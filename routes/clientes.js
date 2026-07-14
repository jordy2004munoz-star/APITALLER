const express = require('express');
const clientesController = require('../controladores/clientesController');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verificarToken, clientesController.listar);
router.get('/:id', verificarToken, clientesController.obtenerPorId);
router.post('/', verificarToken, clientesController.crear);
router.put('/:id', verificarToken, clientesController.actualizar);
router.delete('/:id', verificarToken, clientesController.eliminar);

module.exports = router;
