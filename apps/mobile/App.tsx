import "./global.css";

import { Ionicons } from "@expo/vector-icons";
import type { Session } from "@supabase/supabase-js";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import type { CartLine, Category, Product, Store } from "./src/domain/marketplace";
import {
  canAddProduct,
  filterStores,
  formatARS,
  nextQuantity,
  normalizeSearch,
  summarizeCart,
} from "./src/domain/marketplace";
import {
  authRedirectUrl,
  handleAuthDeepLink,
  isSupabaseConfigured,
  supabase,
} from "./src/lib/supabase";
import { loadCatalog, type Catalog } from "./src/services/catalog";
import {
  createOrder,
  getMyStoreMembership,
  listMyOrders,
  listStoreOrders,
  listStoreProducts,
  setProductAvailability,
  type OrderStatus,
  type StoreMembership,
  updateOrderStatus,
} from "./src/services/orders";

type Tab = "home" | "search" | "cart" | "orders" | "profile" | "commerce";
type IconName = keyof typeof Ionicons.glyphMap;

const emptyCatalog: Catalog = { categories: [], stores: [], products: [], source: "local" };

export default function App() {
  return (
    <SafeAreaProvider>
      <MarketplaceApp />
    </SafeAreaProvider>
  );
}

function MarketplaceApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [membership, setMembership] = useState<StoreMembership | null>(null);

  const refreshCatalog = async () => {
    setLoading(true);
    setCatalog(await loadCatalog());
    setLoading(false);
  };

  useEffect(() => {
    void refreshCatalog();
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) =>
      setSession(nextSession),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setMembership(null);
      return;
    }
    void getMyStoreMembership()
      .then(setMembership)
      .catch(() => setMembership(null));
  }, [session]);

  useEffect(() => {
    const open = (url: string | null) => {
      if (url)
        void handleAuthDeepLink(url).catch(() =>
          Alert.alert("No pudimos completar el ingreso", "Pedí un nuevo enlace desde Mi perfil."),
        );
    };
    void Linking.getInitialURL().then(open);
    const subscription = Linking.addEventListener("url", ({ url }) => open(url));
    return () => subscription.remove();
  }, []);

  const cartSummary = useMemo(() => summarizeCart(cart), [cart]);

  const addProduct = (product: Product) => {
    if (!canAddProduct(cart, product.storeId)) {
      Alert.alert(
        "Un comercio por pedido",
        "Para cuidar tiempos y costos, terminá o vaciá la canasta actual antes de comprar en otro comercio.",
      );
      return;
    }
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing)
        return current.map((line) =>
          line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      return [
        ...current,
        {
          productId: product.id,
          storeId: product.storeId,
          name: product.name,
          unitPrice: product.price,
          quantity: 1,
          imageUrl: product.imageUrl,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((current) =>
      current
        .map((line) =>
          line.productId === productId
            ? { ...line, quantity: nextQuantity(line.quantity, delta) }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  };

  const openCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setTab("search");
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
      {selectedStore ? (
        <StoreScreen
          store={selectedStore}
          products={catalog.products.filter((product) => product.storeId === selectedStore.id)}
          onBack={() => setSelectedStore(null)}
          onAdd={addProduct}
        />
      ) : (
        <>
          {tab === "home" && (
            <HomeScreen
              catalog={catalog}
              loading={loading}
              onRefresh={refreshCatalog}
              onCategory={openCategory}
              onStore={setSelectedStore}
              onSearch={() => setTab("search")}
            />
          )}
          {tab === "search" && (
            <SearchScreen
              catalog={catalog}
              selectedCategory={selectedCategory}
              onCategory={setSelectedCategory}
              onStore={setSelectedStore}
              onAdd={addProduct}
            />
          )}
          {tab === "cart" && (
            <CartScreen
              lines={cart}
              summary={cartSummary}
              session={session}
              onQuantity={updateQuantity}
              onClear={() => setCart([])}
              onConfirmed={() => {
                setCart([]);
                setTab("orders");
              }}
              onProfile={() => setTab("profile")}
            />
          )}
          {tab === "orders" && <OrdersScreen session={session} />}
          {tab === "profile" && (
            <ProfileScreen
              session={session}
              membership={membership}
              onCommerce={() => setTab("commerce")}
            />
          )}
          {tab === "commerce" && membership && (
            <CommerceScreen membership={membership} onBack={() => setTab("profile")} />
          )}
          <BottomTabs
            active={tab}
            onChange={(next) => {
              setTab(next);
              if (next !== "search") setSelectedCategory(null);
            }}
            cartCount={cartSummary.itemCount}
          />
        </>
      )}
    </SafeAreaView>
  );
}

function HomeScreen({
  catalog,
  loading,
  onRefresh,
  onCategory,
  onStore,
  onSearch,
}: {
  catalog: Catalog;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onCategory: (id: string) => void;
  onStore: (store: Store) => void;
  onSearch: () => void;
}) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-28"
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={["#10B981"]} />
      }
    >
      <View className="flex-row items-center justify-between pt-2">
        <View>
          <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Entregar en
          </Text>
          <View className="mt-1 flex-row items-center">
            <Ionicons name="location" size={18} color="#10B981" />
            <Text className="ml-1 font-extrabold text-slate-900">Valle de Uco, Mendoza</Text>
          </View>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-emerald-100 shadow-sm">
          <Ionicons name="person" size={20} color="#047857" />
        </View>
      </View>

      <Pressable
        onPress={onSearch}
        className="mt-5 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
      >
        <Ionicons name="search" size={18} color="#94A3B8" />
        <Text className="ml-3 text-sm text-slate-400">Buscar comercios, productos o rubros</Text>
      </Pressable>

      <View className="mt-5 overflow-hidden rounded-3xl bg-indigo-600 p-5 shadow-lg">
        <View className="max-w-[72%]">
          <View className="self-start rounded-full bg-white/20 px-3 py-1">
            <Text className="text-[10px] font-black uppercase tracking-wider text-white">
              A la Vuelta
            </Text>
          </View>
          <Text className="mt-3 text-2xl font-black leading-7 text-white">
            Todo lo que necesitás, cerca tuyo
          </Text>
          <Text className="mt-2 text-xs leading-5 text-indigo-100">
            Comprá local. Recibí en casa o coordiná el retiro.
          </Text>
        </View>
        <Ionicons
          name="storefront-outline"
          size={104}
          color="rgba(255,255,255,0.12)"
          style={{ position: "absolute", right: -14, bottom: -18 }}
        />
      </View>

      {catalog.source === "local" && !loading && (
        <View className="mt-4 flex-row items-center rounded-2xl bg-amber-50 px-4 py-3">
          <Ionicons name="cloud-offline-outline" size={18} color="#D97706" />
          <Text className="ml-2 flex-1 text-xs font-semibold text-amber-800">
            Catálogo de demostración disponible sin conexión.
          </Text>
        </View>
      )}

      <SectionTitle title="Nuestros rubros" />
      <View className="flex-row flex-wrap justify-between">
        {catalog.categories.map((category, index) => (
          <CategoryCard
            key={category.id}
            category={category}
            featured={index === 0}
            onPress={() => onCategory(category.id)}
          />
        ))}
      </View>

      <SectionTitle title="Comercios recomendados" action="Ver todos" onAction={onSearch} />
      {loading && catalog.stores.length === 0 ? (
        <ActivityIndicator className="mt-8" color="#10B981" />
      ) : (
        catalog.stores
          .slice(0, 4)
          .map((store) => <StoreCard key={store.id} store={store} onPress={() => onStore(store)} />)
      )}
    </ScrollView>
  );
}

