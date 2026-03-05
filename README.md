# Proyecto 1 - Base de Datos 2
## Sistema de Gestión de Pedidos y Reseñas de Restaurantes

###  Descripción
Sistema completo de gestión de restaurantes, menú, pedidos y reseñas implementado con Node.js, Express, MongoDB Atlas y EJS. Incluye operaciones CRUD, agregaciones complejas, transacciones multi-documento, y optimización mediante índices.

---


## Prerrequisitos
- Node.js 16+
- Cuenta de MongoDB Atlas (ya configurada)

### Instalación

```bash
# 1. Clonar el repositorio (ya clonado)
cd "Semestre 7/BD 2/Proyecto1_BD2"

# 2. Instalar dependencias
npm install

# 3. El archivo .env ya está configurado con MongoDB Atlas

# 4. Poblar la base de datos (50,000+ documentos)
npm run seed

# 5. Crear índices
node src/scripts/createIndexes.js

# 6. Iniciar servidor
npm start
# o para desarrollo con auto-reload:
npm run dev
```

El servidor estará disponible en: **http://localhost:3000**

---

##  Estructura del Proyecto

```
Proyecto1_BD2/
├── src/
│   ├── models/           # Esquemas de Mongoose
│   │   ├── User.js
│   │   ├── Restaurant.js
│   │   ├── MenuItem.js
│   │   ├── Order.js
│   │   └── Review.js
│   ├── controllers/      # Lógica de negocio CRUD
│   │   ├── userController.js
│   │   ├── restaurantController.js
│   │   ├── menuItemController.js
│   │   ├── orderController.js
│   │   ├── reviewController.js
│   │   ├── reportController.js
│   │   ├── transactionController.js
│   │   └── queryAnalysisController.js
│   ├── routes/           # Definición de endpoints
│   │   ├── index.js
│   │   ├── userRoutes.js
│   │   ├── restaurantRoutes.js
│   │   ├── menuItemRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── transactionRoutes.js
│   │   └── queryAnalysisRoutes.js
│   ├── services/         # Lógica reutilizable
│   │   ├── aggregationService.js
│   │   └── transactionService.js
│   ├── utils/            # Utilidades
│   │   └── queryUtils.js
│   ├── scripts/          # Scripts de mantenimiento
│   │   ├── seed.js
│   │   └── createIndexes.js
│   └── config/           # Configuración
│       └── db.js
├── views/                # Plantillas EJS
│   └── index.ejs
├── public/               # Archivos estáticos
├── app.js                # Aplicación principal
├── package.json
└── .env                  # Variables de entorno
```

---

##  Modelos de Datos

### Users
- `_id`: ObjectId
- `name`: String
- `email`: String (único)
- `role`: String (admin | owner | customer)
- `createdAt`: Date

**Índices:** email (único)

### Restaurants
- `_id`: ObjectId
- `name`: String
- `address`: String
- `owner_id`: ObjectId (ref: User)
- `location`: GeoJSON Point
- `categories`: Array<String>
- `avgRating`: Number
- `ratingCount`: Number
- `createdAt`: Date
- `image`: ObjectId (GridFS)

**Índices:** location (2dsphere), {name, categories} (text)

### MenuItems
- `_id`: ObjectId
- `restaurantId`: ObjectId (ref: Restaurant)
- `name`: String
- `price`: Number
- `tags`: Array<String>
- `isAvailable`: Boolean
- `createdAt`: Date
- `photo`: ObjectId (GridFS)

### Orders
- `_id`: ObjectId
- `userId`: ObjectId (ref: User)
- `restaurantId`: ObjectId (ref: Restaurant)
- `status`: String (created | confirmed | preparing | delivered | cancelled)
- `items`: Array<OrderItem> *(embedded)*
  - `menuItemId`: ObjectId
  - `nameSnapshot`: String
  - `unitPriceSnapshot`: Number
  - `qty`: Number
  - `lineTotal`: Number
- `totalAmount`: Number
- `createdAt`: Date
- `updatedAt`: Date

**Índices:** {restaurantId, createdAt} (compuesto), items.menuItemId (multikey)

### Reviews
- `_id`: ObjectId
- `restaurantId`: ObjectId (ref: Restaurant)
- `userId`: ObjectId (ref: User)
- `orderId`: ObjectId (ref: Order)
- `rating`: Number (1-5)
- `comment`: String
- `createdAt`: Date

