const pool = require('../db');

async function listar(req, res) {
  try {
    const resultado = await pool.query('SELECT * FROM clientes ORDER BY id');
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
}

async function obtenerPorId(req, res) {
  try {
    const resultado = await pool.query('SELECT * FROM clientes WHERE id = $1', [req.params.id]);
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
  const { nombre, telefono, email, direccion } = req.body;
  try {
    const resultado = await pool.query(
      `UPDATE clientes SET nombre = $1, telefono = $2, email = $3, direccion = $4
       WHERE id = $5 RETURNING *`,
      [nombre, telefono, email, direccion, req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
}

async function eliminar(req, res) {
  try {
    const resultado = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING id', [req.params.id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ mensaje: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };
