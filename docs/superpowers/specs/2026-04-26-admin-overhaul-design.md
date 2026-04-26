# Admin Overhaul — Design Spec

**Fecha:** 2026-04-26
**Estado:** Decidido autónomamente bajo confianza del usuario
**Alcance:** Panel `/admin/*` (dashboard, productos, settings, imágenes). Front público ya está rediseñado.

## Contexto y restricciones del usuario

- El admin se va a usar **principalmente desde el celular**.
- Las descripciones, precios e imágenes vienen de **WhatsApp** (admin copia/pega texto, descarga fotos del chat, sube).
- **Mobile-first** pero la **vista web debe quedar igual de buena** (no es solo mobile, es responsive completo).
- El admin agrega / modifica / **deshabilita** / elimina cosas a diario.

## Auditoría detectada (resumen)

- `ProductList.tsx` archivo vacío huérfano.
- `/admin/images` no enlazada en sidebar; además su contrato no coincide con la API actual de Supabase Storage.
- Cambio de password en settings es decorativo (texto: *"modifica ADMIN_PASSWORD en AuthContext.tsx"*).
- Sidebar fijo `w-64` no se adapta a mobile.
- ProductForm es modal monolítico de 458 líneas; inputs separados por comas (sizes/colors/features/tags) → fuente de errores.
- Tabla de productos sin filtros, sin orden, sin paginación, sin acciones rápidas.
- No existe el concepto de "deshabilitar" producto separado de "agotado". Hoy `inStock=false` significa "no tengo ahora" pero también termina usándose para ocultar de la tienda.

## Decisiones de diseño

### 1. Concepto: separar "agotado" de "archivado"

| Estado | Campo | Visible en tienda | Significado |
|---|---|---|---|
| Activo, en stock | `archived=false`, `inStock=true` | Sí, sin badge | Disponible |
| Activo, sin stock | `archived=false`, `inStock=false` | Sí, badge "Agotado" | Sin stock pero sigue siendo del catálogo |
| Archivado | `archived=true` | **No** | Ocultado del público (descontinuado, error, etc.) |

Schema: agregar columna `archived BOOLEAN NOT NULL DEFAULT FALSE` en `products`.

### 2. Layout responsive

- **Mobile (< md):** sidebar es un **drawer** que abre con tap del hamburguesa, slide-in izquierda con backdrop. Header sticky con logo + hamburguesa + atajos clave (♡ favs no aplica al admin; mantenemos solo logout y user indicator).
- **Desktop (md+):** sidebar fijo a la izquierda (`w-60`), contenido con margen. Header simplificado.
- Paleta: aplicar tokens `boutique cálido` al admin (consistencia con el front público). Diferenciador: el admin usa `bg-cream` como base para distinguirlo visualmente.
- Touch targets mínimos `44x44px` en mobile.

### 3. Lista de productos mobile-first

- **Mobile**: cards verticales con foto + nombre + precio + chips de estado (stock/archivado/oferta) + botón overflow `⋯` que abre **sheet** con acciones.
- **Desktop (md+)**: tabla compacta, mismas acciones en una fila al final.
- **FilterBar sticky** arriba: chips para `Todo / Activos / Agotados / Archivados`, búsqueda, dropdown sort.
- **Sort options**: más reciente, más caro, más barato, alfabético.
- **Paginación**: 20 por página. Mobile usa "Cargar más"; desktop usa anterior/siguiente clásico.
- **Quick action: toggle stock**: switch directo en la card/fila sin abrir form.
- **Menú overflow** por producto: Editar, Duplicar, Archivar/Desarchivar, Compartir por WhatsApp, Eliminar.
- **Compartir por WhatsApp**: genera mensaje pre-armado con nombre + precio + foto link y abre `wa.me/?text=...`. El admin lo manda al cliente.
- **Bulk actions** (solo desktop): checkbox por fila, barra superior con "Archivar seleccionados", "Eliminar seleccionados".

### 4. Form de producto

- **De modal a página dedicada**: `/admin/products/new` y `/admin/products/[id]/edit`. Mejor en mobile (back nativo, scroll fluido) y permite compartir links / deep links desde WhatsApp.
- **Secciones colapsables**:
  1. Información básica (nombre, descripción)
  2. Precios y stock (precio, precio anterior, switch en stock, switch archivado)
  3. Categoría (categoría, subcategoría, género)
  4. Variantes (talles, colores) — chip inputs
  5. Imágenes (principal + adicionales)
  6. Detalles opcionales (material, marca, rating, features, tags)
