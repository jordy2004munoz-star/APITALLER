const express = require('express');
const serviciosController = require('../controladores/serviciosController');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verificarToken, serviciosController.listar);

// NUEVO
router.get('/todos', verificarToken, serviciosController.listarTodos);

router.post('/', verificarToken, serviciosController.crear);

router.put('/:id', verificarToken, serviciosController.actualizar);

// NUEVO
router.put('/:id/toggle', verificarToken, serviciosController.toggle);

module.exports = router;