// =============================================
// BINKA · Parte Diario — Storage adapter
// Reemplaza window.storage usando Supabase
// =============================================
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

window.storage = {
  async get(key, _shared) {
    const { data, error } = await supabase
      .from("app_data")
      .select("value")
      .eq("key", key)
      .single();
    if (error || !data) throw new Error(`Clave no encontrada: ${key}`);
    return { key, value: JSON.stringify(data.value), shared: true };
  },

  async set(key, value, _shared) {
    try {
      const parsed = JSON.parse(value);
      const { error } = await supabase
        .from("app_data")
        .upsert({ key, value: parsed, updated_at: new Date().toISOString() });
      if (error) throw error;
      return { key, value, shared: true };
    } catch (e) {
      console.error("Error al guardar:", e);
      return null;
    }
  },

  async delete(key, _shared) {
    try {
      const { error } = await supabase
        .from("app_data")
        .delete()
        .eq("key", key);
      if (error) throw error;
      return { key, deleted: true, shared: true };
    } catch (e) {
      console.error("Error al eliminar:", e);
      return null;
    }
  },

  async list(prefix, _shared) {
    try {
      let query = supabase.from("app_data").select("key");
      if (prefix) query = query.like("key", `${prefix}%`);
      const { data, error } = await query;
      if (error) throw error;
      return { keys: data.map((d) => d.key), shared: true };
    } catch {
      return { keys: [], shared: true };
    }
  },
};
