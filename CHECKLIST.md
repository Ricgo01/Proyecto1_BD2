# CHECKLIST.md — Proyecto 1 BD2 (MongoDB + Node + Express + EJS)

> Objetivo: que TODO lo requerido exista y se pueda demostrar en la presentación.

---

## 1) Setup y ejecución (debe correr en cualquier PC)
- [x] `npm install` instala dependencias sin errores
- [x] `.env` existe y conecta a MongoDB Atlas
- [x] `npm start` levanta en `http://localhost:3000`
- [x] `npm run dev` funciona (autoreload — requiere `npm install` previo)
- [x] Ruta `GET /health` confirma servidor activo

---

## 2) Estructura de proyecto (archivos/carpetas mínimas)
- [x] `app.js`
- [x] `src/config/db.js`

### Models (Mongoose)
- [x] `src/models/User.js`
- [x] `src/models/Restaurant.js`
- [x] `src/models/MenuItem.js`
- [x] `src/models/Order.js`
- [x] `src/models/Review.js`
- [ ] `src/models/AuditLog.js` ← **FALTA** (necesario para Transacción 2)

### Controllers
- [x] `src/controllers/userController.js` — usa `next(error)`
- [x] `src/controllers/restaurantController.js` — usa `next(error)`
- [x] `src/controllers/menuItemController.js` — usa `next(error)`
- [x] `src/controllers/orderController.js` — usa `next(error)`
- [x] `src/controllers/reviewController.js` — usa `next(error)`
- [x] `src/controllers/reportController.js` — usa `next(error)` ✓ corregido
- [x] `src/controllers/transactionController.js` — usa `next(error)` ✓ corregido
- [x] `src/controllers/queryAnalysisController.js` — usa `next(error)` ✓ corregido

### Routes
- [x] `src/routes/index.js`
- [x] `src/routes/userRoutes.js`
- [x] `src/routes/restaurantRoutes.js`
- [x] `src/routes/menuItemRoutes.js`
- [x] `src/routes/orderRoutes.js`
- [x] `src/routes/reviewRoutes.js`
- [x] `src/routes/reportRoutes.js`
- [x] `src/routes/transactionRoutes.js`
- [x] `src/routes/queryAnalysisRoutes.js`
- [x] `src/routes/viewRoutes.js`

### Services / Utils / Scripts
- [x] `src/services/aggregationService.js`
- [x] `src/services/transactionService.js`
- [x] `src/utils/queryUtils.js`
- [x] `src/scripts/seed.js`
- [x] `src/scripts/createIndexes.js`

### Views / Public (EJS)
- [x] `views/partials/navbar.ejs` — sin emojis, dropdown Owner + Cliente
- [x] `views/index.ejs` — dashboard con stats y links por rol (sin emojis)
- [x] `views/owner/` — páginas de gestión completas
- [ ] `views/customer/orders/index.ejs` ← **FALTA** (archivo vacío)
- [ ] `views/customer/orders/create.ejs` ← **FALTA** (archivo vacío)
- [ ] `views/customer/orders/detail.ejs` ← **FALTA** (archivo vacío)
- [ ] `views/customer/reviews/index.ejs` ← **FALTA** (archivo vacío)
- [ ] `views/customer/reviews/create.ejs` ← **FALTA** (archivo vacío)
- [x] `public/css/` y `public/js/`

---

## 3) Modelos: campos obligatorios (validación mínima)
### User
- [x] `email` UNIQUE
- [x] `role` enum: `admin | owner | customer`

### Restaurant
- [x] `owner_id` ref User
- [x] `location` GeoJSON Point
- [x] `categories[]`
- [x] `avgRating`, `ratingCount`
- [x] `image` fileId (campo existe en modelo, GridFS pendiente de implementar)

### MenuItem
- [x] `restaurantId` ref Restaurant
- [x] `tags[]`
- [x] `isAvailable`
- [x] `photo` fileId (campo existe en modelo, GridFS pendiente de implementar)

