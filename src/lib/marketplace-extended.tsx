import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrderItemSnapshot, Product } from "@/lib/marketplace-store";

export type BusinessStatus = "pending" | "verified" | "rejected" | "suspended";
export type UserRole = "customer" | "business_owner" | "admin";
export type MarketplaceBusiness = {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  city: string;
  zone?: string;
  address?: string;
  status: BusinessStatus;
  is_active: boolean;
  created_at: string;
};
export type MarketplaceOrderStatus =
  | "pending_payment"
  | "payment_rejected"
  | "submitted"
  | "accepted"
  | "rejected"
  | "ready_for_pickup"
  | "in_delivery"
  | "closed"
  | "cancelled";
export type MarketplaceOrder = {
  id: string;
  user_id: string;
  business_id: string;
  business_name: string;
  status: MarketplaceOrderStatus;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_method: "envio" | "retiro";
  notes?: string;
  token?: string;
  created_at: string;
  items: OrderItemSnapshot[];
};

const LS_ORDERS = "mc_orders_v1";
const LS_PRODUCTS = "mc_local_products_v1";
const LS_BUSINESSES = "mc_businesses_v1";
const LS_PROFILE = "mc_profile_v1";

const defaultBusiness: MarketplaceBusiness = {
  id: "business-local-user",
  owner_id: "local-user",
  name: "Mi comercio demo",
  category: "Alimentos y bebidas",
  city: "San Carlos",
  zone: "Centro",
  address: "Dirección protegida hasta aceptar pedido",
  status: "pending",
  is_active: true,
  created_at: new Date(2026, 6, 10, 9, 0).toISOString(),
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readProducts() {
  return readJson<Product[]>(LS_PRODUCTS, []);
}

function readBusinesses() {
  const stored = readJson<MarketplaceBusiness[]>(LS_BUSINESSES, []);
  return stored.length ? stored : [defaultBusiness];
}

function normalizeOrder(raw: Partial<MarketplaceOrder> & Record<string, unknown>): MarketplaceOrder {
  const items = Array.isArray(raw.items) ? (raw.items as OrderItemSnapshot[]) : [];
  return {
    id: String(raw.id ?? `order-${Date.now().toString(36)}`),
    user_id: String(raw.user_id ?? "local-user"),
    business_id: String(raw.business_id ?? "catalogo-local"),
    business_name: String(raw.business_name ?? "Comercio local"),
    status: (raw.status as MarketplaceOrderStatus) ?? "submitted",
    subtotal: Number(raw.subtotal ?? 0),
    shipping_cost: Number(raw.shipping_cost ?? 0),
    total: Number(raw.total ?? raw.subtotal ?? 0),
    shipping_method: (raw.shipping_method as "envio" | "retiro") ?? "retiro",
    notes: String(raw.notes ?? ""),
    token: String(raw.token ?? `QR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`),
    created_at: String(raw.created_at ?? new Date().toISOString()),
    items,
  };
}

export function useMarketplaceProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () =>
      readJson(LS_PROFILE, {
        id: "local-user",
        full_name: "Usuario demo",
        email: "demo@a-la-vuelta.local",
        phone: "+549",
        avatar_url: "",
        role: "customer" as UserRole,
      }),
  });
}

export function useUpdateMarketplaceProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, string>) => {
      const current = readJson<Record<string, string>>(LS_PROFILE, {});
      const next = { ...current, ...input, role: current.role ?? "customer" };
      writeJson(LS_PROFILE, next);
      return next;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useBusinesses() {
  return useQuery({ queryKey: ["businesses"], queryFn: async () => readBusinesses() });
}

export function useMyBusiness() {
  return useQuery({
    queryKey: ["businesses", "mine"],
    queryFn: async () => readBusinesses().find((b) => b.owner_id === "local-user") ?? defaultBusiness,
  });
}

export function useUpsertBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<MarketplaceBusiness>) => {
      const all = readBusinesses();
      const current = all.find((b) => b.id === (input.id ?? defaultBusiness.id)) ?? defaultBusiness;
      const next: MarketplaceBusiness = {
        ...current,
        ...input,
        owner_id: "local-user",
        status: current.status === "verified" ? "verified" : "pending",
      };
      writeJson(LS_BUSINESSES, [next, ...all.filter((b) => b.id !== next.id)]);
      return next;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["businesses"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Product> & { id: string }) => {
      const next = readProducts().map((p) => (p.id === input.id ? { ...p, ...input } : p));
      writeJson(LS_PRODUCTS, next);
      return next.find((p) => p.id === input.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products", "mine"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      writeJson(LS_PRODUCTS, readProducts().filter((p) => p.id !== id));
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products", "mine"] });
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<MarketplaceOrder[]> => readJson<Record<string, unknown>[]>(LS_ORDERS, []).map(normalizeOrder),
  });
}

export function useReceivedOrders() {
  return useQuery({
    queryKey: ["orders", "received"],
    queryFn: async (): Promise<MarketplaceOrder[]> => readJson<Record<string, unknown>[]>(LS_ORDERS, []).map(normalizeOrder),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: MarketplaceOrderStatus }) => {
      const next = readJson<Record<string, unknown>[]>(LS_ORDERS, []).map((o) =>
        String(o.id) === id ? { ...o, status } : o,
      );
      writeJson(LS_ORDERS, next);
      return next.find((o) => String(o.id) === id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["orders", "received"] });
    },
  });
}

export function useAdminActions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ businessId, status }: { businessId: string; status: BusinessStatus }) => {
      const next = readBusinesses().map((b) =>
        b.id === businessId ? { ...b, status, is_active: status !== "suspended" } : b,
      );
      writeJson(LS_BUSINESSES, next);
      return next.find((b) => b.id === businessId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["businesses"] }),
  });
}

export function useAdminProducts() {
  return useQuery({ queryKey: ["admin-products"], queryFn: async () => readProducts() });
}
