import { createFileRoute, Link } from "@tanstack/react-router";
import { LogOut, MailCheck, ShieldCheck, Store, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMarketplaceProfile, useUpdateMarketplaceProfile } from "@/lib/marketplace-extended";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Mi perfil — A la Vuelta" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile } = useMarketplaceProfile();
  const update = useUpdateMarketplaceProfile();

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-brand-dark to-brand p-6 text-white shadow-glow">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-3xl border border-cyan-200/30 bg-white/10">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <UserRound className="h-10 w-10 text-cyan-100" />
            )}
          </div>
          <div>
            <p className="text-sm text-cyan-100">Cuenta de usuario</p>
            <h1 className="text-3xl font-bold">{profile?.full_name ?? "Usuario demo"}</h1>
            <p className="text-sm text-cyan-100">Rol: {profile?.role ?? "customer"}</p>
          </div>
        </div>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_.8fr]">
        <form
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            await update.mutateAsync({
              full_name: String(form.get("full_name") ?? ""),
              phone: String(form.get("phone") ?? ""),
              avatar_url: String(form.get("avatar_url") ?? ""),
            });
            toast.success("Perfil actualizado");
          }}
        >
          <h2 className="text-xl font-bold">Editar perfil</h2>
          <div className="mt-4 grid gap-3">
            <input
              name="full_name"
              defaultValue={profile?.full_name}
              className="rounded-xl border border-border bg-background px-3 py-2"
              placeholder="Nombre y apellido"
            />
            <input
              name="phone"
              defaultValue={profile?.phone}
              className="rounded-xl border border-border bg-background px-3 py-2"
              placeholder="Teléfono"
            />
            <input
              name="avatar_url"
              defaultValue={profile?.avatar_url}
              className="rounded-xl border border-border bg-background px-3 py-2"
              placeholder="URL de avatar"
            />
            <Button className="bg-brand text-brand-foreground hover:bg-brand/90">Guardar cambios</Button>
          </div>
        </form>

        <div className="space-y-4">
          <ActionCard icon={<MailCheck className="h-5 w-5" />} title="Validación de correo" text="Pendiente de conectar a Supabase Auth real." />
          <ActionCard icon={<ShieldCheck className="h-5 w-5" />} title="Recuperar contraseña" text="Se habilita con el flujo de Supabase Auth." />
          <Link className="block rounded-2xl border border-border bg-card p-5 shadow-sm" to="/comercio">
            <div className="flex items-center gap-2 font-bold"><Store className="h-5 w-5 text-brand" /> Panel comercio</div>
            <p className="mt-1 text-sm text-muted-foreground">Cargá productos y gestioná pedidos.</p>
          </Link>
          <button
            className="w-full rounded-2xl border border-border bg-card p-5 text-left shadow-sm"
            onClick={() => toast.info("Sesión demo cerrada. Con Supabase Auth será cierre real.")}
          >
            <div className="flex items-center gap-2 font-bold"><LogOut className="h-5 w-5 text-brand" /> Cerrar sesión</div>
            <p className="mt-1 text-sm text-muted-foreground">Acción preparada para autenticación real.</p>
          </button>
        </div>
      </section>
    </main>
  );
}

function ActionCard({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 font-bold text-foreground">{icon}{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
