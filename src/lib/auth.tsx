import { createContext, useContext, type ReactNode } from "react";

type LocalUser = {
  id: string;
  email: string;
};

type AuthCtx = {
  user: LocalUser | null;
  session: null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const LOCAL_USER: LocalUser = {
  id: "local-user",
  email: "demo@a-la-vuelta.local",
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider
      value={{
        user: LOCAL_USER,
        session: null,
        loading: false,
        signOut: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
