export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const PAY_METHODS = [
  { id: "efectivo", label: "Efectivo" },
  { id: "tarjeta", label: "Tarjeta" },
  { id: "transferencia", label: "Transferencia" },
];

export const TIP_PRESETS = [0, 5, 10, 15, 20];

export const mx = (n) => `$${(Number(n) || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;

export const todayStr = () => new Date().toISOString().slice(0, 10);

// 0 = lunes ... 6 = domingo
export const isoWeekday = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const wd = d.getDay();
  return wd === 0 ? 6 : wd - 1;
};

export function weekRangeDates(baseDate = new Date()) {
  const now = new Date(baseDate);
  const monday = new Date(now);
  const wd = isoWeekday(now.toISOString().slice(0, 10));
  monday.setDate(now.getDate() - wd);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function monthRangeDates(baseDate = new Date()) {
  const now = new Date(baseDate);
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return [first.toISOString().slice(0, 10), last.toISOString().slice(0, 10)];
}
