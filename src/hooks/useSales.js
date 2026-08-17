import { useCallback, useEffect, useState } from "react";
import { getSales, subscribeToSales } from "../services/sales";

// Trae ventas para un rango de fechas y se re-sincroniza solo cuando
// Supabase Realtime avisa que hubo un cambio (venta nueva desde
// cualquier dispositivo). Así el dashboard del administrador se
// actualiza sin que nadie tenga que recargar la página.
export function useSales(filters) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSales(filters);
      setSales(data);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const unsubscribe = subscribeToSales(() => reload());
    return unsubscribe;
  }, [reload]);

  return { sales, loading, error, reload };
}
