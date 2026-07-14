const express = require('express');
const vehiculosController = require('../controladores/vehiculosController');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verificarToken, vehiculosController.listar);
router.get('/:id/historial', verificarToken, vehiculosController.historial);
router.post('/', verificarToken, vehiculosController.crear);
router.put('/:id', verificarToken, vehiculosController.actualizar);
router.delete('/:id', verificarToken, vehiculosController.eliminar);

module.exports = router;
