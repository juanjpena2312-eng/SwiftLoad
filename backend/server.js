require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const pool = require('./db');

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors({
  origin: [
    'http://localhost:8100',
    'http://127.0.0.1:8100',
    'http://localhost:4200'
  ]
}));

app.use(express.json());

// Fotos públicas: http://localhost:3000/img/pizza.jpg
app.use('/img', express.static(path.join(__dirname, 'public', 'img')));

app.get('/api', (_req, res) => {
  res.json({ ok: true, message: 'SwiftLoad API activa' });
});

// ===============================
// REGISTRO DE USUARIOS
// ===============================
app.post('/api/registro', async (req, res) => {
  const { nombre, correo, contrasena } = req.body;

  if (
    typeof nombre !== 'string' ||
    typeof correo !== 'string' ||
    typeof contrasena !== 'string' ||
    !nombre.trim() ||
    !correo.trim() ||
    !contrasena ||
    contrasena.length < 8
  ) {
    return res.status(400).json({
      mensaje: 'Completa todos los campos. La contraseña debe tener al menos 8 caracteres.'
    });
  }

  const correoNormalizado = correo.trim().toLowerCase();

  if (
    correoNormalizado.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado)
  ) {
    return res.status(400).json({ mensaje: 'Ingresa un correo electrónico válido.' });
  }

  if (nombre.trim().length > 100) {
    return res.status(400).json({ mensaje: 'El nombre no debe superar los 100 caracteres.' });
  }

  try {
    const [usuarios] = await pool.execute(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correoNormalizado]
    );

    if (usuarios.length > 0) {
      return res.status(409).json({ mensaje: 'Este correo ya está registrado.' });
    }

    const hash = await bcrypt.hash(contrasena, 12);

    const [resultado] = await pool.execute(
      'INSERT INTO usuarios (nombre, correo, contrasena) VALUES (?, ?, ?)',
      [nombre.trim(), correoNormalizado, hash]
    );

    return res.status(201).json({
      ok: true,
      mensaje: 'Usuario registrado correctamente.',
      usuario: {
        id: resultado.insertId,
        nombre: nombre.trim(),
        correo: correoNormalizado
      }
    });
  } catch (err) {
    console.error('Error en registro:', err);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'Este correo ya está registrado.' });
    }

    return res.status(500).json({ mensaje: 'No se pudo registrar el usuario.' });
  }
});

// ===============================
// INICIO DE SESIÓN
// ===============================
app.post('/api/login', async (req, res) => {
  const { correo, contrasena } = req.body;

  if (
    typeof correo !== 'string' ||
    typeof contrasena !== 'string' ||
    !correo.trim() ||
    !contrasena
  ) {
    return res.status(400).json({ mensaje: 'Ingresa tu correo y contraseña.' });
  }

  try {
    const correoNormalizado = correo.trim().toLowerCase();

    const [usuarios] = await pool.execute(
      'SELECT id, nombre, correo, contrasena FROM usuarios WHERE correo = ?',
      [correoNormalizado]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
    }

    const usuario = usuarios[0];
    const coincide = await bcrypt.compare(contrasena, usuario.contrasena);

    if (!coincide) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
    }

    return res.json({
      ok: true,
      mensaje: 'Inicio de sesión correcto.',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo
      }
    });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ mensaje: 'No se pudo iniciar sesión.' });
  }
});

// ===============================
// CATEGORÍAS
// ===============================
app.get('/api/categorias', async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, descripcion, icono, color FROM categorias ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'No se pudieron consultar las categorías.' });
  }
});

app.get('/api/categorias/:id/productos', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ mensaje: 'ID inválido.' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, precio, stock, imagen FROM productos WHERE categoria_id = ? ORDER BY nombre',
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'No se pudieron consultar los productos.' });
  }
});

// ===============================
// SUBCATEGORÍAS
// ===============================
app.get('/api/categorias/:id/subcategorias', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ mensaje: 'ID inválido.' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, categoria_id, nombre, icono, color FROM subcategorias WHERE categoria_id = ? ORDER BY id',
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'No se pudieron consultar las subcategorías.' });
  }
});

app.get('/api/subcategorias/:id/productos', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ mensaje: 'ID inválido.' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, precio, stock, imagen FROM productos WHERE subcategoria_id = ? ORDER BY nombre',
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'No se pudieron consultar los productos.' });
  }
});

