import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

window.supabaseClient = supabase;

window.storage = {
  async get(key, _shared) {
    const { data, error } = await supabase
      .from("app_data").select("value").eq("key", key).single();
    if (error || !data) throw new Error(`Clave no encontrada: ${key}`);
    return { key, value: JSON.stringify(data.value), shared: true };
  },
  async set(key, value, _shared) {
    try {
      const { error } = await supabase.from("app_data")
        .upsert({ key, value: JSON.parse(value), updated_at: new Date().toISOString() });
      if (error) throw error;
      return { key, value, shared: true };
    } catch (e) { console.error("Error al guardar:", e); return null; }
  },
  async delete(key, _shared) {
    try {
      const { error } = await supabase.from("app_data").delete().eq("key", key);
      if (error) throw error;
      return { key, deleted: true, shared: true };
    } catch (e) { return null; }
  },
  async list(prefix, _shared) {
    try {
      let q = supabase.from("app_data").select("key");
      if (prefix) q = q.like("key", `${prefix}%`);
      const { data } = await q;
      return { keys: (data || []).map(d => d.key), shared: true };
    } catch { return { keys: [], shared: true }; }
  },
};
