// Funciones para la tabla "services" (catálogo de servicios de la barbería).
// Se llama "catalogServices" en el código para no confundirla con la
// carpeta src/services/ (capa de acceso a datos).
import { supabase } from "../lib/supabase";

export async function getServices() {
  const { data, error } = await supabase.from("services").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function createService({ name, price, duration_minutes }) {
  const { data, error } = await supabase
    .from("services")
    .insert({ name, price, duration_minutes })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateService(id, patch) {
  const { data, error } = await supabase.from("services").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteService(id) {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}