// ===============================
// RESTAURANTES Y RESEÑAS
// ===============================
app.get('/api/subcategorias/:id/restaurantes', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ mensaje: 'ID inválido.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT r.id, r.nombre, r.imagen, r.tiempo_min, r.costo_envio,
              ROUND(COALESCE(AVG(rs.calificacion), 0), 1) AS calificacion,
              COUNT(rs.id) AS total_resenas
       FROM restaurantes r
       LEFT JOIN resenas rs ON rs.restaurante_id = r.id
       WHERE r.subcategoria_id = ?
       GROUP BY r.id, r.nombre, r.imagen, r.tiempo_min, r.costo_envio
       ORDER BY calificacion DESC, r.nombre`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'No se pudieron consultar los restaurantes.' });
  }
});

app.get('/api/restaurantes/:id/productos', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ mensaje: 'ID inválido.' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, precio, stock, imagen FROM productos WHERE restaurante_id = ? ORDER BY nombre',
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'No se pudo consultar el menú.' });
  }
});

app.get('/api/restaurantes/:id/resenas', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ mensaje: 'ID inválido.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT rs.id, rs.calificacion, rs.comentario, rs.creado_en, u.nombre AS usuario
       FROM resenas rs
       JOIN usuarios u ON u.id = rs.usuario_id
       WHERE rs.restaurante_id = ?
       ORDER BY rs.creado_en DESC, rs.id DESC
       LIMIT 20`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'No se pudieron consultar las reseñas.' });
  }
});

app.post('/api/restaurantes/:id/resenas', async (req, res) => {
  const id = Number(req.params.id);
  const { usuario_id, calificacion, comentario } = req.body;

  if (
    !Number.isInteger(id) || id < 1 ||
    !Number.isInteger(Number(usuario_id)) ||
    !Number.isInteger(Number(calificacion)) ||
    Number(calificacion) < 1 || Number(calificacion) > 5
  ) {
    return res.status(400).json({ mensaje: 'La calificación debe ser de 1 a 5.' });
  }

  try {
    await pool.execute(
      'INSERT INTO resenas (restaurante_id, usuario_id, calificacion, comentario) VALUES (?, ?, ?, ?)',
      [id, Number(usuario_id), Number(calificacion), (comentario || '').toString().slice(0, 300)]
    );
    res.status(201).json({ ok: true, mensaje: 'Reseña guardada.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'No se pudo guardar la reseña.' });
  }
});

// ===============================
// PRODUCTOS (CRUD)
// ===============================
app.get('/api/productos', async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, precio, stock FROM productos ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      mensaje: 'No se pudieron consultar los productos. Verifica la tabla productos.'
    });
  }
});

app.post('/api/productos', async (req, res) => {
  const { nombre, precio, stock } = req.body;

  if (
    typeof nombre !== 'string' ||
    !nombre.trim() ||
    !Number.isFinite(Number(precio)) ||
    Number(precio) < 0 ||
    !Number.isInteger(Number(stock)) ||
    Number(stock) < 0
  ) {
    return res.status(400).json({ mensaje: 'Nombre, precio o existencias inválidos.' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)',
      [nombre.trim(), Number(precio), Number(stock)]
    );

    res.status(201).json({
      id: result.insertId,
      nombre: nombre.trim(),
      precio: Number(precio),
      stock: Number(stock)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'No se pudo crear el producto.' });
  }
});

app.put('/api/productos/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, precio, stock } = req.body;

  if (
    !Number.isInteger(id) ||
    id < 1 ||
    typeof nombre !== 'string' ||
    !nombre.trim() ||
    !Number.isFinite(Number(precio)) ||
    Number(precio) < 0 ||
    !Number.isInteger(Number(stock)) ||
    Number(stock) < 0
  ) {
    return res.status(400).json({ mensaje: 'Datos inválidos.' });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE productos SET nombre = ?, precio = ?, stock = ? WHERE id = ?',
      [nombre.trim(), Number(precio), Number(stock), id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }

    res.json({ mensaje: 'Producto actualizado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'No se pudo actualizar el producto.' });
  }
});

app.delete('/api/productos/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ mensaje: 'ID inválido.' });
  }

  try {
    const [result] = await pool.execute('DELETE FROM productos WHERE id = ?', [id]);

    if (!result.affectedRows) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }

    res.json({ mensaje: 'Producto eliminado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'No se pudo eliminar el producto.' });
  }
});

// ===============================
// INICIAR SERVIDOR
// ===============================
async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Conexión MySQL correcta.');

    app.listen(port, () => {
      console.log(`API lista en http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Error conectando a MySQL:', err.message);
    process.exit(1);
  }
}

start();