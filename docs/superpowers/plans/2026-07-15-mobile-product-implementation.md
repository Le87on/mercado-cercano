# A la Vuelta Mobile Product Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current Expo mock into a production-shaped mobile marketplace connected to Supabase and a dedicated Fastify API for customer, commerce, admin, and order flows.

**Architecture:** The Expo app uses Supabase Auth directly for sessions and calls a Fastify API for domain commands. The API validates the Supabase JWT, applies business rules, and writes to Supabase with server-only credentials. Public catalogue reads may use the API first; Supabase Realtime will be added after the order state machine is stable.

**Tech Stack:** Expo 53, React Native 0.79, NativeWind 4, TypeScript 5.8, Expo Router, TanStack Query, Supabase JS, Fastify, Zod, PostgreSQL/Supabase, Node test runner/Vitest where appropriate.

## Global Constraints

- The primary product is a real Android/iOS app, not a responsive website.
- No Supabase service-role key may exist in `apps/mobile`.
- Commerce registration always starts as `pending`.
- Exact commerce address and phone stay hidden until an accepted operation allows disclosure.
- Order prices, stock, totals, roles, and status transitions are validated server-side.
- Work happens on `mobile-product-development`; do not commit directly to `main`.
- No store publication or production launch in this plan.

---

## File Structure

```text
apps/mobile/
  App.tsx
  app.json
  package.json
  src/
    app/
      AppProviders.tsx
      navigation/
        RootNavigator.tsx
        types.ts
    components/
      AppButton.tsx
      EmptyState.tsx
      LoadingScreen.tsx
      ShopCard.tsx
    features/
      auth/
      cart/
      catalog/
      orders/
      commerce/
      admin/
      profile/
    lib/
      env.ts
      supabase.ts
      api.ts
      queryClient.ts
    theme/
      tokens.ts
    types/
      database.ts
      domain.ts
apps/api/
  package.json
  tsconfig.json
  src/
    server.ts
    app.ts
    config/env.ts
    plugins/auth.ts
    plugins/supabase.ts
    modules/health/
    modules/catalog/
    modules/orders/
    modules/commerce/
    modules/admin/
    shared/errors.ts
    shared/schemas.ts
  tests/
supabase/migrations/
docs/superpowers/plans/
```

