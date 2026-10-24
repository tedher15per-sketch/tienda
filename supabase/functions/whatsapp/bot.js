// Cerebro del bot de inventario por WhatsApp. JavaScript puro (corre en Deno y en Node para pruebas).
// handleText(texto, quien, store) → texto de respuesta.
// store: { products(), stockAdd(id, delta, entry), salesSince(ms), getPending(k), setPending(k, v), clearPending(k) }

const STOP = new Set(["de", "del", "la", "el", "los", "las", "un", "una", "unos", "unas", "con", "sin", "y", "a", "en", "para", "por", "al", "que", "mas", "hay"]);
const UNIT_WORDS = {
  pz: "pza", pza: "pza", pzas: "pza", pieza: "pza", piezas: "pza",
  kg: "kg", kgs: "kg", kilo: "kg", kilos: "kg", k: "kg",
  g: "g", gr: "g", grs: "g", gramo: "g", gramos: "g",
  lt: "lt", lts: "lt", litro: "lt", litros: "lt",
  paq: "paq", paqs: "paq", paquete: "paq", paquetes: "paq",
  caja: "caja", cajas: "caja", bolsa: "pza", bolsas: "pza", bote: "pza", botes: "pza",
};
const NUM_WORDS = {
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, veinte: 20, veinticuatro: 24, treinta: 30, cuarenta: 40, cincuenta: 50,
  medio: 0.5, media: 0.5, docena: 12, docenas: 12,
};

