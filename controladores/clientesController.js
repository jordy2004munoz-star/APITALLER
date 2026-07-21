const pool = require('../db');

async function listar(req, res) {
  try {
    const resultado = await pool.query(`
      SELECT c.*, u.email as usuario_email, u.rol
      FROM clientes c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      ORDER BY c.id
    `);
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
}

async function obtenerPorId(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT c.*, u.email as usuario_email
       FROM clientes c
       LEFT JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
}

async function crear(req, res) {
  const { nombre, cedula, telefono, email, direccion, usuario_id } = req.body;
  if (!nombre || !cedula) {
    return res.status(400).json({ error: 'Nombre y cédula son obligatorios' });
  }
  try {
    const resultado = await pool.query(
      `INSERT INTO clientes (usuario_id, nombre, cedula, telefono, email, direccion)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [usuario_id || null, nombre, cedula, telefono, email, direccion]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un cliente con esa cédula' });
    }
    res.status(500).json({ error: 'Error al crear cliente' });
  }
}

async function actualizar(req, res) {
  const { nombre, cedula, telefono, email, direccion } = req.body;
  try {
    const resultado = await pool.query(
      `UPDATE clientes
       SET nombre = COALESCE($1, nombre),
           cedula = COALESCE($2, cedula),
           telefono = $3,
           email = COALESCE($4, email),
           direccion = $5
       WHERE id = $6 RETURNING *`,
      [nombre, cedula, telefono, email, direccion, req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Si tiene usuario asociado, actualizar también el nombre en usuarios
    if (nombre && resultado.rows[0].usuario_id) {
      await pool.query(
        'UPDATE usuarios SET nombre = $1 WHERE id = $2',
        [nombre, resultado.rows[0].usuario_id]
      );
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
}

async function eliminar(req, res) {
  const conn = await pool.connect();
  try {
    await conn.query('BEGIN');

    // Obtener usuario_id antes de eliminar
    const clienteResult = await conn.query(
      'SELECT usuario_id FROM clientes WHERE id = $1', [req.params.id]
    );

    if (clienteResult.rows.length === 0) {
      await conn.query('ROLLBACK');
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const usuarioId = clienteResult.rows[0].usuario_id;

    // Eliminar cliente
    await conn.query('DELETE FROM clientes WHERE id = $1', [req.params.id]);

    // Eliminar usuario asociado si existe
    if (usuarioId) {
      await conn.query('DELETE FROM usuarios WHERE id = $1', [usuarioId]);
    }

    await conn.query('COMMIT');
    res.json({ mensaje: 'Cliente eliminado correctamente' });
  } catch (error) {
    await conn.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  } finally {
    conn.release();
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };