import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type DemoUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export type AuthUser = User | DemoUser;

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "customer" | "business_owner" | "admin";
  email_verified: boolean;
};

type AuthCtx = {
  user: AuthUser | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  configurationError: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updateProfile: (values: Partial<Pick<Profile, "full_name" | "phone" | "avatar_url">>) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const demoAuthEnabled = !isSupabaseConfigured && import.meta.env.DEV;
const configurationError = !isSupabaseConfigured && !import.meta.env.DEV
  ? "Supabase no está configurado para producción. Completá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY antes de publicar."
  : null;

const LOCAL_USER: DemoUser = {
  id: "local-user",
  email: "demo@a-la-vuelta.local",
  user_metadata: { full_name: "Usuario demo", role: "customer" },
};

const LOCAL_PROFILE: Profile = {
  id: "local-user",
  full_name: "Usuario demo",
  phone: "+549",
  avatar_url: null,
  role: "customer",
  email_verified: false,
};

const AuthContext = createContext<AuthCtx | null>(null);

async function loadProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(demoAuthEnabled ? LOCAL_USER : null);
  const [profile, setProfile] = useState<Profile | null>(demoAuthEnabled ? LOCAL_PROFILE : null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      if (error) console.error(error);
      const nextSession = data.session;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        try {
          setProfile(await loadProfile(nextSession.user.id));
        } catch (profileError) {
          console.error(profileError);
        }
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession?.user) {
        setProfile(null);
        return;
      }
      queueMicrotask(async () => {
        try {
          setProfile(await loadProfile(nextSession.user.id));
        } catch (profileError) {
          console.error(profileError);
        }
      });
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      session,
      profile,
      loading,
      isDemoMode: demoAuthEnabled,
      configurationError,
      async signIn(email, password) {
        if (!supabase) return { error: configurationError ?? "Supabase no está configurado." };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? { error: error.message } : {};
      },
      async signUp(email, password, fullName) {
        if (!supabase) return { error: configurationError ?? "Supabase no está configurado." };
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        return error ? { error: error.message } : {};
      },
      async resetPassword(email) {
        if (!supabase) return { error: configurationError ?? "Supabase no está configurado." };
        const redirectTo = `${window.location.origin}/perfil`;
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        return error ? { error: error.message } : {};
      },
      async updateProfile(values) {
        if (demoAuthEnabled) {
          setProfile((current) => ({ ...(current ?? LOCAL_PROFILE), ...values }));
          return {};
        }
        if (!supabase || !user) return { error: "No hay sesión activa." };
        const { error } = await supabase.from("profiles").update(values).eq("id", user.id);
        if (error) return { error: error.message };
        try {
          setProfile(await loadProfile(user.id));
        } catch (profileError) {
          return { error: profileError instanceof Error ? profileError.message : "No se pudo actualizar el perfil." };
        }
        return {};
      },
      async signOut() {
        if (!supabase) {
          setSession(null);
          setUser(null);
          setProfile(null);
          return;
        }
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setProfile(null);
      },
    }),
    [loading, profile, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
