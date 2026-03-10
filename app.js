require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const errorHandler = require("./src/middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Configuración de EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Conexión a MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error al conectar a MongoDB:", err));

// Importar rutas
const apiRoutes  = require('./src/routes');
const viewRoutes = require('./src/routes/viewRoutes');

// Rutas de vistas EJS (antes de /api para no interceptar llamadas de API)
app.use('/', viewRoutes);

// Rutas de API
app.use('/api', apiRoutes);

// health check 
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Levantar el servidor
app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
});
