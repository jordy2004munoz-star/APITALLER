const express = require('express');
const ordenesController = require('../controladores/ordenesController');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verificarToken, ordenesController.listar);
router.get('/:id', verificarToken, ordenesController.obtenerPorId);
router.post('/', verificarToken, ordenesController.crear);
router.put('/:id/estado', verificarToken, ordenesController.cambiarEstado);

module.exports = router;
