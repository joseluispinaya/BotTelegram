const { supabase } = require('../config/supabase');
// Necesitamos importar la instancia de tu bot. Asegúrate de exportarla en tu archivo bot/index.js
const bot = require('../bot/index'); 

// Pausa para evitar bloqueos de Telegram (Anti-Spam)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const notificacionesController = {};

// 1. Obtener archivos guardados
notificacionesController.getArchivos = async (req, res) => {
    try {
        const { data, error } = await supabase.from('archivos_media').select('*').order('fecha_creacion', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener archivos' });
    }
};

// 2. Guardar un nuevo archivo (Cloudinary URL)
notificacionesController.guardarArchivo = async (req, res) => {
    const { tipo, media_url } = req.body;
    try {
        const { data, error } = await supabase.from('archivos_media').insert([{ tipo, media_url }]).select();
        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al guardar el archivo' });
    }
};

// 3. Eliminar archivo
notificacionesController.eliminarArchivo = async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase.from('archivos_media').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Archivo eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
};

// 4. ENVÍO MASIVO (Broadcast)
notificacionesController.enviarMasivo = async (req, res) => {
    const { tipo, url, texto } = req.body; // El texto es opcional (para links o descripciones)
    
    try {
        // 1. Obtener todos los IDs de los usuarios
        const { data: usuarios, error } = await supabase.from('usuarios').select('telegram_id');
        if (error) throw error;

        let enviados = 0;
        let fallidos = 0;

        // 2. Recorrer usuarios y enviar
        for (const usuario of usuarios) {
            try {
                if (tipo === 'imagen') {
                    await bot.sendPhoto(usuario.telegram_id, url, { caption: texto || '' });
                } else if (tipo === 'pdf') {
                    await bot.sendDocument(usuario.telegram_id, url, { caption: texto || '' });
                } else if (tipo === 'enlace' || tipo === 'texto') {
                    await bot.sendMessage(usuario.telegram_id, texto || url);
                }
                
                enviados++;
                await sleep(50); // Pausa de 50ms para respetar el límite de Telegram
            } catch (err) {
                console.error(`Error enviando a ${usuario.telegram_id}:`, err.message);
                fallidos++;
            }
        }

        res.json({ message: 'Envío completado', enviados, fallidos });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el envío masivo' });
    }
};

module.exports = notificacionesController;