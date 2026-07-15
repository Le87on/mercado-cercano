# A la Vuelta móvil

Aplicación Expo/React Native para Android e iOS. No utiliza WebView.

## Configuración

1. Copiá `.env.example` a `.env`.
2. Completá `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con la URL y la clave publicable del proyecto.
3. En Supabase Auth, agregá `alavuelta://auth/callback` a la lista de Redirect URLs. El ingreso móvil usa PKCE; los tokens no viajan en el enlace.
4. Instalá y ejecutá:

```bash
npm ci --legacy-peer-deps
npm run android
```

Sin variables de Supabase, la aplicación inicia con el catálogo local de demostración. La confirmación de pedidos y el acceso requieren Supabase.

## Verificación

```bash
npm test
npm run typecheck
npm run export:android
```