### Order
- [x] `status` enum: `created | confirmed | preparing | delivered | cancelled`
- [x] `items[]` EMBEBIDO (snapshot):
  - [x] `menuItemId`
  - [x] `nameSnapshot`
  - [x] `unitPriceSnapshot`
  - [x] `qty`
  - [x] `lineTotal`
- [x] `totalAmount`
- [x] `createdAt`, `updatedAt`

### Review
- [x] `restaurantId`, `userId`, `orderId` (refs)
- [x] `rating` 1..5
- [x] `createdAt`

---

## 4) CRUD obligatorio (Create/Read/Update/Delete)
### Create
- [x] Crear usuarios — `POST /api/users`
- [x] Crear restaurantes — `POST /api/restaurants`
- [x] Crear items de menú — `POST /api/menu-items`
- [x] Crear pedidos (con `items[]` embebido) — `POST /api/orders`
- [x] Crear reseñas — `POST /api/reviews`
- [ ] Subir imágenes (GridFS) ← **FALTA** (Ricardo)

### Read (RÚBRICA)
- [x] Listados con filtros — todos los GET soportan filtros
- [x] Búsqueda parcial/regex (1+ letra) — `q` en restaurants, menu-items, users
- [x] Proyección (`fields=`) — en users y restaurants
- [x] Ordenamiento (`sortBy`, `order`)
- [x] Paginación real (`page`, `limit`, `skip`)
- [x] Detalle de pedido con `items[]` embebido — `GET /api/orders/:id`
- [x] `$lookup` — en pipelines de agregación y populate()

### Update
- [x] UpdateOne — `PUT /api/restaurants/:id`, `PATCH /api/orders/:id/status`
- [x] UpdateMany — `PATCH /api/menu-items/bulk/availability`
- [x] `$push` — `POST /api/orders/:id/items`
- [x] `$pull` — `DELETE /api/orders/:id/items`
- [x] `$addToSet` — `POST /api/restaurants/:id/categories`

### Delete
- [x] DeleteOne — `DELETE /api/reviews/:id`, `DELETE /api/menu-items/:id`
- [x] DeleteMany — `DELETE /api/orders/bulk/cancelled`, `DELETE /api/reviews/bulk/delete`

---

## 5) GridFS (archivos obligatorios)
- [ ] Endpoint upload imagen → guarda en GridFS ← **FALTA** (Ricardo)
- [ ] Guarda `fileId` en `Restaurant.image` / `MenuItem.photo` ← **FALTA**
- [ ] Endpoint servir imagen por streaming ← **FALTA**
- [ ] Evidencia en UI ← **FALTA**

---

## 6) Agregaciones (reportes)
### Simples
- [x] `countDocuments` — `GET /api/reports/stats`
- [x] `distinct` — `GET /api/reports/distinct-values`

### Complejas (pipelines)
- [x] Top platillos más vendidos — `GET /api/reports/top-dishes`
- [x] Ventas por mes por restaurante — `GET /api/reports/monthly-sales`
- [x] Top clientes por gasto — `GET /api/reports/top-customers`
- [x] Top restaurantes mejor calificados — `GET /api/reports/top-restaurants`
- [x] Análisis pedidos por estado — `GET /api/reports/order-status-analysis`
- [x] Ventas por categoría — `GET /api/reports/sales-by-category`

---

## 7) Transacciones multi-documento (mínimo 1)
- [x] Transacción 1: crear Review + actualizar ratingCount + recalcular avgRating
  - [x] valida: order debe estar `delivered`
  - [x] valida: no puede existir reseña previa para ese order
- [ ] Transacción 2: cancelar order + crear AuditLog ← **FALTA AuditLog model**
  - [x] valida: no cancelar delivered
  - [x] valida: no cancelar ya cancelados

---

