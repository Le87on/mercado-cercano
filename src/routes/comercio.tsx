import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Eye, PackagePlus, Store, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatARS, useCreateProduct, useMyProducts } from "@/lib/marketplace-store";
import {
  useDeleteProduct,
  useMyBusiness,
  useReceivedOrders,
  useUpdateOrderStatus,
  useUpdateProduct,
  useUpsertBusiness,
  type MarketplaceOrderStatus,
} from "@/lib/marketplace-extended";
import { validateProductInput } from "@/lib/marketplace-rules";

export const Route = createFileRoute("/comercio")({
  head: () => ({ meta: [{ title: "Panel comercio — A la Vuelta" }] }),
  component: BusinessPanelPage,
});

function BusinessPanelPage() {
  const { data: business } = useMyBusiness();
  const { data: products = [] } = useMyProducts();
  const { data: orders = [] } = useReceivedOrders();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateOrder = useUpdateOrderStatus();
  const upsertBusiness = useUpsertBusiness();
  const [filter, setFilter] = useState<"todos" | MarketplaceOrderStatus>("todos");

  const visibleOrders = useMemo(
    () => (filter === "todos" ? orders : orders.filter((o) => o.status === filter)),
    [filter, orders],
  );

  const submitProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      price: Number(form.get("price") ?? 0),
      stock: Number(form.get("stock") ?? 0),
      city: business?.city ?? "San Carlos",
      category: String(form.get("category") ?? business?.category ?? "General"),
      shipping: "ambos" as const,
      image_url: String(form.get("image_url") ?? "") || "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=900&auto=format&fit=crop",
    };
    const errors = validateProductInput(input);
    if (errors.length) {
      toast.error(errors[0]);
      return;
    }
    await createProduct.mutateAsync(input);
    event.currentTarget.reset();
    toast.success("Producto creado");
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-brand-dark to-brand p-6 text-white shadow-glow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-cyan-100">Panel protegido del comercio</p>
            <h1 className="mt-1 text-3xl font-bold">{business?.name ?? "Mi comercio"}</h1>
            <p className="mt-1 text-sm text-cyan-100">
              Estado: <b>{business?.status ?? "pending"}</b> · {business?.city ?? "San Carlos"}
            </p>
          </div>
          <Store className="h-12 w-12 text-cyan-200" />
        </div>
        <form
          className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 sm:grid-cols-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            await upsertBusiness.mutateAsync({
              name: String(form.get("name") ?? business?.name ?? "Mi comercio"),
              category: String(form.get("category") ?? business?.category ?? "General"),
              city: String(form.get("city") ?? business?.city ?? "San Carlos"),
              zone: String(form.get("zone") ?? business?.zone ?? ""),
            });
            toast.success("Datos guardados. La verificación queda pendiente de admin.");
          }}
        >
          <input name="name" defaultValue={business?.name} className="rounded-xl border border-white/20 bg-slate-950/50 px-3 py-2" placeholder="Nombre" />
          <input name="category" defaultValue={business?.category} className="rounded-xl border border-white/20 bg-slate-950/50 px-3 py-2" placeholder="Rubro" />
          <input name="city" defaultValue={business?.city} className="rounded-xl border border-white/20 bg-slate-950/50 px-3 py-2" placeholder="Localidad" />
          <input name="zone" defaultValue={business?.zone} className="rounded-xl border border-white/20 bg-slate-950/50 px-3 py-2 sm:col-span-2" placeholder="Zona" />
          <Button className="bg-cyan-200 text-slate-950 hover:bg-cyan-100">Guardar comercio</Button>
        </form>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-brand" />
            <h2 className="text-xl font-bold">Crear producto</h2>
          </div>
          <form className="mt-4 grid gap-3" onSubmit={submitProduct}>
            <input required name="title" className="rounded-xl border border-border bg-background px-3 py-2" placeholder="Nombre del producto" />
            <textarea name="description" className="min-h-20 rounded-xl border border-border bg-background px-3 py-2" placeholder="Descripción" />
            <div className="grid grid-cols-2 gap-3">
              <input required name="price" type="number" className="rounded-xl border border-border bg-background px-3 py-2" placeholder="Precio" />
              <input required name="stock" type="number" className="rounded-xl border border-border bg-background px-3 py-2" placeholder="Stock" />
            </div>
            <input required name="category" className="rounded-xl border border-border bg-background px-3 py-2" placeholder="Rubro" defaultValue={business?.category} />
            <input name="image_url" className="rounded-xl border border-border bg-background px-3 py-2" placeholder="URL imagen / Supabase Storage" />
            <Button className="bg-brand text-brand-foreground hover:bg-brand/90">Crear producto</Button>
          </form>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-bold">Mis productos</h2>
          <div className="mt-4 space-y-3">
            {products.length ? (
              products.map((product) => (
                <article key={product.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <img src={product.image_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{product.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatARS(product.price)} · stock {product.stock}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateProduct.mutate({ id: product.id, stock: product.stock > 0 ? 0 : 10 })}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm("¿Eliminar este producto?")) deleteProduct.mutate(product.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </article>
              ))
            ) : (
              <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">No cargaste productos todavía.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Pedidos recibidos</h2>
            <p className="text-sm text-muted-foreground">Filtrá por estado y actualizá el avance.</p>
          </div>
          <select
            className="rounded-xl border border-border bg-background px-3 py-2"
            value={filter}
            onChange={(event) => setFilter(event.target.value as typeof filter)}
          >
            <option value="todos">Todos</option>
            <option value="submitted">Enviados</option>
            <option value="accepted">Aceptados</option>
            <option value="ready_for_pickup">Retiro</option>
            <option value="in_delivery">Delivery</option>
            <option value="closed">Cerrados</option>
          </select>
        </div>
        <div className="mt-4 space-y-3">
          {visibleOrders.length ? (
            visibleOrders.map((order) => (
              <article key={order.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <b>{order.id}</b>
                    <p className="text-sm text-muted-foreground"><CalendarDays className="mr-1 inline h-4 w-4" />{new Date(order.created_at).toLocaleString("es-AR")}</p>
                  </div>
                  <b>{formatARS(order.total)}</b>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => updateOrder.mutate({ id: order.id, status: "accepted" })}>Aceptar</Button>
                  <Button variant="outline" size="sm" onClick={() => updateOrder.mutate({ id: order.id, status: "ready_for_pickup" })}>Listo QR</Button>
                  <Button variant="outline" size="sm" onClick={() => updateOrder.mutate({ id: order.id, status: "in_delivery" })}>Delivery</Button>
                  <Button variant="outline" size="sm" onClick={() => updateOrder.mutate({ id: order.id, status: "rejected" })}>Rechazar</Button>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Sin pedidos para este filtro.</p>
          )}
        </div>
      </section>
    </main>
  );
}
