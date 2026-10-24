// Webhook de WhatsApp Cloud API → inventario de Mostrador Abarrotes.
// Secretos (Supabase → Edge Functions → Secrets):
//   WA_VERIFY_TOKEN  texto que inventas y pegas también en Meta (verificación del webhook)
//   WA_APP_SECRET    App secret de tu app de Meta (para validar que el mensaje viene de Meta)
//   WA_TOKEN         token de acceso de WhatsApp (para responder)
//   WA_GRAPH_VERSION opcional, por defecto v23.0
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { handleText } from "./bot.js";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const VERIFY = Deno.env.get("WA_VERIFY_TOKEN") ?? "";
const APP_SECRET = Deno.env.get("WA_APP_SECRET") ?? "";
const TOKEN = Deno.env.get("WA_TOKEN") ?? "";
const GRAPH = Deno.env.get("WA_GRAPH_VERSION") ?? "v23.0";

const last10 = (n: string) => String(n || "").replace(/\D/g, "").slice(-10);

async function validSignature(raw: string, header: string | null): Promise<boolean> {
  if (!APP_SECRET || !header?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(APP_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)));
  const hex = [...sig].map(b => b.toString(16).padStart(2, "0")).join("");
  const given = header.slice(7);
  if (given.length !== hex.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

const docs = () => sb.from("docs");
const store = {
  async products() {
    const { data, error } = await docs().select("id,data").eq("collection", "products").limit(5000);
    if (error) throw error;
    return (data ?? []).map(r => ({ id: r.id, ...r.data }));
  },
  async stockAdd(id: string, delta: number, entry: unknown) {
    const { error } = await sb.rpc("stock_add", { p_id: id, p_delta: delta, p_entry: entry });
    if (error) throw error;
  },
  async salesSince(ms: number) {
    const { data, error } = await docs().select("data").eq("collection", "sales").order("data->at", { ascending: false }).limit(2000);
    if (error) throw error;
    return (data ?? []).map(r => r.data).filter((s: { at: number }) => +s.at >= ms);
  },
  async getPending(k: string) {
    const { data } = await docs().select("data").eq("collection", "wapend").eq("id", k).maybeSingle();
    return data?.data ?? null;
  },
  async setPending(k: string, v: unknown) { await docs().upsert({ collection: "wapend", id: k, data: v }); },
  async clearPending(k: string) { await docs().delete().eq("collection", "wapend").eq("id", k); },
};

async function authorized(from: string) {
  const { data } = await docs().select("data").eq("collection", "ajustes").eq("id", "whatsapp").maybeSingle();
  const list: { phone: string; label?: string }[] = data?.data?.numbers ?? [];
  return list.find(n => last10(n.phone) === last10(from)) ?? null;
}

/** true = mensaje nuevo; false = Meta lo reenvió (ya lo procesamos) */
async function firstTime(msgId: string, from: string) {
  const { data, error } = await docs()
    .upsert({ collection: "walog", id: msgId, data: { from: last10(from), at: Date.now() } }, { onConflict: "collection,id", ignoreDuplicates: true })
    .select("id");
  if (error) { console.error("walog", error); return true; }
  return (data ?? []).length > 0;
}

async function reply(phoneNumberId: string, to: string, body: string) {
  if (!TOKEN) { console.error("Falta WA_TOKEN: no puedo responder"); return; }
  // Celulares de México llegan como 521XXXXXXXXXX pero se responden como 52XXXXXXXXXX
  const dest = /^521\d{10}$/.test(to) ? "52" + to.slice(3) : to;
  const res = await fetch(`https://graph.facebook.com/${GRAPH}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: dest, type: "text", text: { body: body.slice(0, 4000), preview_url: false } }),
  });
  if (!res.ok) console.error("Error al responder", res.status, await res.text());
}

async function handleWebhook(body: any) {
  for (const entry of body?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      const v = change?.value;
      const pnid = v?.metadata?.phone_number_id;
      for (const m of v?.messages ?? []) {
        if (!(await firstTime(m.id, m.from))) continue;
        const who = await authorized(m.from);
        if (!who) {
          await reply(pnid, m.from, `Este número (${last10(m.from)}) no está autorizado para mover el inventario. Pide al dueño que lo agregue en la app: Personal → WhatsApp.`);
          continue;
        }
        if (m.type !== "text") {
          await reply(pnid, m.from, "Por ahora solo entiendo mensajes de texto 🙂 Escribe *ayuda* para ver ejemplos.");
          continue;
        }
        let text: string;
        try {
          text = await handleText(m.text?.body ?? "", { key: last10(m.from), label: who.label ?? "" }, store);
        } catch (e) {
          console.error("bot", e);
          text = "⚠️ Hubo un error al actualizar. Intenta de nuevo en un momento.";
        }
        await reply(pnid, m.from, text);
      }
    }
  }
  // limpieza ligera del registro anti-duplicados (más de 14 días)
  await docs().delete().eq("collection", "walog").lt("created_at", new Date(Date.now() - 14 * 864e5).toISOString());
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  if (req.method === "GET") {
    // Verificación del webhook desde el panel de Meta
    if (url.searchParams.get("hub.mode") === "subscribe" && VERIFY && url.searchParams.get("hub.verify_token") === VERIFY) {
      return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const raw = await req.text();
  if (!(await validSignature(raw, req.headers.get("x-hub-signature-256")))) {
    console.error(APP_SECRET ? "Firma inválida" : "Falta WA_APP_SECRET");
    return new Response("Invalid signature", { status: 401 });
  }
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
  try { await handleWebhook(body); } catch (e) { console.error("process", e); }
  return new Response("ok", { status: 200 }); // siempre 200 para que Meta no reintente en bucle
});
