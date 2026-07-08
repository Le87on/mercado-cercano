import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Package, DollarSign, Boxes, ImagePlus, Store, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AR_CITIES,
  formatARS,
  useMyProducts,
  useCreateProduct,
  type Product,
} from "@/lib/marketplace-store";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/vender")({
  head: () => ({
    meta: [
      { title: "Vender — MercadoCercano" },
      { name: "description", content: "Publicá un producto en pocos pasos." },
    ],
  }),
  component: SellerPage,
});

const CATS = ["Electrónica", "Hogar", "Indumentaria", "Deportes", "Otros"];

function SellerPage() {
  const { user, loading } = useAuth();
  const { data: myProducts = [] } = useMyProducts();
  const createProduct = useCreateProduct();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [city, setCity] = useState(AR_CITIES[1]);
  const [category, setCategory] = useState(CATS[0]);
  const [shipping, setShipping] = useState<"envio" | "retiro" | "ambos">("ambos");

  const priceNum = Number(price);
  const stockNum = Number(stock);
  const valid =
    title.trim().length >= 3 &&
    priceNum > 0 &&
    stockNum > 0 &&
    description.trim().length >= 10;

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        Cargando…
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand/10 text-brand">
          <Store className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Vendé en MercadoCercano</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ingresá o creá tu cuenta para publicar productos.
        </p>
        <Button asChild className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90">
          <Link to="/auth" search={{ next: "/vender" }}>
            <LogIn className="mr-2 h-4 w-4" />
            Ingresar
          </Link>
        </Button>
      </main>
    );
  }

  const submit = async () => {
    if (!valid) {
      toast.error("Completá todos los campos correctamente");
      return;
    }
    try {
      await createProduct.mutateAsync({
        title: title.trim(),
        price: priceNum,
        stock: stockNum,
        description: description.trim(),
        image_url:
          image.trim() ||
          "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop",
        city,
        category,
        shipping,
      });
      toast.success("Producto publicado", { description: title });
      setTitle("");
      setPrice("");
      setStock("1");
      setDescription("");
      setImage("");
    } catch (e) {
      toast.error("No pudimos publicar", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel de vendedor</h1>
          <p className="text-sm text-muted-foreground">
            Cargá un producto y aparecerá en el marketplace al instante.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
          <Field icon={Package} label="Nombre del producto" htmlFor="title">
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Notebook 14'' 8GB RAM"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field icon={DollarSign} label="Precio (ARS)" htmlFor="price">
              <Input
                id="price"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field icon={Boxes} label="Stock disponible" htmlFor="stock">
              <Input
                id="stock"
                type="number"
                min="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Descripción" htmlFor="desc">
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contá características, estado y detalles relevantes."
              rows={4}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Categoría">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Ubicación">
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AR_CITIES.filter((c) => c !== AR_CITIES[0]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Método de entrega">
              <Select
                value={shipping}
                onValueChange={(v) => setShipping(v as typeof shipping)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="envio">Solo envío local</SelectItem>
                  <SelectItem value="retiro">Solo retiro</SelectItem>
                  <SelectItem value="ambos">Envío + retiro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field icon={ImagePlus} label="URL de la foto (opcional)" htmlFor="img">
            <Input
              id="img"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://…"
            />
          </Field>

          <Button
            onClick={submit}
            disabled={!valid || createProduct.isPending}
            className="w-full bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto"
          >
            {createProduct.isPending ? "Publicando…" : "Publicar producto"}
          </Button>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Vista previa
            </p>
            <div className="mt-3 overflow-hidden rounded-lg border border-border bg-background">
              <div className="aspect-square bg-muted">
                {image ? (
                  <img src={image} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-muted-foreground">
                    Foto del producto
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-medium text-foreground">
                  {title || "Nombre del producto"}
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {priceNum > 0 ? formatARS(priceNum) : "$0"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{city}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tus publicaciones ({myProducts.length})
            </p>
            {myProducts.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Todavía no publicaste productos.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {myProducts.map((p: Product) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-2"
                  >
                    <img
                      src={p.image_url}
                      alt=""
                      className="h-10 w-10 rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatARS(p.price)} · Stock {p.stock}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  icon: Icon,
  children,
}: {
  label: string;
  htmlFor?: string;
  icon?: typeof Package;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {label}
      </Label>
      {children}
    </div>
  );
}
