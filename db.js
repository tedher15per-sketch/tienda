/* Capa de datos sobre Supabase.
 * Todo vive en una sola tabla `docs (collection, id, data jsonb)` protegida con RLS por rol
 * (ver supabase/schema.sql). Este archivo expone una API pequeña tipo "documentos":
 *   DB.collection('products').orderBy('at','desc').limit(50).onSnapshot(fn)
 *   DB.doc('products/abc').set({...}) / .update({...}) / .delete()
 * Los cambios llegan en tiempo real por Supabase Realtime y la vista se vuelve a pedir.
 */
(function () {
  "use strict";
  const cfg = window.APP_CONFIG || {};
  const configured = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !/TU-PROYECTO|TU_ANON/.test(cfg.SUPABASE_URL + cfg.SUPABASE_ANON_KEY));
  const sb = configured && window.supabase ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

  const rid = () => (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "") : Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 20);

  function mapErr(error) {
    const code = error && error.code;
    // 42501 = RLS / sin permiso. PGRST116 = no encontrado en .single()
    if (code === "42501" || /row-level security|permission/i.test(error && error.message || "")) return { code: "invalid_argument", message: error.message };
    return { code: "unavailable", message: (error && error.message) || "Error de red" };
  }
  const snapOf = rows => {
    const docs = (rows || []).map(r => ({ id: r.id, exists: true, data: () => r.data }));
    return { docs, size: docs.length, empty: !docs.length };
  };

  /* ---- un solo canal realtime, repartido por colección ---- */
  const listeners = new Map(); // collection -> Set<fn>
  let channel = null;
  function listen(col, fn) {
    if (!listeners.has(col)) listeners.set(col, new Set());
    listeners.get(col).add(fn);
    if (!channel && sb) {
      channel = sb.channel("docs-cambios")
        .on("postgres_changes", { event: "*", schema: "public", table: "docs" }, payload => {
          const c = (payload.new && payload.new.collection) || (payload.old && payload.old.collection);
          if (c && listeners.has(c)) listeners.get(c).forEach(f => f());
          else if (!c) listeners.forEach(set => set.forEach(f => f())); // borrado sin datos viejos: refresca todo
        })
        .subscribe();
    }
    return () => listeners.get(col) && listeners.get(col).delete(fn);
  }

  class Query {
    constructor(col, o) { this.col = col; this.o = o || {}; }
    where(field, op, value) { return new Query(this.col, Object.assign({}, this.o, { where: [field, op, value] })); }
    orderBy(field, dir) { return new Query(this.col, Object.assign({}, this.o, { order: [field, dir || "asc"] })); }
    limit(n) { return new Query(this.col, Object.assign({}, this.o, { limit: n })); }
    _build() {
      let q = sb.from("docs").select("id,data").eq("collection", this.col);
      if (this.o.where) q = q.eq("data->>" + this.o.where[0], String(this.o.where[2]));
      if (this.o.order) q = q.order("data->" + this.o.order[0], { ascending: this.o.order[1] !== "desc" });
      return q.limit(this.o.limit || 5000);
    }
    async get() {
      if (!sb) throw { code: "unavailable", message: "Supabase no está configurado" };
      const { data, error } = await this._build();
      if (error) throw mapErr(error);
      return snapOf(data);
    }
    onSnapshot(next, onError) {
      let alive = true, t = 0, running = false, again = false;
      const run = async () => {
        if (running) { again = true; return; }
        running = true;
        try { const s = await this.get(); if (alive) next(s); }
        catch (e) { if (alive && onError) onError(e); }
        running = false;
        if (again && alive) { again = false; run(); }
      };
      run();
      const off = listen(this.col, () => { clearTimeout(t); t = setTimeout(run, 200); });
      const iv = setInterval(() => { if (document.visibilityState === "visible") run(); }, 45000);
      const vis = () => { if (document.visibilityState === "visible") run(); };
      document.addEventListener("visibilitychange", vis);
      return () => { alive = false; off(); clearInterval(iv); document.removeEventListener("visibilitychange", vis); };
    }
    doc(id) { return new DocRef(this.col, id || rid()); }
    async add(data) { const r = this.doc(); await r.set(data); return r; }
  }

  class DocRef {
    constructor(col, id) { this.col = col; this.id = id; this.path = col + "/" + id; }
    async get() {
      const { data, error } = await sb.from("docs").select("id,data").eq("collection", this.col).eq("id", this.id).maybeSingle();
      if (error) throw mapErr(error);
      return data ? { id: this.id, exists: true, data: () => data.data } : { id: this.id, exists: false, data: () => undefined };
    }
    async set(body) {
      const { error } = await sb.from("docs").upsert({ collection: this.col, id: this.id, data: body, updated_at: new Date().toISOString() });
      if (error) throw mapErr(error);
    }
    async update(patch) {
      // fusión del lado del servidor (data || patch) para no pisar cambios de otros
      const { data, error } = await sb.rpc("doc_merge", { p_collection: this.col, p_id: this.id, p_patch: patch });
      if (error) throw mapErr(error);
      if (data === false) throw { code: "invalid_argument", message: "El documento no existe o no tienes permiso" };
    }
    async delete() {
      const { error } = await sb.from("docs").delete().eq("collection", this.col).eq("id", this.id);
      if (error) throw mapErr(error);
    }
    onSnapshot(next, onError) {
      let alive = true, t = 0;
      const run = async () => { try { const s = await this.get(); if (alive) next(s); } catch (e) { if (alive && onError) onError(e); } };
      run();
      const off = listen(this.col, () => { clearTimeout(t); t = setTimeout(run, 200); });
      return () => { alive = false; off(); };
    }
  }

  const DB = {
    configured,
    client: sb,
    async stockAdd(id, delta, entry) {
      const { data, error } = await sb.rpc("stock_add", { p_id: id, p_delta: delta, p_entry: entry });
      if (error) throw mapErr(error);
      if (data === false) throw { code: "invalid_argument", message: "Producto no encontrado o sin permiso" };
    },
    collection: name => new Query(name),
    doc: path => { const i = path.lastIndexOf("/"); return new DocRef(path.slice(0, i), path.slice(i + 1)); },
  };

  /* ---- sesión ---- */
  const Auth = {
    async session() { if (!sb) return null; const { data } = await sb.auth.getSession(); return data.session; },
    async signIn(email, password) { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; },
    async signUp(email, password, name) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw error; return data;
    },
    async reset(email) { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin }); if (error) throw error; },
    async signOut() { await sb.auth.signOut(); },
    onChange(fn) { if (sb) sb.auth.onAuthStateChange((ev, s) => fn(ev, s)); },
  };

  /* ---- fotos de productos (Supabase Storage, bucket público "productos") ---- */
  const Photos = {
    async upload(blob) {
      const path = "p/" + rid() + ".jpg";
      const { error } = await sb.storage.from("productos").upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (error) throw error;
      return sb.storage.from("productos").getPublicUrl(path).data.publicUrl;
    },
  };

  window.DB = DB; window.Auth = Auth; window.Photos = Photos;
})();
