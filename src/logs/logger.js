const pino = require('pino');

// Configuración minimalista y pura
const logger = pino({
    // En producción muestra desde 'info', en local muestra todo ('debug')
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});

module.exports = logger;