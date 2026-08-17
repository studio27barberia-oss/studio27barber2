import { supabase } from "../lib/supabase";

export async function getClients() {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("total_spent", { ascending: false });
  if (error) throw error;
  return data;
}

export async function searchClients(term) {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .or(`name.ilike.%${term}%,phone.ilike.%${term}%`)
    .order("name")
    .limit(20);
  if (error) throw error;
  return data;
}

export async function createClient({ name, phone }) {
  const { data, error } = await supabase.from("clients").insert({ name, phone }).select().single();
  if (error) throw error;
  return data;
}
