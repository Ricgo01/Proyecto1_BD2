/**
 * createIndexes.js — Script para crear y verificar índices
 * 
 * Este script:
 * 1. Se conecta a MongoDB Atlas
 * 2. Crea todos los índices definidos en los modelos
 * 3. Muestra un resumen de los índices creados para cada colección
 * 4. Ejecuta consultas de prueba con .explain() para verificar uso de índices
 * 
 * Uso: node src/scripts/createIndexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const User       = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem   = require('../models/MenuItem');
const Order      = require('../models/Order');
const Review     = require('../models/Review');

async function createIndexes() {
  console.log('\n📊 Iniciando creación y verificación de índices...\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB Atlas\n');

    // Crear índices en todas las colecciones
    console.log('🔨 Creando índices...\n');
    
    await User.createIndexes();
    console.log('  ✓ Índices creados en Users');
    
    await Restaurant.createIndexes();
    console.log('  ✓ Índices creados en Restaurants');
    
    await MenuItem.createIndexes();
    console.log('  ✓ Índices creados en MenuItems');
    
    await Order.createIndexes();
    console.log('  ✓ Índices creados en Orders');
    
    await Review.createIndexes();
    console.log('  ✓ Índices creados en Reviews');

    // Listar todos los índices
    console.log('\n📋 Resumen de índices por colección:\n');
    
    const collections = [
      { name: 'Users', model: User },
      { name: 'Restaurants', model: Restaurant },
      { name: 'MenuItems', model: MenuItem },
      { name: 'Orders', model: Order },
      { name: 'Reviews', model: Review }
    ];

    for (const { name, model } of collections) {
      const indexes = await model.collection.getIndexes();
      console.log(`\n${name}:`);
      Object.entries(indexes).forEach(([indexName, indexSpec]) => {
        const keys = JSON.stringify(indexSpec.key);
        const unique = indexSpec.unique ? ' [UNIQUE]' : '';
        const text = indexSpec.textIndexVersion ? ' [TEXT]' : '';
        const geo = indexSpec['2dsphereIndexVersion'] ? ' [GEOSPATIAL]' : '';
        console.log(`  - ${indexName}: ${keys}${unique}${text}${geo}`);
      });
    }

    // Verificar uso de índices con .explain()
    console.log('\n\n🔍 Verificando uso de índices con .explain()...\n');

    // 1. Users: búsqueda por email (debe usar índice único)
    console.log('1️⃣  Users.find({ email: "test@example.com" })');
    const explainUser = await User.find({ email: 'test@example.com' })
      .explain('executionStats');
    console.log(`   → Stage: ${explainUser.executionStats.executionStages.stage}`);
    console.log(`   → Index usado: ${explainUser.executionStats.executionStages.indexName || 'NINGUNO'}`);

    // 2. Restaurants: búsqueda de texto
    console.log('\n2️⃣  Restaurants.find({ $text: { $search: "pizza" } })');
    const explainRestText = await Restaurant.find({ $text: { $search: 'pizza' } })
      .explain('executionStats');
    console.log(`   → Stage: ${explainRestText.executionStats.executionStages.stage}`);
    console.log(`   → Index usado: ${explainRestText.executionStats.executionStages.indexName || 'NINGUNO'}`);

    // 3. Restaurants: búsqueda geoespacial
    console.log('\n3️⃣  Restaurants.find({ location: { $near: {...} } })');
    const explainRestGeo = await Restaurant.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [-90.5069, 14.6349] },
          $maxDistance: 5000
        }
      }
    }).limit(10).explain('executionStats');
    console.log(`   → Stage: ${explainRestGeo.executionStats.executionStages.stage}`);
    console.log(`   → Index usado: ${explainRestGeo.executionStats.executionStages.indexName || 'NINGUNO'}`);

    // 4. Reviews: búsqueda por restaurante
    console.log('\n4️⃣  Reviews.find({ restaurantId: ObjectId(...) })');
    const sampleRest = await Restaurant.findOne();
    if (sampleRest) {
      const explainReview = await Review.find({ restaurantId: sampleRest._id })
        .explain('executionStats');
      console.log(`   → Stage: ${explainReview.executionStats.executionStages.stage}`);
      console.log(`   → Index usado: ${explainReview.executionStats.executionStages.indexName || 'NINGUNO'}`);
    } else {
      console.log('   → No hay datos para probar (ejecutar seed primero)');
    }

    // 5. Orders: índice compuesto
    console.log('\n5️⃣  Orders.find({ restaurantId: ObjectId(...) }).sort({ createdAt: -1 })');
    if (sampleRest) {
      const explainOrder = await Order.find({ restaurantId: sampleRest._id })
        .sort({ createdAt: -1 })
        .explain('executionStats');
      console.log(`   → Stage: ${explainOrder.executionStats.executionStages.stage}`);
      if (explainOrder.executionStats.executionStages.inputStage) {
        console.log(`   → Index usado: ${explainOrder.executionStats.executionStages.inputStage.indexName || 'NINGUNO'}`);
      }
    } else {
      console.log('   → No hay datos para probar (ejecutar seed primero)');
    }

    // 6. Orders: índice multikey para items
    console.log('\n6️⃣  Orders.find({ "items.menuItemId": ObjectId(...) })');
    const sampleItem = await MenuItem.findOne();
    if (sampleItem) {
      const explainOrderItem = await Order.find({ 'items.menuItemId': sampleItem._id })
        .explain('executionStats');
      console.log(`   → Stage: ${explainOrderItem.executionStats.executionStages.stage}`);
      console.log(`   → Index usado: ${explainOrderItem.executionStats.executionStages.indexName || 'NINGUNO'}`);
    } else {
      console.log('   → No hay datos para probar (ejecutar seed primero)');
    }

    console.log('\n\n✅ Verificación completada!\n');
    console.log('📝 Notas:');
    console.log('   - IXSCAN indica que se está usando un índice');
    console.log('   - COLLSCAN indica un escaneo completo (NO deseable)');
    console.log('   - TEXT indica búsqueda de texto completo');
    console.log('   - GEO_NEAR_2DSPHERE indica búsqueda geoespacial\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB\n');
  }
}

createIndexes();
