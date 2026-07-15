import "./global.css";

import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { AppProviders } from "./src/app/AppProviders";

type Tab = "home" | "cart" | "orders" | "commerce" | "profile";

type Shop = {
  id: string;
  name: string;
  category: string;
  city: string;
  rating: number;
  eta: string;
  delivery: string;
  hero: string;
  product: string;
  price: number;
};

const shops: Shop[] = [
  {
    id: "parientes",
    name: "Parientes Pizzería",
    category: "Gastronomía",
    city: "San Carlos",
    rating: 4.8,
    eta: "25-35 min",
    delivery: "$1.200 envío",
    hero: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&auto=format&fit=crop",
    product: "Pizza muzza grande",
    price: 6900,
  },
  {
    id: "sucre",
    name: "Calzados Sucre",
    category: "Moda",
    city: "Eugenio Bustos",
    rating: 4.7,
    eta: "Retiro",
    delivery: "Dirección al aceptar",
    hero: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop",
    product: "Zapatillas urbanas",
    price: 38500,
  },
  {
    id: "titan",
    name: "Pet Shop Titán",
    category: "Mascotas",
    city: "Eugenio Bustos",
    rating: 4.9,
    eta: "20-30 min",
    delivery: "$1.200 envío",
    hero: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=900&auto=format&fit=crop",
    product: "Alimento balanceado",
    price: 14200,
  },
];

const categories = ["Gastronomía", "Moda", "Mascotas", "Tecnología", "Salud", "Ferretería"];

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);

export default function App() {
  return (
    <AppProviders>
      <MarketplaceApp />
    </AppProviders>
  );
}

