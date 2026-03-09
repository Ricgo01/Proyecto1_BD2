const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const upload = require('../middlewares/upload');

// Endpoint para subir imagen cruda y sacar el ID mágico
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se envió ninguna imagen' });
  
  res.status(201).json({ 
    message: 'Imagen alojada en GridFS exitosamente', 
    fileId: req.file.id,
    filename: req.file.filename
  });
});

// Endpoint para descargar imagen armada a HTML -> src=
router.get('/:id', imageController.getImage);

module.exports = router;
