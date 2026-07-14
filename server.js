const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const vehiculosRoutes = require('./routes/vehiculos');
const mecanicosRoutes = require('./routes/mecanicos');
const serviciosRoutes = require('./routes/servicios');
const ordenesRoutes = require('./routes/ordenes');

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de prueba para verificar que la API está viva
app.get('/', (req, res) => {
  res.json({ mensaje: 'API Taller Mecánico funcionando correctamente 🚗🔧' });
});

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/mecanicos', mecanicosRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/ordenes', ordenesRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
