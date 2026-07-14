const express = require('express');
const serviciosController = require('../controladores/serviciosController');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verificarToken, serviciosController.listar);
router.post('/', verificarToken, serviciosController.crear);
router.put('/:id', verificarToken, serviciosController.actualizar);

module.exports = router;