## 8) Índices (crear + demostrar con explain + notablescan)
- [x] Users: `{ email: 1 }` UNIQUE
- [x] Restaurants: `{ location: "2dsphere" }`
- [x] Restaurants: `{ name: "text", categories: "text" }`
- [x] Reviews: `{ restaurantId: 1 }`
- [x] Orders: `{ restaurantId: 1, createdAt: -1 }`
- [x] Orders: `{ "items.menuItemId": 1 }` (multikey)
- [x] Script `createIndexes.js` crea todos
- [x] `explain()` en queryAnalysisController
- [ ] `notablescan` activado para demostrar ← verificar en demo

---

## 9) Datos masivos (seed)
- [x] `npm run seed` genera 50,000+ documentos
- [ ] BulkWrite evidencia en código ← verificar en seed.js

---

## 10) Frontend EJS — separado por rol
### Compartido
- [x] `views/partials/navbar.ejs` 
- [x] `views/index.ejs` — dashboard con stats y links por rol
- [x] `src/routes/viewRoutes.js`

### Rol: Owner (gestión) — COMPLETO
- [x] `views/owner/restaurants/index.ejs` — listar + dropdown categorías + búsqueda parcial + paginación
- [x] `views/owner/restaurants/create.ejs` — búsqueda owner por nombre + multi-select categorías
- [x] `views/owner/restaurants/detail.ejs` — detalle + sección menú
- [x] `views/owner/menu/index.ejs` — buscar restaurante por nombre + dropdown tags + toggle disponibilidad
- [x] `views/owner/menu/create.ejs` — búsqueda restaurante + multi-select tags
- [x] `views/owner/menu/edit.ejs` — formulario editar item
- [x] `views/owner/reports/index.ejs` — dashboard de agregaciones

### Rol: Customer (consumo) — FALTA
- [ ] `views/customer/orders/index.ejs` ← **FALTA**
- [ ] `views/customer/orders/create.ejs` ← **FALTA**
- [ ] `views/customer/orders/detail.ejs` ← **FALTA**
- [ ] `views/customer/reviews/index.ejs` ← **FALTA**
- [ ] `views/customer/reviews/create.ejs` ← **FALTA**


> Objetivo: que TODO lo requerido exista y se pueda demostrar en la presentación.

---

## 1) Setup y ejecución (debe correr en cualquier PC)
- [x] `npm install` instala dependencias sin errores
- [x] `.env` existe y conecta a MongoDB Atlas
- [x] `npm start` levanta en `http://localhost:3000`
- [x] `npm run dev` funciona (autoreload — requiere `npm install` previo)
- [x] Ruta `GET /health` confirma servidor activo

---

## 2) Estructura de proyecto (archivos/carpetas mínimas)
- [x] `app.js`
- [x] `src/config/db.js`

### Models (Mongoose)
- [x] `src/models/User.js`
- [x] `src/models/Restaurant.js`
- [x] `src/models/MenuItem.js`
- [x] `src/models/Order.js`
- [x] `src/models/Review.js`
- [ ] `src/models/AuditLog.js` ← **FALTA** (necesario para Transacción 2)

### Controllers
- [x] `src/controllers/userController.js`
- [x] `src/controllers/restaurantController.js`
- [x] `src/controllers/menuItemController.js`
- [x] `src/controllers/orderController.js`
- [x] `src/controllers/reviewController.js`
- [x] `src/controllers/reportController.js` *(usa res.500 directo — pendiente next(error))*
- [x] `src/controllers/transactionController.js` *(usa res.500 directo — pendiente next(error))*
- [x] `src/controllers/queryAnalysisController.js`

### Routes
- [x] `src/routes/index.js`
- [x] `src/routes/userRoutes.js`
- [x] `src/routes/restaurantRoutes.js`
- [x] `src/routes/menuItemRoutes.js`
- [x] `src/routes/orderRoutes.js`
- [x] `src/routes/reviewRoutes.js`
- [x] `src/routes/reportRoutes.js`
- [x] `src/routes/transactionRoutes.js`
- [x] `src/routes/queryAnalysisRoutes.js`

