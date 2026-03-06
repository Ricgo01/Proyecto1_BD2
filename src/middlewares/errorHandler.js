/**
 * erroHandler
 * Este middleware global de errores
 * Capturar cualquier error que llegue a este punto y enviar una respuesta JSON con el mensaje de error
 * next(err) o errores no manejados
 */

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;

    // error de validación de Mongoose
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: {
                message: 'Error de validación',
                code: 'VALIDATION_ERROR',
                details: Object.values(err.errors).map(e => e.message)
            }
        });
    }

    // error de ObjectId inválido
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(400).json({
            error: {
                message: 'ID inválido',
                code: 'INVALID_ID',
                details: `El ID '${err.value}' no es un ObjectId válido`
            }
        });
    }

    // email duplicado ya que es unico 
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            error: {
                message: `El valor para '${field}' ya existe`,
                code: 'DUPLICATE_KEY',
                details: `El valor '${err.keyValue[field]}' para el campo '${field}' ya está en uso`
            }
        });
    }

    res.status(statusCode).json({
        error: {
        message: err.message || 'Error interno del servidor',
        code: err.code || 'INTERNAL_ERROR'
        }
    });
};

module.exports = errorHandler;