require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Función para pausar la ejecución los milisegundos que le indiquemos
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 1. Configurar los tokens
const token = process.env.TELEGRAM_TOKEN;

// 2. Iniciar el bot de Telegram
const bot = new TelegramBot(token, { polling: true });

console.log('Bot de Telegram inicializado y escuchando mensajes...');

// 3. Escuchar cuando el bot recibe un mensaje
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const textoUsuario = msg.text;

    // VALIDACIÓN: Si el mensaje no tiene texto (imagen, sticker, audio)
    if (!textoUsuario) {
        bot.sendMessage(chatId, "Solo puedo responder mensajes de texto. No puedo procesar audios, imágenes o stickers por el momento.");
        return; // Detenemos la ejecución aquí
    }

    try {
        // ACCIÓN: Ahora sí, mostramos "escribiendo..." porque vamos a procesar texto
        bot.sendChatAction(chatId, 'typing');

        // 2. Forzamos una pequeña pausa visual de 1.5 segundos (1500 ms)
        await sleep(1500);

        // 4. Enviar a la función separada de IA
        const respuestaIA = await generarRespuestaIA(textoUsuario);

        // 5. Enviar la respuesta al usuario
        bot.sendMessage(chatId, respuestaIA);

    } catch (error) {
        console.error("Error al procesar el mensaje:", error);
        bot.sendMessage(chatId, "Ups, ocurrió un error al intentar conectarme con mi cerebro de IA. 🧠🔌");
    }
});

// --- FUNCIÓN SEPARADA PARA LA LÓGICA DE OPENAI ---
async function generarRespuestaIA(mensaje) {
    try {
        const promptSistema = `Eres el Asistente Virtual oficial de Fricab Xpress. 
        Tu trabajo es atender a los clientes de forma amable, natural y como un excelente vendedor.
        
        REGLAS ESTRICTAS:
        1. Utiliza ÚNICAMENTE la información de referencia proporcionada. Si te preguntan algo fuera de esta información, indica amablemente que no tienes ese dato o que consulten al número de contacto.
        2. EVITA EL VACIADO DE DATOS: Si hacen una pregunta general ('¿Qué venden?', 'Muéstrame tu catálogo', 'Hola'), NUNCA listes todos los productos. Menciona brevemente nuestras categorías principales, da un par de ejemplos atractivos y pregúntale qué está buscando.
        3. Utiliza emojis de manera moderada para dar un tono amigable.
        4. Mantén tus respuestas concisas y directas. No escribas párrafos largos.
        
        INFORMACIÓN DE REFERENCIA:
        ${infoEmpresaDetallada}`;

        const messages = [
            { role: 'system', content: promptSistema },
            { role: 'user', content: mensaje }
        ];

        const tokenOPENAI = process.env.OPENAI_API_KEY;
        const { data } = await axios.post("https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: messages,
                temperature: 0.4
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + tokenOPENAI
                }
            }
        );

        return data.choices[0].message.content;

    } catch (error) {
        console.error("Error generando la respuesta de IA:", error.response ? error.response.data : error.message);
        return "Ups, lo siento, ha ocurrido un error al generar la respuesta.";
    }
}

// --- INFORMACIÓN DE REFERENCIA (BASE DE CONOCIMIENTO) ---
const infoEmpresaDetallada = `
INFORMACIÓN GENERAL:
- Nombre: Fricab Xpress
- Ubicación: Barrio la Chonta, Av. José Vallivian Nro. 715, Riberalta - Beni
- Teléfono/WhatsApp: 67270442
- Correo: fricabsrl@gmail.com
- Sobre Nosotros: Somos una Empresa en Riberalta para abastecer la canasta familiar. Venta al por menor y mayor de fiambres, carnes frías, lácteos y productos de primera necesidad. Distribuidores mayoristas de cajas de pollo de industria brasilera. Ofrecemos frescura, calidad, precios accesibles y servicio de delivery hasta la puerta de casa o negocio.

PRODUCTOS DISPONIBLES (Por categorías):
* ABARROTES: Arroz Premium 5 Kg, Fideo Espagueti 700 G, Aceite Vegetal 900 Ml, Sal Yodada 1 Kg, Lenteja 500 G, Frijol Negro 1 Kg, Arroz Integral 1 Kg, Quinua Real 500 G, Maicena 200 G.
* BEBIDAS: Agua Mineral 2 L, Gaseosa Cola 2 L, Jugo de Naranja 1 L, Néctar de Durazno 1 L, Té Helado Limón 500 Ml.
* LIMPIEZA: Lejía 2 L, Bolsas de Basura Grandes, Ambientador Aerosol, Limpiador de Baño 750 Ml.
* FIAMBRES: Paté de hígado de pollo SOFIA 200g y 100g, Salchicha AURORA, Salchicha para pelar SOFIA, Salchicha NOBRE.
* LÁCTEOS: Queso Muzarella REAL.
* CARNES FRÍAS: Filete de pollo AURORA, Filete de paiche.
* POR MAYOR: Salchicha aurora paquetes de 24 kg, Chorizo parrillero paquetes de 25 kg, Caja de pollo 15 kg, Caja de pollo 20 kg.
`;