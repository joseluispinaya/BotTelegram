const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const env = require('./config/env');
const adminRoutes = require('./routes/adminRoutes');

const logger = require('./logs/logger');

// Importamos el archivo del bot. 
// Al hacer require, el código de index.js se ejecuta y el bot comienza a escuchar.
require('./bot/index');

const app = express();
// 3. Creamos el servidor HTTP envolviendo a Express
const server = http.createServer(app);

// 4. Inicializamos Socket.io sobre nuestro servidor HTTP
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

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

// 2. ENDPOINT REST (Para backend de C# .NET)
// Tu C# llamará a esta ruta cuando el administrador guarde un gol o tarjeta
// --- NUEVO: ENDPOINT PARA RECIBIR AVISOS DE TU C# ---
app.post('/api/notificar-evento', (req, res) => {
    const { idPartido, tipoEvento } = req.body;

    if (!idPartido) {
        return res.status(400).json({ error: 'Falta enviar el idPartido' });
    }

    const sala = `partido_${idPartido}`;
    
    // Emitimos la actualización a los celulares conectados a esta sala
    io.to(sala).emit('actualizacion_partido', {
        idPartido: idPartido,
        tipo: tipoEvento || 'actualizacion',
        timestamp: new Date()
    });

    logger.info(`Aviso de actualización (App C#) enviado a la sala ${sala}`);
    
    res.status(200).json({ 
        success: true, 
        message: `Notificación enviada a espectadores del partido ${idPartido}` 
    });
});

// --- NUEVO: LÓGICA DE WEBSOCKETS (PARA LA APP REACT NATIVE) ---
io.on('connection', (socket) => {
    logger.info(`Nuevo cliente App conectado: ${socket.id}`);

    socket.on('unirse_partido', (idPartido) => {
        const sala = `partido_${idPartido}`;
        socket.join(sala);
        logger.info(`=> Cliente ${socket.id} se unió a: ${sala}`);
    });

    socket.on('salir_partido', (idPartido) => {
        const sala = `partido_${idPartido}`;
        socket.leave(sala);
        logger.info(`<= Cliente ${socket.id} abandonó: ${sala}`);
    });

    socket.on('disconnect', () => {
        logger.info(`Cliente App desconectado: ${socket.id}`);
    });
});

// --- INICIAR SERVIDOR ---
// IMPORTANTE: Ahora usamos server.listen en lugar de app.listen
server.listen(env.server.port, () => {
    logger.info(`Servidor Express y Socket.io ejecutándose en puerto ${env.server.port}`);
});