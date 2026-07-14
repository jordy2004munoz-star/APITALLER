const pool = require('../db');

async function listar(req, res) {
  try {
    const resultado = await pool.query('SELECT * FROM mecanicos WHERE activo = TRUE ORDER BY id');
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener mecánicos' });
  }
}

async function crear(req, res) {
  const { nombre, especialidad, telefono, usuario_id } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO mecanicos (usuario_id, nombre, especialidad, telefono)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [usuario_id || null, nombre, especialidad, telefono]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al registrar mecánico' });
  }
}

async function actualizar(req, res) {
  const { nombre, especialidad, telefono, activo } = req.body;
  try {
    const resultado = await pool.query(
      `UPDATE mecanicos SET nombre = $1, especialidad = $2, telefono = $3, activo = $4
       WHERE id = $5 RETURNING *`,
      [nombre, especialidad, telefono, activo, req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Mecánico no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar mecánico' });
  }
}

module.exports = { listar, crear, actualizar };
