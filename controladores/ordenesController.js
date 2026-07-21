const pool = require('../db');

async function listar(req, res) {
  const { estado, cliente_id } = req.query;
  try {
    let query = `
      SELECT o.*, v.placa, v.marca, v.modelo, c.nombre AS cliente,
             c.id AS cliente_id, m.nombre AS mecanico
      FROM ordenes_trabajo o
      JOIN vehiculos v ON o.vehiculo_id = v.id
      JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN mecanicos m ON o.mecanico_id = m.id
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    // Filtro por cliente_id (para clientes, no admin)
    if (cliente_id) {
      query += ` AND c.id = $${idx++}`;
      params.push(cliente_id);
    }

    // Filtro por estado
    if (estado) {
      query += ` AND o.estado = $${idx++}`;
      params.push(estado);
    }

    query += ' ORDER BY o.fecha_ingreso DESC';

    const resultado = await pool.query(query, params);
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
}

async function obtenerPorId(req, res) {
  try {
    const orden = await pool.query(
      `SELECT o.*, v.placa, v.marca, v.modelo, c.nombre AS cliente, m.nombre AS mecanico
       FROM ordenes_trabajo o
       JOIN vehiculos v ON o.vehiculo_id = v.id
       JOIN clientes c ON v.cliente_id = c.id
       LEFT JOIN mecanicos m ON o.mecanico_id = m.id
       WHERE o.id = $1`,
      [req.params.id]
    );

    if (orden.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const detalle = await pool.query(
      `SELECT d.id, d.cantidad, d.precio_unitario, d.subtotal, s.nombre AS servicio
       FROM orden_detalle d
       JOIN servicios s ON d.servicio_id = s.id
       WHERE d.orden_id = $1`,
      [req.params.id]
    );

    res.json({ ...orden.rows[0], servicios: detalle.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el detalle de la orden' });
  }
}

async function crear(req, res) {
  const { vehiculo_id, mecanico_id, fecha_salida_estimada, observaciones, servicios } = req.body;

  if (!vehiculo_id || !servicios || servicios.length === 0) {
    return res.status(400).json({ error: 'vehiculo_id y al menos un servicio son obligatorios' });
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    const ordenResultado = await cliente.query(
      `INSERT INTO ordenes_trabajo (vehiculo_id, mecanico_id, fecha_salida_estimada, observaciones)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [vehiculo_id, mecanico_id || null, fecha_salida_estimada || null, observaciones || null]
    );
    const ordenId = ordenResultado.rows[0].id;

    for (const item of servicios) {
      await cliente.query(
        `INSERT INTO orden_detalle (orden_id, servicio_id, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [ordenId, item.servicio_id, item.cantidad || 1, item.precio_unitario]
      );
    }

    await cliente.query('COMMIT');
    const ordenFinal = await pool.query('SELECT * FROM ordenes_trabajo WHERE id = $1', [ordenId]);
    res.status(201).json(ordenFinal.rows[0]);
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Error al crear la orden de trabajo' });
  } finally {
    cliente.release();
  }
}

async function cambiarEstado(req, res) {
  const { estado } = req.body;
  const estadosValidos = ['pendiente', 'en_proceso', 'terminado', 'entregado', 'cancelado'];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Usa uno de: ${estadosValidos.join(', ')}` });
  }

  try {
    const fechaEntrega = estado === 'entregado' ? new Date() : null;
    const resultado = await pool.query(
      `UPDATE ordenes_trabajo
       SET estado = $1, fecha_entrega_real = COALESCE($2, fecha_entrega_real)
       WHERE id = $3 RETURNING *`,
      [estado, fechaEntrega, req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
}

module.exports = { listar, obtenerPorId, crear, cambiarEstado };