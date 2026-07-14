const express = require('express');
const mecanicosController = require('../controladores/mecanicosController');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verificarToken, mecanicosController.listar);
router.post('/', verificarToken, mecanicosController.crear);
router.put('/:id', verificarToken, mecanicosController.actualizar);

module.exports = router;
