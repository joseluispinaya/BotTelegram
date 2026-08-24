const { createClient } = require('@supabase/supabase-js');
const env = require('./env');

// Validar que tengamos las credenciales antes de intentar conectar
if (!env.supabase.url || !env.supabase.key) {
    console.error("Faltan las credenciales de Supabase en el archivo .env");
    process.exit(1);
}

// ESTA ES LA PRUEBA DE FUEGO
//console.log("Ultimos 10 caracteres de la llave en uso:", env.supabase.key.slice(-10));

// Inicializar el cliente
const supabase = createClient(env.supabase.url, env.supabase.key);

module.exports = { supabase };