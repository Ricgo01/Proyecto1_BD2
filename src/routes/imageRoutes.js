const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Readable } = require('stream');
const imageController = require('../controllers/imageController');
const upload = require('../middlewares/upload');

// Endpoint para subir imagen — stream manual a GridFSBucket 
router.post('/upload', upload.single('image'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: 'No se envió ninguna imagen' });

  try {
    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    const filename = `${Date.now()}-${req.file.originalname}`;

    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: req.file.mimetype
    });

    readableStream.pipe(uploadStream);

    uploadStream.on('finish', () => {
      res.status(201).json({
        message: 'Imagen alojada en GridFS exitosamente',
        fileId: uploadStream.id,
        filename
      });
    });

    uploadStream.on('error', next);
  } catch (err) {
    next(err);
  }
});

// Endpoint para descargar imagen armada a HTML -> src=
router.get('/:id', imageController.getImage);

module.exports = router;
