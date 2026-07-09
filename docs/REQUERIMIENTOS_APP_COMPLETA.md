# A la Vuelta · Requerimientos de app completa

Este documento fija el alcance funcional que debe tener la app inspirada en un marketplace/delivery local. No se debe copiar marca, logo, textos exactos, identidad visual propietaria ni assets de apps existentes. La referencia es de flujo funcional y experiencia de usuario.

## 1. Acceso e identidad

### Cliente
- Ingreso con Google.
- Ingreso con Apple.
- Ingreso con Facebook.
- Ingreso por otro método: email o celular.
- Aceptación de términos, condiciones y política de privacidad.
- Perfil del usuario con datos personales.
- Validación de número de celular.
- Cierre de sesión.
- Cierre de sesión en otros dispositivos.
- Eliminación de cuenta.

### Comercio
- Opción visible de `Registrar mi negocio`.
- Alta de comercio con validación manual o automática.
- Reclamo de comercio ya existente.
- Carga de rubro, domicilio, horarios, productos, formas de entrega y medios de cobro.

## 2. Ubicación y cobertura

### Alta de dirección
- Pantalla `Ingresá tu dirección`.
- Búsqueda por dirección o punto de referencia.
- Botón `Mi ubicación actual`.
- Selección de país/localidad.
- Direcciones guardadas.

### Confirmación en mapa
- Mapa con pin de ubicación.
- Confirmación de dirección.
- Corrección manual de ubicación.
- Campo de dirección final.

### Detalles de entrega
- Dirección principal.
- Piso / departamento.
- Punto de entrega en mapa.
- Referencias o indicaciones para la entrega.
- Guardado de dirección.
- Opción `En otro momento`.

### Cobertura
- Validar si hay comercios cercanos al domicilio.
- Mostrar mensaje cuando no hay comercios en la zona:
  - `Aún no tenemos locales en tu barrio`.
  - Mensaje de expansión futura.
- Permitir explorar comercios aunque todavía no haya delivery activo.

## 3. Home / inicio

- Header con dirección activa.
- Selector de dirección.
- Buscador de locales, productos y rubros.
- Icono de notificaciones.
- Icono de carrito.
- Banner de promociones destacadas.
- Categorías principales:
  - Restaurantes.
  - Mercado / súper.
  - Helados.
  - Kioscos.
  - Bebidas.
  - Otros rubros locales.
- Skeleton/loading visual mientras carga la información.
- Estados vacíos cuando no hay comercios.

## 4. Catálogo y comercios

### Comercios
- Listado de comercios cercanos.
- Filtro por rubro.
- Filtro por localidad.
- Filtro por modalidad:
  - Retiro.
  - Envío local.
  - Consulta.
- Vista de comercio con:
  - Nombre.
  - Dirección.
  - Rubro.
  - Productos/servicios.
  - Horarios.
  - Estado abierto/cerrado.
  - Contacto autorizado.
  - Calificación futura.

### Productos
- Producto con nombre, descripción, precio, stock y foto.
- Productos con precio fijo.
- Productos `Consultar precio`.
- Promociones.
- Combos.
- Categorías internas por comercio.

## 5. Carrito y pedidos

### Carrito
- Agregar productos al carrito.
- Cambiar cantidad.
- Quitar productos.
- Subtotal.
- Costo de envío si aplica.
- Total estimado.
- Selección de entrega:
  - Retiro en comercio.
  - Envío local.
  - Coordinar por WhatsApp.

### Pedido
- Crear pedido pendiente.
- Estados:
  - Pendiente de confirmación.
  - Confirmado por comercio.
  - Pendiente de pago.
  - Pagado.
  - En preparación.
  - En camino / listo para retirar.
  - Entregado.
  - Cancelado.
- Pantalla `Mis pedidos`.
- Estado vacío: `Aún no realizaste pedidos`.
- Botón `Hacer pedidos`.

## 6. Promociones

- Pantalla `Promociones`.
- Categorías de promociones:
  - Restaurantes.
  - Mercados.
  - Medios de pago.
- Estado vacío: `No hay promociones por ahora`.
- Descuentos por comercio.
- Cupones.
- Beneficios futuros por billetera o medio de pago.

## 7. Perfil del usuario

- Acceso a:
  - Información personal.
  - Cupones.
  - Beneficios / membresía futura.
  - Ayuda.
- Completar perfil con progreso `1 de 3`, `2 de 3`, `3 de 3`.
- Direcciones.
- Favoritos.
- Grupo familiar.
- Billetera interna.
- Notificaciones.
- Información legal.
- Registrar mi negocio.

## 8. Pagos

### Etapa 1: sin cobro directo
- Pedido queda como `Pendiente de confirmación`.
- Comercio confirma precio y stock.
- Se genera link de pago solo si corresponde.

### Etapa 2: Mercado Pago Checkout Pro
- Backend crea preferencia de pago.
- Cliente abre link de Mercado Pago.
- Webhook recibe confirmación.
- Pedido cambia a `Pagado`.
- No guardar token secreto en frontend.

### Etapa 3: billetera / medios de pago
- Pantalla de medios de pago.
- Cupones por medio de pago.
- Billetera interna futura.

## 9. Panel comercio

- Login de comercio.
- Registro de negocio.
- Validación de datos.
- Alta y edición de productos.
- Stock.
- Horarios.
- Modalidades de entrega.
- Contacto autorizado.
- Recepción de pedidos.
- Confirmar/rechazar pedido.
- Generar link de pago.
- Marcar pedido como listo / entregado.

## 10. Panel admin

- Alta, baja y edición de comercios.
- Revisión de comercios reclamados.
- Validación de contacto público.
- Administración de rubros.
- Administración de promociones.
- Control de pedidos.
- Auditoría básica.
- Moderación de contenido.

## 11. Base de datos sugerida

- `users`
- `profiles`
- `addresses`
- `stores`
- `store_claims`
- `store_users`
- `store_hours`
- `store_delivery_zones`
- `products`
- `product_categories`
- `carts`
- `cart_items`
- `orders`
- `order_items`
- `payments`
- `payment_webhooks`
- `promotions`
- `coupons`
- `notifications`
- `support_tickets`

## 12. Orden de implementación recomendado

1. Autenticación básica.
2. Direcciones y cobertura.
3. Home con categorías.
4. Comercios y productos.
5. Carrito.
6. Pedidos pendientes.
7. Panel comercio.
8. WhatsApp/contacto autorizado.
9. Mercado Pago Checkout Pro.
10. Promociones/cupones.
11. Perfil completo.
12. Panel admin.

## 13. Regla de producto

La app debe ser un marketplace local propio. Puede tomar como referencia flujos habituales de apps de delivery, pero no debe clonar identidad visual, marca, copy propietario, logos, assets ni comportamiento que dependa de sistemas privados de terceros.