### Services / Utils / Scripts
- [x] `src/services/aggregationService.js`
- [x] `src/services/transactionService.js`
- [x] `src/utils/queryUtils.js`
- [x] `src/scripts/seed.js`
- [x] `src/scripts/createIndexes.js`

### Views / Public (EJS)
- [ ] `views/partials/navbar.ejs` ← **FALTA**
- [ ] `views/index.ejs` — solo boilerplate, necesita dashboard real
- [ ] `views/owner/` — páginas de gestión ← **FALTA**
- [ ] `views/customer/` — páginas de cliente ← **FALTA**
- [ ] `src/routes/viewRoutes.js` ← **FALTA**
- [ ] `public/css/` y `public/js/` vacíos

---

## 3) Modelos: campos obligatorios (validación mínima)
### User
- [x] `email` UNIQUE
- [x] `role` enum: `admin | owner | customer`

### Restaurant
- [x] `owner_id` ref User
- [x] `location` GeoJSON Point
- [x] `categories[]`
- [x] `avgRating`, `ratingCount`
- [x] `image` fileId (campo existe en modelo, GridFS pendiente de implementar)

### MenuItem
- [x] `restaurantId` ref Restaurant
- [x] `tags[]`
- [x] `isAvailable`
- [x] `photo` fileId (campo existe en modelo, GridFS pendiente de implementar)

### Order
- [x] `status` enum: `created | confirmed | preparing | delivered | cancelled`
- [x] `items[]` EMBEBIDO (snapshot):
  - [x] `menuItemId`
  - [x] `nameSnapshot`
  - [x] `unitPriceSnapshot`
  - [x] `qty`
  - [x] `lineTotal`
- [x] `totalAmount`
- [x] `createdAt`, `updatedAt`

### Review
- [x] `restaurantId`, `userId`, `orderId` (refs)
- [x] `rating` 1..5
- [x] `createdAt`

---

## 4) CRUD obligatorio (Create/Read/Update/Delete)
### Create
- [x] Crear usuarios — `POST /api/users`
- [x] Crear restaurantes — `POST /api/restaurants`
- [x] Crear items de menú — `POST /api/menu-items`
- [x] Crear pedidos (con `items[]` embebido) — `POST /api/orders`
- [x] Crear reseñas — `POST /api/reviews`
- [ ] Subir imágenes (GridFS) ← **FALTA** (Ricardo)

### Read (RÚBRICA)
- [x] Listados con filtros — todos los GET soportan filtros
- [x] Proyección (`fields=`) — en users y restaurants
- [x] Ordenamiento (`sortBy`, `order`)
- [x] Paginación real (`page`, `limit`, `skip`)
- [x] Detalle de pedido con `items[]` embebido — `GET /api/orders/:id`
- [x] `$lookup` — en pipelines de agregación y populate()

### Update
- [x] UpdateOne — `PUT /api/restaurants/:id`, `PATCH /api/orders/:id/status`
- [x] UpdateMany — `PATCH /api/menu-items/bulk/availability`
- [x] `$push` — `POST /api/orders/:id/items`
- [x] `$pull` — `DELETE /api/orders/:id/items`
- [x] `$addToSet` — `POST /api/restaurants/:id/categories`

### Delete
- [x] DeleteOne — `DELETE /api/reviews/:id`, `DELETE /api/menu-items/:id`
- [x] DeleteMany — `DELETE /api/orders/bulk/cancelled`, `DELETE /api/reviews/bulk/delete`

---

## 5) GridFS (archivos obligatorios)
- [ ] Endpoint upload imagen → guarda en GridFS ← **FALTA** (Ricardo)
- [ ] Guarda `fileId` en `Restaurant.image` / `MenuItem.photo` ← **FALTA**
- [ ] Endpoint servir imagen por streaming ← **FALTA**
- [ ] Evidencia en UI ← **FALTA**

