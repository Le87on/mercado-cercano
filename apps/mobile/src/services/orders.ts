import type { CartLine, Product } from "../domain/marketplace";
import { supabase } from "../lib/supabase";

export type StoreMembership = {
  storeId: string;
  role: "owner" | "manager" | "staff";
  store: { id: string; name: string; city: string };
};

export type OrderStatus =
  "submitted" | "accepted" | "preparing" | "ready" | "completed" | "rejected" | "cancelled";

export async function createOrder(lines: CartLine[], deliveryAddress: string) {
  if (!supabase) throw new Error("Supabase no está configurado.");
  if (!lines.length) throw new Error("La canasta está vacía.");

  const storeId = lines[0].storeId;
  const { data, error } = await supabase.rpc("create_order", {
    target_store_id: storeId,
    delivery_address: deliveryAddress,
    items: lines.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
  });
  if (error) throw error;
  return data as string;
}

export async function listMyOrders() {
  if (!supabase) return [];
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("market_orders")
    .select("id,status,total,created_at,market_stores(name)")
    .eq("customer_id", userData.user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function getMyStoreMembership(): Promise<StoreMembership | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("market_store_members")
    .select("store_id,role,market_stores(id,name,city)")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.market_stores) return null;
  return { storeId: data.store_id, role: data.role, store: data.market_stores };
}

export async function listStoreOrders(storeId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("market_orders")
    .select("id,status,total,created_at,delivery_address")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data ?? [];
}

export async function listStoreProducts(storeId: string): Promise<Product[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("market_products")
    .select("id,store_id,name,description,price,stock,image_url,available")
    .eq("store_id", storeId)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((item) => ({
    id: item.id,
    storeId: item.store_id,
    name: item.name,
    description: item.description ?? undefined,
    price: Number(item.price),
    stock: item.stock,
    imageUrl: item.image_url ?? undefined,
    available: item.available,
  }));
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { error } = await supabase.rpc("update_market_order_status", {
    target_order_id: orderId,
    next_status: status,
  });
  if (error) throw error;
}

export async function setProductAvailability(productId: string, available: boolean) {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { error } = await supabase
    .from("market_products")
    .update({ available })
    .eq("id", productId);
  if (error) throw error;
}