function MarketplaceApp() {
  const [signedIn, setSignedIn] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [cart, setCart] = useState<Record<string, number>>({});

  const cartLines = useMemo(
    () => shops.filter((shop) => cart[shop.id]).map((shop) => ({ ...shop, qty: cart[shop.id] })),
    [cart],
  );
  const total = cartLines.reduce((acc, line) => acc + line.price * line.qty, 0);

  const addToCart = (id: string) => setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  const updateQty = (id: string, qty: number) =>
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });

  if (!signedIn) return <AuthScreen onEnter={() => setSignedIn(true)} />;

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-midnight">
        <StatusBar style="light" />
        {tab === "home" && <HomeScreen onAdd={addToCart} />}
        {tab === "cart" && <CartScreen lines={cartLines} total={total} onQty={updateQty} />}
        {tab === "orders" && <OrdersScreen />}
        {tab === "commerce" && <CommerceScreen />}
        {tab === "profile" && <ProfileScreen onSignOut={() => setSignedIn(false)} />}
        <BottomTabs active={tab} onChange={setTab} cartCount={cartLines.reduce((acc, line) => acc + line.qty, 0)} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function AuthScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-midnight px-6">
        <StatusBar style="light" />
        <View className="flex-1 justify-center">
          <Text className="text-center text-5xl font-black text-brandSoft">A la Vuelta</Text>
          <Text className="mt-2 text-center text-base text-mutedInk">Tu comercio local a un clic.</Text>
          <View className="mt-14 gap-4">
            <PrimaryButton icon="call-outline" label="Con número de teléfono" onPress={onEnter} />
            <PrimaryButton icon="logo-google" label="Con Google" onPress={onEnter} />
          </View>
          <Text className="my-6 text-center text-base text-ink">o registrate</Text>
          <Pressable
            onPress={onEnter}
            className="rounded-3xl border border-cyanGlow/70 bg-cardBlue/70 p-6 shadow-glow"
          >
            <Ionicons name="storefront-outline" size={42} color="#6FEFF2" />
            <Text className="mt-4 text-2xl font-bold text-ink">Soy Comercio</Text>
            <Text className="mt-1 text-mutedInk">Vende y gestiona tu tienda desde el teléfono.</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function HomeScreen({ onAdd }: { onAdd: (id: string) => void }) {
  return (
    <ScrollView className="flex-1 px-4" contentContainerClassName="pb-28">
      <View className="pt-2">
        <View className="flex-row items-center rounded-3xl bg-white/95 px-4 py-3">
          <Ionicons name="search" size={18} color="#0B2440" />
          <TextInput placeholder="Buscar comercios, rubros o productos" className="ml-2 flex-1 text-slate-700" />
          <View className="rounded-full bg-brand p-2">
            <Ionicons name="options-outline" size={16} color="#081A2E" />
          </View>
        </View>
        <Text className="mt-6 text-2xl font-extrabold text-ink">Rubros cerca tuyo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          {categories.map((category) => (
            <View key={category} className="mr-3 rounded-2xl border border-cyanGlow/20 bg-cardBlue px-4 py-3">
              <Text className="font-semibold text-ink">{category}</Text>
            </View>
          ))}
        </ScrollView>
        <View className="mt-7 flex-row items-center justify-between">
          <Text className="text-xl font-extrabold text-ink">Recomendados</Text>
          <Text className="font-semibold text-cyanGlow">Ver todo</Text>
        </View>
        <View className="mt-3 gap-4">
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} onAdd={onAdd} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function ShopCard({ shop, onAdd }: { shop: Shop; onAdd: (id: string) => void }) {
  return (
    <View className="overflow-hidden rounded-3xl border border-cyanGlow/25 bg-cardBlue shadow-glow">
      <Image source={{ uri: shop.hero }} className="h-36 w-full" />
      <View className="p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xl font-extrabold text-ink">{shop.name}</Text>
            <Text className="mt-1 text-sm text-mutedInk">{shop.category} · {shop.city}</Text>
            <Text className="mt-2 text-sm text-brandSoft">★ {shop.rating} · {shop.eta} · {shop.delivery}</Text>
          </View>
          <Pressable onPress={() => onAdd(shop.id)} className="rounded-2xl bg-brand px-4 py-3">
            <Text className="font-black text-midnight">Agregar</Text>
          </Pressable>
        </View>
        <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-midnight/55 p-3">
          <Text className="font-semibold text-ink">{shop.product}</Text>
          <Text className="font-black text-cyanGlow">{formatARS(shop.price)}</Text>
        </View>
      </View>
    </View>
  );
}

function CartScreen({
  lines,
  total,
  onQty,
}: {
  lines: Array<Shop & { qty: number }>;
  total: number;
  onQty: (id: string, qty: number) => void;
}) {
  return (
    <ScrollView className="flex-1 px-4" contentContainerClassName="pb-28">
      <Text className="mt-2 text-3xl font-black text-ink">Carrito</Text>
      <Text className="mt-1 text-mutedInk">El comercio recibe el pedido recién después de validar pago y stock.</Text>
      <View className="mt-5 gap-3">
        {lines.length === 0 && <EmptyState icon="cart-outline" title="Todavía no agregaste productos" />}
        {lines.map((line) => (
          <View key={line.id} className="flex-row items-center rounded-3xl bg-cardBlue p-3">
            <Image source={{ uri: line.hero }} className="h-16 w-16 rounded-2xl" />
            <View className="ml-3 flex-1">
              <Text className="font-bold text-ink">{line.product}</Text>
              <Text className="text-sm text-mutedInk">{line.name}</Text>
              <Text className="mt-1 font-black text-cyanGlow">{formatARS(line.price)}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Pressable onPress={() => onQty(line.id, line.qty - 1)} className="rounded-full bg-midnight p-2">
                <Ionicons name="remove" color="#EAF8FF" size={16} />
              </Pressable>
              <Text className="min-w-6 text-center font-bold text-ink">{line.qty}</Text>
              <Pressable onPress={() => onQty(line.id, line.qty + 1)} className="rounded-full bg-brand p-2">
                <Ionicons name="add" color="#081A2E" size={16} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
      {lines.length > 0 && (
        <View className="mt-6 rounded-3xl bg-white p-5">
          <Text className="text-sm font-semibold text-slate-500">Total estimado</Text>
          <Text className="mt-1 text-3xl font-black text-slate-950">{formatARS(total)}</Text>
          <Pressable className="mt-4 rounded-2xl bg-midnight py-4">
            <Text className="text-center text-base font-black text-brandSoft">Proceder al checkout</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function OrdersScreen() {
  return (
    <ScrollView className="flex-1 px-4" contentContainerClassName="pb-28">
      <Text className="mt-2 text-3xl font-black text-ink">Pedidos</Text>
      <View className="mt-5 rounded-3xl bg-cardBlue p-5">
        <Text className="text-lg font-black text-ink">Pedido demo enviado</Text>
        <Text className="mt-1 text-mutedInk">Estado: esperando aceptación del comercio.</Text>
        <View className="mt-4 rounded-2xl border border-cyanGlow/30 p-4">
          <Text className="font-bold text-cyanGlow">QR/PIN protegido</Text>
          <Text className="mt-1 text-sm text-mutedInk">Se libera solo cuando el comercio acepta la operación.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function CommerceScreen() {
  return (
    <ScrollView className="flex-1 px-4" contentContainerClassName="pb-28">
      <Text className="mt-2 text-3xl font-black text-ink">Panel comercio</Text>
      <View className="mt-5 rounded-3xl bg-cardBlue p-5">
        <Text className="text-mutedInk">Performance</Text>
        <View className="mt-3 flex-row justify-between">
          <Metric label="Ventas" value="$10K" />
          <Metric label="Pedidos" value="12" />
          <Metric label="Productos" value="20" />
        </View>
      </View>
      <View className="mt-4 rounded-3xl bg-white p-5">
        <Text className="text-xl font-black text-slate-950">Últimos pedidos</Text>
        <Text className="mt-2 text-slate-500">Aceptar, rechazar y marcar listo desde el teléfono.</Text>
      </View>
    </ScrollView>
  );
}

function ProfileScreen({ onSignOut }: { onSignOut: () => void }) {
  return (
    <ScrollView className="flex-1 px-4" contentContainerClassName="pb-28">
      <Text className="mt-2 text-3xl font-black text-ink">Perfil</Text>
      <View className="mt-5 rounded-3xl bg-cardBlue p-5">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-brand">
          <Ionicons name="person" color="#081A2E" size={36} />
        </View>
        <Text className="mt-4 text-2xl font-black text-ink">Usuario de prueba</Text>
        <Text className="mt-1 text-mutedInk">Cliente · Valle de Uco</Text>
      </View>
      <Pressable onPress={onSignOut} className="mt-4 rounded-3xl border border-red-400/30 bg-red-950/30 p-4">
        <Text className="text-center font-bold text-red-200">Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

function BottomTabs({ active, onChange, cartCount }: { active: Tab; onChange: (tab: Tab) => void; cartCount: number }) {
  const tabs: Array<{ id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { id: "home", label: "Inicio", icon: "home-outline" },
    { id: "cart", label: "Carrito", icon: "cart-outline" },
    { id: "orders", label: "Pedidos", icon: "receipt-outline" },
    { id: "commerce", label: "Comercio", icon: "storefront-outline" },
    { id: "profile", label: "Perfil", icon: "person-outline" },
  ];

  return (
    <View className="absolute bottom-0 left-0 right-0 flex-row border-t border-cyanGlow/20 bg-midnight/95 px-2 pb-3 pt-2">
      {tabs.map((item) => {
        const selected = item.id === active;
        return (
          <Pressable key={item.id} onPress={() => onChange(item.id)} className="flex-1 items-center py-1">
            <View className="relative">
              <Ionicons name={item.icon} size={24} color={selected ? "#6FEFF2" : "#92A8BB"} />
              {item.id === "cart" && cartCount > 0 && (
                <View className="absolute -right-3 -top-2 min-w-5 rounded-full bg-brand px-1">
                  <Text className="text-center text-xs font-black text-midnight">{cartCount}</Text>
                </View>
              )}
            </View>
            <Text className={`mt-1 text-[11px] font-semibold ${selected ? "text-cyanGlow" : "text-mutedInk"}`}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PrimaryButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-center rounded-3xl bg-brand px-5 py-4">
      <Ionicons name={icon} size={22} color="#081A2E" />
      <Text className="ml-3 text-base font-black text-midnight">{label}</Text>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-2xl font-black text-cyanGlow">{value}</Text>
      <Text className="text-sm text-mutedInk">{label}</Text>
    </View>
  );
}

function EmptyState({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View className="items-center rounded-3xl border border-cyanGlow/20 bg-cardBlue p-8">
      <Ionicons name={icon} color="#6FEFF2" size={44} />
      <Text className="mt-3 text-center text-lg font-bold text-ink">{title}</Text>
    </View>
  );
}
