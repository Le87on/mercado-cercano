# Plan de implementación — A la Vuelta móvil + Supabase

> Alcance aprobado: aplicación Expo/React Native únicamente. La web no se modifica como producto.

## 1. Preparar pruebas de dominio

- Agregar un runner de pruebas al paquete móvil.
- Escribir pruebas fallidas para búsqueda normalizada, filtros, totales y reglas de una sola tienda por canasta.
- Implementar tipos y funciones puras hasta que las pruebas pasen.

## 2. Estructurar la app móvil

- Separar datos, dominio, servicios, estado, componentes y pantallas.
- Incorporar catálogo local de respaldo con rubros, comercios y productos.
- Sustituir el prototipo monolítico por navegación y pantallas móviles reutilizables.
- Mantener la identidad A la Vuelta y el flujo bento solicitado.

## 3. Integrar Supabase en React Native

- Configurar el cliente con URL y clave publicable de Expo, sesión persistente y refresco automático.
- Implementar servicio de catálogo con fallback local.
- Implementar acceso por código de email, cierre de sesión y escucha de sesión.
- Implementar creación y consulta de pedidos autenticados.

## 4. Crear esquema seguro

- Generar una migración consolidada mediante Supabase CLI.
- Crear catálogo, perfiles, comercios, membresías y pedidos.
- Activar RLS, índices, políticas y función transaccional de pedido.
- Revocar permisos inseguros heredados y sembrar categorías/comercios/productos de demostración.
- Aplicar la migración al proyecto Supabase conectado y generar tipos TypeScript.

## 5. Verificar y publicar

- Ejecutar pruebas móviles, TypeScript y exportación Android de Expo.
- Ejecutar las pruebas y build existentes del repositorio.
- Revisar asesores de seguridad y rendimiento de Supabase.
- Confirmar que el diff no altera la web fuera de ajustes de infraestructura imprescindibles.
- Crear commits, publicar la rama en GitHub y abrir un pull request en borrador.
