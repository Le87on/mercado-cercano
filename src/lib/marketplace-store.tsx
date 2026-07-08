import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type Product = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  city: string;
  category: string;
  shipping: "envio" | "retiro" | "ambos";
  image_url: string;
  created_at: string;
  seller_name?: string | null;
  seller_rating?: number;
};

export type CartItem = { productId: string; qty: number };

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

export const formatARS = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

// ---------------------------------------------------------------------------
// Cart (kept in localStorage — buyer can build a cart without signing in)
// ---------------------------------------------------------------------------

type CartCtx = {
  cart: CartItem[];
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartCtx | null>(null);
const LS_CART = "mc_cart_v2";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const c = localStorage.getItem(LS_CART);
      if (c) setCart(JSON.parse(c));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(LS_CART, JSON.stringify(cart));
  }, [cart, hydrated]);

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
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// Product / order queries (Supabase)
// ---------------------------------------------------------------------------

type RawProduct = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number | string;
  stock: number;
  city: string;
  category: string;
  shipping: string;
  image_url: string;
  created_at: string;
  profiles?: { display_name: string | null } | null;
};

const mapProduct = (r: RawProduct): Product => ({
  id: r.id,
  user_id: r.user_id,
  title: r.title,
  description: r.description,
  price: Number(r.price),
  stock: r.stock,
  city: r.city,
  category: r.category,
  shipping: (r.shipping as Product["shipping"]) ?? "ambos",
  image_url: r.image_url,
  created_at: r.created_at,
  seller_name: r.profiles?.display_name ?? "Vendedor",
  // Deterministic 4.2–5.0 pseudo rating from the id so the UI shows stars
  seller_rating: 4.2 + ((parseInt(r.id.replace(/\D/g, "").slice(0, 4) || "0", 10) % 80) / 100),
});

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*, profiles:profiles!products_user_id_fkey(display_name)")
        .order("created_at", { ascending: false });
      if (error) {
        // Fallback without join in case FK name isn't recognized
        const { data: d2, error: e2 } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });
        if (e2) throw e2;
        return (d2 as RawProduct[]).map(mapProduct);
      }
      return (data as RawProduct[]).map(mapProduct);
    },
  });
}

export function useMyProducts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["products", "mine", user?.id ?? null],
    enabled: !!user,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as RawProduct[]).map(mapProduct);
    },
  });
}

export type NewProductInput = {
  title: string;
  description: string;
  price: number;
  stock: number;
  city: string;
  category: string;
  shipping: "envio" | "retiro" | "ambos";
  image_url: string;
};

export function useCreateProduct() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewProductInput) => {
      if (!user) throw new Error("Necesitás iniciar sesión para publicar.");
      const { data, error } = await supabase
        .from("products")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export type OrderItemSnapshot = {
  product_id: string;
  title: string;
  price: number;
  qty: number;
  image_url: string;
};

export function useCreateOrder() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      items: OrderItemSnapshot[];
      subtotal: number;
      shipping_cost: number;
      total: number;
      shipping_method: "envio" | "retiro";
      shipping_zip: string | null;
    }) => {
      if (!user) throw new Error("Necesitás iniciar sesión para finalizar la compra.");
      const { data, error } = await supabase
        .from("orders")
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
