import { useEffect } from "react";
import { supabase } from "../lib/supabase";

// Se suscribe a TODOS los cambios (insert/update/delete) de una tabla y
// ejecuta onChange cuando algo cambia, sin importar desde qué dispositivo
// vino el cambio. Úsalo en cualquier pantalla que deba reflejar en vivo
// lo que otro usuario está editando en ese momento.
//
// Ejemplo:
//   useRealtimeTable("products", () => reload());
export function useRealtimeTable(table, onChange, enabled = true) {
  useEffect(() => {
    if (!enabled || !table) return;
    const channel = supabase
      .channel(`realtime-${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, onChange)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, enabled]);
}
