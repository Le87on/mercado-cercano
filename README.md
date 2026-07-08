# A la Vuelta · Marketplace local

MVP de marketplace local para comercios de cercanía, adaptado sobre la base existente del repositorio `mercado-cercano`.

## Qué incluye

- Catálogo inicial con **101 comercios locales** de San Carlos, Eugenio Bustos, La Consulta, Pareditas, Chilecito, Tunuyán y zonas cercanas.
- Buscador por comercio, rubro, descripción y localidad.
- Filtros por localidad, categoría y modalidad.
- Cards de comercios consultables.
- Carrito/guardados para armar consultas o reservas.
- Funcionamiento standalone: el catálogo inicial corre sin Supabase.
- Supabase queda como próximo paso para usuarios, comercios, productos reales y pedidos persistentes.

## Importante

El MVP no publica WhatsApp automáticamente. Los contactos deben agregarse solo cuando cada comercio autorice su publicación.

No se exponen CUIT, CBU, IIBB, mails privados ni razón social legal.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrir el link local que muestre Vite/Lovable, normalmente:

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