---

## 6) Agregaciones (reportes)
### Simples
- [x] `countDocuments` — `GET /api/reports/stats`
- [x] `distinct` — `GET /api/reports/distinct-values`

### Complejas (pipelines)
- [x] Top platillos más vendidos — `GET /api/reports/top-dishes`
- [x] Ventas por mes por restaurante — `GET /api/reports/monthly-sales`
- [x] Top clientes por gasto — `GET /api/reports/top-customers`

---

## 7) Transacciones multi-documento (mínimo 1)
- [x] Transacción 1: crear Review + actualizar ratingCount + recalcular avgRating
  - [x] valida: order debe estar `delivered`
  - [x] valida: no puede existir reseña previa para ese order
- [ ] Transacción 2: cancelar order + crear AuditLog ← **FALTA AuditLog model**
  - [x] valida: no cancelar delivered
  - [x] valida: no cancelar ya cancelados

---

## 8) Índices (crear + demostrar con explain + notablescan)
- [x] Users: `{ email: 1 }` UNIQUE
- [x] Restaurants: `{ location: "2dsphere" }`
- [x] Restaurants: `{ name: "text", categories: "text" }`
- [x] Reviews: `{ restaurantId: 1 }`
- [x] Orders: `{ restaurantId: 1, createdAt: -1 }`
- [x] Orders: `{ "items.menuItemId": 1 }` (multikey)
- [x] Script `createIndexes.js` crea todos
- [x] `explain()` en queryAnalysisController
- [ ] `notablescan` activado para demostrar ← verificar en demo

---

## 9) Datos masivos (seed)
- [x] `npm run seed` genera 50,000+ documentos
- [ ] BulkWrite evidencia en código ← verificar en seed.js

---

## 10) Frontend EJS — separado por rol
### Compartido
- [ ] `views/partials/navbar.ejs` ← **FALTA**
- [ ] `views/index.ejs` Dashboard con stats y links por rol ← **FALTA**
- [ ] `src/routes/viewRoutes.js` ← **FALTA**

### Rol: Owner (gestión)
- [ ] `views/owner/restaurants/index.ejs` — listar + filtro + search + paginación ← **FALTA**
- [ ] `views/owner/restaurants/create.ejs` — formulario crear ← **FALTA**
- [ ] `views/owner/restaurants/detail.ejs` — detalle + sección menú ← **FALTA**
- [ ] `views/owner/menu/index.ejs` — listar por restaurante + toggle disponibilidad ← **FALTA**
- [ ] `views/owner/menu/create.ejs` — formulario crear item ← **FALTA**
- [ ] `views/owner/menu/edit.ejs` — formulario editar item ← **FALTA**
- [ ] `views/owner/reports/index.ejs` — dashboard de agregaciones ← **FALTA**

### Rol: Customer (consumo)
- [ ] `views/customer/orders/index.ejs` — listar (paginado + filtros) ← **FALTA**
- [ ] `views/customer/orders/create.ejs` — selección restaurante → items → submit ← **FALTA**
- [ ] `views/customer/orders/detail.ejs` — detalle con items embebidos + cambiar status ← **FALTA**
- [ ] `views/customer/reviews/index.ejs` — listar reviews por restaurante ← **FALTA**
- [ ] `views/customer/reviews/create.ejs` — formulario crear review ← **FALTA**

---

## 11) Definition of Done (para cada endpoint)
- [x] Valida inputs → 400
- [x] No existe → 404
- [x] ID inválido no rompe (CastError manejado por errorHandler)
- [x] Errores pasan por `next(error)` — aplicado en 5 controllers core
- [ ] `reportController` y `transactionController` aún usan `res.500` directo ← pendiente
- [x] Ejemplos documentados en README

---