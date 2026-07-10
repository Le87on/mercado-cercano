import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, PackageCheck, QrCode, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatARS } from "@/lib/marketplace-store";
import {
  useOrders,
  useUpdateOrderStatus,
  type MarketplaceOrder,
  type MarketplaceOrderStatus,
} from "@/lib/marketplace-extended";
import { canMoveOrderStatus } from "@/lib/marketplace-rules";
import { toast } from "sonner";

export const Route = createFileRoute("/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — A la Vuelta" }] }),
  component: OrdersPage,
});

const statusLabel: Record<MarketplaceOrderStatus, string> = {
  pending_payment: "Pago pendiente",
  payment_rejected: "Pago rechazado",
  submitted: "Enviado al comercio",
  accepted: "Aceptado",
  rejected: "Rechazado",
  ready_for_pickup: "Listo para retirar",
  in_delivery: "En delivery",
  closed: "Cerrado",
  cancelled: "Cancelado",
};

function OrdersPage() {
  const { data: orders = [] } = useOrders();
  const update = useUpdateOrderStatus();

  const move = async (order: MarketplaceOrder, status: MarketplaceOrderStatus) => {
    if (!canMoveOrderStatus(order.status, status)) {
      toast.error("Ese cambio de estado no es válido");
      return;
    }
    await update.mutateAsync({ id: order.id, status });
    toast.success("Estado actualizado", { description: statusLabel[status] });
  };

  if (!orders.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <PackageCheck className="mx-auto h-14 w-14 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Todavía no hay pedidos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cuando confirmes una consulta o compra, vas a verla acá.
        </p>
        <Button asChild className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90">
          <Link to="/">Explorar comercios</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground">Mis pedidos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Seguimiento de pedidos, retiro QR y cierre de operación.
      </p>
      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{order.business_name}</h2>
                <p className="text-xs text-muted-foreground">
                  {order.id} · {new Date(order.created_at).toLocaleString("es-AR")}
                </p>
              </div>
              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                {statusLabel[order.status]}
              </span>
            </div>
            <div className="mt-4 divide-y divide-border rounded-xl border border-border">
              {order.items.map((item) => (
                <div key={item.product_id} className="flex justify-between gap-3 p-3 text-sm">
                  <span>
                    {item.title} × {item.qty}
                  </span>
                  <b>{formatARS(item.price * item.qty)}</b>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <Info label="Subtotal" value={formatARS(order.subtotal)} />
              <Info
                label="Envío"
                value={order.shipping_cost ? formatARS(order.shipping_cost) : "Retiro / coordinar"}
              />
              <Info label="Total" value={formatARS(order.total)} strong />
            </div>
            {order.status === "ready_for_pickup" && (
              <div className="mt-4 rounded-xl bg-brand/5 p-4 text-center">
                <QrCode className="mx-auto h-10 w-10 text-brand" />
                <p className="mt-2 text-sm font-semibold">QR de retiro: {order.token}</p>
                <Button className="mt-3 bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => move(order, "closed")}>
                  Simular escaneo QR
                </Button>
              </div>
            )}
            {order.status === "in_delivery" && (
              <div className="mt-4 rounded-xl bg-success/10 p-4 text-center">
                <Truck className="mx-auto h-10 w-10 text-success" />
                <p className="mt-2 text-sm font-semibold">PIN de entrega: {order.token}</p>
                <Button className="mt-3" onClick={() => move(order, "closed")}>
                  Confirmar entrega
                </Button>
              </div>
            )}
            {order.status === "submitted" && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => move(order, "cancelled")}>Cancelar</Button>
              </div>
            )}
            {order.status === "closed" && (
              <p className="mt-4 flex items-center gap-2 text-sm font-medium text-success">
                <CheckCircle2 className="h-4 w-4" /> Pedido cerrado. Comisión registrada.
              </p>
            )}
            {order.status === "rejected" && (
              <p className="mt-4 flex items-center gap-2 text-sm font-medium text-destructive">
                <XCircle className="h-4 w-4" /> Rechazado por comercio.
              </p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}

function Info({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={strong ? "text-base font-bold" : "font-medium"}>{value}</div>
    </div>
  );
}
