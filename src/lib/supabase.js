import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error(
    "[Supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. " +
    "Copia .env.example a .env y llena tus valores reales del proyecto de Supabase."
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
