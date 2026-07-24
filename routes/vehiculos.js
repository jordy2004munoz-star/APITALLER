const express = require('express');
const vehiculosController = require('../controladores/vehiculosController');
const { verificarToken } = require('../middleware/auth');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

//  Listar y consultar historial
router.get('/', verificarToken, vehiculosController.listar);
router.get('/:id/historial', verificarToken, vehiculosController.historial);

//  Crear vehículo (Verifica token + procesa la imagen)
router.post('/', verificarToken, upload.single('imagen'), vehiculosController.crear);

//  Actualizar vehículo (Verifica token + procesa imagen opcional)
router.put('/:id', verificarToken, upload.single('imagen'), vehiculosController.actualizar);

//  Eliminar vehículo
router.delete('/:id', verificarToken, vehiculosController.eliminar);

module.exports = router;