- **ChipInput** custom (~40 LOC, sin dependencia): tipear + Enter/coma agrega chip; click X quita. Aplica a sizes, colors, features, tags.
- **Inputs numéricos**: `inputMode="numeric"` para precios y rating. Auto-formateo de miles en display.
- **Imágenes**:
  - Mobile: input acepta `accept="image/*"` y multiple. No usamos `capture` (limita a cámara y bloquea galería en algunos browsers); el usuario elige desde galería o cámara según prefiera.
  - Desktop: drag-and-drop zone que también acepta click.
  - Multi-select directo (sin tener que subir una por una).
  - Preview en grid con drag-to-reorder más adelante (v2; ahora orden por upload).
- **Acciones**: Guardar (sticky bottom mobile, top-right desktop), Cancelar.
- **Validación**: nombre, precio, imagen principal, categoría, género son requeridos. Resto opcional.

### 5. Página `/admin/images`

- **Fix shape**: ajustar a la respuesta actual de `/api/upload` (Supabase Storage list).
- **Agregar al sidebar**: ítem "Imágenes" con icono `Image`.
- Funcionalidad: ver bucket, subir nuevas, copiar URL, eliminar. Sirve como banco de imágenes reusable.

### 6. Dashboard

- Reducir el ruido (hoy son 4 stats + recent + top-rated + 2 distribuciones).
- Quedarse con lo esencial:
  - 3 KPIs: total productos, en stock, archivados.
  - Atajos rápidos: "Nuevo producto", "Ver imágenes", "Configuración".
  - Lista de productos sin stock (acción rápida: marcar reposición o archivar).
- Aplicar paleta + tipografía boutique.

### 7. Settings

- Quitar el bloque de cambio de password (es decorativo, engaña al admin).
- Agregar nota: "El acceso al admin se configura vía variable de entorno `ADMIN_PASSWORD` en Vercel". Si quiere cambiarla, link a Vercel dashboard.
- Mantener: nombre de la tienda, número de WhatsApp, ícono de la tienda.

### 8. Cleanup técnico

- Borrar `src/components/admin/ProductList.tsx` (vacío).
- Cambiar ícono hamburguesa de `Package` a `Menu`.
- `admin/layout.tsx`: aplicar paleta, sidebar drawer, header simplificado.

## No-objetivos

- No se implementa Supabase Auth para reemplazar `ADMIN_PASSWORD`. Sigue siendo password global (constraint del usuario: "auth como está").
- No se implementan drafts/autosave del form. La regla simple: si no guardás, perdés.
- No se implementa undo de eliminaciones. Confirmación previa basta.
- No se implementa preview de producto antes de publicar (basta el form preview interno).
- No se implementa parser inteligente de mensajes de WhatsApp (heurístico, no confiable). El admin pega texto a mano.
- No se implementa drag-to-reorder de imágenes en esta iteración.
- No se implementan estadísticas avanzadas (ventas, clicks, etc. — no existe esa data).

## Criterios de aceptación

- [ ] Sidebar funciona como drawer en mobile, fijo en desktop.
- [ ] Lista de productos muestra cards en mobile, tabla en desktop.
- [ ] Toggle de stock funciona inline desde la lista.
- [ ] Menú de acciones por producto incluye duplicar, archivar/desarchivar, compartir por WhatsApp.
- [ ] Productos archivados no aparecen en el front público.
- [ ] Productos archivados son visibles en admin con filtro/badge claro.
- [ ] Form se abre como página completa, no modal.
- [ ] Form tiene chip inputs para sizes/colors/features/tags.
- [ ] Form acepta múltiples imágenes en una sola operación.
- [ ] Inputs numéricos usan teclado numérico en mobile.
- [ ] Página `/admin/images` carga sin error y muestra el bucket.
- [ ] Build pasa sin errores. Tests pasan.
- [ ] Página `/admin/images` aparece en el sidebar.
- [ ] Settings no muestra UI de cambio de password.
- [ ] Schema migration applied en Supabase (instrucciones documentadas).

## Schema migration

Ejecutar en Supabase SQL Editor antes de deployar (o el front público no romperá pero el admin no podrá filtrar archivados):

```sql
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_archived ON public.products(archived);
```

Sin esto, todas las queries seguirán funcionando porque el código lo trata como opcional (default false), pero el flag no se persistirá. La migración es idempotente.
