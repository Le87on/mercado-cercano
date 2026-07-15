import type { Category, Product, Store } from "../domain/marketplace";

export const categories: Category[] = [
  {
    id: "gastronomia",
    name: "Comida",
    icon: "restaurant-outline",
    color: "#F43F5E",
    description: "Restaurantes y más",
  },
  {
    id: "almacen",
    name: "Almacén",
    icon: "basket-outline",
    color: "#F59E0B",
    description: "Despensa diaria",
  },
  {
    id: "salud",
    name: "Farmacia",
    icon: "medkit-outline",
    color: "#10B981",
    description: "Salud y cuidado",
  },
  {
    id: "moda",
    name: "Moda",
    icon: "shirt-outline",
    color: "#3B82F6",
    description: "Ropa y calzado",
  },
  {
    id: "ferreteria",
    name: "Ferretería",
    icon: "hammer-outline",
    color: "#F97316",
    description: "Herramientas",
  },
  {
    id: "servicios",
    name: "Servicios",
    icon: "construct-outline",
    color: "#8B5CF6",
    description: "Técnicos cerca",
  },
];

export const stores: Store[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Parientes Pizzería",
    categoryId: "gastronomia",
    city: "San Carlos",
    description: "Pizzas al horno y empanadas caseras.",
    rating: 4.8,
    eta: "25–35 min",
    deliveryLabel: "Envío $1.200",
    featured: true,
    imageUrl:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&auto=format&fit=crop",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Mercado Sur",
    categoryId: "almacen",
    city: "Eugenio Bustos",
    description: "Almacén, bebidas y productos frescos.",
    rating: 4.7,
    eta: "20–30 min",
    deliveryLabel: "Envío gratis",
    imageUrl:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&auto=format&fit=crop",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Farmacia Central",
    categoryId: "salud",
    city: "La Consulta",
    description: "Cuidado personal y farmacia de cercanía.",
    rating: 4.9,
    eta: "15–25 min",
    deliveryLabel: "Envío $900",
    imageUrl:
      "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=900&auto=format&fit=crop",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Calzados Sucre",
    categoryId: "moda",
    city: "Eugenio Bustos",
    description: "Calzado urbano para toda la familia.",
    rating: 4.7,
    eta: "Retiro",
    deliveryLabel: "Coordinar entrega",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Ferretería El Tornillo",
    categoryId: "ferreteria",
    city: "San Carlos",
    description: "Herramientas y soluciones para el hogar.",
    rating: 4.8,
    eta: "20–30 min",
    deliveryLabel: "Envío $1.200",
    imageUrl:
      "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=900&auto=format&fit=crop",
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    name: "Servicios del Valle",
    categoryId: "servicios",
    city: "Tunuyán",
    description: "Electricidad, climatización y reparaciones.",
    rating: 4.9,
    eta: "Con turno",
    deliveryLabel: "Visita a domicilio",
    imageUrl:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=900&auto=format&fit=crop",
  },
];

export const products: Product[] = [
  {
    id: "a1111111-1111-4111-8111-111111111111",
    storeId: "11111111-1111-4111-8111-111111111111",
    name: "Pizza muzzarella grande",
    description: "Salsa casera, muzzarella y aceitunas",
    price: 6900,
    stock: 18,
    available: true,
    imageUrl: stores[0].imageUrl,
  },
  {
    id: "a2222222-2222-4222-8222-222222222222",
    storeId: "11111111-1111-4111-8111-111111111111",
    name: "Docena de empanadas",
    description: "Carne, jamón y queso o verdura",
    price: 9800,
    stock: 12,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=700&auto=format&fit=crop",
  },
  {
    id: "b1111111-1111-4111-8111-111111111111",
    storeId: "22222222-2222-4222-8222-222222222222",
    name: "Leche entera 1 L",
    price: 1500,
    stock: 30,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=700&auto=format&fit=crop",
  },
  {
    id: "b2222222-2222-4222-8222-222222222222",
    storeId: "22222222-2222-4222-8222-222222222222",
    name: "Café molido 500 g",
    price: 7200,
    stock: 20,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=700&auto=format&fit=crop",
  },
  {
    id: "c1111111-1111-4111-8111-111111111111",
    storeId: "33333333-3333-4333-8333-333333333333",
    name: "Alcohol en gel 500 ml",
    price: 3900,
    stock: 22,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=700&auto=format&fit=crop",
  },
  {
    id: "d1111111-1111-4111-8111-111111111111",
    storeId: "44444444-4444-4444-8444-444444444444",
    name: "Zapatillas urbanas",
    price: 38500,
    stock: 8,
    available: true,
    imageUrl: stores[3].imageUrl,
  },
  {
    id: "e1111111-1111-4111-8111-111111111111",
    storeId: "55555555-5555-4555-8555-555555555555",
    name: "Martillo de acero",
    price: 16400,
    stock: 14,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=700&auto=format&fit=crop",
  },
  {
    id: "f1111111-1111-4111-8111-111111111111",
    storeId: "66666666-6666-4666-8666-666666666666",
    name: "Revisión de aire acondicionado",
    price: 28000,
    stock: 6,
    available: true,
    imageUrl: stores[5].imageUrl,
  },
];
