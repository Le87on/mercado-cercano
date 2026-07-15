# Red Team - A la Vuelta

Rama evaluada: `fresh-friendly-marketplace-flow`
Fecha: 2026-07-12
Alcance: app propia A la Vuelta / mercado-cercano. Revisión no destructiva sobre código, auth, Supabase/RLS, pedidos, comercio/admin y exposición de datos.

## Resumen ejecutivo

La app todavía no debe lanzarse. La interfaz y la base funcional avanzaron, pero hay superficies críticas que deben cerrarse antes de producción: modo demo, roles, RLS, validación de pedidos, visibilidad de productos/comercios y flujo de cambio de estados.

## Hallazgos críticos

### RT-01 - Modo demo con usuario local en ausencia de Supabase

Riesgo: si una build pública queda sin variables Supabase, el frontend puede operar con usuario local/demo. Esto es útil para desarrollo, pero peligroso para producción.

Impacto: rutas, paneles o datos locales podrían parecer autorizados sin sesión real.

Corrección requerida:
- El modo demo debe existir solo en `import.meta.env.DEV`.
- En producción, si Supabase no está configurado, bloquear la app con pantalla de error segura.
- El rol demo no debe ser admin por defecto.

Estado: pendiente de hardening.

### RT-02 - Riesgo de escalamiento de roles en profiles

Riesgo: la política actual evita que un usuario se ponga `admin`, pero no cierra completamente otros cambios de rol no autorizados.

Impacto: un cliente podría intentar pasar a `business_owner` si no se bloquea el campo `role` desde base de datos.

Corrección requerida:
- Nueva migración que bloquee cambios de `role` salvo `is_admin()`.
- Trigger `prevent_self_role_change()`.
- Política de update de perfil que solo permita campos editables de usuario: nombre, teléfono, avatar.

Estado: pendiente.

### RT-03 - Productos activos visibles aunque el comercio no esté verificado

Riesgo: la política de lectura de productos permite leer `is_active = true` sin exigir que el comercio asociado esté verificado y activo.

Impacto: productos de comercios pendientes/suspendidos podrían aparecer en catálogo.

Corrección requerida:
- La lectura pública de productos debe exigir negocio `verified` + `is_active`.
- Dueño/admin sí pueden ver productos propios aunque no estén publicados.

Estado: pendiente.

### RT-04 - Creación de pedidos sin validación transaccional completa

Riesgo: `orders` y `order_items` están modelados, pero todavía falta función transaccional que valide precio, stock, comercio, producto y totales en base.

Impacto: manipulación de subtotal/total desde frontend, pedido con producto de otro comercio, cantidades inválidas o stock superado.

Corrección requerida:
- Crear RPC `create_order_from_cart()` o función equivalente.
- Validar todos los items server-side.
- Guardar snapshot de precio/nombre desde base.
- Descontar stock o reservar según estrategia.
- Evitar inserts manuales inconsistentes en `order_items`.

Estado: pendiente.

### RT-05 - Cambios de estado de pedido demasiado abiertos

Riesgo: el dueño del comercio/admin puede actualizar pedidos, pero se necesita validar transiciones permitidas en base.

Impacto: pasar de rechazado a cerrado, saltar pago/aceptación, cerrar pedidos sin flujo.

Corrección requerida:
- Trigger de transición de estados.
- Tabla/event log `order_events`.
- Estados permitidos según rol y estado anterior.

Estado: pendiente.

## Hallazgos altos

### RT-06 - Exact address / teléfono de comercio

Riesgo: la tabla `businesses` tiene `address`, `phone`, `email`, `tax_id`. La lectura pública de comercios verificados podría exponer datos sensibles si el frontend consulta `select(*)`.

Corrección requerida:
- Crear vista pública `public_business_cards` sin dirección exacta/teléfono/tax_id.
- Liberar dirección exacta solo por pedido aceptado.
- Evitar `select(*)` para catálogo público.

### RT-07 - Falta Storage policy para imágenes

Riesgo: se menciona subida de imágenes, pero falta política de Supabase Storage para que cada comercio gestione solo su carpeta.

Corrección requerida:
- Bucket `product-images`.
- Ruta `business_id/product_id/...`.
- Políticas Storage: owner/admin write, public read solo si negocio/producto publicado.

### RT-08 - Admin sin backend seguro todavía

Riesgo: el frontend puede mostrar panel admin, pero toda decisión real debe estar reforzada por RLS/RPC. No alcanza con ocultar botones.

Corrección requerida:
- Todas las acciones admin deben validarse con `is_admin()` en base.
- Log obligatorio en `admin_action_logs` para aprobar/suspender/moderar.

## Hallazgos medios

### RT-09 - Dependencias heredadas de Lovable

Persisten dependencias Lovable en `package.json`. No son una vulnerabilidad directa, pero aumentan superficie y acoplamiento.

Corrección requerida:
- Reemplazar configuración Lovable con Vite/TanStack estándar solo cuando el build quede reproducible.

### RT-10 - Semillas y datos reales mezclados

Hay datos de comercios reales/semilla. Para producción deben pasar por consentimiento/carga real o mantenerse como demo privado.

Corrección requerida:
- Separar seed demo de datos reales.
- No publicar dirección exacta hasta validación legal/comercial.

## Pruebas manuales de red team pendientes

1. Usuario sin sesión intenta abrir `/admin`.
2. Usuario cliente intenta cambiar `role` en `profiles`.
3. Comercio A intenta crear producto en comercio B.
4. Comercio A intenta ver pedidos de comercio B.
5. Cliente intenta insertar order_items con producto de otro comercio.
6. Cliente intenta modificar total del pedido desde frontend.
7. Producto activo de comercio pendiente no debe verse públicamente.
8. Comercio suspendido no debe aparecer en catálogo.
9. Pedido rechazado no debe poder cerrarse.
10. Dirección exacta solo visible tras pago aprobado + comercio aceptado.

## Plan de hardening inmediato

### Bloque 1 - Bloquear modo demo en producción
- Cambiar `auth.tsx` para permitir usuario demo solo en DEV.
- Cambiar perfil demo a cliente, no admin.
- Pantalla segura si falta Supabase en producción.

### Bloque 2 - Migración RLS hardening
- Crear nueva migración, no editar histórica.
- Bloquear cambios de rol no admin.
- Ajustar políticas de lectura de productos/comercios.
- Agregar Storage policies.

### Bloque 3 - Pedidos transaccionales
- RPC segura para crear pedido.
- Validar precios, cantidades, stock, negocio y producto.
- Insertar order + order_items en una operación.

### Bloque 4 - Estados y auditoría
- Trigger de transición de estados.
- `order_events`.
- `admin_action_logs` obligatorio.

### Bloque 5 - Tests mínimos
- Tests de cálculo.
- Tests de transiciones.
- Tests de roles.
- Tests de visibilidad pública.

## Estado final del red team

No hay evidencia de exposición de service-role keys en frontend. El cliente Supabase usa variables públicas `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, que es correcto para frontend, siempre que las políticas RLS estén fuertes.

Resultado: NO APTO PARA LANZAMIENTO todavía. Apto para continuar en rama de desarrollo con hardening inmediato.
