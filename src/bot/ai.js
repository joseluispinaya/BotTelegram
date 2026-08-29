const { supabase } = require('../config/supabase');
const env = require('../config/env');
const axios = require('axios');

// Variable global en memoria para guardar las categorías
let contextoEMI = "";

// 1. Función para cargar el conocimiento desde Supabase
async function cargarContextoDesdeDB() {
    try {
        const { data, error } = await supabase
            .from('base_conocimiento')
            .select('*');

        if (error) throw error;

        if (data && data.length > 0) {
            // Formateamos los datos como "[CATEGORÍA]: Contenido"
            contextoEMI = data.map(item => `[${item.categoria.toUpperCase()}]: ${item.contenido}`).join('\n\n');
            console.log("Base de conocimiento de la EMI cargada en memoria.");
        }
    } catch (err) {
        console.error("Error al cargar la base de conocimiento:", err.message);
    }
}

// 2. Función para procesar el mensaje con OpenAI
async function generarRespuestaIA(mensajeUsuario) {
    try {
        // Instrucciones estrictas para la IA
        const promptSistema = `Eres un asistente virtual de la Escuela Militar de Ingeniería (EMI) - Unidad Académica Riberalta. 
        Responde de manera amigable, profesional y directa (máximo 40 palabras).
        Utiliza ÚNICAMENTE la siguiente información para responder:
        
        ${contextoEMI}
        
        Si la pregunta del usuario no se puede responder con esta información, indica amablemente que no tienes esos datos.`;

        const messages = [
            { role: 'system', content: promptSistema },
            { role: 'user', content: mensajeUsuario }
        ];

        const { data } = await axios.post("https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: messages,
                temperature: 0.3 // Baja temperatura para mayor precisión
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + env.openai.apiKey
                }
            }
        );

        return data.choices[0].message.content;

    } catch (error) {
        console.error("Error generando respuesta de IA:", error.response ? error.response.data : error.message);
        return "Ups, lo siento, ha ocurrido un error de conexión con mi sistema principal.";
    }
}

async function analizarTendencias() {
    try {
        // 1. Obtener los últimos 20 mensajes de los usuarios
        const { data: interacciones, error: errInt } = await supabase
            .from('interacciones')
            .select('mensaje_usuario')
            .order('fecha_creacion', { ascending: false })
            .limit(10);

        if (errInt) throw errInt;

        if (!interacciones || interacciones.length === 0) return [];

        // 2. Obtener las categorías actuales de la base de conocimiento
        const { data: categorias, error: errCat } = await supabase
            .from('base_conocimiento')
            .select('categoria');

        if (errCat) throw errCat;

        // 3. Preparar los datos para la IA
        const listaMensajes = interacciones.map(i => i.mensaje_usuario).join(' | ');
        const listaCategorias = categorias.map(c => c.categoria).join(', ');

        // PROMPT MEJORADO: Instrucciones más estrictas sobre la agrupación
        const promptSistema = `Eres un analista de datos experto. Tienes una lista de mensajes de usuarios separados por el carácter '|', y una lista de categorías válidas: [${listaCategorias}]. 
        Tu tarea es leer cada mensaje, clasificarlo en la categoría que mejor corresponda y contar cuántos mensajes pertenecen a cada categoría. 
        Si un mensaje no encaja en ninguna, clasifícalo estrictamente como "OTROS".
        
        REGLA VITAL: Agrupa los resultados. Ninguna categoría debe repetirse en tu respuesta. Suma las cantidades de las categorías iguales. La categoría "OTROS" (y cualquier otra) debe aparecer una sola vez con la cantidad total acumulada.
        
        Responde ÚNICAMENTE con un arreglo en formato JSON válido con esta estructura exacta: 
        [{"categoria": "NOMBRE", "cantidad": numero}]
        No agregues saludos, explicaciones, ni texto en formato Markdown. Solo el JSON puro.`;

        // 4. Consultar a OpenAI
        const { data } = await axios.post("https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [
                    { role: 'system', content: promptSistema },
                    { role: 'user', content: `Mensajes a analizar: ${listaMensajes}` }
                ],
                temperature: 0.1 
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + env.openai.apiKey
                }
            }
        );

        // 5. Transformamos el string de respuesta en un objeto JavaScript
        const resultadoBrutoJSON = JSON.parse(data.choices[0].message.content);

        // 6. POST-PROCESAMIENTO (El blindaje final)
        // Por si la IA se equivoca y manda duplicados, JavaScript los suma a la fuerza.
        const resultadoAgrupado = resultadoBrutoJSON.reduce((acumulador, itemActual) => {
            // Buscamos si la categoría ya existe en nuestro nuevo arreglo
            const categoriaExistente = acumulador.find(i => i.categoria === itemActual.categoria);
            
            if (categoriaExistente) {
                // Si existe, solo le sumamos la cantidad
                categoriaExistente.cantidad += itemActual.cantidad;
            } else {
                // Si no existe, la agregamos al arreglo
                acumulador.push({ categoria: itemActual.categoria, cantidad: itemActual.cantidad });
            }
            return acumulador;
        }, []); // [] es el valor inicial del acumulador

        return resultadoAgrupado;

    } catch (error) {
        console.error("Error en analizarTendencias:", error.response ? error.response.data : error.message);
        return []; 
    }
}

module.exports = {
    cargarContextoDesdeDB,
    generarRespuestaIA,
    analizarTendencias
};