export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
};

export type Store = {
  id: string;
  name: string;
  categoryId: string;
  city: string;
  description: string;
  rating?: number;
  eta?: string;
  deliveryLabel?: string;
  imageUrl?: string;
  featured?: boolean;
};

export type Product = {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  available: boolean;
};

export type CartLine = {
  productId: string;
  storeId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
};

export type CartSummary = {
  itemCount: number;
  subtotal: number;
  total: number;
};

type SearchableStore = Pick<Store, "id" | "name" | "categoryId" | "city" | "description">;

export const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es-AR");

export function searchStores<T extends SearchableStore>(stores: T[], query: string): T[] {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return stores;

  return stores.filter((store) =>
    normalizeSearch(
      `${store.name} ${store.categoryId} ${store.city} ${store.description}`,
    ).includes(normalizedQuery),
  );
}

export function filterStores<T extends SearchableStore>(
  stores: T[],
  categoryId: string | null,
  query: string,
): T[] {
  const byCategory = categoryId
    ? stores.filter((store) => store.categoryId === categoryId)
    : stores;
  return searchStores(byCategory, query);
}

export function summarizeCart(lines: Array<Pick<CartLine, "unitPrice" | "quantity">>): CartSummary {
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  return { itemCount, subtotal, total: subtotal };
}

export function canAddProduct(lines: Array<Pick<CartLine, "storeId">>, storeId: string): boolean {
  return lines.length === 0 || lines.every((line) => line.storeId === storeId);
}

export const nextQuantity = (current: number, delta: number) => Math.max(0, current + delta);

export const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