function CategoryCard({
  category,
  featured,
  onPress,
}: {
  category: Category;
  featured: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: featured ? category.color : "#FFFFFF",
        width: featured ? "100%" : "48.5%",
      }}
      className="mb-3 min-h-24 overflow-hidden rounded-3xl border border-slate-100 p-4 shadow-sm"
    >
      <View
        style={{ backgroundColor: featured ? "rgba(255,255,255,.22)" : `${category.color}18` }}
        className="h-10 w-10 items-center justify-center rounded-2xl"
      >
        <Ionicons
          name={category.icon as IconName}
          size={22}
          color={featured ? "#FFFFFF" : category.color}
        />
      </View>
      <Text className={`mt-3 text-base font-black ${featured ? "text-white" : "text-slate-900"}`}>
        {category.name}
      </Text>
      <Text className={`mt-0.5 text-[11px] ${featured ? "text-white/80" : "text-slate-500"}`}>
        {category.description}
      </Text>
    </Pressable>
  );
}

function SearchScreen({
  catalog,
  selectedCategory,
  onCategory,
  onStore,
  onAdd,
}: {
  catalog: Catalog;
  selectedCategory: string | null;
  onCategory: (id: string | null) => void;
  onStore: (store: Store) => void;
  onAdd: (product: Product) => void;
}) {
  const [query, setQuery] = useState("");
  const normalized = normalizeSearch(query);
  const visibleStores = useMemo(() => {
    const direct = filterStores(catalog.stores, selectedCategory, query);
    if (!normalized || selectedCategory) return direct;
    const categoryIds = catalog.categories
      .filter((category) => normalizeSearch(category.name).includes(normalized))
      .map((category) => category.id);
    const categoryMatches = catalog.stores.filter((store) =>
      categoryIds.includes(store.categoryId),
    );
    return [...new Map([...direct, ...categoryMatches].map((store) => [store.id, store])).values()];
  }, [catalog.categories, catalog.stores, normalized, query, selectedCategory]);
  const visibleProducts = normalized
    ? catalog.products.filter(
        (product) =>
          normalizeSearch(product.name).includes(normalized) &&
          (!selectedCategory ||
            catalog.stores.find((store) => store.id === product.storeId)?.categoryId ===
              selectedCategory),
      )
    : [];

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-28"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="pt-2 text-3xl font-black text-slate-950">Buscar</Text>
      <View className="mt-4 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoFocus
          placeholder="Pizza, farmacia, herramientas…"
          className="ml-3 flex-1 text-base text-slate-900"
        />
        {!!query && (
          <Pressable onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </Pressable>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
        <FilterChip label="Todos" active={!selectedCategory} onPress={() => onCategory(null)} />
        {catalog.categories.map((category) => (
          <FilterChip
            key={category.id}
            label={category.name}
            active={selectedCategory === category.id}
            onPress={() => onCategory(category.id)}
          />
        ))}
      </ScrollView>
      {visibleProducts.length > 0 && (
        <>
          <SectionTitle title="Productos" />
          {visibleProducts.map((product) => (
            <ProductRow key={product.id} product={product} onAdd={() => onAdd(product)} />
          ))}
        </>
      )}
      {visibleStores.length > 0 && (
        <SectionTitle title={selectedCategory ? "Comercios del rubro" : "Comercios"} />
      )}
      {visibleStores.length > 0 ? (
        visibleStores.map((store) => (
          <StoreCard key={store.id} store={store} onPress={() => onStore(store)} />
        ))
      ) : visibleProducts.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No encontramos resultados"
          subtitle="Probá con otra palabra o quitá el filtro."
        />
      ) : null}
    </ScrollView>
  );
}

