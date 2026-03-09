const multer = require('multer');

// Usamos memoria en lugar de multer-gridfs-storage (incompatible con MongoDB driver v4+)
// El stream a GridFS se hace manualmente en el route handler
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten archivos de imagen'));
    }
    cb(null, true);
  }
});

module.exports = upload;
