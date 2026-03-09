const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const dotenv = require('dotenv');

dotenv.config();

const storage = new GridFsStorage({
  url: process.env.MONGO_URI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      // Filtrar solo imágenes
      if (!file.mimetype.startsWith('image/')) {
        return reject(new Error('Solo se permiten archivos de imagen'));
      }

      const filename = `${Date.now()}-${file.originalname}`;
      const fileInfo = {
        filename: filename,
        bucketName: 'uploads' // Las colecciones se llamarán 'uploads.files' y 'uploads.chunks'
      };
      resolve(fileInfo);
    });
  }
});

storage.on('connection', (db) => {
  console.log('✅ GridFS Storage Middleware conectado');
});

storage.on('connectionFailed', (err) => {
  console.error('❌ GridFS Storage Error al conectar', err.message);
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB
});

module.exports = upload;
