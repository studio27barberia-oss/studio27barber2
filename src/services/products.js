import { supabase } from "../lib/supabase";

export async function getProducts() {
  const { data, error } = await supabase.from("products").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function createProduct({ name, price, stock, category, commission_pct }) {
  const { data, error } = await supabase
    .from("products")
    .insert({ name, price, stock, category, commission_pct })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id, patch) {
  const { data, error } = await supabase.from("products").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}
