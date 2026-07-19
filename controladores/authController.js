const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

// POST /api/auth/registro
async function registro(req, res) {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    // Verificar si el email ya existe
    const yaExiste = await cliente.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (yaExiste.rows.length > 0) {
      await cliente.query('ROLLBACK');
      return res.status(409).json({ error: 'Ese email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // 1. Insertar en tabla usuarios
    const usuarioResult = await cliente.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol`,
      [nombre, email, passwordHash, rol]
    );
    const usuario = usuarioResult.rows[0];

    // 2. Si es cliente, también insertar en tabla clientes
    let clienteId = null;
    if (rol === 'cliente') {
      // Generamos una cédula temporal única basada en el timestamp
      const cedulaTemporal = `TEMP${Date.now()}`;
      const clienteResult = await cliente.query(
        `INSERT INTO clientes (usuario_id, nombre, cedula, email)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [usuario.id, nombre, cedulaTemporal, email]
      );
      clienteId = clienteResult.rows[0].id;
    }

    await cliente.query('COMMIT');

    res.status(201).json({ ...usuario, cliente_id: clienteId });
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  } finally {
    cliente.release();
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const resultado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const usuario = resultado.rows[0];

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Si es cliente, buscamos su cliente_id para filtrar vehículos y órdenes
    let clienteId = null;
    if (usuario.rol === 'cliente') {
      const clienteResult = await pool.query(
        'SELECT id FROM clientes WHERE usuario_id = $1', [usuario.id]
      );
      if (clienteResult.rows.length > 0) {
        clienteId = clienteResult.rows[0].id;
      }
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, cliente_id: clienteId },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        cliente_id: clienteId
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

module.exports = { registro, login };