import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Product = {
  id: string;
  title: string;
  price: number;
  stock: number;
  description: string;
  image: string;
  seller: string;
  rating: number; // 0-5
  city: string;
  shipping: "envio" | "retiro" | "ambos";
  category: string;
};

export type CartItem = { productId: string; qty: number };

const SEED: Product[] = [
  {
    id: "p1",
    title: "Mate imperial de algarrobo con bombilla",
    price: 18500,
    stock: 12,
    description: "Mate artesanal tallado en algarrobo, incluye bombilla de alpaca.",
    image:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop",
    seller: "Artesanías del Norte",
    rating: 4.8,
    city: "Salta",
    shipping: "ambos",
    category: "Hogar",
  },
  {
    id: "p2",
    title: "Zapatillas urbanas running unisex",
    price: 89990,
    stock: 34,
    description: "Zapatillas livianas ideales para uso diario y deporte.",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop",
    seller: "SportBA",
    rating: 4.5,
    city: "CABA - Palermo",
    shipping: "envio",
    category: "Indumentaria",
  },
  {
    id: "p3",
    title: "Notebook 14'' 8GB RAM 256GB SSD",
    price: 749000,
    stock: 5,
    description: "Ideal para trabajo y estudio. Garantía oficial 12 meses.",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop",
    seller: "TecnoCórdoba",
    rating: 4.6,
    city: "Córdoba",
    shipping: "envio",
    category: "Electrónica",
  },
  {
    id: "p4",
    title: "Bicicleta MTB rodado 29 con cambios Shimano",
    price: 385000,
    stock: 3,
    description: "Cuadro aluminio, 21 velocidades, frenos a disco.",
    image:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop",
    seller: "Ruedas Rosario",
    rating: 4.9,
    city: "Rosario",
    shipping: "retiro",
    category: "Deportes",
  },
  {
    id: "p5",
    title: "Cafetera espresso semi automática",
    price: 245000,
    stock: 8,
    description: "15 bares de presión, vaporizador y molinillo integrado.",
    image:
      "https://images.unsplash.com/photo-1517142089942-ba376ce32a2e?w=600&auto=format&fit=crop",
    seller: "CasaCafé",
    rating: 4.3,
    city: "Mendoza",
    shipping: "ambos",
    category: "Hogar",
  },
  {
    id: "p6",
    title: "Silla ergonómica de oficina con soporte lumbar",
    price: 195000,
    stock: 15,
    description: "Malla transpirable, apoyabrazos regulables.",
    image:
      "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&auto=format&fit=crop",
    seller: "Muebles La Plata",
    rating: 4.4,
    city: "La Plata",
    shipping: "envio",
    category: "Hogar",
  },
  {
    id: "p7",
    title: "Auriculares inalámbricos con cancelación de ruido",
    price: 128000,
    stock: 22,
    description: "Bluetooth 5.3, autonomía 30hs, estuche de carga.",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop",
    seller: "AudioZone",
    rating: 4.7,
    city: "CABA - Belgrano",
    shipping: "envio",
    category: "Electrónica",
  },
  {
    id: "p8",
    title: "Set de cuchillos profesionales acero inoxidable",
    price: 62000,
    stock: 18,
    description: "6 piezas con soporte de madera, mango ergonómico.",
    image:
      "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=600&auto=format&fit=crop",
    seller: "Cocina & Más",
    rating: 4.2,
    city: "Mar del Plata",
    shipping: "ambos",
    category: "Hogar",
  },
];

type Ctx = {
  products: Product[];
  cart: CartItem[];
  addProduct: (p: Omit<Product, "id" | "rating" | "seller">) => void;
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
};

const MarketplaceContext = createContext<Ctx | null>(null);

const LS_PRODUCTS = "mc_products_v1";
const LS_CART = "mc_cart_v1";

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(SEED);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const p = localStorage.getItem(LS_PRODUCTS);
      const c = localStorage.getItem(LS_CART);
      if (p) setProducts(JSON.parse(p));
      if (c) setCart(JSON.parse(c));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(LS_PRODUCTS, JSON.stringify(products));
  }, [products, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(LS_CART, JSON.stringify(cart));
  }, [cart, hydrated]);

  const addProduct: Ctx["addProduct"] = (p) => {
    const id = "u" + Math.random().toString(36).slice(2, 9);
    setProducts((prev) => [
      { ...p, id, rating: 5.0, seller: "Tu tienda" },
      ...prev,
    ]);
  };

  const addToCart = (id: string) =>
    setCart((prev) => {
      const found = prev.find((i) => i.productId === id);
      if (found) return prev.map((i) => (i.productId === id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { productId: id, qty: 1 }];
    });

  const removeFromCart = (id: string) =>
    setCart((prev) => prev.filter((i) => i.productId !== id));

  const updateQty = (id: string, qty: number) =>
    setCart((prev) =>
      prev
        .map((i) => (i.productId === id ? { ...i, qty: Math.max(1, qty) } : i))
        .filter((i) => i.qty > 0),
    );

  const clearCart = () => setCart([]);

  return (
    <MarketplaceContext.Provider
      value={{ products, cart, addProduct, addToCart, removeFromCart, updateQty, clearCart }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) throw new Error("useMarketplace must be used within MarketplaceProvider");
  return ctx;
}

export const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

export const AR_CITIES = [
  "Todas las ubicaciones",
  "CABA - Palermo",
  "CABA - Belgrano",
  "CABA - Caballito",
  "La Plata",
  "Córdoba",
  "Rosario",
  "Mendoza",
  "Salta",
  "Mar del Plata",
  "Tucumán",
  "Neuquén",
];