function StoreScreen({
  store,
  products,
  onBack,
  onAdd,
}: {
  store: Store;
  products: Product[];
  onBack: () => void;
  onAdd: (product: Product) => void;
}) {
  return (
    <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="pb-10">
      <View className="relative">
        <Image source={{ uri: store.imageUrl }} className="h-64 w-full bg-slate-200" />
        <Pressable
          onPress={onBack}
          className="absolute left-4 top-4 h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow"
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </Pressable>
      </View>
      <View className="-mt-6 rounded-t-[30px] bg-slate-50 px-4 pt-6">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-black text-slate-950">{store.name}</Text>
            <Text className="mt-1 text-sm text-slate-500">
              {store.city} · ★ {store.rating?.toFixed(1)}
            </Text>
          </View>
          <View className="rounded-full bg-emerald-100 px-3 py-2">
            <Text className="text-xs font-bold text-emerald-700">Abierto</Text>
          </View>
        </View>
        <Text className="mt-3 leading-5 text-slate-600">{store.description}</Text>
        <View className="mt-4 flex-row rounded-2xl bg-white p-4">
          <Info icon="time-outline" value={store.eta ?? "A coordinar"} />
          <Info icon="bicycle-outline" value={store.deliveryLabel ?? "Consultar"} />
        </View>
        <SectionTitle title="Productos" />
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={() => onAdd(product)} />
        ))}
      </View>
    </ScrollView>
  );
}

