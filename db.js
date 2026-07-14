const { Pool } = require('pg');
require('dotenv').config();

// Neon requiere SSL. rejectUnauthorized: false evita problemas
// con el certificado autofirmado en entornos de desarrollo.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('✅ Conectado a la base de datos (Neon/PostgreSQL)');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
});

module.exports = pool;
