# A la Vuelta — diseño de integración móvil con Supabase

## Objetivo

Convertir `apps/mobile` en el producto principal de A la Vuelta: una aplicación nativa para Android e iOS construida con Expo y React Native. La aplicación permite descubrir comercios cercanos por rubro, buscar productos, armar una canasta y registrar pedidos. Supabase aporta catálogo, autenticación y persistencia segura.

La aplicación web existente queda expresamente fuera de alcance y no se modifica como producto.

## Experiencia móvil

La interfaz toma como referencia el prototipo entregado por el usuario y conserva la marca **A la Vuelta**:

- encabezado con dirección de entrega y acceso al perfil;
- buscador global táctil;
- banner de marca;
- grilla bento de rubros;
- recorrido `rubro → comercio → productos`;
- canasta con cantidades y total en pesos argentinos;
- pedidos con estado;
- perfil y acceso condicionado a gestión del comercio;
- barra inferior con Inicio, Buscar, Canasta, Pedidos y Perfil.

El diseño será claro, de alto contraste y optimizado para una sola mano. Se utilizarán componentes nativos y áreas seguras; no se incrustará una página web ni se usará WebView.

## Arquitectura

`App.tsx` queda como composición de proveedores y navegación. La lógica se divide en:

- `src/domain`: tipos y funciones puras de catálogo, búsqueda, carrito y pedidos;
- `src/data`: catálogo local de respaldo para desarrollo y modo sin conexión;
- `src/lib`: cliente Supabase configurado con variables públicas de Expo y persistencia de sesión;
- `src/services`: acceso al catálogo y creación/consulta de pedidos;
- `src/state`: contexto de aplicación para catálogo, carrito y sesión;
- `src/screens`: pantallas móviles;
- `src/components`: tarjetas, botones, estados vacíos y navegación.

La aplicación intenta leer el catálogo remoto cuando Supabase está configurado. Si no hay configuración o la red falla, muestra el catálogo local y avisa que está en modo demostración. La canasta siempre funciona localmente; la confirmación remota requiere una sesión válida.

## Modelo de datos Supabase

Se creará una migración consolidada y segura para una base actualmente vacía:

- `profiles`: identidad pública y rol controlado;
- `categories`: rubros;
- `stores`: comercios, estado y datos públicos;
- `store_members`: relación entre usuarios y comercios;
- `products`: productos, precio, stock y disponibilidad;
- `orders`: cabecera, cliente, comercio, total y estado;
- `order_items`: detalle e instantánea del precio;
- `order_events`: historial de estados.

Todas las tablas expuestas tendrán RLS. El catálogo activo será legible por `anon` y `authenticated`; los perfiles, membresías y pedidos se limitarán al usuario o comercio correspondiente. Las columnas usadas por las políticas tendrán índices.

La creación de un pedido será atómica mediante una función con privilegios mínimos: valida sesión, comercio, productos, precio y stock dentro de una transacción. La función no acepta precios calculados por el teléfono. Cualquier función `SECURITY DEFINER` tendrá `search_path` fijo y permisos revocados por defecto. También se revocará la ejecución pública de la función heredada `public.rls_auto_enable()` señalada por el asesor de seguridad.

La app usa exclusivamente la URL del proyecto y una clave `sb_publishable_...`. Nunca incluye una clave secreta o `service_role`.

## Autenticación y roles

Supabase Auth mantiene la sesión en almacenamiento seguro compatible con React Native. El MVP admite catálogo público y deja preparado el ingreso por email mediante código de un solo uso. No se mostrará un acceso de Google falso: ese proveedor sólo aparecerá cuando existan credenciales reales.

Los roles son `customer`, `merchant` y `admin`. Un usuario no puede elevar su propio rol. La gestión del comercio se muestra únicamente a integrantes de `store_members`; las operaciones administrativas se protegen en base de datos, no sólo en la interfaz.

## Manejo de errores

- Carga: esqueletos o indicador breve.
- Sin red: catálogo local con aviso visible.
- Sin resultados: estado vacío y opción para limpiar filtros.
- Pedido inválido: mensaje legible sin perder la canasta.
- Error remoto: se registra un mensaje técnico limitado en desarrollo y se muestra una explicación segura al usuario.

## Verificación

- pruebas unitarias para búsqueda, agrupación de rubros y cálculos de carrito;
- comprobación TypeScript estricta;
- exportación nativa de Expo para Android como prueba de empaquetado;
- verificación de migración, RLS y asesores de Supabase;
- pruebas y build existentes del repositorio para confirmar que la app web no se rompió accidentalmente.

## Fuera de alcance

- convertir o rediseñar la aplicación web;
- publicar en App Store o Play Store;
- pagos reales, mapas o notificaciones push;
- habilitar proveedores OAuth sin credenciales del propietario;
- secretos dentro del repositorio.
