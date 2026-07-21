const pool = require('../db');

async function listar(req, res) {
  try {
    const resultado = await pool.query(
      'SELECT * FROM servicios WHERE activo = TRUE ORDER BY id'
    );

    console.log(resultado.rows);

    res.json(resultado.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
}

// Mostrar todos (activos e inactivos)
async function listarTodos(req, res) {
  try {
    const resultado = await pool.query(
      'SELECT * FROM servicios ORDER BY id'
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
}

async function crear(req, res) {
  const { nombre, descripcion, precio_base, tipo } = req.body;

  if (!nombre || precio_base === undefined) {
    return res.status(400).json({
      error: 'nombre y precio_base son obligatorios'
    });
  }

  try {
    const resultado = await pool.query(
    `INSERT INTO servicios
    (nombre, descripcion, precio_base, tipo)
    VALUES ($1,$2,$3,$4)
    RETURNING *`,
    [nombre, descripcion, precio_base, tipo]
    );

    res.status(201).json(resultado.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
}

async function actualizar(req, res) {

  const { nombre, descripcion, precio_base, tipo } = req.body;

  try {

    const resultado = await pool.query(
    `UPDATE servicios
    SET nombre=$1,
    descripcion=$2,
    precio_base=$3,
    tipo=$4
    WHERE id=$5
    RETURNING *`,
    [
    nombre,
    descripcion,
    precio_base,
    tipo,
    req.params.id
    ]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        error: 'Servicio no encontrado'
      });
    }

    res.json(resultado.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Error al actualizar servicio'
    });

  }

}

// NUEVO
async function toggle(req, res) {

  const { activo } = req.body;

  try {

    const resultado = await pool.query(

      `UPDATE servicios
       SET activo = $1
       WHERE id = $2
       RETURNING *`,

      [activo, req.params.id]

    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        error: 'Servicio no encontrado'
      });
    }

    res.json(resultado.rows[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Error al cambiar estado'
    });

  }

}

module.exports = {
  listar,
  listarTodos,
  crear,
  actualizar,
  toggle
};