const pool = require('../db');

async function listar(req, res) {
  const { cliente_id } = req.query;
  try {
    let resultado;
    if (cliente_id) {
      resultado = await pool.query(
        'SELECT * FROM vehiculos WHERE cliente_id = $1 ORDER BY id',
        [cliente_id]
      );
    } else {
      resultado = await pool.query(`
        SELECT v.*, c.nombre AS nombre_cliente
        FROM vehiculos v
        JOIN clientes c ON v.cliente_id = c.id
        ORDER BY v.id
      `);
    }
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener vehículos' });
  }
}

async function historial(req, res) {
  try {
    const resultado = await pool.query(
      `SELECT o.id AS orden_id, o.fecha_ingreso, o.fecha_entrega_real,
              o.estado, o.total, o.observaciones, m.nombre AS mecanico
       FROM ordenes_trabajo o
       LEFT JOIN mecanicos m ON o.mecanico_id = m.id
       WHERE o.vehiculo_id = $1
       ORDER BY o.fecha_ingreso DESC`,
      [req.params.id]
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
}

async function crear(req, res) {
  const { cliente_id, placa, marca, modelo, anio, color, kilometraje } = req.body;

  if (!cliente_id || !placa || !marca || !modelo) {
    return res.status(400).json({ error: 'cliente_id, placa, marca y modelo son obligatorios' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO vehiculos (cliente_id, placa, marca, modelo, anio, color, kilometraje)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [cliente_id, placa, marca, modelo, anio || null, color || null, kilometraje || 0]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un vehículo con esa placa' });
    }
    res.status(500).json({ error: 'Error al registrar vehículo' });
  }
}

async function actualizar(req, res) {
  const { marca, modelo, anio, color, kilometraje } = req.body;
  try {
    const resultado = await pool.query(
      `UPDATE vehiculos SET marca=$1, modelo=$2, anio=$3, color=$4, kilometraje=$5
       WHERE id=$6 RETURNING *`,
      [marca, modelo, anio, color, kilometraje, req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar vehículo' });
  }
}

async function eliminar(req, res) {
  try {
    const resultado = await pool.query(
      'DELETE FROM vehiculos WHERE id=$1 RETURNING id', [req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
    res.json({ mensaje: 'Vehículo eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar vehículo' });
  }
}

module.exports = { listar, historial, crear, actualizar, eliminar };