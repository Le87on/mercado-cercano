import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Minus, Plus, Trash2, Truck, MapPin, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { formatARS, useMarketplace } from "@/lib/marketplace-store";
import { toast } from "sonner";

export const Route = createFileRoute("/carrito")({
  head: () => ({
    meta: [
      { title: "Mi carrito — MercadoCercano" },
      { name: "description", content: "Revisá tus productos y simulá el envío." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { products, cart, updateQty, removeFromCart, clearCart } = useMarketplace();
  const [zip, setZip] = useState("");
  const [method, setMethod] = useState<"envio" | "retiro">("envio");

  const items = useMemo(
    () =>
      cart
        .map((i) => {
          const p = products.find((x) => x.id === i.productId);
          return p ? { ...i, product: p } : null;
        })
        .filter(Boolean) as { productId: string; qty: number; product: (typeof products)[0] }[],
    [cart, products],
  );

  const subtotal = items.reduce((a, i) => a + i.product.price * i.qty, 0);
  const shipping = method === "retiro" ? 0 : zip ? estimateShipping(zip, subtotal) : null;
  const total = subtotal + (shipping ?? 0);

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-muted">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Tu carrito está vacío</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Explorá el marketplace y sumá productos.
        </p>
        <Button asChild className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90">
          <Link to="/">Ir a comprar</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-foreground">Tu carrito</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map(({ product, qty }) => (
            <div
              key={product.id}
              className="grid grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-[96px_minmax(0,1fr)_auto_auto]"
            >
              <img
                src={product.image}
                alt={product.title}
                className="h-20 w-20 rounded-lg object-cover sm:h-24 sm:w-24"
              />
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-medium text-foreground">
                  {product.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {product.seller} · {product.city}
                </p>
                <p className="mt-1 text-base font-bold text-foreground">
                  {formatARS(product.price)}
                </p>
              </div>
              <div className="col-start-3 flex items-center gap-1 rounded-md border border-border p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQty(product.id, qty - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="min-w-6 text-center text-sm font-semibold">{qty}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => updateQty(product.id, qty + 1)}
                >
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
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-muted-foreground"
          >
            Vaciar carrito
          </Button>
        </div>

        <aside className="h-fit space-y-4 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-20">
          <h2 className="text-base font-semibold text-foreground">Simulador de envío</h2>
          <RadioGroup
            value={method}
            onValueChange={(v) => setMethod(v as "envio" | "retiro")}
            className="grid gap-2"
          >
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
              <RadioGroupItem value="envio" id="envio" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="envio" className="flex items-center gap-1.5 font-medium">
                  <Truck className="h-4 w-4 text-success" /> Envío local
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Llega en 24-72hs a tu domicilio.
                </p>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
              <RadioGroupItem value="retiro" id="retiro" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="retiro" className="flex items-center gap-1.5 font-medium">
                  <MapPin className="h-4 w-4 text-brand" /> Retiro en persona
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Sin costo. Coordinás con el vendedor.
                </p>
              </div>
            </label>
          </RadioGroup>

          {method === "envio" && (
            <div>
              <Label htmlFor="zip" className="text-xs font-medium">
                Código postal
              </Label>
              <Input
                id="zip"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Ej: 1425"
                className="mt-1"
              />
            </div>
          )}

          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <Row label="Subtotal" value={formatARS(subtotal)} />
            <Row
              label="Envío"
              value={
                method === "retiro"
                  ? "Gratis"
                  : shipping === null
                    ? "Calculá con tu CP"
                    : shipping === 0
                      ? "Gratis"
                      : formatARS(shipping)
              }
              muted={shipping === null}
            />
            <div className="flex items-center justify-between border-t border-border pt-3 text-base font-bold">
              <span>Total</span>
              <span>{formatARS(total)}</span>
            </div>
          </div>
          <Button
            className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
            onClick={() => {
              toast.success("Compra simulada", {
                description: `Total ${formatARS(total)}. Recibirás un correo de confirmación.`,
              });
              clearCart();
            }}
          >
            Finalizar compra
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
      <span className={muted ? "text-muted-foreground" : "font-medium text-foreground"}>
        {value}
      </span>
    </div>
  );
}

function estimateShipping(zip: string, subtotal: number) {
  if (subtotal >= 250000) return 0;
  const n = parseInt(zip, 10) || 0;
  const base = 2500;
  const distance = Math.abs(1400 - n) / 100; // rough
  return Math.round(base + distance * 120);
}
