const express = require('express');
const router = express.Router();
const { 
    getUsuarios, 
    getInteracciones, 
    getConocimiento, 
    createConocimiento, 
    updateConocimiento,
    getEstadisticas,
    deleteConocimiento,
    getInteraccionesByUsuario
} = require('../controllers/adminController');

// Rutas 
router.get('/usuarios', getUsuarios);
router.get('/interacciones', getInteracciones);
router.get('/conocimiento', getConocimiento);
router.post('/conocimiento', createConocimiento);
router.put('/conocimiento/:id', updateConocimiento);
router.get('/estadisticas', getEstadisticas);
router.delete('/conocimiento/:id', deleteConocimiento);
router.get('/interacciones/:telegram_id', getInteraccionesByUsuario);

module.exports = router;