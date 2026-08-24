const { supabase } = require('../config/supabase');
// Importamos la función para refrescar la memoria del bot
const { cargarContextoDesdeDB, analizarTendencias } = require('../bot/ai');

// Obtener la lista de todos los usuarios únicos
const getUsuarios = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('fecha_registro', { ascending: false });

        if (error) throw error;
        
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener el historial completo de interacciones (con datos del usuario)
const getInteracciones = async (req, res) => {
    try {
        // En Supabase, si tienes llaves foráneas configuradas, 
        // puedes traer los datos de la tabla relacionada poniendo el nombre de la tabla entre paréntesis.
        // Es el equivalente a un INNER JOIN en SQL.
        const { data, error } = await supabase
            .from('interacciones')
            .select(`
                id,
                mensaje_usuario,
                respuesta_bot,
                fecha_creacion,
                usuarios ( telegram_id, nombre_usuario )
            `)
            .order('fecha_creacion', { ascending: false });

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener interacciones:", error);
        res.status(500).json({ error: error.message });
    }
};

// Obtener el historial de un usuario específico por su telegram_id
const getInteraccionesByUsuario = async (req, res) => {
    try {
        const { telegram_id } = req.params;
        
        const { data, error } = await supabase
            .from('interacciones')
            .select('id, mensaje_usuario, respuesta_bot, fecha_creacion')
            .eq('usuario_id', telegram_id)
            .order('fecha_creacion', { ascending: true }); // Orden ascendente para simular un chat

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener historial del usuario:", error);
        res.status(500).json({ error: error.message });
    }
};

// 3. Obtener toda la base de conocimiento
const getConocimiento = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('base_conocimiento')
            .select('*')
            .order('id', { ascending: true }); // Ordenamos por ID para que siempre salgan en el mismo orden

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error("Error al obtener conocimiento:", error);
        res.status(500).json({ error: error.message });
    }
};

// 4. Crear un nuevo punto de información (INSERT)
const createConocimiento = async (req, res) => {
    try {
        const { categoria, contenido } = req.body; // Recibimos los datos del frontend
        
        const { data, error } = await supabase
            .from('base_conocimiento')
            .insert([{ categoria, contenido }])
            .select(); // .select() hace que Supabase nos devuelva la fila recién insertada

        if (error) throw error;
        // REFRESCAMOS LA MEMORIA DEL BOT EN TIEMPO REAL
        await cargarContextoDesdeDB();
        res.status(201).json(data[0]);
    } catch (error) {
        console.error("Error al crear conocimiento:", error);
        res.status(500).json({ error: error.message });
    }
};

// 5. Editar un punto de información existente (UPDATE)
const updateConocimiento = async (req, res) => {
    try {
        const { id } = req.params; // Obtenemos el ID de la URL (ej. /conocimiento/5)
        const { categoria, contenido } = req.body;
        
        const { data, error } = await supabase
            .from('base_conocimiento')
            .update({ 
                categoria, 
                contenido,
                fecha_actualizacion: new Date() // Actualizamos el timestamp
            })
            .eq('id', id) // Equivalente al WHERE id = ...
            .select();

        if (error) throw error;
        await cargarContextoDesdeDB();
        res.status(200).json(data[0]);
    } catch (error) {
        console.error("Error al actualizar conocimiento:", error);
        res.status(500).json({ error: error.message });
    }
};

// 6. Eliminar un punto de información (DELETE)
const deleteConocimiento = async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('base_conocimiento')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;

        // REFRESCAMOS LA MEMORIA DEL BOT PARA QUE OLVIDE ESTE DATO
        await cargarContextoDesdeDB();

        res.status(200).json(data[0]);
    } catch (error) {
        console.error("Error al eliminar conocimiento:", error);
        res.status(500).json({ error: error.message });
    }
};

// 6. Obtener estadísticas para el Dashboard usando IA
const getEstadisticas = async (req, res) => {
    try {
        const tendencias = await analizarTendencias();
        res.status(200).json(tendencias);
    } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getUsuarios,
    getInteracciones,
    getInteraccionesByUsuario,
    getConocimiento,
    createConocimiento,
    updateConocimiento,
    deleteConocimiento,
    getEstadisticas
};