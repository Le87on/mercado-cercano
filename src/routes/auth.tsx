import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Store, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ingresar — MercadoCercano" },
      { name: "description", content: "Iniciá sesión o creá tu cuenta para comprar y vender." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const search = useRouterState({ select: (s) => s.location.search }) as { next?: string };
  const next = typeof search.next === "string" && search.next.startsWith("/") ? search.next : "/";

  useEffect(() => {
    if (!loading && user) navigate({ to: next });
  }, [loading, user, navigate, next]);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand text-brand-foreground">
            <Store className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Bienvenido a MercadoCercano</h1>
          <p className="text-sm text-muted-foreground">
            Ingresá para comprar o publicar tus productos.
          </p>
        </div>

        <GoogleButton />

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">o con email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Ingresar</TabsTrigger>
            <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="mt-4">
            <SignInForm />
          </TabsContent>
          <TabsContent value="signup" className="mt-4">
            <SignUpForm />
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Volver al marketplace
          </Link>
        </p>
      </div>
    </main>
  );
}

function GoogleButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      className="w-full"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        });
        if (result.error) {
          toast.error("No pudimos iniciar sesión con Google");
          setBusy(false);
          return;
        }
        // On redirect the page navigates away; on popup, session is set
      }}
    >
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.75 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
        />
      </svg>
      {busy ? "Redirigiendo…" : "Continuar con Google"}
    </Button>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setBusy(false);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("¡Bienvenido de vuelta!");
      }}
    >
      <FieldEmail value={email} onChange={setEmail} />
      <FieldPassword value={password} onChange={setPassword} />
      <Button
        type="submit"
        className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
        disabled={busy || !email || !password}
      >
        {busy ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        setBusy(false);
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Cuenta creada", {
          description: "Revisá tu email para confirmar y luego ingresá.",
        });
      }}
    >
      <div>
        <Label htmlFor="name" className="text-xs">
          Nombre público
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Cómo te ven los compradores"
          className="mt-1"
        />
      </div>
      <FieldEmail value={email} onChange={setEmail} />
      <FieldPassword value={password} onChange={setPassword} minLength={6} />
      <Button
        type="submit"
        className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
        disabled={busy || !email || password.length < 6}
      >
        {busy ? "Creando…" : "Crear cuenta"}
      </Button>
    </form>
  );
}

function FieldEmail({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label htmlFor="email" className="text-xs">
        Email
      </Label>
      <div className="relative mt-1">
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="email"
          type="email"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="vos@ejemplo.com"
          className="pl-9"
        />
      </div>
    </div>
  );
}

function FieldPassword({
  value,
  onChange,
  minLength,
}: {
  value: string;
  onChange: (v: string) => void;
  minLength?: number;
}) {
  return (
    <div>
      <Label htmlFor="password" className="text-xs">
        Contraseña {minLength ? <span className="text-muted-foreground">(mín. {minLength})</span> : null}
      </Label>
      <div className="relative mt-1">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="password"
          type="password"
          required
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="pl-9"
        />
      </div>
    </div>
  );
}
