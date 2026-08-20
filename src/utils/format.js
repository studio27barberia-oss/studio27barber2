export const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const PAY_METHODS = [
  { id: "efectivo", label: "Efectivo" },
  { id: "tarjeta", label: "Tarjeta" },
  { id: "transferencia", label: "Transferencia" },
];

export const TIP_PRESETS = [0, 5, 10, 15, 20];

export const mx = (n) => `$${(Number(n) || 0).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;

// IMPORTANTE: nunca usar `date.toISOString()` para obtener "la fecha de
// hoy" — toISOString() SIEMPRE convierte a UTC primero. Si el dispositivo
// está en una zona horaria detrás de UTC (México, por ejemplo), una venta
// hecha en la noche puede terminar registrada como si fuera "mañana".
// Estas funciones arman la fecha con los componentes LOCALES del
// dispositivo (getFullYear/getMonth/getDate), nunca convirtiendo a UTC.
export function toLocalDateStr(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toLocalTimeStr(date) {
  const d = date instanceof Date ? date : new Date(date);
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${min}:${s}`;
}

export const todayStr = () => toLocalDateStr(new Date());

// 0 = lunes ... 6 = domingo. Recibe una fecha "YYYY-MM-DD" y la interpreta
// como medianoche LOCAL (sin sufijo "Z"), así que el día de la semana
// siempre sale correcto sin importar la zona horaria del dispositivo.
export const isoWeekday = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const wd = d.getDay();
  return wd === 0 ? 6 : wd - 1;
};

export function weekRangeDates(baseDate = new Date()) {
  const now = new Date(baseDate);
  const wd = isoWeekday(toLocalDateStr(now));
  const monday = new Date(now);
  monday.setDate(now.getDate() - wd);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toLocalDateStr(d);
  });
}

export function monthRangeDates(baseDate = new Date()) {
  const now = new Date(baseDate);
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return [toLocalDateStr(first), toLocalDateStr(last)];
}

// Fecha local de hace N días (para rangos tipo "último mes" en reportes).
export function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toLocalDateStr(d);
}
