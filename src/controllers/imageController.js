const mongoose = require('mongoose');

/**
 * GET - Obtener la imagen alojada en GridFS
 */
exports.getImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de imagen no es válido' });
    }

    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'uploads'
    });

    const fileId = new mongoose.Types.ObjectId(id);

    // Verificar que existe antes de armar el Stream
    const files = await bucket.find({ _id: fileId }).toArray();
    if (files.length === 0) {
      return res.status(404).json({ error: 'Imagen no encontrada en GridFS' });
    }

    const file = files[0];
    res.set('Content-Type', file.contentType || 'image/jpeg');
    res.set('Content-Length', file.length);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year to offload server

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);

  } catch (error) {
    next(error);
  }
};
