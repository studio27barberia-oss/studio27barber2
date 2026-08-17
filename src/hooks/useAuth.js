import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { getMyProfile } from "../services/auth";

// Sesión + perfil (rol) del usuario actual. El rol NUNCA se decide en
// el frontend: viene de la tabla profiles, protegida por RLS.
export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const p = await getMyProfile();
      setProfile(p);
    } catch (e) {
      console.error("No se pudo cargar el perfil", e);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) await loadProfile();
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await loadProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  return { session, profile, loading, role: profile?.role || null, refreshProfile: loadProfile };
}
