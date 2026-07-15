import {
  categories as localCategories,
  products as localProducts,
  stores as localStores,
} from "../data/seed";
import type { Category, Product, Store } from "../domain/marketplace";
import { supabase } from "../lib/supabase";

export type Catalog = {
  categories: Category[];
  stores: Store[];
  products: Product[];
  source: "remote" | "local";
};

const localCatalog = (): Catalog => ({
  categories: localCategories,
  stores: localStores,
  products: localProducts,
  source: "local",
});

export async function loadCatalog(): Promise<Catalog> {
  if (!supabase) return localCatalog();

  const [categoryResult, storeResult, productResult] = await Promise.all([
    supabase
      .from("market_categories")
      .select("id,name,icon,color,description")
      .eq("active", true)
      .order("position"),
    supabase
      .from("market_stores")
      .select("id,name,category_id,city,description,rating,eta,delivery_label,image_url,featured")
      .eq("active", true)
      .order("name"),
    supabase
      .from("market_products")
      .select("id,store_id,name,description,price,stock,image_url,available")
      .eq("available", true)
      .order("name"),
  ]);

  if (categoryResult.error || storeResult.error || productResult.error) return localCatalog();

  return {
    source: "remote",
    categories: (categoryResult.data ?? []).map((item) => ({
      ...item,
      description: item.description ?? "",
    })) as Category[],
    stores: (storeResult.data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      categoryId: item.category_id,
      city: item.city,
      description: item.description ?? "",
      rating: Number(item.rating ?? 0),
      eta: item.eta ?? undefined,
      deliveryLabel: item.delivery_label ?? undefined,
      imageUrl: item.image_url ?? undefined,
      featured: item.featured,
    })) as Store[],
    products: (productResult.data ?? []).map((item) => ({
      id: item.id,
      storeId: item.store_id,
      name: item.name,
      description: item.description ?? undefined,
      price: Number(item.price),
      stock: item.stock,
      imageUrl: item.image_url ?? undefined,
      available: item.available,
    })) as Product[],
  };
}
