const TelegramBot = require('node-telegram-bot-api');
const env = require('../config/env');
const { supabase } = require('../config/supabase');
const { generarRespuestaIA, cargarContextoDesdeDB } = require('./ai');

// Función para pausar la ejecución (efecto visual)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 1. Iniciar el bot de Telegram
const bot = new TelegramBot(env.telegram.token, { polling: true });

// 2. Cargar el conocimiento de la base de datos al arrancar
cargarContextoDesdeDB().then(() => {
    console.log('Bot de Telegram inicializado y escuchando mensajes...');
});

// 3. Escuchar cuando el bot recibe un mensaje
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const textoUsuario = msg.text;
    const nombreUsuario = msg.from.first_name || "Usuario/a";

    // Validar que sea un mensaje de texto
    if (!textoUsuario) {
        bot.sendMessage(chatId, "Solo puedo responder mensajes de texto por el momento. 📝");
        return;
    }

    try {
        // Mostrar "escribiendo..." en Telegram
        bot.sendChatAction(chatId, 'typing');
        
        // Pequeña pausa visual para que se sienta más natural
        await sleep(1000);

        // 4. Generar la respuesta usando la IA
        const respuestaIA = await generarRespuestaIA(textoUsuario);

        // 5. Enviar la respuesta al usuario
        bot.sendMessage(chatId, respuestaIA);

        // --- 6. REGISTRO EN BASE DE DATOS (SUPABASE) ---
        // Lo ejecutamos en bloque try-catch interno para que, si falla la DB, 
        // el usuario igual reciba su mensaje sin notar el error.
        try {
            // A. Upsert del usuario: Lo crea si no existe, lo actualiza si ya existe
            await supabase.from('usuarios').upsert(
                { 
                    telegram_id: telegramId, 
                    nombre_usuario: nombreUsuario 
                }, 
                { onConflict: 'telegram_id' }
            );

            // B. Insertar la interacción (Historial)
            await supabase.from('interacciones').insert([
                {
                    usuario_id: telegramId,
                    mensaje_usuario: textoUsuario,
                    respuesta_bot: respuestaIA
                }
            ]);
            
        } catch (dbError) {
            console.error("Error al guardar en Supabase:", dbError.message);
        }

    } catch (error) {
        console.error("Error general procesando el mensaje:", error);
        bot.sendMessage(chatId, "Ups, ocurrió un error al procesar tu solicitud. Intenta de nuevo más tarde.");
    }
});