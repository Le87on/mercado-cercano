import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

const SEED_COMERCIOS = `Calzados Sucre|Moda, calzado y accesorios|Eugenio Bustos|San Martín 241|Indumentaria
Max Limpio|Limpieza|Eugenio Bustos|San Juan Bosco 417|Fabricantes de Prod Especiales de Limpieza
Los Amiguitos|Alimentos y bebidas|San Carlos|Lencinas 370|Carnicerias
Bailo Sport|Moda, calzado y accesorios|Eugenio Bustos|San Martín 1329|Indumentaria Deportiva
Trozadero Don Andres|Alimentos y bebidas|Eugenio Bustos||Carnicerias
Fiambreria Don Juan|Alimentos y bebidas|La Consulta|Barrio Juventud Sancarlina Mb C 1|Autoservicios -Despensa
Fiambreria Bastias|Alimentos y bebidas|Eugenio Bustos|A. Bonfanti 273|Autoservicios -Despensa
Sg Tu Look|Moda, calzado y accesorios|Eugenio Bustos|El Rosedal S/N|Indumentaria
Don David|Alimentos y bebidas|Pareditas|Santiago Mendez 735|Autoservicios -Despensa
Carniceria y Avicola Mi Viejo|Alimentos y bebidas|San Carlos|Maestri y Lavalle 88|Carnicerias
Despensa Naty|Alimentos y bebidas|Chilecito|Ruta Nacional 40|Carnicerias
Singular|Moda, calzado y accesorios|Eugenio Bustos|Sargenti Cabral|Indumentaria
Impulso Indumentaria|Moda, calzado y accesorios|San Carlos|Bernardo Quiroga 293|Indumentaria Deportiva
Martinez Repuestos|Autos, motos y repuestos|Eugenio Bustos||Servicios y Repuestos Auto/Motos
Kamina|Moda, calzado y accesorios|Eugenio Bustos|Arenales 361|Indumentaria
Carnes Don Paco|Alimentos y bebidas|San Carlos|Bernardo Quiroga 99|Carnicerias
Locos Por El Deporte|Moda, calzado y accesorios|La Consulta|Enrique Ramonda|Accesorio y Bijouterie
Flor de Lis|Juguetería|San Carlos|San Martín|Jugueteria
Mercado Independencia|Alimentos y bebidas|San Carlos|Sargento Cabral E Independencia S/N -|Supermercado -Alimentos -Carniceria- Lacteos
Suyana Modas|Moda, calzado y accesorios|Eugenio Bustos|Arnales 361|Indumentaria
Panificadora Don Juan|Alimentos y bebidas|Eugenio Bustos|Las Heras 493|Panaderias
Me Visto Como Quiero|Moda, calzado y accesorios|Eugenio Bustos|B&# 176|Indumentaria
Acuarios Creaciones|Moda, calzado y accesorios|San Carlos|Bernardo Quiroga 259|Indumentaria
Myg-Decohogar|Hogar, ferretería y jardín|Eugenio Bustos|Granaderos 211|Articulos y Servicios Para El Hogar
Liga Lucha Contra El Cancer|Servicios|San Carlos||Asociaciones Sociales Civiles
Primcopias|Librería, papelería e imprenta|Eugenio Bustos|B&# 176|Libreria - Papeleria y Utiles
Tienda Janet|Moda, calzado y accesorios|Eugenio Bustos|Gral.San Martín 201|Indumentaria- Accesorios/Hombres/Niños
Mayorista Fenix|Alimentos y bebidas|Eugenio Bustos|San Martín 151|Supermercado -Alimentos -Carniceria- Lacteos
Numen|Tecnología y electrónica|Eugenio Bustos|Las Heras 350|Servicio de Reparación de Artículos Electrónicos
El Cumpa|Alimentos y bebidas|Tres Esquinas|Arriagada|Carnicerias
Emunah|Moda, calzado y accesorios|Eugenio Bustos|Barrio Huayquerias M F Casa 1|Indumentaria
Agua|Moda, calzado y accesorios|Eugenio Bustos|Guillermo Cano 326|Indumentaria- Accesorios/Hombres/Niños
Almasofia|Moda, calzado y accesorios|Eugenio Bustos|Sin Numero|Indumentaria
La Estancia|Alimentos y bebidas|Tres Esquinas|Puerta|Autoservicios -Despensa
Mayorista Fenix|Alimentos y bebidas|Eugenio Bustos|San Martín 151|Supermercado -Alimentos -Carniceria- Lacteos
Bio Servicios|Servicios|Eugenio Bustos|B&# 186|Otros Servicios Personales (Ncp)
La Rural|Alimentos y bebidas|La Consulta|B&# 176|Carnicerias
Carniceria y Verduleria El Gato|Alimentos y bebidas|San Carlos|Maestri 272|Carnicerias
Corralon Al Fondo|Alimentos y bebidas|San Carlos|San Martín 15|Autoservicios -Despensa
Fina|Moda, calzado y accesorios|Eugenio Bustos|San Juan Bosco 321|Indumentaria
Mercado San Expedito|Alimentos y bebidas|Chilecito|Daniel Guevara|Supermercado -Alimentos -Carniceria- Lacteos
Electro Cell|Tecnología y electrónica|San Carlos|B&# 176|Telefonía y Electrónica
Panaderia Nueva Esperanza|Alimentos y bebidas|San Carlos|Casa 1|Panaderias
Blanco Arte|Moda, calzado y accesorios|Eugenio Bustos|Arenales 371|Indumentaria
Mc Umy Resto|Gastronomía|La Consulta|Bianchetti 240|Comida Rápida
Me Visto Como Quiero|Moda, calzado y accesorios|Eugenio Bustos|San Martín S/N -|Indumentaria
Celestina|Alimentos y bebidas|Eugenio Bustos|S/Calle S/N Zona Industrial Ruta 40|Chocolatería
El Nogal|Alimentos y bebidas|San Carlos|Calle Sin Nombre|Carnicerias
Carniceria Eugenio Bustos|Alimentos y bebidas|Eugenio Bustos|B&# 186|Carnicerias
La Plaza|Alimentos y bebidas|Chilecito|Bernardo Quiroga|Autoservicios -Despensa
Las Marias|Hogar, ferretería y jardín|San Carlos|Ruta 40|Ferreterias
Polleria y Carniceria|Alimentos y bebidas|San Carlos|Barrio Carrasco Ma C 19|Autoservicios -Despensa
Frigorifico San Carlos|Alimentos y bebidas|San Carlos|Emilio Civit Norte 2616|Carnicerias
Descartables Jl|Alimentos y bebidas|Eugenio Bustos|B&# 186|Autoservicios -Despensa
Lagrafica|Librería, papelería e imprenta|Eugenio Bustos|Chile 130|Imprenta
Oreo Libreria|Librería, papelería e imprenta|San Carlos|Bernardo Quiroga 675|Libreria - Papeleria y Utiles
Despensa Roy y Rox|Alimentos y bebidas|San Carlos|Donato Guevara 445|Kiosco
Delirio|Moda, calzado y accesorios|San Carlos|Los Olivos y Claderon 397|Indumentaria
Olimpya Telas|Usados y segunda mano|San Carlos|Bernardo Quiroga 260|Vta de Mercadería Usada General
Pintureria y Ferreteria Arcoiris|Hogar, ferretería y jardín|Eugenio Bustos|San Martín y Belgrano|Ferreterias
She Indumentaria|Moda, calzado y accesorios|La Consulta|Juan Jose Paso 394|Indumentaria
Despensa Doña Rita|Alimentos y bebidas|San Carlos|Calderon 326|Supermercado -Alimentos -Carniceria- Lacteos
Bodega de la Tierrita|Viajes y turismo|Eugenio Bustos|El Maiten 968|Viaje y Turismo
Pulchino la Boutique del Niño|Moda, calzado y accesorios|San Carlos|San Martín 517|Indumentaria
Nonnosdeco|Moda, calzado y accesorios|Pareditas|San Martín y Delfino 10|Indumentaria
Almacen Ramos Burgos|Alimentos y bebidas|La Consulta|San Martín Norte 265|Verdulerias
Gomeria Neumatica Adarme|Autos, motos y repuestos|Eugenio Bustos|San Martín 860|Gomería / Taller Mecánico
Ucofitness|Salud, deporte y bienestar|Tunuyán|Republica de Siria 316|Gimnasio
Exclusivo Modas|Moda, calzado y accesorios|La Consulta|Cobos|Indumentaria- Accesorios/Hombres/Niños
Ceverina Deco|Arte y artesanías|San Carlos|La Capilla S/N&# 186|Arte / Artesanías
Me Quiero Mimar|Moda, calzado y accesorios|Tres Esquinas|Navarro|Calzado
Jamon Bonaparte|Alimentos y bebidas|Eugenio Bustos|Echeverria 441|Autoservicios -Despensa
Isa Supermercado|Alimentos y bebidas|Eugenio Bustos|Arenales 370|Supermercado -Alimentos -Carniceria- Lacteos
Calzados Jovita y Más|Moda, calzado y accesorios|Eugenio Bustos|San Martín 219|Calzado
Ohjack|Gastronomía|Eugenio Bustos|San Martín 643|Bar
Ferreteria Poletto|Hogar, ferretería y jardín|San Carlos|Bernardo Quiroga 1085|Ferreterias
Ferreteria y Materiales de Construccion Orlando|Hogar, ferretería y jardín|Eugenio Bustos||Ferreterias
Celeste Ayelen|Moda, calzado y accesorios|San Carlos|San Martín Norte 235|Indumentaria
Brune Gonzalez|Servicios|San Carlos||Vtas Puerta A Puerta
El Entrerriano|Gastronomía|Eugenio Bustos|Sin Nombre|Comida Rápida
Lubrincentro Aldo Juarez|Autos, motos y repuestos|Eugenio Bustos|San Martín 775|Lubricentro
Tienda Flores|Moda, calzado y accesorios|Eugenio Bustos|Manzana B Casa 10|Accesorio y Bijouterie
El Carrito de la Limpieza|Limpieza|San Carlos|Bernardo Quiroga 661|Fabricantes de Prod Especiales de Limpieza
La Libelula|Alimentos y bebidas|Eugenio Bustos|B&# 186|Supermercado -Alimentos -Carniceria- Lacteos
Alma Sofia|Moda, calzado y accesorios|Chilecito|Sin Calle|Indumentaria- Accesorios/Hombres/Niños
Pro Garden|Hogar, ferretería y jardín|Agrelo|Rio Blanco 4000|Viveros
Parientes Pizzeria|Gastronomía|San Carlos|J.N.Lencinas 349|Gastronomia
Que Lo Disfrutes|Gastronomía|Tunuyán|San Martín 1021|Bar
La Villa|Alimentos y bebidas|San Carlos|Sargento Cabral 496|Carnicerias
Agrovalle|Autos, motos y repuestos|Eugenio Bustos||Vta Equip Autom, Aeronáutico, Agríc(Ncp)
Josue Lucero|Alimentos y bebidas|San Carlos|Ejercito de Los Andes 68|Panaderias
Donaxel97|Hogar, ferretería y jardín|La Consulta|Curto|Jardinería
El Foca|Alimentos y bebidas|Eugenio Bustos|B&# 176|Autoservicios -Despensa
Atipana|Gastronomía|Los Sauces|Ruta 94|Gastronomia
Algramo|Alimentos y bebidas|Eugenio Bustos|San Martín y Chile 5569|Autoservicios -Despensa
Sublime|Moda, calzado y accesorios|San Carlos|Maestri y Lavalle|Indumentaria- Accesorios/Hombres/Niños
Petshoptitan|Mascotas|Eugenio Bustos|San Martín y Bonfanti S/N|Artículos Para Mascotas
Vanina Todo Telas|Servicios|San Carlos|San Martín 417|Mktg Directo - Ventas Por Catálogo
Viansa|Hogar, ferretería y jardín|Chacras de Coria|Aguinaga 1420|Viveros
Soderia|Alimentos y bebidas|Pareditas|B&# 186|Vinoteca
Cielito Kids|Moda, calzado y accesorios|San Carlos|Ruta 40|Indumentaria`;

