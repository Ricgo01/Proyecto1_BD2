/**
 * seed.js — Script de población de base de datos
 * 
 * Distribución de ~50,000 documentos:
 *   - Users:       500
 *   - Restaurants: 100
 *   - MenuItems:   2,000  (~20 por restaurante)
 *   - Orders:      42,000 (insertados en lotes de 1,000)
 *   - Reviews:     5,500  (~1 review por cada ~8 órdenes delivered)
 * 
 * Uso: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

const User       = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem   = require('../models/MenuItem');
const Order      = require('../models/Order');
const Review     = require('../models/Review');

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Elige un elemento aleatorio de un array */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Genera un número entero aleatorio entre min y max (inclusivo) */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Progreso en consola */
const log = (msg) => console.log(`  ➜  ${msg}`);

// ─── Constantes ─────────────────────────────────────────────────────────────

const TOTAL_USERS       = 500;
const TOTAL_RESTAURANTS = 100;
const ITEMS_PER_REST    = 20;   // 100 * 20 = 2,000 MenuItems
const TOTAL_ORDERS      = 42000;
const ORDER_BATCH_SIZE  = 1000; // lotes de insertMany

const FOOD_CATEGORIES = [
  'Comida Rápida', 'Italiana', 'Mexicana', 'Japonesa', 'China',
  'Vegana', 'Mariscos', 'Panadería', 'Postres', 'Saludable'
];

const FOOD_TAGS = [
  'picante', 'vegetariano', 'sin_gluten', 'popular', 'nuevo',
  'económico', 'premium', 'casero', 'orgánico', 'keto'
];

const ORDER_STATUSES = ['created', 'confirmed', 'preparing', 'delivered', 'cancelled'];

// Coordenadas aproximadas de Guatemala City (rango realista)
const baseCoords = { lat: 14.6349, lng: -90.5069 };
const geoPoint = () => ({
  type: 'Point',
  coordinates: [
    parseFloat((baseCoords.lng + (Math.random() - 0.5) * 0.5).toFixed(6)),
    parseFloat((baseCoords.lat + (Math.random() - 0.5) * 0.5).toFixed(6))
  ]
});

// ─── Generadores ────────────────────────────────────────────────────────────

const genUsers = (n) =>
  Array.from({ length: n }, (_, i) => ({
    name:      faker.person.fullName(),
    email:     faker.internet.email({ allowSpecialCharacters: false }).toLowerCase() + `_${i}`,
    role:      i < 5 ? 'admin' : i < 5 + TOTAL_RESTAURANTS ? 'owner' : 'customer',
    createdAt: faker.date.between({ from: '2023-01-01', to: '2024-12-31' })
  }));

const genRestaurants = (owners) =>
  owners.map((owner) => ({
    name:        faker.company.name() + ' Restaurant',
    address:     faker.location.streetAddress(true),
    owner_id:    owner._id,
    location:    geoPoint(),
    categories:  faker.helpers.arrayElements(FOOD_CATEGORIES, randInt(1, 3)),
    avgRating:   0,
    ratingCount: 0,
    createdAt:   faker.date.between({ from: '2023-01-01', to: '2024-06-30' }),
    image:       null
  }));

const FOOD_NAMES = [
  'Hamburguesa Clásica', 'Pizza Margarita', 'Tacos de Pastor', 'Sushi Roll', 'Ensalada César',
  'Pad Thai', 'Ceviche Mixto', 'Lasaña de Carne', 'Pollo Asado', 'Burrito Supremo',
  'Sopa de Tortilla', 'Ramen de Cerdo', 'Costillas BBQ', 'Papas Fritas', 'Tarta de Queso'
];

const genMenuItems = (restaurants) =>
  restaurants.flatMap((rest) =>
    Array.from({ length: ITEMS_PER_REST }, () => ({
      restaurantId: rest._id,
      name:         pick(FOOD_NAMES) + ' ' + faker.commerce.productAdjective(),
      price:        parseFloat(faker.commerce.price({ min: 5, max: 150, dec: 2 })),
      tags:         faker.helpers.arrayElements(FOOD_TAGS, randInt(1, 3)),
      isAvailable:  Math.random() > 0.1, // 90% disponibles
      createdAt:    faker.date.between({ from: '2023-01-01', to: '2024-12-31' }),
      photo:        null
    }))
  );

