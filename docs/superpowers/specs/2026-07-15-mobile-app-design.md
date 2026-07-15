# A la Vuelta — Mobile App Design

## Decision

The primary product is a real phone app, not a responsive website. The current web work remains useful as a prototype, admin reference, and shared business-logic source, but the customer/commercial experience moves to a native mobile app.

## Stack

- Expo + React Native for Android and iOS from one codebase.
- NativeWind for Tailwind-style mobile styling.
- Supabase for auth, database, storage, RLS, and future realtime events.
- Shared business rules from the repository where possible.

NativeWind v4 installation for Expo requires `nativewind`, `react-native-reanimated`, `react-native-safe-area-context`, Tailwind CSS, Babel setup with `nativewind/babel`, Metro setup with `withNativeWind`, a `global.css`, and the TypeScript declaration file.

## App structure

```text
apps/mobile
  App.tsx
  app.json
  babel.config.js
  metro.config.js
  tailwind.config.js
  global.css
  nativewind-env.d.ts
  src/
    components/
    data/
    lib/
    screens/
    theme/
```

## First mobile MVP screens

1. Auth screen: login with phone, Google placeholder, customer registration, commerce registration entry.
2. Home screen: search, categories, recommended shops, promo/rubro cards, bottom navigation.
3. Cart screen: grouped cart by commerce, quantity controls, checkout button.
4. Orders screen: status tracking, QR/PIN placeholder after acceptance.
5. Commerce dashboard: revenue summary, pending orders, products, settings.
6. Profile screen: customer/commercial identity and session controls.

## Data flow

During the first scaffold, the mobile app uses local mock data shaped like the marketplace domain. The next implementation step replaces mock reads with Supabase queries and RPCs already planned in the migrations.

## Security rules

- No service-role key in the app.
- Supabase anon key only through `EXPO_PUBLIC_*` variables.
- No exact address or phone exposed before accepted operation.
- Commerce registration starts as pending, never self-verified.
- Order creation must validate price, stock, active commerce, and ownership server-side.

## Testing / validation

The mobile scaffold is considered valid when:

- `cd apps/mobile && npm install` completes.
- `npx expo start` opens the app in Expo Go or emulator.
- The app renders Auth, Home, Cart, Orders, Commerce, and Profile tabs without crashing.
- NativeWind classes render styles.

## Scope control

This spec does not launch the app, publish to stores, or replace Supabase migrations. It creates the real mobile codebase and moves future UI work there.
