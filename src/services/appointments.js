import { supabase } from "../lib/supabase";
import { todayStr } from "../utils/format";

export async function getAppointments({ date } = {}) {
  let query = supabase
    .from("appointments")
    .select("*")
    .order("appt_time");
  if (date) query = query.eq("appt_date", date);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getAppointmentsToday() {
  return getAppointments({ date: todayStr() });
}

export async function createAppointment({ barber_id, client_name, phone, appt_time, service_id, duration_minutes }) {
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      appt_date: todayStr(),
      appt_time,
      client_name,
      phone,
      barber_id,
      service_id,
      duration_minutes,
      status: "pendiente",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAppointmentStatus(id, status) {
  const { data, error } = await supabase.from("appointments").update({ status }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAppointment(id) {
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeToAppointments(onChange) {
  const channel = supabase
    .channel("appointments-realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
