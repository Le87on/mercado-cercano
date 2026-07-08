# A la Vuelta · Marketplace local

MVP React/Vite para una app tipo marketplace local, armado a partir del prototipo `ALaVuelta.jsx` y del Excel limpio de comercios.

## Qué incluye

- Catálogo inicial con **101 comercios** importados desde `lumen_local_catalogo_app_limpio.xlsx`.
- Modo cliente:
  - buscador de comercios;
  - filtros por localidad y categoría;
  - vista de productos;
  - reservas/compras simuladas;
  - seguimiento de pedidos.
- Modo comercio:
  - reclamar comercio existente de la base;
  - crear comercio manual en borrador;
  - cargar productos;
  - manejar stock;
  - gestionar pedidos.
- Panel admin:
  - conteo de comercios, productos y pedidos;
  - distribución por localidad y categoría;
  - reinicio de demo.
- PWA básica:
  - manifest;
  - ícono SVG;
  - service worker simple para instalación/caché en build de producción.

## Importante

El MVP **no publica WhatsApp automáticamente** porque el Excel limpio deja ese campo vacío hasta que cada comercio autorice contacto público.

No incluye datos sensibles como CUIT, CBU, IIBB, mail privado ni razón social legal.

## Cómo correrlo

```bash
cd a-la-vuelta-local
npm install
npm run dev
```

Abrir:

```bash
http://localhost:5173
```

## Build de producción

```bash
npm run build
npm run preview
```

## Próximo paso recomendado

Conectar Supabase con estas tablas:

- `comercios`
- `productos`
- `clientes`
- `pedidos`
- `usuarios_comercio`
- `autorizaciones_contacto`

Para el MVP comercial inicial conviene mantener cierre por WhatsApp y recién después sumar Mercado Pago.
