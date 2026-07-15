export type ShippingMethod = "envio" | "retiro";
export type ProductStatus = "active" | "paused" | "deleted";
export type OrderStatus =
  | "pending_payment"
  | "payment_rejected"
  | "submitted"
  | "accepted"
  | "rejected"
  | "ready_for_pickup"
  | "in_delivery"
  | "closed"
  | "cancelled";

export type TotalsLine = {
  price: number;
  qty: number;
  stock?: number;
  productId?: string;
};

export function normalizeMarketplaceText(value: string) {
  return value
    .replace(/B&#\s*176|B&#\s*186|B&deg;|Bº/gi, "Barrio")
    .replace(/\s+/g, " ")
    .trim();
}

export function calculateShippingCost(method: ShippingMethod, city = "") {
  if (method === "retiro") return 0;
  const premiumDistance = ["Tupungato", "Vista Flores", "Agrelo", "Los Sauces"].includes(city);
  return premiumDistance ? 1800 : 1200;
}

export function calculateOrderTotals(lines: TotalsLine[], method: ShippingMethod, city = "") {
  if (!lines.length) throw new Error("El pedido no tiene productos.");
  const subtotal = lines.reduce((acc, line) => {
    if (!Number.isFinite(line.price) || line.price < 0) throw new Error("Precio inválido.");
    if (!Number.isInteger(line.qty) || line.qty <= 0) throw new Error("Cantidad inválida.");
    if (typeof line.stock === "number" && line.qty > line.stock) throw new Error("Stock insuficiente.");
    return acc + line.price * line.qty;
  }, 0);
  const shipping = calculateShippingCost(method, city);
  return { subtotal, shipping, total: subtotal + shipping };
}

export function canBusinessOwnerManage(ownerId: string, userId: string) {
  return Boolean(ownerId && userId && ownerId === userId);
}

export function canAdmin(role?: string | null) {
  return role === "admin";
}

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["payment_rejected", "submitted", "cancelled"],
  payment_rejected: [],
  submitted: ["accepted", "rejected", "cancelled"],
  accepted: ["ready_for_pickup", "in_delivery", "cancelled"],
  ready_for_pickup: ["closed", "cancelled"],
  in_delivery: ["closed", "cancelled"],
  rejected: [],
  closed: [],
  cancelled: [],
};

export function canMoveOrderStatus(from: OrderStatus, to: OrderStatus) {
  return allowedTransitions[from]?.includes(to) ?? false;
}

export function validateProductInput(input: { title: string; price: number; stock: number; category: string }) {
  const errors: string[] = [];
  if (!input.title.trim()) errors.push("El producto necesita nombre.");
  if (!input.category.trim()) errors.push("El producto necesita rubro.");
  if (!Number.isFinite(input.price) || input.price < 0) errors.push("El precio no es válido.");
  if (!Number.isInteger(input.stock) || input.stock < 0) errors.push("El stock no es válido.");
  return errors;
}
