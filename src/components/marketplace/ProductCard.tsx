import { Star, Truck, MapPin, Plus, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatARS, type Product, useCart } from "@/lib/marketplace-store";
import { toast } from "sonner";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={
            "h-3.5 w-3.5 " +
            (i <= Math.round(rating) ? "fill-warning text-warning" : "text-muted-foreground/40")
          }
        />
      ))}
      <span className="ml-1 text-xs font-medium text-muted-foreground">{rating.toFixed(1)}</span>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const image =
    product.image_url ||
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop";
  const isCatalogCard = product.price === 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/5">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={image}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {(product.shipping === "envio" || product.shipping === "ambos") && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/95 px-2 py-0.5 text-[10px] font-semibold text-success-foreground shadow-sm">
              <Truck className="h-3 w-3" /> Envío local
            </span>
          )}
          {(product.shipping === "retiro" || product.shipping === "ambos") && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background/95 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm">
              <MapPin className="h-3 w-3" /> Retiro
            </span>
          )}
        </div>
        {isCatalogCard && (
          <div className="absolute bottom-2 left-2 rounded-full bg-brand px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-foreground">
            Comercio local
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-tight text-foreground">
          {product.title}
        </h3>
        <div className="text-lg font-bold text-foreground">{formatARS(product.price)}</div>
        <Stars rating={product.seller_rating ?? 4.5} />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {product.seller_name || "Comercio"} · {product.city || "Mendoza"}
          </span>
        </div>
        <Button
          size="sm"
          className="mt-1 w-full bg-brand text-brand-foreground hover:bg-brand/90"
          onClick={() => {
            addToCart(product.id);
            toast.success(isCatalogCard ? "Guardado para consultar" : "Agregado al carrito", {
              description: product.seller_name || product.title,
            });
          }}
        >
          {isCatalogCard ? <Store className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
          {isCatalogCard ? "Consultar / reservar" : "Agregar"}
        </Button>
      </div>
    </article>
  );
}
