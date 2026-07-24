const pool = require('../db');
const { subirACloudinary } = require('../middleware/uploadMiddleware');

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
    let imagen_url = null;

    // Si viene un archivo enviado desde la app, lo subimos a Cloudinary
    if (req.file) {
      imagen_url = await subirACloudinary(req.file.buffer);
    }

    const resultado = await pool.query(
      `INSERT INTO vehiculos (cliente_id, placa, marca, modelo, anio, color, kilometraje, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        cliente_id, 
        placa, 
        marca, 
        modelo, 
        anio || null, 
        color || null, 
        kilometraje || 0, 
        imagen_url
      ]
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
  const { placa, marca, modelo, anio, color, kilometraje } = req.body;
  try {
    let imagen_url = req.body.imagen_url || null;

    // Si el usuario subió una nueva foto al editar
    if (req.file) {
      imagen_url = await subirACloudinary(req.file.buffer);
    }

    const resultado = await pool.query(
      `UPDATE vehiculos 
       SET placa = COALESCE($1, placa),
           marca = COALESCE($2, marca),
           modelo = COALESCE($3, modelo),
           anio = COALESCE($4, anio),
           color = COALESCE($5, color),
           kilometraje = COALESCE($6, kilometraje),
           imagen_url = COALESCE($7, imagen_url)
       WHERE id = $8 
       RETURNING *`,
      [placa, marca, modelo, anio, color, kilometraje, imagen_url, req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al actualizar vehículo:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un vehículo con esa placa' });
    }
    res.status(500).json({ error: 'Error al actualizar vehículo' });
  }
}

async function eliminar(req, res) {
  const vehiculoId = req.params.id;
  const client = await pool.connect();

  try {
    // Iniciamos transacción
    await client.query('BEGIN');

    // 1. Eliminar los detalles/servicios de las órdenes de este vehículo
    await client.query(`
      DELETE FROM orden_detalles 
      WHERE orden_id IN (SELECT id FROM ordenes_trabajo WHERE vehiculo_id = $1)
    `, [vehiculoId]);

    // 2. Eliminar las órdenes de trabajo del vehículo
    await client.query(
      'DELETE FROM ordenes_trabajo WHERE vehiculo_id = $1',
      [vehiculoId]
    );

    // 3. Eliminar el vehículo
    const resultado = await client.query(
      'DELETE FROM vehiculos WHERE id = $1 RETURNING id',
      [vehiculoId]
    );

    if (resultado.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    // Confirmamos los cambios
    await client.query('COMMIT');
    res.json({ mensaje: 'Vehículo y todo su historial eliminados correctamente' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar vehículo en cascada:', error);
    res.status(500).json({ error: 'Error al eliminar el vehículo' });
  } finally {
    client.release();
  }
}

module.exports = { listar, historial, crear, actualizar, eliminar };