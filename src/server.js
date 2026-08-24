const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const adminRoutes = require('./routes/adminRoutes');

// Importamos el archivo del bot. 
// Al hacer require, el código de index.js se ejecuta y el bot comienza a escuchar.
require('./bot/index');

const app = express();

// --- MIDDLEWARES ---
// cors() es vital para que tu frontend (que estará en otro puerto o dominio) no sea bloqueado
app.use(cors()); 
app.use(express.json());

// --- RUTAS ---
// Todas las rutas del administrador tendrán el prefijo /api/admin
app.use('/api/admin', adminRoutes);

// Ruta de prueba para verificar que el servidor está vivo
app.get('/ping', (req, res) => {
    res.send('Servidor de Bot y API funcionando correctamente.');
});

// --- INICIAR SERVIDOR ---
app.listen(env.server.port, () => {
    console.log(`Servidor Express ejecutándose en http://localhost:${env.server.port}`);
    console.log(`API Admin disponible en http://localhost:${env.server.port}/api/admin/...`);
});