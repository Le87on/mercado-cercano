export type Role = "customer" | "business_owner" | "admin";

export type PricedItem = {
  price: number;
  qty: number;
  stock?: number;
};

export function assertValidCart(items: PricedItem[]) {
  if (!items.length) return { ok: false, message: "El carrito está vacío." } as const;
  const invalid = items.find((item) => item.qty < 1 || item.price < 0);
  if (invalid) return { ok: false, message: "Hay cantidades o precios inválidos." } as const;
  const withoutStock = items.find((item) => typeof item.stock === "number" && item.qty > item.stock);
  if (withoutStock) return { ok: false, message: "La cantidad supera el stock disponible." } as const;
  return { ok: true, message: "Carrito válido." } as const;
}

export function calculateSubtotal(items: PricedItem[]) {
  return items.reduce((total, item) => total + item.price * item.qty, 0);
}

export function calculateTotal(items: PricedItem[], shippingCost = 0) {
  return calculateSubtotal(items) + Math.max(0, shippingCost);
}

export function canManageBusiness(params: { role: Role; userId: string; ownerId: string }) {
  return params.role === "admin" || params.userId === params.ownerId;
}

export function canManageProduct(params: { role: Role; userId: string; businessOwnerId: string }) {
  return params.role === "admin" || params.userId === params.businessOwnerId;
}

export function canViewOrder(params: {
  role: Role;
  userId: string;
  customerId: string;
  businessOwnerId: string;
}) {
  return (
    params.role === "admin" ||
    params.userId === params.customerId ||
    params.userId === params.businessOwnerId
  );
}