**Índices:** restaurantId (simple)

---

##  API Endpoints

###  Base URL: `/api`

### **Users** (`/api/users`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear usuario |
| GET | `/` | Listar usuarios (paginado) |
| GET | `/:id` | Obtener usuario por ID |
| GET | `/email/:email` | Buscar por email |
| PUT | `/:id` | Actualizar usuario |
| DELETE | `/:id` | Eliminar usuario |

**Query params:** `role`, `page`, `limit`, `sortBy`, `order`, `fields`

### **Restaurants** (`/api/restaurants`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear restaurante |
| GET | `/` | Listar restaurantes |
| GET | `/search` | Búsqueda de texto completo |
| GET | `/nearby` | Búsqueda geoespacial |
| GET | `/:id` | Obtener por ID |
| PUT | `/:id` | Actualizar |
| POST | `/:id/categories` | Agregar categoría ($addToSet) |
| DELETE | `/:id/categories` | Remover categoría ($pull) |
| DELETE | `/:id` | Eliminar |

**Query params búsqueda texto:** `q`, `limit`  
**Query params búsqueda geo:** `lng`, `lat`, `maxDistance`, `limit`

### **Menu Items** (`/api/menu-items`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear item |
| GET | `/` | Listar items |
| GET | `/:id` | Obtener por ID |
| PUT | `/:id` | Actualizar |
| PATCH | `/bulk/availability` | Actualización masiva |
| DELETE | `/:id` | Eliminar |

### **Orders** (`/api/orders`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear pedido |
| GET | `/` | Listar pedidos |
| GET | `/:id` | Obtener por ID |
| PATCH | `/:id/status` | Actualizar estado |
| POST | `/:id/items` | Agregar item ($push) |
| DELETE | `/:id/items` | Remover item ($pull) |
| DELETE | `/:id` | Eliminar |
| DELETE | `/bulk/cancelled` | Eliminar cancelados antiguos |

### **Reviews** (`/api/reviews`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear reseña |
| GET | `/` | Listar reseñas |
| GET | `/:id` | Obtener por ID |
| PUT | `/:id` | Actualizar |
| DELETE | `/:id` | Eliminar |
| DELETE | `/bulk/delete` | Eliminación masiva |

### **Reports** (`/api/reports`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/stats` | Estadísticas generales |
| GET | `/distinct-values` | Valores únicos (categorías, tags) |
| GET | `/top-dishes` | Platillos más vendidos |
| GET | `/monthly-sales` | Ventas por mes |
| GET | `/top-customers` | Clientes con mayor gasto |
| GET | `/top-restaurants` | Restaurantes mejor calificados |
| GET | `/order-status-analysis` | Análisis por estado |
| GET | `/sales-by-category` | Ventas por categoría |
| GET | `/restaurant/:id/top-dishes` | Top platillos de un restaurante |

### **Transactions** (`/api/transactions`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/review-with-rating` | Crear reseña + actualizar rating (transacción) |
| POST | `/cancel-order/:orderId` | Cancelar pedido + auditoría (transacción) |
| GET | `/audit-logs` | Obtener logs de auditoría |

### **Query Analysis** (`/api/query-analysis`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/analyze` | Analizar query con explain() |
| POST | `/validate` | Validar uso de índices |
| GET | `/performance/:collection` | Reporte de rendimiento |
| POST | `/compare` | Comparar dos queries |
| GET | `/demonstrate` | Demo de uso de índices |

---

##  Aggregation Pipelines Implementados

### 1. Top Platillos Más Vendidos
```javascript
GET /api/reports/top-dishes?limit=10
```
**Pipeline:** `$unwind` → `$group` → `$sort` → `$limit` → `$lookup`

### 2. Ventas Mensuales por Restaurante
```javascript
GET /api/reports/monthly-sales?restaurantId=<id>
```
**Pipeline:** `$match` → `$group` (con `$month`, `$year`) → `$lookup` → `$sort`

### 3. Top Clientes por Gasto
```javascript
GET /api/reports/top-customers?limit=10
```
**Pipeline:** `$group` → `$sort` → `$limit` → `$lookup` → `$unwind`

### 4. Análisis de Pedidos por Estado
```javascript
GET /api/reports/order-status-analysis
```
**Pipeline:** `$group` → `$sort`

