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
    const nombreUsuario = msg.from.first_name || "Usuario/a";

    // --- ESCENARIO A: El usuario inicia el bot o manda /start ---
    if (msg.text === '/start') {
        try {
            // 1. Consultamos a Supabase si este usuario ya existe y si tiene teléfono
            const { data: usuarioExistente, error } = await supabase
                .from('usuarios')
                .select('telefono')
                .eq('telegram_id', telegramId)
                .maybeSingle(); // Retorna un objeto si existe, o null si no existe

            // 2. Si el usuario ya está registrado Y tiene su teléfono, le damos una bienvenida normal
            if (usuarioExistente && usuarioExistente.telefono) {
                bot.sendMessage(chatId, `¡Hola de nuevo, ${nombreUsuario}! Qué gusto saludarte otra vez. ¿En qué te puedo ayudar hoy? 🤖`, {
                    reply_markup: { remove_keyboard: true } // Por si acaso se quedó pegado un teclado anterior
                });
                return; // Detenemos la ejecución
            }

            // 3. Si NO tiene teléfono (o es un usuario nuevo), le pedimos el contacto
            const opciones = {
                reply_markup: {
                    keyboard: [
                        [{ text: "📱 Compartir mi número de contacto", request_contact: true }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            };
            bot.sendMessage(chatId, `¡Hola, ${nombreUsuario}! Bienvenido al bot de la EMI. Para brindarte una atención personalizada, por favor comparte tu número de celular usando el botón de abajo. 👇`, opciones);
            
        } catch (dbError) {
            console.error("Error al consultar el usuario en el /start:", dbError);
            bot.sendMessage(chatId, "¡Hola! Bienvenido al bot de la EMI. ¿En qué te puedo ayudar?");
        }
        
        return; // Detenemos la ejecución para que la IA no responda a "/start"
    }

    // --- ESCENARIO B: El usuario presionó el botón de compartir contacto ---
    if (msg.contact) {
        const numeroTelefono = msg.contact.phone_number;

        try {
            // Actualizamos o creamos el usuario con su teléfono
            await supabase.from('usuarios').upsert(
                { 
                    telegram_id: telegramId, 
                    nombre_usuario: nombreUsuario,
                    telefono: numeroTelefono 
                }, 
                { onConflict: 'telegram_id' }
            );

            // Respondemos y eliminamos el teclado especial
            bot.sendMessage(chatId, "¡Excelente! Tu número ha sido registrado exitosamente. ¿En qué te puedo ayudar hoy? 🤖", {
                reply_markup: { remove_keyboard: true }
            });
        } catch (dbError) {
            console.error("Error al guardar el teléfono en Supabase:", dbError.message);
            bot.sendMessage(chatId, "Hubo un pequeño error al guardar tu contacto, pero puedes continuar preguntándome lo que necesites.");
        }
        return; // Detenemos la ejecución
    }

    // --- ESCENARIO C: Flujo normal (Chat con IA) ---
    const textoUsuario = msg.text;

    if (!textoUsuario) {
        bot.sendMessage(chatId, "Solo puedo procesar texto o contactos por el momento. 📝");
        return;
    }

    try {
        bot.sendChatAction(chatId, 'typing');
        await sleep(1000);

        const respuestaIA = await generarRespuestaIA(textoUsuario);
        bot.sendMessage(chatId, respuestaIA);

        // Registro silencioso del historial
        try {
            // Mantenemos el upsert por si el usuario habló sin darle al botón de /start
            // Intenta registrar al usuario, pero si ya existe, NO hace nada (ahorra recursos)
            await supabase.from('usuarios').upsert(
                { telegram_id: telegramId, nombre_usuario: nombreUsuario }, 
                { onConflict: 'telegram_id', ignoreDuplicates: true } 
            );

            await supabase.from('interacciones').insert([
                {
                    usuario_id: telegramId,
                    mensaje_usuario: textoUsuario,
                    respuesta_bot: respuestaIA
                }
            ]);
        } catch (dbError) {
            console.error("Error al guardar historial en Supabase:", dbError.message);
        }

    } catch (error) {
        console.error("Error general procesando el mensaje:", error);
        bot.sendMessage(chatId, "Ups, ocurrió un error al procesar tu solicitud. Intenta de nuevo más tarde.");
    }
});