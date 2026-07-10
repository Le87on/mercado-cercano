import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Store, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatARS } from "@/lib/marketplace-store";
import {
  useAdminActions,
  useAdminProducts,
  useBusinesses,
  useOrders,
  useMarketplaceProfile,
  type BusinessStatus,
} from "@/lib/marketplace-extended";
import { canAdmin } from "@/lib/marketplace-rules";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — A la Vuelta" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { data: profile } = useMarketplaceProfile();
  const { data: businesses = [] } = useBusinesses();
  const { data: products = [] } = useAdminProducts();
  const { data: orders = [] } = useOrders();
  const action = useAdminActions();

  if (!canAdmin(profile?.role)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShieldCheck className="mx-auto h-14 w-14 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Acceso administrativo protegido</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta vista requiere rol administrador y políticas RLS activas en Supabase.
        </p>
      </main>
    );
  }

  const setStatus = async (businessId: string, status: BusinessStatus) => {
    await action.mutateAsync({ businessId, status });
    toast.success("Acción administrativa registrada", { description: status });
  };

  const pending = businesses.filter((b) => b.status === "pending");

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-brand-dark to-brand p-6 text-white shadow-glow">
        <p className="text-sm text-cyan-100">Panel exclusivo para administradores</p>
        <h1 className="mt-1 text-3xl font-bold">Control de A la Vuelta</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Metric label="Usuarios" value="Demo" />
          <Metric label="Comercios" value={String(businesses.length)} />
          <Metric label="Pendientes" value={String(pending.length)} />
          <Metric label="Pedidos" value={String(orders.length)} />
        </div>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-brand" />
            <h2 className="text-xl font-bold">Comercios</h2>
          </div>
          <div className="mt-4 space-y-3">
            {businesses.map((business) => (
              <article key={business.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <b>{business.name}</b>
                    <p className="text-sm text-muted-foreground">
                      {business.category} · {business.city} · {business.status}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">{business.is_active ? "activo" : "inactivo"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setStatus(business.id, "verified")}>Aprobar</Button>
                  <Button variant="outline" size="sm" onClick={() => setStatus(business.id, "rejected")}>Rechazar</Button>
                  <Button variant="outline" size="sm" onClick={() => setStatus(business.id, "suspended")}>Suspender</Button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-brand" />
            <h2 className="text-xl font-bold">Registro básico de acciones</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <Log label="Moderación" value="Aprobar / rechazar / suspender comercios" />
            <Log label="Productos" value={`${products.length} productos revisables`} />
            <Log label="Pedidos" value={`${orders.length} pedidos visibles para auditoría`} />
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-xl font-bold">Productos publicados</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="rounded-xl border border-border p-3">
              <img src={product.image_url} alt="" className="h-32 w-full rounded-xl object-cover" />
              <b className="mt-3 block line-clamp-2">{product.title}</b>
              <p className="text-sm text-muted-foreground">{product.category} · {formatARS(product.price)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
      <div className="text-xs text-cyan-100">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Log({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <b>{label}</b>
      <p className="text-muted-foreground">{value}</p>
    </div>
  );
}