const imageByCategory: Record<string, string> = {
  "Alimentos y bebidas": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&auto=format&fit=crop",
  "Moda, calzado y accesorios": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=900&auto=format&fit=crop",
  "Hogar, ferretería y jardín": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&auto=format&fit=crop",
  Gastronomía: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&auto=format&fit=crop",
  Limpieza: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=900&auto=format&fit=crop",
  "Tecnología y electrónica": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&auto=format&fit=crop",
  Servicios: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&auto=format&fit=crop",
  Mascotas: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=900&auto=format&fit=crop",
};

const cleanAddress = (value: string) =>
  value.replace(/B&#\s*176|B&#\s*186/g, "Barrio").replace(/\s+/g, " ").trim();

const seedProducts: Product[] = SEED_COMERCIOS.trim().split("\n").map((line, index) => {
  const [name, category, city, rawAddress, subcategory] = line.split("|");
  const address = cleanAddress(rawAddress || "Dirección a confirmar");
  return {
    id: `local-${String(index + 1).padStart(3, "0")}`,
    user_id: "catalogo-local",
    title: `${name} · ${subcategory || category}`,
    description: `${name} es un comercio local de ${subcategory || category} en ${city}. ${address ? `Dirección: ${address}.` : "Dirección a confirmar."}`,
    price: 0,
    stock: 1,
    city,
    category,
    shipping: "ambos",
    image_url: imageByCategory[category] ?? "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=900&auto=format&fit=crop",
    created_at: new Date(2026, 6, 8, 9, index % 60).toISOString(),
    seller_name: name,
    seller_rating: 4.4 + ((index % 6) / 10),
  } satisfies Product;
});

export const AR_CITIES = ["Todas las ubicaciones", ...Array.from(new Set(seedProducts.map((p) => p.city))).sort()];

export const formatARS = (n: number) =>
  n === 0
    ? "Consultar"
    : new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(n);

const LS_PRODUCTS = "mc_local_products_v1";
const LS_CART = "mc_cart_v2";
const LS_ORDERS = "mc_orders_v1";

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

function readLocalProducts() {
  return readJson<Product[]>(LS_PRODUCTS, []);
}

type CartCtx = {
  cart: CartItem[];
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(readJson<CartItem[]>(LS_CART, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeJson(LS_CART, cart);
  }, [cart, hydrated]);

  const addToCart = (id: string) =>
    setCart((prev) => {
      const found = prev.find((i) => i.productId === id);
      if (found) return prev.map((i) => (i.productId === id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { productId: id, qty: 1 }];
    });

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i.productId !== id));

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

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      return [...readLocalProducts(), ...seedProducts];
    },
  });
}

export function useMyProducts() {
  return useQuery({
    queryKey: ["products", "mine"],
    queryFn: async (): Promise<Product[]> => readLocalProducts(),
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewProductInput) => {
      const next: Product = {
        id: `user-${Date.now().toString(36)}`,
        user_id: "local-user",
        created_at: new Date().toISOString(),
        seller_name: "Mi comercio",
        seller_rating: 4.8,
        ...input,
      };
      writeJson(LS_PRODUCTS, [next, ...readLocalProducts()]);
      return next;
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
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      business_id: string;
      business_name: string;
      items: OrderItemSnapshot[];
      subtotal: number;
      shipping_cost: number;
      total: number;
      shipping_method: "envio" | "retiro";
      shipping_zip: string | null;
      delivery_address?: string;
      notes?: string;
    }) => {
      const order = {
        id: `order-${Date.now().toString(36)}`,
        user_id: "local-user",
        status: "submitted",
        token: `QR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        created_at: new Date().toISOString(),
        ...input,
      };
      writeJson(LS_ORDERS, [order, ...readJson<object[]>(LS_ORDERS, [])]);
      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