function CartScreen({
  lines,
  summary,
  session,
  onQuantity,
  onClear,
  onConfirmed,
  onProfile,
}: {
  lines: CartLine[];
  summary: ReturnType<typeof summarizeCart>;
  session: Session | null;
  onQuantity: (id: string, delta: number) => void;
  onClear: () => void;
  onConfirmed: () => void;
  onProfile: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const submit = async () => {
    if (!session) {
      Alert.alert(
        "Ingresá para pedir",
        "Podés explorar y armar la canasta sin cuenta. Para confirmar necesitamos identificarte.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Ir a Perfil", onPress: onProfile },
        ],
      );
      return;
    }
    if (deliveryAddress.trim().length < 3) {
      Alert.alert(
        "Falta la dirección",
        "Ingresá la calle y altura donde querés recibir el pedido.",
      );
      return;
    }
    try {
      setSubmitting(true);
      await createOrder(lines, deliveryAddress.trim());
      Alert.alert("Pedido confirmado", "El comercio ya recibió tu pedido.");
      onConfirmed();
    } catch {
      Alert.alert("No pudimos confirmar", "Revisá la conexión, el stock y volvé a intentar.");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pb-28">
      <View className="flex-row items-center justify-between pt-2">
        <Text className="text-3xl font-black text-slate-950">Mi canasta</Text>
        {lines.length > 0 && (
          <Pressable onPress={onClear}>
            <Text className="font-bold text-rose-500">Vaciar</Text>
          </Pressable>
        )}
      </View>
      <Text className="mt-1 text-sm text-slate-500">
        Un comercio por pedido para entregas más simples.
      </Text>
      <View className="mt-5 gap-3">
        {lines.length === 0 && (
          <EmptyState
            icon="basket-outline"
            title="Tu canasta está vacía"
            subtitle="Explorá los comercios y agregá lo que necesitás."
          />
        )}
        {lines.map((line) => (
          <CartRow key={line.productId} line={line} onQuantity={onQuantity} />
        ))}
      </View>
      {lines.length > 0 && (
        <View className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Dirección de entrega
          </Text>
          <TextInput
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            placeholder="Calle, altura y referencia"
            className="mb-5 rounded-2xl border border-slate-200 px-4 py-3 text-slate-900"
          />
          <PriceRow label="Subtotal" value={summary.subtotal} />
          <View className="my-3 h-px bg-slate-100" />
          <PriceRow label="Total estimado" value={summary.total} strong />
          <Pressable
            disabled={submitting}
            onPress={submit}
            className="mt-5 flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text className="text-base font-black text-white">Confirmar pedido</Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function OrdersScreen({ session }: { session: Session | null }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!session) return;
    setLoading(true);
    void listMyOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [session]);
  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pb-28">
      <Text className="pt-2 text-3xl font-black text-slate-950">Pedidos</Text>
      {!session ? (
        <EmptyState
          icon="receipt-outline"
          title="Ingresá para ver tus pedidos"
          subtitle="Los pedidos quedan vinculados a tu cuenta."
        />
      ) : loading ? (
        <ActivityIndicator className="mt-10" color="#10B981" />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="Todavía no hay pedidos"
          subtitle="Cuando confirmes uno, vas a seguirlo desde acá."
        />
      ) : (
        orders.map((order) => (
          <View key={order.id} className="mt-4 rounded-3xl bg-white p-5">
            <Text className="text-lg font-black text-slate-900">
              {order.market_stores?.name ?? "Comercio local"}
            </Text>
            <Text className="mt-1 text-sm font-semibold capitalize text-emerald-600">
              {order.status}
            </Text>
            <Text className="mt-3 text-xl font-black text-slate-950">
              {formatARS(Number(order.total))}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function ProfileScreen({
  session,
  membership,
  onCommerce,
}: {
  session: Session | null;
  membership: StoreMembership | null;
  onCommerce: () => void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const sendCode = async () => {
    if (!supabase || !email.trim()) return;
    try {
      setBusy(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true, emailRedirectTo: authRedirectUrl },
      });
      if (error) throw error;
      Alert.alert("Revisá tu correo", "Te enviamos un enlace seguro para ingresar.");
    } catch {
      Alert.alert(
        "No pudimos enviar el acceso",
        "Verificá el correo y tu conexión e intentá de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  };
  const signOut = async () => {
    await supabase?.auth.signOut();
  };
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-28"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="pt-2 text-3xl font-black text-slate-950">Mi perfil</Text>
      {session ? (
        <View className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Ionicons name="person" size={28} color="#047857" />
          </View>
          <Text className="mt-4 text-xl font-black text-slate-950">
            {session.user.email ?? "Usuario A la Vuelta"}
          </Text>
          <Text className="mt-1 text-sm text-slate-500">
            {membership ? `${membership.role} · ${membership.store.name}` : "Cliente"}
          </Text>
          <MenuRow icon="location-outline" label="Direcciones de entrega" />
          {membership ? (
            <MenuRow icon="storefront-outline" label="Panel de mi comercio" onPress={onCommerce} />
          ) : (
            <MenuRow
              icon="storefront-outline"
              label="Quiero vender en A la Vuelta"
              onPress={() =>
                Alert.alert(
                  "Sumá tu comercio",
                  "Estamos incorporando comercios de forma acompañada. Escribinos desde soporte para validar tus datos.",
                )
              }
            />
          )}
          <Pressable onPress={signOut} className="mt-5 rounded-2xl bg-slate-100 py-4">
            <Text className="text-center font-black text-slate-700">Cerrar sesión</Text>
          </Pressable>
        </View>
      ) : (
        <View className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
            <Ionicons name="lock-closed-outline" size={25} color="#047857" />
          </View>
          <Text className="mt-4 text-xl font-black text-slate-950">Ingresá de forma segura</Text>
          <Text className="mt-2 leading-5 text-slate-500">
            Te mandamos un enlace de acceso. No necesitás recordar una contraseña.
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="tu@email.com"
            className="mt-5 rounded-2xl border border-slate-200 px-4 py-4 text-base"
          />
          <Pressable
            disabled={busy || !isSupabaseConfigured}
            onPress={sendCode}
            className={`mt-3 rounded-2xl py-4 ${isSupabaseConfigured ? "bg-emerald-500" : "bg-slate-300"}`}
          >
            <Text className="text-center font-black text-white">
              {busy ? "Enviando…" : "Enviar acceso"}
            </Text>
          </Pressable>
          {!isSupabaseConfigured && (
            <Text className="mt-3 text-center text-xs text-amber-700">
              Configurá Supabase para habilitar el ingreso.
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const nextStoreActions: Partial<
  Record<OrderStatus, Array<{ label: string; status: OrderStatus }>>
> = {
  submitted: [
    { label: "Aceptar", status: "accepted" },
    { label: "Rechazar", status: "rejected" },
  ],
  accepted: [
    { label: "Preparando", status: "preparing" },
    { label: "Cancelar", status: "cancelled" },
  ],
  preparing: [{ label: "Marcar listo", status: "ready" }],
  ready: [{ label: "Entregado", status: "completed" }],
};

function CommerceScreen({
  membership,
  onBack,
}: {
  membership: StoreMembership;
  onBack: () => void;
}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const [nextOrders, nextProducts] = await Promise.all([
        listStoreOrders(membership.storeId),
        listStoreProducts(membership.storeId),
      ]);
      setOrders(nextOrders);
      setProducts(nextProducts);
    } catch {
      Alert.alert("No pudimos cargar el panel", "Revisá la conexión y volvé a intentar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [membership.storeId]);

  const moveOrder = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      await refresh();
    } catch {
      Alert.alert(
        "No pudimos actualizar el pedido",
        "El estado cambió o no tenés permiso para esa acción.",
      );
    }
  };

  const toggleProduct = async (product: Product) => {
    try {
      await setProductAvailability(product.id, !product.available);
      await refresh();
    } catch {
      Alert.alert("No pudimos actualizar el producto", "Revisá la conexión y volvé a intentar.");
    }
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pb-10">
      <View className="flex-row items-center pt-2">
        <Pressable
          onPress={onBack}
          className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-2xl font-black text-slate-950">{membership.store.name}</Text>
          <Text className="text-sm text-slate-500">Panel móvil · {membership.role}</Text>
        </View>
      </View>

      <View className="mt-5 flex-row justify-between rounded-3xl bg-emerald-500 p-5">
        <Metric label="Pedidos" value={String(orders.length)} />
        <Metric label="Productos" value={String(products.length)} />
        <Metric
          label="Activos"
          value={String(products.filter((product) => product.available).length)}
        />
      </View>

      <SectionTitle title="Pedidos recientes" />
      {loading ? (
        <ActivityIndicator color="#10B981" />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No hay pedidos pendientes"
          subtitle="Los nuevos pedidos aparecerán acá."
        />
      ) : (
        orders.map((order) => (
          <View key={order.id} className="mb-3 rounded-3xl bg-white p-4 shadow-sm">
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="font-black text-slate-900">
                  Pedido {String(order.id).slice(0, 8)}
                </Text>
                <Text className="mt-1 text-xs text-slate-500">{order.delivery_address}</Text>
              </View>
              <Text className="font-black text-emerald-600">{formatARS(Number(order.total))}</Text>
            </View>
            <Text className="mt-3 text-xs font-bold uppercase text-slate-500">{order.status}</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {(nextStoreActions[order.status as OrderStatus] ?? []).map((action) => (
                <Pressable
                  key={action.status}
                  onPress={() => moveOrder(order.id, action.status)}
                  className="rounded-xl bg-slate-950 px-4 py-2.5"
                >
                  <Text className="text-xs font-black text-white">{action.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))
      )}

      <SectionTitle title="Disponibilidad" />
      {products.map((product) => (
        <View key={product.id} className="mb-3 flex-row items-center rounded-2xl bg-white p-3">
          <Image source={{ uri: product.imageUrl }} className="h-14 w-14 rounded-xl bg-slate-100" />
          <View className="ml-3 flex-1">
            <Text className="font-black text-slate-900">{product.name}</Text>
            <Text className="mt-1 text-xs text-slate-500">Stock: {product.stock}</Text>
          </View>
          <Pressable
            onPress={() => toggleProduct(product)}
            className={`rounded-full px-3 py-2 ${product.available ? "bg-emerald-100" : "bg-slate-100"}`}
          >
            <Text
              className={`text-xs font-black ${product.available ? "text-emerald-700" : "text-slate-500"}`}
            >
              {product.available ? "Activo" : "Pausado"}
            </Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function BottomTabs({
  active,
  onChange,
  cartCount,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
  cartCount: number;
}) {
  const tabs: Array<{ key: Tab; label: string; icon: IconName; activeIcon: IconName }> = [
    { key: "home", label: "Inicio", icon: "home-outline", activeIcon: "home" },
    { key: "search", label: "Buscar", icon: "search-outline", activeIcon: "search" },
    { key: "cart", label: "Canasta", icon: "basket-outline", activeIcon: "basket" },
    { key: "orders", label: "Pedidos", icon: "receipt-outline", activeIcon: "receipt" },
    { key: "profile", label: "Perfil", icon: "person-outline", activeIcon: "person" },
  ];
  return (
    <View className="absolute bottom-0 left-0 right-0 flex-row justify-around border-t border-slate-100 bg-white px-2 pb-2 pt-3">
      {tabs.map((item) => {
        const selected = active === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            className="min-w-14 items-center"
          >
            <View>
              <Ionicons
                name={selected ? item.activeIcon : item.icon}
                size={22}
                color={selected ? "#10B981" : "#94A3B8"}
              />
              {item.key === "cart" && cartCount > 0 && (
                <View className="absolute -right-3 -top-2 min-w-5 items-center rounded-full bg-rose-500 px-1">
                  <Text className="text-[10px] font-black text-white">{cartCount}</Text>
                </View>
              )}
            </View>
            <Text
              className={`mt-1 text-[10px] ${selected ? "font-black text-emerald-600" : "font-semibold text-slate-400"}`}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function StoreCard({ store, onPress }: { store: Store; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
    >
      <Image source={{ uri: store.imageUrl }} className="h-36 w-full bg-slate-200" />
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-lg font-black text-slate-950">{store.name}</Text>
            <Text className="mt-1 text-sm text-slate-500">
              {store.city} · {store.description}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color="#94A3B8" />
        </View>
        <Text className="mt-3 text-xs font-bold text-emerald-600">
          ★ {store.rating?.toFixed(1)} · {store.eta} · {store.deliveryLabel}
        </Text>
      </View>
    </Pressable>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <View className="mb-4 overflow-hidden rounded-3xl bg-white shadow-sm">
      <Image source={{ uri: product.imageUrl }} className="h-40 w-full bg-slate-200" />
      <View className="p-4">
        <Text className="text-lg font-black text-slate-950">{product.name}</Text>
        {product.description && (
          <Text className="mt-1 text-sm text-slate-500">{product.description}</Text>
        )}
        <View className="mt-4 flex-row items-center justify-between">
          <Text className="text-xl font-black text-emerald-600">{formatARS(product.price)}</Text>
          <Pressable
            onPress={onAdd}
            className="flex-row items-center rounded-2xl bg-slate-950 px-4 py-3"
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text className="ml-1 font-black text-white">Agregar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
function ProductRow({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <View className="mb-3 flex-row items-center rounded-2xl bg-white p-3">
      <Image source={{ uri: product.imageUrl }} className="h-16 w-16 rounded-xl bg-slate-100" />
      <View className="ml-3 flex-1">
        <Text className="font-black text-slate-900">{product.name}</Text>
        <Text className="mt-1 font-bold text-emerald-600">{formatARS(product.price)}</Text>
      </View>
      <Pressable
        onPress={onAdd}
        className="h-10 w-10 items-center justify-center rounded-full bg-slate-950"
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
function CartRow({
  line,
  onQuantity,
}: {
  line: CartLine;
  onQuantity: (id: string, delta: number) => void;
}) {
  return (
    <View className="flex-row items-center rounded-3xl bg-white p-3 shadow-sm">
      <Image source={{ uri: line.imageUrl }} className="h-16 w-16 rounded-2xl bg-slate-100" />
      <View className="ml-3 flex-1">
        <Text className="font-black text-slate-900">{line.name}</Text>
        <Text className="mt-1 font-bold text-emerald-600">
          {formatARS(line.unitPrice * line.quantity)}
        </Text>
      </View>
      <View className="flex-row items-center rounded-xl bg-slate-50 p-1">
        <QuantityButton icon="remove" onPress={() => onQuantity(line.productId, -1)} />
        <Text className="w-8 text-center font-black text-slate-900">{line.quantity}</Text>
        <QuantityButton icon="add" onPress={() => onQuantity(line.productId, 1)} />
      </View>
    </View>
  );
}
function QuantityButton({ icon, onPress }: { icon: IconName; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm"
    >
      <Ionicons name={icon} size={16} color="#334155" />
    </Pressable>
  );
}
function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 rounded-full px-4 py-2.5 ${active ? "bg-emerald-500" : "border border-slate-200 bg-white"}`}
    >
      <Text className={`text-xs font-bold ${active ? "text-white" : "text-slate-600"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="mb-3 mt-7 flex-row items-center justify-between">
      <Text className="text-lg font-black text-slate-950">{title}</Text>
      {action && (
        <Pressable onPress={onAction}>
          <Text className="text-xs font-bold text-emerald-600">{action}</Text>
        </Pressable>
      )}
    </View>
  );
}
function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
}) {
  return (
    <View className="mt-6 items-center rounded-3xl border border-slate-100 bg-white p-8">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
        <Ionicons name={icon} size={30} color="#10B981" />
      </View>
      <Text className="mt-4 text-center text-lg font-black text-slate-900">{title}</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-slate-500">{subtitle}</Text>
    </View>
  );
}
function Info({ icon, value }: { icon: IconName; value: string }) {
  return (
    <View className="mr-6 flex-row items-center">
      <Ionicons name={icon} size={18} color="#10B981" />
      <Text className="ml-2 text-xs font-bold text-slate-600">{value}</Text>
    </View>
  );
}
function PriceRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className={strong ? "text-lg font-black text-slate-950" : "text-sm text-slate-500"}>
        {label}
      </Text>
      <Text className={strong ? "text-xl font-black text-slate-950" : "font-bold text-slate-700"}>
        {formatARS(value)}
      </Text>
    </View>
  );
}
function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mt-4 flex-row items-center border-t border-slate-100 pt-4"
    >
      <Ionicons name={icon} size={21} color="#10B981" />
      <Text className="ml-3 flex-1 font-bold text-slate-700">{label}</Text>
      <Ionicons name="chevron-forward" size={19} color="#94A3B8" />
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-2xl font-black text-white">{value}</Text>
      <Text className="mt-1 text-xs font-semibold text-emerald-50">{label}</Text>
    </View>
  );
}
