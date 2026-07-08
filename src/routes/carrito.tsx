import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Minus, Plus, Trash2, Truck, MapPin, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { formatARS, useCart, useProducts, useCreateOrder, type Product } from "@/lib/marketplace-store";
import { toast } from "sonner";

export const Route = createFileRoute("/carrito")({
  head: () => ({
    meta: [
      { title: "Guardados — A la Vuelta" },
      { name: "description", content: "Revisá comercios guardados y prepará tu consulta local." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { cart, updateQty, removeFromCart, clearCart } = useCart();
  const { data: products = [] } = useProducts();
  const navigate = useNavigate();
  const createOrder = useCreateOrder();
  const [zip, setZip] = useState("");
  const [method, setMethod] = useState<"envio" | "retiro">("retiro");

  const items = useMemo(
    () =>
      cart
        .map((i) => {
          const p = products.find((x: Product) => x.id === i.productId);
          return p ? { ...i, product: p } : null;
        })
        .filter(Boolean) as { productId: string; qty: number; product: Product }[],
    [cart, products],
  );

  const subtotal = items.reduce((a, i) => a + i.product.price * i.qty, 0);
  const shipping = method === "retiro" ? 0 : zip ? estimateShipping(zip, subtotal) : null;
  const total = subtotal + (shipping ?? 0);
  const onlyCatalog = items.every((i) => i.product.price === 0);

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-muted">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">No guardaste comercios todavía</h1>
        <p className="mt-2 text-sm text-muted-foreground">Explorá el catálogo y sumá comercios para consultar o reservar.</p>
        <Button asChild className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90">
          <Link to="/">Volver al catálogo</Link>
        </Button>
      </main>
    );
  }

  const checkout = async () => {
    try {
      await createOrder.mutateAsync({
        items: items.map(({ product, qty }) => ({
          product_id: product.id,
          title: product.title,
          price: product.price,
          qty,
          image_url: product.image_url,
        })),
        subtotal,
        shipping_cost: shipping ?? 0,
        total,
        shipping_method: method,
        shipping_zip: method === "envio" ? zip || null : null,
      });
      toast.success(onlyCatalog ? "Consulta preparada" : "Pedido registrado", {
        description: onlyCatalog ? "Estos comercios quedaron guardados para contactar." : `Total ${formatARS(total)}.`,
      });
      clearCart();
      navigate({ to: "/" });
    } catch (e) {
      toast.error("No pudimos registrar la consulta", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-foreground">Comercios guardados</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map(({ product, qty }) => (
            <div
              key={product.id}
              className="grid grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-[96px_minmax(0,1fr)_auto_auto]"
            >
              <img src={product.image_url} alt={product.title} className="h-20 w-20 rounded-lg object-cover sm:h-24 sm:w-24" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-medium text-foreground">{product.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{product.seller_name} · {product.city}</p>
                <p className="mt-1 text-base font-bold text-foreground">{formatARS(product.price)}</p>
              </div>
              <div className="col-start-3 flex items-center gap-1 rounded-md border border-border p-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQty(product.id, qty - 1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="min-w-6 text-center text-sm font-semibold">{qty}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQty(product.id, qty + 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="col-start-3 row-start-2 h-8 w-8 text-muted-foreground hover:text-destructive sm:col-start-4 sm:row-start-1"
                onClick={() => removeFromCart(product.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground">
            Vaciar guardados
          </Button>
        </div>

        <aside className="h-fit space-y-4 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-20">
          <h2 className="text-base font-semibold text-foreground">Preparar consulta</h2>
          <RadioGroup value={method} onValueChange={(v) => setMethod(v as "envio" | "retiro")} className="grid gap-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
              <RadioGroupItem value="retiro" id="retiro" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="retiro" className="flex items-center gap-1.5 font-medium">
                  <MapPin className="h-4 w-4 text-brand" /> Retiro en comercio
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">Coordinación directa con cada comercio.</p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
              <RadioGroupItem value="envio" id="envio" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="envio" className="flex items-center gap-1.5 font-medium">
                  <Truck className="h-4 w-4 text-success" /> Envío local
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">Sujeto a confirmación del comercio.</p>
              </div>
            </label>
          </RadioGroup>

          {method === "envio" && (
            <div>
              <Label htmlFor="zip" className="text-xs font-medium">Código postal</Label>
              <Input
                id="zip"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Ej: 5569"
                className="mt-1"
              />
            </div>
          )}

          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <Row label="Subtotal" value={formatARS(subtotal)} />
            <Row
              label="Envío"
              value={method === "retiro" ? "A coordinar" : shipping === null ? "Ingresá CP" : shipping === 0 ? "Gratis" : formatARS(shipping)}
              muted={shipping === null}
            />
            <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold">
              <span>Total estimado</span>
              <span>{onlyCatalog ? "Consultar" : formatARS(total)}</span>
            </div>
          </div>
          <Button className="w-full bg-brand text-brand-foreground hover:bg-brand/90" onClick={checkout} disabled={createOrder.isPending}>
            {createOrder.isPending ? "Guardando…" : "Guardar consulta"}
          </Button>
        </aside>
      </div>
    </main>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? "text-muted-foreground" : "font-medium text-foreground"}>{value}</span>
    </div>
  );
}

function estimateShipping(zip: string, subtotal: number) {
  if (subtotal >= 250000) return 0;
  const n = parseInt(zip, 10) || 0;
  const base = 1500;
  const distance = Math.abs(5569 - n) / 100;
  return Math.round(base + distance * 120);
}
