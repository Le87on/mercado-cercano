import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AR_CITIES, useMarketplace } from "@/lib/marketplace-store";
import { ProductCard } from "@/components/marketplace/ProductCard";

export const Route = createFileRoute("/")({
  component: Index,
});

const CATEGORIES = ["Todas", "Electrónica", "Hogar", "Indumentaria", "Deportes"];
const SHIPPING = [
  { v: "todos", label: "Cualquier entrega" },
  { v: "envio", label: "Envío local" },
  { v: "retiro", label: "Retiro en persona" },
];

function Index() {
  const { products } = useMarketplace();
  const [q, setQ] = useState("");
  const [city, setCity] = useState(AR_CITIES[0]);
  const [category, setCategory] = useState("Todas");
  const [shipping, setShipping] = useState("todos");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (q && !p.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (city !== AR_CITIES[0] && p.city !== city) return false;
      if (category !== "Todas" && p.category !== category) return false;
      if (shipping !== "todos") {
        if (shipping === "envio" && p.shipping === "retiro") return false;
        if (shipping === "retiro" && p.shipping === "envio") return false;
      }
      return true;
    });
  }, [products, q, city, category, shipping]);

  return (
    <main>
      {/* Hero + search */}
      <section className="border-b border-border bg-gradient-to-b from-brand/5 to-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              Comprá y vendé <span className="text-brand">cerca tuyo</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Miles de productos con envío local o retiro en persona en toda Argentina.
            </p>
          </div>
          <div className="mx-auto flex max-w-4xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar productos, marcas o vendedores…"
                className="h-11 border-0 pl-9 text-sm shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="relative sm:w-64">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-brand" />
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="h-11 border-0 pl-9 shadow-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AR_CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Filters + grid */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium text-foreground">
              {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={shipping} onValueChange={setShipping}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHIPPING.map((s) => (
                  <SelectItem key={s.v} value={s.v}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-sm font-medium text-foreground">Sin resultados</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Probá con otra búsqueda o ampliá la ubicación.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