### 5. Ventas por Categoría
```javascript
GET /api/reports/sales-by-category
```
**Pipeline:** `$lookup` → `$unwind` (2x) → `$group` → `$sort`

---

##  Transacciones Multi-Documento

### Transacción 1: Crear Reseña + Actualizar Rating
**Endpoint:** `POST /api/transactions/review-with-rating`

**Operaciones atómicas:**
1. Insertar documento en `Reviews`
2. Incrementar `ratingCount` en `Restaurant`
3. Recalcular `avgRating`

**Validaciones:**
- Pedido debe estar en estado 'delivered'
- No puede existir reseña previa para ese pedido

### Transacción 2: Cancelar Pedido + Auditoría
**Endpoint:** `POST /api/transactions/cancel-order/:orderId`

**Operaciones atómicas:**
1. Actualizar estado del pedido a 'cancelled'
2. Crear registro en `AuditLog`
3. Simular proceso de reembolso

**Validaciones:**
- No se pueden cancelar pedidos entregados
- No se pueden cancelar pedidos ya cancelados

---

##  Índices Implementados

| Colección | Tipo | Índice | Propósito |
|-----------|------|--------|-----------|
| Users | Simple (único) | `{ email: 1 }` | Login y validación de duplicados |
| Restaurants | Geoespacial | `{ location: "2dsphere" }` | Búsquedas por proximidad |
| Restaurants | Texto | `{ name: "text", categories: "text" }` | Búsqueda de texto completo |
| Reviews | Simple | `{ restaurantId: 1 }` | Listar reseñas por restaurante |
| Orders | Compuesto | `{ restaurantId: 1, createdAt: -1 }` | Pedidos recientes por restaurante |
| Orders | Multikey | `{ "items.menuItemId": 1 }` | Reportes de platillos más vendidos |

### Verificar Índices
```bash
node src/scripts/createIndexes.js
```

---

##  Operadores MongoDB Demostrados

### Operadores de Array
- **$push**: Agregar item a carrito → `POST /api/orders/:id/items`
- **$pull**: Remover item de carrito → `DELETE /api/orders/:id/items`
- **$addToSet**: Agregar categoría única → `POST /api/restaurants/:id/categories`

### Operadores de Consulta
- **$text**: Búsqueda de texto → `GET /api/restaurants/search`
- **$near**: Búsqueda geoespacial → `GET /api/restaurants/nearby`
- **$lookup**: Joins entre colecciones → Todos los pipelines
- **$unwind**: Descomponer arrays → Pipeline de platillos más vendidos

### Operadores de Agregación
- **$group**: Agrupar y sumar
- **$sort**: Ordenamiento
- **$limit**: Limitar resultados
- **$match**: Filtros
- **$project**: Proyecciones
- **$month, $year**: Extracción de fechas

---

##  Datos Masivos

El script `seed.js` genera automáticamente:
- **500** usuarios
- **100** restaurantes
- **2,000** items de menú
- **42,000** pedidos (en lotes de 1,000)
- **5,500+** reseñas

**Total: ~50,000 documentos**

```bash
npm run seed
```

---

##  Shard Key Propuesta

**Colección:** `Orders`  
**Shard Key:** `{ restaurantId: 1, createdAt: 1 }`

**Justificación:**
- Mejora lectura: las consultas filtran por restaurante y fecha
- Escalabilidad: distribución natural por restaurante
- Trade-off aceptado: hotspot temporal en restaurantes muy populares

---

##  Query Analysis & Explain

### Analizar cualquier query
```javascript
POST /api/query-analysis/analyze
Body: {
  "collection": "Order",
  "filter": { "restaurantId": "..." },
  "limit": 10
}
```

### Validar uso de índices
```javascript
POST /api/query-analysis/validate
Body: {
  "collection": "Restaurant",
  "filter": { "categories": "Pizza" }
}
```

### Demo de todos los índices
```javascript
GET /api/query-analysis/demonstrate
```

---

##  Comandos Útiles

```bash
# Poblar base de datos
npm run seed

# Crear índices y verificar con explain()
node src/scripts/createIndexes.js

# Iniciar servidor
npm start

# Desarrollo con auto-reload
npm run dev

# Ver commits del proyecto
git log --oneline
```

---


## Autores

**Proyecto 1 - Base de Datos 2**  
Universidad del Valle de Guatemala  
2026