### Task 1: Stabilize the mobile foundation

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/App.tsx`
- Create: `apps/mobile/src/app/AppProviders.tsx`
- Create: `apps/mobile/src/lib/env.ts`
- Create: `apps/mobile/src/lib/queryClient.ts`
- Create: `apps/mobile/src/theme/tokens.ts`
- Create: `apps/mobile/src/types/domain.ts`
- Test: `apps/mobile/src/lib/env.test.ts`

**Interfaces:**
- Produces: `getPublicEnv(): { supabaseUrl: string; supabasePublishableKey: string; apiUrl: string }`
- Produces: `AppProviders({ children }: PropsWithChildren)`
- Produces: `UserRole = "customer" | "business_owner" | "admin"`

- [ ] **Step 1: Add mobile dependencies and test script**

```bash
cd apps/mobile
npx expo install expo-router expo-linking expo-constants expo-secure-store
npm install @tanstack/react-query zod
npm install -D vitest
```

Update scripts:

```json
{
  "test": "vitest run",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 2: Write the failing environment test**

```ts
import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "./env";

describe("parsePublicEnv", () => {
  it("rejects missing API configuration", () => {
    expect(() =>
      parsePublicEnv({
        EXPO_PUBLIC_SUPABASE_URL: "",
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
        EXPO_PUBLIC_API_URL: "",
      }),
    ).toThrow();
  });
});
```

Run: `npm test -- src/lib/env.test.ts`  
Expected: FAIL because `parsePublicEnv` does not exist.

- [ ] **Step 3: Implement validated public environment**

```ts
import { z } from "zod";

const schema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  EXPO_PUBLIC_API_URL: z.string().url(),
});

export function parsePublicEnv(input: Record<string, string | undefined>) {
  return schema.parse(input);
}

export function getPublicEnv() {
  const value = parsePublicEnv(process.env);
  return {
    supabaseUrl: value.EXPO_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: value.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    apiUrl: value.EXPO_PUBLIC_API_URL,
  };
}
```

- [ ] **Step 4: Split global providers from `App.tsx`**

```tsx
import "./global.css";
import { AppProviders } from "./src/app/AppProviders";
import { RootNavigator } from "./src/app/navigation/RootNavigator";

export default function App() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile
git commit -m "refactor(mobile): establish typed application foundation"
```

### Task 2: Create real mobile navigation and screens

**Files:**
- Create: `apps/mobile/src/app/navigation/RootNavigator.tsx`
- Create: `apps/mobile/src/app/navigation/types.ts`
- Create: `apps/mobile/src/features/auth/screens/AuthScreen.tsx`
- Create: `apps/mobile/src/features/catalog/screens/HomeScreen.tsx`
- Create: `apps/mobile/src/features/catalog/screens/BusinessScreen.tsx`
- Create: `apps/mobile/src/features/cart/screens/CartScreen.tsx`
- Create: `apps/mobile/src/features/orders/screens/OrdersScreen.tsx`
- Create: `apps/mobile/src/features/commerce/screens/CommerceDashboardScreen.tsx`
- Create: `apps/mobile/src/features/admin/screens/AdminDashboardScreen.tsx`
- Create: `apps/mobile/src/features/profile/screens/ProfileScreen.tsx`

- [ ] Write route visibility tests.
- [ ] Implement auth stack and role-aware tabs.
- [ ] Move mock UI into focused screen files.
- [ ] Add business-detail navigation.
- [ ] Run tests and typecheck.
- [ ] Commit with `feat(mobile): add role-aware navigation`.

### Task 3: Connect Supabase Auth and session persistence

**Files:**
- Create: `apps/mobile/src/lib/supabase.ts`
- Create: `apps/mobile/src/features/auth/AuthProvider.tsx`
- Create: `apps/mobile/src/features/auth/auth.service.ts`
- Modify: `apps/mobile/src/app/AppProviders.tsx`
- Modify: `apps/mobile/src/features/auth/screens/AuthScreen.tsx`
- Create: `apps/mobile/src/types/database.ts`

- [ ] Generate database TypeScript types.
- [ ] Create the Supabase client with SecureStore-backed session storage.
- [ ] Write session-to-profile mapping tests.
- [ ] Implement OTP sign-in and profile loading.
- [ ] Replace demo sign-in state.
- [ ] Commit with `feat(auth): connect mobile sessions to Supabase`.

### Task 4: Create the Fastify API skeleton

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/.env.example`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/config/env.ts`
- Create: `apps/api/src/plugins/auth.ts`
- Create: `apps/api/src/plugins/supabase.ts`
- Create: `apps/api/src/modules/health/routes.ts`
- Test: `apps/api/tests/health.test.ts`

- [ ] Initialize Fastify, Zod, Supabase JS, Vitest, and TypeScript.
- [ ] Write a failing health-route test.
- [ ] Implement `buildApp` and `GET /health`.
- [ ] Add strict environment parsing.
- [ ] Add JWT authentication plugin.
- [ ] Run API tests and typecheck.
- [ ] Commit with `feat(api): create authenticated Fastify foundation`.

### Task 5: Apply and validate the Supabase marketplace schema

**Files:**
- Use: `supabase/migrations/202607100001_marketplace_core.sql`
- Use: `supabase/migrations/202607100002_security_hardening.sql`
- Create: `supabase/migrations/202607150001_order_command_api.sql`

- [ ] Apply core migration to the connected development project.
- [ ] Apply security hardening migration.
- [ ] Run security and performance advisors.
- [ ] Add transactional `create_marketplace_order` RPC.
- [ ] Apply the RPC migration.
- [ ] Generate TypeScript database types.
- [ ] Commit generated types and migration.

### Task 6: Build catalogue, cart, and secure checkout

**Interfaces:**
- `GET /v1/businesses`
- `GET /v1/businesses/:id/products`
- `POST /v1/orders`
- `GET /v1/orders/me`

- [ ] Implement safe catalogue reads without exact address or phone.
- [ ] Test stock, totals, and mixed-business rejection.
- [ ] Implement secure order creation.
- [ ] Connect TanStack Query.
- [ ] Replace mock checkout.
- [ ] Commit with `feat: connect secure catalogue and checkout`.

### Task 7: Build commerce and admin operations

- [ ] Add commerce authorization tests.
- [ ] Implement product CRUD and pending-order actions.
- [ ] Add admin authorization tests.
- [ ] Implement business verification and suspension.
- [ ] Hide commerce/admin navigation from unauthorized roles.
- [ ] Commit with `feat: add commerce and admin control planes`.

### Task 8: Complete the purchase lifecycle

**States:** `submitted -> accepted|rejected|cancelled -> ready_for_pickup|in_delivery -> closed`

- [ ] Write order-transition tests.
- [ ] Implement accept/reject/ready actions.
- [ ] Implement QR/PIN release rules.
- [ ] Add customer order timeline and realtime refresh.
- [ ] Add customer-to-commerce smoke test.
- [ ] Commit with `feat(orders): complete purchase lifecycle`.

## Verification Gate

```bash
cd apps/mobile && npm test && npm run typecheck
cd ../../apps/api && npm test && npm run typecheck
```

Verify:

- Android emulator opens the Expo app.
- Customer cannot see commerce/admin tabs.
- Public catalogue contains no exact address or phone.
- A customer can create one-business orders only.
- Commerce can accept/reject only its own orders.
- Admin actions are audited.
- Main remains untouched until review.
