import { supabase } from "../lib/supabase";

export async function getBarbers() {
  const { data, error } = await supabase.from("barbers").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function createBarber({ name, commission_pct }) {
  const { data, error } = await supabase
    .from("barbers")
    .insert({ name, commission_pct })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBarber(id, patch) {
  const { data, error } = await supabase.from("barbers").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function toggleBarberActive(id, active) {
  return updateBarber(id, { active });
}
export async function deleteBarber(id) {
  const { data, error } = await supabase
    .from('barbers')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return data;
}
