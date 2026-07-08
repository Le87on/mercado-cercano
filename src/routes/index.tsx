import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, MapPin, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AR_CITIES, formatARS, useProducts, type Product } from "@/lib/marketplace-store";
import { ProductCard } from "@/components/marketplace/ProductCard";

export const Route = createFileRoute("/")({
  component: Index,
});

const CATEGORIES = [
  "Todas",
  "Alimentos y bebidas",
  "Moda, calzado y accesorios",
  "Hogar, ferretería y jardín",
  "Gastronomía",
  "Tecnología y electrónica",
  "Servicios",
  "Limpieza",
  "Mascotas",
  "Otros",
];

const SHIPPING = [
  { v: "todos", label: "Cualquier modalidad" },
  { v: "envio", label: "Envío local" },
  { v: "retiro", label: "Retiro en comercio" },
];

const SORTS = [
  { v: "relevancia", label: "Más relevantes" },
  { v: "precio_asc", label: "Menor precio" },
  { v: "precio_desc", label: "Mayor precio" },
  { v: "reputacion", label: "Mejor reputación" },
];

const PRICE_MIN = 0;
const PRICE_MAX = 1_000_000;

function Index() {
  const { data: products = [], isLoading, error } = useProducts();
  const [q, setQ] = useState("");
  const [city, setCity] = useState(AR_CITIES[0]);
  const [category, setCategory] = useState("Todas");
  const [shipping, setShipping] = useState("todos");
  const [sort, setSort] = useState("relevancia");
  const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);

  const [minPrice, maxPrice] = priceRange;
  const priceActive = minPrice > PRICE_MIN || maxPrice < PRICE_MAX;
  const anyFilterActive = Boolean(
    q || city !== AR_CITIES[0] || category !== "Todas" || shipping !== "todos" || sort !== "relevancia" || priceActive,
  );

  const filtered = useMemo(() => {
    const result = products.filter((p: Product) => {
      const query = q.trim().toLowerCase();
      if (query) {
        const haystack = `${p.title} ${p.description} ${p.seller_name ?? ""} ${p.city}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (city !== AR_CITIES[0] && p.city !== city) return false;
      if (category !== "Todas" && p.category !== category) return false;
      if (shipping !== "todos") {
        if (shipping === "envio" && p.shipping === "retiro") return false;
        if (shipping === "retiro" && p.shipping === "envio") return false;
      }
      if (p.price > 0 && (p.price < minPrice || p.price > maxPrice)) return false;
      return true;
    });

    switch (sort) {
      case "precio_asc":
        result.sort((a: Product, b: Product) => a.price - b.price);
        break;
      case "precio_desc":
        result.sort((a: Product, b: Product) => b.price - a.price);
        break;
      case "reputacion":
        result.sort((a: Product, b: Product) => (b.seller_rating ?? 0) - (a.seller_rating ?? 0));
        break;
    }
    return result;
  }, [products, q, city, category, shipping, sort, minPrice, maxPrice]);

  const resetFilters = () => {
    setQ("");
    setCity(AR_CITIES[0]);
    setCategory("Todas");
    setShipping("todos");
    setSort("relevancia");
    setPriceRange([PRICE_MIN, PRICE_MAX]);
  };

  return (
    <main>
      <section className="border-b border-border bg-gradient-to-b from-brand/10 to-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
          <div className="mb-6 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-brand">
              Marketplace local
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              A la Vuelta: comprá <span className="text-brand">cerca de casa</span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Catálogo inicial con comercios de San Carlos, Eugenio Bustos, La Consulta y el Valle de Uco. Primero vidriera local; pagos y WhatsApp autorizado después.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-[1fr_260px_160px]">
            <div className="relative rounded-2xl border border-border bg-card shadow-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar comercio, rubro o producto…"
                className="h-12 border-0 pl-9 text-sm shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="relative rounded-2xl border border-border bg-card shadow-sm">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-brand" />
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="h-12 border-0 pl-9 shadow-none focus:ring-0">
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
            <div className="rounded-2xl border border-border bg-card px-4 py-2 text-center shadow-sm">
              <b className="block text-lg text-brand">{products.length}</b>
              <span className="text-xs text-muted-foreground">comercios</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <SlidersHorizontal className="h-4 w-4 text-brand" />
                Filtros
              </div>
              {anyFilterActive && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={resetFilters}>
                  <X className="mr-1 h-3 w-3" /> Limpiar
                </Button>
              )}
            </div>

            <FilterGroup label="Categoría">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                      (category === c
                        ? "border-brand bg-brand text-brand-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-brand/40 hover:text-foreground")
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="Modalidad">
              <div className="space-y-1.5">
                {SHIPPING.map((s) => (
                  <label key={s.v} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent">
                    <input
                      type="radio"
                      name="shipping"
                      value={s.v}
                      checked={shipping === s.v}
                      onChange={() => setShipping(s.v)}
                      className="h-3.5 w-3.5 accent-brand"
                    />
                    {s.label}
                  </label>
                ))}
              </div>
            </FilterGroup>
          </aside>

          <div>
            <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <span className="truncate text-sm font-medium text-foreground">
                {isLoading ? "Cargando…" : `${filtered.length} resultado${filtered.length === 1 ? "" : "s"}`}
                {priceActive && !isLoading && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    · {formatARS(minPrice)} – {maxPrice >= PRICE_MAX ? "+" : formatARS(maxPrice)}
                  </span>
                )}
              </span>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-9 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.v} value={s.v}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
                No pudimos cargar el catálogo. Intentá recargar la página.
              </div>
            ) : isLoading ? (
              <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card p-16 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <p className="text-sm font-medium text-foreground">Sin resultados</p>
                <p className="mt-1 text-xs text-muted-foreground">Probá con otra búsqueda o localidad.</p>
                {anyFilterActive && (
                  <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                    Limpiar filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p: Product) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