export const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[¿?¡!*_~"'`]/g, " ").replace(/\s+/g, " ").trim();
const singular = w => (w.length > 4 && w.endsWith("es") ? [w, w.slice(0, -2), w.slice(0, -1)] : w.length > 3 && w.endsWith("s") ? [w, w.slice(0, -1)] : [w]);
const tokens = s => norm(s).replace(/[^a-z0-9.]+/g, " ").split(" ").map(t => t.replace(/^\.+|\.+$/g, "")).filter(t => t && !STOP.has(t));
const r3 = n => Math.round(n * 1000) / 1000;
const fmtQty = (q, u) => `${(+q).toLocaleString("es-MX", { maximumFractionDigits: 3 })} ${u || "pza"}`;
const money = n => "$" + (+n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function lev1(a, b) { // ¿distancia de edición ≤ 1?
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, e = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++e > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return e + (a.length - i) + (b.length - j) <= 1;
}
function tokScore(q, c) {
  let best = 0;
  for (const a of singular(q)) for (const b of singular(c)) {
    if (a === b) return 1;
    if (/^\d/.test(a) || /^\d/.test(b)) continue; // los números (600, 1) deben coincidir exacto
    if (a.length >= 3 && b.length >= 3 && (b.startsWith(a) || a.startsWith(b))) best = Math.max(best, 0.8);
    else if (a.length >= 4 && lev1(a, b)) best = Math.max(best, 0.7);
  }
  return best;
}
function phraseScore(qt, phrase) {
  const ct = tokens(phrase);
  if (!qt.length || !ct.length) return 0;
  let s = 0;
  for (const q of qt) { let b = 0; for (const c of ct) b = Math.max(b, tokScore(q, c)); s += b; }
  let score = s / qt.length;
  if (norm(phrase) === qt.join(" ")) score += 0.5;          // frase idéntica (nombre o apodo)
  score -= Math.max(0, ct.length - qt.length) * 0.02;       // desempate: el nombre más corto gana
  return score;
}
/** Busca el producto. Regresa {p} si hay uno claro, {options:[...]} si hay empate, o {} si nada. */
export function matchProduct(query, products) {
  const q = norm(query).trim();
  if (/^\d{6,}$/.test(q.replace(/\s/g, ""))) {
    const p = products.find(x => String(x.barcode || "") === q.replace(/\s/g, ""));
    return p ? { p } : {};
  }
  const qt = tokens(q);
  if (!qt.length) return {};
  const scored = products.map(p => {
    const names = [p.name, ...String(p.aliases || "").split(/[,;\n]/).map(s => s.trim()).filter(Boolean)];
    return { p, s: Math.max(...names.map(n => phraseScore(qt, n))) };
  }).filter(x => x.s >= 0.6).sort((a, b) => b.s - a.s);
  if (!scored.length) return {};
  if (scored.length > 1 && scored[1].s >= scored[0].s - 0.12) return { options: scored.filter(x => x.s >= scored[0].s - 0.12).slice(0, 5).map(x => x.p) };
  return { p: scored[0].p };
}

const VERB = [
  ["entrada", /^(\+|llegaron|llego|entrada|entraron|entro|compre|compra|recibi|recibimos|surti|surtimos|agrega|agregar|agregue|suma|sumar|sume|meti|repuse|reponer)\b\s*/],
  ["salida", /^(-|merma|mermas|salida|quita|quitar|quite|resta|restar|reste|tire|tiramos|se echo a perder|se echaron a perder|caduco|caducaron|se rompio|se rompieron|rompio|consumo|regale|saque)\b\s*/],
  ["conteo", /^(=|conteo|conte|ajusta|ajustar|ajuste|quedan|hay exactamente|son)\b\s*/],
];
const LABEL = { entrada: "Entrada", salida: "Merma/salida", conteo: "Conteo" };

function parseQty(s) {
  // Regresa {qty, unit, rest}
  let m = s.match(/^(\d+(?:[.,]\d+)?)\s*/);
  let qty = null, rest = s;
  if (m) { qty = parseFloat(m[1].replace(",", ".")); rest = s.slice(m[0].length); }
  else {
    m = s.match(/^(media docena|kilo y medio|[a-z]+)\s+/);
    if (m && m[1] === "media docena") { qty = 6; rest = s.slice(m[0].length); }
    else if (m && m[1] === "kilo y medio") { qty = 1.5; rest = "kg " + s.slice(m[0].length); }
    else if (m && NUM_WORDS[m[1]] != null) { qty = NUM_WORDS[m[1]]; rest = s.slice(m[0].length); }
  }
  const dz = rest.match(/^(docenas?)\b\s*/);
  if (dz) { qty = (qty == null ? 1 : qty) * 12; rest = rest.slice(dz[0].length); }
  let unit = null;
  const u = rest.match(/^([a-z]+)\b\.?\s*/);
  if (u && UNIT_WORDS[u[1]]) { unit = UNIT_WORDS[u[1]]; rest = rest.slice(u[0].length); }
  rest = rest.replace(/^(de|del)\s+/, "");
  return { qty, unit, rest: rest.trim() };
}
function splitItems(s) {
  return s.split(/\s*(?:,|;|\n|\s+y\s+(?=\d|un |una |uno |dos |tres |cuatro |cinco |seis |siete |ocho |nueve |diez |doce |media |medio ))\s*/).map(x => x.trim()).filter(Boolean);
}

export const HELP = [
  "📦 *Inventario por WhatsApp*",
  "",
  "*Entradas:* llegaron 24 coca 600 y 12 leche",
  "*Mermas:* merma 2 pan · caducaron 3 yogur",
  "*Conteo exacto:* quedan 5 tortillas",
  "*Consultar:* cuánto hay de huevo",
  "*Faltantes:* qué falta",
  "*Caducidades:* qué caduca",
  "*Ventas:* ventas de hoy",
  "",
  "Puedes usar el código de barras en lugar del nombre. Los apodos de cada producto (ej. \"coca\") se ponen en la app.",
].join("\n");

async function applyMove(store, who, action, p, qty, unit) {
  let q = qty;
  if (unit === "g" && p.unit === "kg") q = qty / 1000;
  const before = +p.stock || 0;
  const delta = action === "entrada" ? q : action === "salida" ? -q : q - before;
  if (!delta) return `• ${p.name}: sin cambio (${fmtQty(before, p.unit)})`;
  await store.stockAdd(p.id, r3(delta), { d: r3(delta), r: `WhatsApp · ${LABEL[action]}${who.label ? " (" + who.label + ")" : ""}`, at: Date.now(), by: "wa:" + (who.key || "") });
  const after = r3(before + delta);
  const low = (+p.minStock || 0) > 0 && after <= +p.minStock ? " ⚠️ bajo mínimo" : "";
  return `• ${p.name}: ${fmtQty(before, p.unit)} → *${fmtQty(after, p.unit)}*${low}`;
}

function mxDayStart(now = Date.now()) {
  // Centro de México: UTC-6 todo el año (sin horario de verano desde 2022)
  const d = new Date(now - 6 * 3600e3);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 6, 0, 0);
}

export async function handleText(text, who, store) {
  const t = norm(text);
  if (!t) return HELP;
  if (/^(hola|ayuda|menu|help|comandos|\?|info|buenas|buenos dias|buenas tardes)$/.test(t)) return HELP;

  // Respuesta a una pregunta pendiente ("1", "2"...)
  if (/^\d$/.test(t)) {
    const pend = await store.getPending(who.key);
    if (pend && Date.now() - pend.at < 15 * 60e3) {
      const products = await store.products();
      const p = products.find(x => x.id === pend.options[+t - 1]);
      if (!p) return "Ese número no está en la lista. Escribe el movimiento otra vez.";
      await store.clearPending(who.key);
      return "✅ Listo\n" + await applyMove(store, who, pend.action, p, pend.qty, pend.unit);
    }
  }

  // Movimientos
  for (const [action, re] of VERB) {
    const m = t.match(re);
    if (!m) continue;
    const body = t.slice(m[0].length);
    if (action === "conteo" && !/^\d|^(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|doce|media|medio)\b/.test(body)) break; // "quedan leche?" es consulta
    const items = splitItems(body);
    if (!items.length) return `¿Qué ${action === "entrada" ? "llegó" : "producto"}? Ejemplo: ${action === "entrada" ? "llegaron 24 coca" : "merma 2 pan"}`;
    const products = await store.products();
    const out = [], missing = [];
    let asked = null;
    for (const it of items) {
      const { qty, unit, rest } = parseQty(it);
      const q = qty == null ? 1 : qty;
      if (!(q >= 0)) { missing.push(it); continue; }
      const r = matchProduct(rest, products);
      if (r.p) out.push(await applyMove(store, who, action, r.p, q, unit));
      else if (r.options && !asked) {
        asked = { action, qty: q, unit, options: r.options.map(p => p.id), at: Date.now() };
        await store.setPending(who.key, asked);
        out.push(`❓ “${rest}” puede ser:\n` + r.options.map((p, i) => `   *${i + 1}.* ${p.name} (${fmtQty(p.stock || 0, p.unit)})`).join("\n") + "\n   Responde con el número.");
      } else missing.push(rest || it);
    }
    let reply = out.length ? `✅ *${LABEL[action]}*\n` + out.join("\n") : "";
    if (missing.length) reply += (reply ? "\n\n" : "") + "🤷 No encontré: " + missing.map(x => `“${x}”`).join(", ") + "\nRevisa el nombre o agrégale un apodo al producto en la app.";
    return reply;
  }

  // Faltantes
  if (/(que falta|faltan|faltante|por surtir|stock bajo|bajo stock|que pido|que hay que pedir|que se acabo|agotado)/.test(t)) {
    const low = (await store.products()).filter(p => (+p.minStock || 0) > 0 && (+p.stock || 0) <= +p.minStock)
      .sort((a, b) => (a.stock / a.minStock) - (b.stock / b.minStock));
    if (!low.length) return "👌 Nada está por debajo del mínimo.";
    return "⚠️ *Por surtir*\n" + low.slice(0, 20).map(p => `• ${p.name}: ${fmtQty(p.stock || 0, p.unit)} (mín. ${fmtQty(p.minStock, p.unit)})`).join("\n") + (low.length > 20 ? `\n…y ${low.length - 20} más` : "");
  }

  // Caducidades
  if (/(caduc|vence|vencen|vencido|expira)/.test(t)) {
    const today = new Date(mxDayStart()).toISOString().slice(0, 10);
    const days = e => Math.round((Date.parse(e + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 864e5);
    const soon = (await store.products()).filter(p => p.expiry && days(p.expiry) <= 7).sort((a, b) => a.expiry.localeCompare(b.expiry));
    if (!soon.length) return "👌 Nada caduca en los próximos 7 días.";
    return "📅 *Caducidades*\n" + soon.map(p => { const d = days(p.expiry); return `• ${p.name}: ${d < 0 ? "*caducado*" : d === 0 ? "*hoy*" : "en " + d + " d"} (${fmtQty(p.stock || 0, p.unit)})`; }).join("\n");
  }

  // Ventas de hoy
  if (/(venta|vendi|vendimos|se vendio|corte|cuanto llevamos|caja de hoy)/.test(t)) {
    const sales = await store.salesSince(mxDayStart());
    if (!sales.length) return "Hoy todavía no hay ventas registradas.";
    const total = sales.reduce((s, x) => s + (+x.total || 0), 0);
    const by = {};
    for (const s of sales) by[s.payment] = (by[s.payment] || 0) + (+s.total || 0);
    const names = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia", fiado: "Fiado" };
    return `💰 *Ventas de hoy*: ${money(total)} en ${sales.length} ticket${sales.length === 1 ? "" : "s"}\n` +
      Object.entries(by).map(([k, v]) => `• ${names[k] || k}: ${money(v)}`).join("\n");
  }

  // Consulta de un producto
  const qm = t.match(/^(cuantos|cuantas|cuanto|hay|tienes|tenemos|stock|existencias|existencia|quedan|queda|precio|cuesta)\b\s*(?:(hay|quedan|queda|tenemos|tiene|cuesta|vale)\b\s*)?(?:(de|del)\b\s*)?/);
  const query = qm ? t.slice(qm[0].length) : t;
  const products = await store.products();
  const r = matchProduct(query, products);
  const show = p => `• *${p.name}*: ${fmtQty(p.stock || 0, p.unit)}${(+p.minStock || 0) > 0 ? ` (mín. ${fmtQty(p.minStock, p.unit)})` : ""} · ${money(p.price)}`;
  if (r.p) return show(r.p);
  if (r.options) return "Encontré varios:\n" + r.options.map(show).join("\n");
  if (qm) return `🤷 No encontré “${query}”.`;
  return "No entendí 🤔\n\n" + HELP;
}