const genOrdersBatch = (customers, restaurants, menuItemsByRestaurant, batchSize) => {
  const orders = [];
  for (let i = 0; i < batchSize; i++) {
    const restaurant   = pick(restaurants);
    const restItems    = menuItemsByRestaurant[restaurant._id.toString()] || [];
    if (restItems.length === 0) continue;

    const selectedItems = faker.helpers.arrayElements(restItems, randInt(1, 5));
    const items = selectedItems.map((item) => {
      const qty = randInt(1, 4);
      return {
        menuItemId:        item._id,
        nameSnapshot:      item.name,
        unitPriceSnapshot: item.price,
        qty,
        lineTotal: parseFloat((item.price * qty).toFixed(2))
      };
    });

    const totalAmount = parseFloat(
      items.reduce((sum, it) => sum + it.lineTotal, 0).toFixed(2)
    );
    const createdAt = faker.date.between({ from: '2023-01-01', to: '2024-12-31' });

    orders.push({
      userId:       pick(customers)._id,
      restaurantId: restaurant._id,
      status:       pick(ORDER_STATUSES),
      items,
      totalAmount,
      createdAt,
      updatedAt:    createdAt
    });
  }
  return orders;
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Iniciando seed...\n');

  await mongoose.connect(process.env.MONGO_URI);
  log('Conectado a MongoDB Atlas');

  // 1. Limpiar colecciones
  console.log('\n🗑️  Limpiando colecciones anteriores...');
  await Promise.all([
    User.deleteMany({}),
    Restaurant.deleteMany({}),
    MenuItem.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({})
  ]);
  log('Colecciones limpiadas');

  // 2. Users
  console.log('\n👥 Insertando Users...');
  const usersData = genUsers(TOTAL_USERS);
  const users     = await User.insertMany(usersData, { ordered: false });
  const owners    = users.filter((u) => u.role === 'owner');
  const customers = users.filter((u) => u.role === 'customer');
  log(`${users.length} usuarios insertados (${owners.length} owners, ${customers.length} customers)`);

  // 3. Restaurants
  console.log('\n🍽️  Insertando Restaurants...');
  const restaurantsData = genRestaurants(owners);
  const restaurants     = await Restaurant.insertMany(restaurantsData, { ordered: false });
  log(`${restaurants.length} restaurantes insertados`);

  // 4. MenuItems
  console.log('\n📋 Insertando MenuItems...');
  const menuItemsData = genMenuItems(restaurants);
  const menuItems     = await MenuItem.insertMany(menuItemsData, { ordered: false });

  // Indexar por restaurantId para acceso rápido en el seed de Orders
  const menuItemsByRestaurant = {};
  for (const item of menuItems) {
    const key = item.restaurantId.toString();
    if (!menuItemsByRestaurant[key]) menuItemsByRestaurant[key] = [];
    menuItemsByRestaurant[key].push(item);
  }
  log(`${menuItems.length} menu items insertados`);

  // 5. Orders — en lotes de ORDER_BATCH_SIZE
  console.log(`\n📦 Insertando Orders (${TOTAL_ORDERS} en lotes de ${ORDER_BATCH_SIZE})...`);
  let totalOrdersInserted = 0;
  const allInsertedOrders = [];

  for (let offset = 0; offset < TOTAL_ORDERS; offset += ORDER_BATCH_SIZE) {
    const remaining  = Math.min(ORDER_BATCH_SIZE, TOTAL_ORDERS - offset);
    const batch      = genOrdersBatch(customers, restaurants, menuItemsByRestaurant, remaining);
    const inserted   = await Order.insertMany(batch, { ordered: false });
    allInsertedOrders.push(...inserted);
    totalOrdersInserted += inserted.length;
    process.stdout.write(`\r  ➜  ${totalOrdersInserted}/${TOTAL_ORDERS} órdenes insertadas...`);
  }
  console.log(); // salto de línea tras el progreso inline

  // 6. Reviews — solo de órdenes con status 'delivered'
  console.log('\n⭐ Insertando Reviews...');
  const deliveredOrders = allInsertedOrders.filter((o) => o.status === 'delivered');

  // Tomar una muestra (~80% de las delivered)
  const ordersToReview = deliveredOrders.filter(() => Math.random() < 0.8);

  const reviewsData = ordersToReview.map((order) => ({
    restaurantId: order.restaurantId,
    userId:       order.userId,
    orderId:      order._id,
    rating:       randInt(1, 5),
    comment:      Math.random() > 0.3 ? faker.lorem.sentences(randInt(1, 3)) : '',
    createdAt:    faker.date.between({ from: order.createdAt, to: '2024-12-31' })
  }));

  const reviews = await Review.insertMany(reviewsData, { ordered: false });
  log(`${reviews.length} reviews insertadas`);

  // 7. Actualizar avgRating y ratingCount en Restaurants usando bulkWrite
  console.log('\n🔄 Actualizando avgRating y ratingCount en Restaurants...');
  const ratingMap = {};
  for (const review of reviews) {
    const key = review.restaurantId.toString();
    if (!ratingMap[key]) ratingMap[key] = { sum: 0, count: 0 };
    ratingMap[key].sum   += review.rating;
    ratingMap[key].count += 1;
  }

  const bulkOps = Object.entries(ratingMap).map(([restId, { sum, count }]) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(restId) },
      update: {
        $set: {
          avgRating:   parseFloat((sum / count).toFixed(2)),
          ratingCount: count
        }
      }
    }
  }));

  if (bulkOps.length > 0) {
    await Restaurant.bulkWrite(bulkOps);
    log(`${bulkOps.length} restaurantes actualizados con su rating promedio`);
  }

  // Resumen
  console.log('\n✅ Seed completado exitosamente!\n');
  console.log('─'.repeat(40));
  console.log(`  Users:       ${users.length}`);
  console.log(`  Restaurants: ${restaurants.length}`);
  console.log(`  MenuItems:   ${menuItems.length}`);
  console.log(`  Orders:      ${totalOrdersInserted}`);
  console.log(`  Reviews:     ${reviews.length}`);
  console.log(`  TOTAL:       ${users.length + restaurants.length + menuItems.length + totalOrdersInserted + reviews.length}`);
  console.log('─'.repeat(40) + '\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Error durante el seed:', err);
  mongoose.disconnect();
  process.exit(1);
});
