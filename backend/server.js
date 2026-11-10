require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const pool = require('./db');
const registrarAdmin = require('./admin');
const fs = require('fs');
const multer = require('multer');

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors({
  origin: [
    'http://localhost:8100',
    'http://127.0.0.1:8100',
    'http://localhost:8101',
    'http://127.0.0.1:8101',
    'http://localhost:4200',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ]
}));

app.use(express.json());

const carpetaImagenes = path.join(__dirname, 'public', 'img', 'negocios');
fs.mkdirSync(carpetaImagenes, { recursive: true });

const subirImagen = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, carpetaImagenes),
    filename: (_req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      cb(null, `negocio-${Date.now()}${extension}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten archivos de imagen.'));
    }
    cb(null, true);
  }
});

// Rutas del panel de administración
registrarAdmin(app, pool);

// Rutas de pedidos de los clientes
require('./pedidos')(app, pool);

// Fotos públicas
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
    return res.status(400).json({
      mensaje: 'Ingresa un correo electrónico válido.'
    });
  }

  if (nombre.trim().length > 100) {
    return res.status(400).json({
      mensaje: 'El nombre no debe superar los 100 caracteres.'
    });
  }

  try {
    const [usuarios] = await pool.execute(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correoNormalizado]
    );

    if (usuarios.length > 0) {
      return res.status(409).json({
        mensaje: 'Este correo ya está registrado.'
      });
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
      return res.status(409).json({
        mensaje: 'Este correo ya está registrado.'
      });
    }

    return res.status(500).json({
      mensaje: 'No se pudo registrar el usuario.'
    });
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
    return res.status(400).json({
      mensaje: 'Ingresa tu correo y contraseña.'
    });
  }

  try {
    const correoNormalizado = correo.trim().toLowerCase();

    const [usuarios] = await pool.execute(
      'SELECT id, nombre, correo, contrasena FROM usuarios WHERE correo = ?',
      [correoNormalizado]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos.'
      });
    }

    const usuario = usuarios[0];
    const coincide = await bcrypt.compare(contrasena, usuario.contrasena);

    if (!coincide) {
      return res.status(401).json({
        mensaje: 'Correo o contraseña incorrectos.'
      });
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

    return res.status(500).json({
      mensaje: 'No se pudo iniciar sesión.'
    });
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

    res.status(500).json({
      mensaje: 'No se pudieron consultar las categorías.'
    });
  }
});

app.get('/api/categorias/:id/productos', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ mensaje: 'ID inválido.' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, precio, stock, imagen FROM productos WHERE categoria_id = ? AND estado = ? ORDER BY nombre',
      [id, 'activo']
    );

    res.json(rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      mensaje: 'No se pudieron consultar los productos.'
    });
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

    res.status(500).json({
      mensaje: 'No se pudieron consultar las subcategorías.'
    });
  }
});

app.get('/api/subcategorias/:id/productos', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ mensaje: 'ID inválido.' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, precio, stock, imagen FROM productos WHERE subcategoria_id = ? AND estado = ? ORDER BY nombre',
      [id, 'activo']
    );

    res.json(rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      mensaje: 'No se pudieron consultar los productos.'
    });
  }
});

// ===============================
// RESTAURANTES
// ===============================
app.get('/api/restaurantes', async (_req, res) => {
  try {
    const [restaurantes] = await pool.execute(
      'SELECT id, nombre FROM restaurantes ORDER BY nombre ASC'
    );

    res.json(restaurantes);
  } catch (err) {
    console.error('Error al obtener restaurantes:', err);

    res.status(500).json({
      mensaje: 'Error al obtener los restaurantes.'
    });
  }
});

// Restaurantes por subcategoría (solo los disponibles)
app.get('/api/subcategorias/:id/restaurantes', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ mensaje: 'ID inválido.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT r.id, r.subcategoria_id, r.nombre, r.descripcion, r.imagen,
              r.direccion, r.telefono, r.tiempo_min, r.costo_envio, r.disponible,
              ROUND(COALESCE(AVG(rs.calificacion), 0), 1) AS calificacion,
              COUNT(rs.id) AS total_resenas
       FROM restaurantes r
       LEFT JOIN resenas rs ON rs.restaurante_id = r.id
       WHERE r.subcategoria_id = ? AND r.disponible = 1
       GROUP BY r.id, r.subcategoria_id, r.nombre, r.descripcion, r.imagen,
                r.direccion, r.telefono, r.tiempo_min, r.costo_envio, r.disponible
       ORDER BY calificacion DESC, r.nombre`,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      mensaje: 'No se pudieron consultar los restaurantes.'
    });
  }
});

// Productos de cada restaurante
app.get('/api/restaurantes/:id/productos', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ mensaje: 'ID inválido.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, nombre, descripcion, precio, stock, imagen, tipo
       FROM productos
       WHERE restaurante_id = ? AND estado = ?
       ORDER BY nombre`,
      [id, 'activo']
    );

    res.json(rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      mensaje: 'No se pudo consultar el menú.'
    });
  }
});

// ===============================
// RESEÑAS DE RESTAURANTES
// ===============================
app.get('/api/restaurantes/:id/resenas', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ mensaje: 'ID inválido.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT rs.id, rs.calificacion, rs.comentario, rs.creado_en,
              u.nombre AS usuario
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

    res.status(500).json({
      mensaje: 'No se pudieron consultar las reseñas.'
    });
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
    return res.status(400).json({
      mensaje: 'La calificación debe ser de 1 a 5.'
    });
  }

  try {
    await pool.execute(
      'INSERT INTO resenas (restaurante_id, usuario_id, calificacion, comentario) VALUES (?, ?, ?, ?)',
      [
        id,
        Number(usuario_id),
        Number(calificacion),
        (comentario || '').toString().slice(0, 300)
      ]
    );

    res.status(201).json({
      ok: true,
      mensaje: 'Reseña guardada.'
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      mensaje: 'No se pudo guardar la reseña.'
    });
  }
});

// ===============================
// NEGOCIOS (panel del propietario)
// ===============================
function validarNegocio(d) {
  const errores = [];

  if (typeof d.nombre !== 'string' || !d.nombre.trim() || d.nombre.length > 120) {
    errores.push('nombre vacío o demasiado largo');
  }
  if (typeof d.descripcion !== 'string' || !d.descripcion.trim() || d.descripcion.length > 1000) {
    errores.push('descripción vacía o demasiado larga');
  }
  if (typeof d.imagen !== 'string' || !d.imagen.trim() || d.imagen.length > 255) {
    errores.push('imagen no recibida o inválida');
  }
  if (typeof d.direccion !== 'string' || !d.direccion.trim() || d.direccion.length > 255) {
    errores.push('dirección vacía o demasiado larga');
  }
  if (typeof d.telefono !== 'string' || !d.telefono.trim() || d.telefono.length > 30) {
    errores.push('teléfono vacío o demasiado largo');
  }
  if (
    d.tiempo_min === '' || d.tiempo_min === null ||
    !Number.isInteger(Number(d.tiempo_min)) ||
    Number(d.tiempo_min) < 1 || Number(d.tiempo_min) > 240
  ) {
    errores.push('tiempo_min inválido');
  }
  if (
    d.costo_envio === '' || d.costo_envio === null ||
    !Number.isFinite(Number(d.costo_envio)) || Number(d.costo_envio) < 0
  ) {
    errores.push('costo_envio inválido');
  }
  if (!Number.isInteger(Number(d.subcategoria_id)) || Number(d.subcategoria_id) < 1) {
    errores.push('subcategoria_id inválido');
  }
  if (typeof d.disponible !== 'boolean') {
    errores.push('disponible inválido');
  }

  return errores;
}

app.get('/api/negocios', async (req, res) => {
  const usuarioId = Number(req.query.usuario_id);

  if (!Number.isInteger(usuarioId) || usuarioId < 1) {
    return res.status(400).json({ mensaje: 'ID de usuario inválido.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT r.id, r.subcategoria_id, r.nombre, r.descripcion, r.imagen,
              r.direccion, r.telefono, r.tiempo_min, r.costo_envio, r.disponible,
              ROUND(COALESCE(AVG(rs.calificacion), 0), 1) AS calificacion,
              COUNT(rs.id) AS total_resenas
       FROM restaurantes r
       LEFT JOIN resenas rs ON rs.restaurante_id = r.id
       WHERE r.propietario_id = ?
       GROUP BY r.id, r.subcategoria_id, r.nombre, r.descripcion, r.imagen,
                r.direccion, r.telefono, r.tiempo_min, r.costo_envio, r.disponible
       ORDER BY r.nombre`,
      [usuarioId]
    );

    return res.json(rows);
  } catch (err) {
    console.error('Error consultando negocios:', err);

    return res.status(500).json({
      mensaje: 'No se pudieron consultar tus negocios.'
    });
  }
});

app.post('/api/negocios', subirImagen.single('imagen'), async (req, res) => {
  const datos = req.body;

  if (!req.file) {
    return res.status(400).json({
      mensaje: 'La imagen del negocio es obligatoria.'
    });
  }

  datos.imagen = `/img/negocios/${req.file.filename}`;
  datos.disponible = datos.disponible === 'true';

  const usuarioId = Number(datos.usuario_id);
  const errores = validarNegocio(datos);

  if (!Number.isInteger(usuarioId) || usuarioId < 1) {
    errores.push('usuario_id inválido');
  }

  if (errores.length > 0) {
    return res.status(400).json({
      mensaje: 'Hay campos inválidos en el formulario.',
      errores
    });
  }

  try {
    const [subcategorias] = await pool.execute(
      'SELECT id FROM subcategorias WHERE id = ?',
      [Number(datos.subcategoria_id)]
    );

    if (subcategorias.length === 0) {
      return res.status(400).json({ mensaje: 'Selecciona una categoría válida.' });
    }

    const [result] = await pool.execute(
      `INSERT INTO restaurantes
       (propietario_id, subcategoria_id, nombre, descripcion, imagen, direccion,
        telefono, tiempo_min, costo_envio, disponible)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuarioId,
        Number(datos.subcategoria_id),
        datos.nombre.trim(),
        datos.descripcion.trim(),
        datos.imagen,
        datos.direccion.trim(),
        datos.telefono.trim(),
        Number(datos.tiempo_min),
        Number(datos.costo_envio),
        datos.disponible ? 1 : 0
      ]
    );

    return res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error('Error creando negocio:', err);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        mensaje: 'Ya existe un negocio registrado con ese nombre.'
      });
    }

    return res.status(500).json({
      mensaje: 'No se pudo registrar el negocio.'
    });
  }
});

app.put('/api/negocios/:id', subirImagen.single('imagen'), async (req, res) => {
  const negocioId = Number(req.params.id);
  const datos = req.body;
  const usuarioId = Number(datos.usuario_id);

  datos.disponible = datos.disponible === 'true';

  if (
    !Number.isInteger(negocioId) || negocioId < 1 ||
    !Number.isInteger(usuarioId) || usuarioId < 1
  ) {
    return res.status(400).json({ mensaje: 'Datos del negocio inválidos.' });
  }

  try {
    const [negocios] = await pool.execute(
      'SELECT id, imagen FROM restaurantes WHERE id = ? AND propietario_id = ?',
      [negocioId, usuarioId]
    );

    if (negocios.length === 0) {
      return res.status(403).json({
        mensaje: 'No tienes permiso para modificar este negocio.'
      });
    }

    datos.imagen = req.file
      ? `/img/negocios/${req.file.filename}`
      : negocios[0].imagen;

    const errores = validarNegocio(datos);

    if (errores.length > 0) {
      return res.status(400).json({
        mensaje: 'Hay campos inválidos en el formulario.',
        errores
      });
    }

    const [subcategorias] = await pool.execute(
      'SELECT id FROM subcategorias WHERE id = ?',
      [Number(datos.subcategoria_id)]
    );

    if (subcategorias.length === 0) {
      return res.status(400).json({ mensaje: 'Selecciona una categoría válida.' });
    }

    const [result] = await pool.execute(
      `UPDATE restaurantes
       SET subcategoria_id = ?, nombre = ?, descripcion = ?, imagen = ?,
           direccion = ?, telefono = ?, tiempo_min = ?, costo_envio = ?, disponible = ?
       WHERE id = ? AND propietario_id = ?`,
      [
        Number(datos.subcategoria_id),
        datos.nombre.trim(),
        datos.descripcion.trim(),
        datos.imagen,
        datos.direccion.trim(),
        datos.telefono.trim(),
        Number(datos.tiempo_min),
        Number(datos.costo_envio),
        datos.disponible ? 1 : 0,
        negocioId,
        usuarioId
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ mensaje: 'Negocio no encontrado.' });
    }

    return res.json({
      ok: true,
      mensaje: 'Negocio actualizado correctamente.',
      imagen: datos.imagen
    });
  } catch (err) {
    console.error('Error actualizando negocio:', err);

    return res.status(500).json({
      mensaje: 'No se pudo actualizar el negocio.'
    });
  }
});

// ===============================
// RESEÑAS DE LA APLICACIÓN
// ===============================
app.get('/api/resenas-aplicacion/:usuarioId', async (req, res) => {
  const usuarioId = Number(req.params.usuarioId);

  if (!Number.isInteger(usuarioId) || usuarioId < 1) {
    return res.status(400).json({ mensaje: 'ID de usuario inválido.' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, usuario_id, calificacion, comentario,
              fecha_creacion, fecha_actualizacion
       FROM resenas_aplicacion
       WHERE usuario_id = ?`,
      [usuarioId]
    );

    return res.json(rows[0] || null);
  } catch (err) {
    console.error('Error consultando reseña de aplicación:', err);

    return res.status(500).json({
      mensaje: 'No se pudo consultar tu reseña.'
    });
  }
});

app.post('/api/resenas-aplicacion', async (req, res) => {
  const { usuario_id, calificacion, comentario } = req.body;

  if (
    !Number.isInteger(Number(usuario_id)) ||
    Number(usuario_id) < 1 ||
    !Number.isInteger(Number(calificacion)) ||
    Number(calificacion) < 1 ||
    Number(calificacion) > 5 ||
    typeof comentario !== 'string' ||
    !comentario.trim() ||
    comentario.trim().length > 500
  ) {
    return res.status(400).json({
      mensaje: 'Revisa la calificación y el comentario. El comentario debe tener entre 1 y 500 caracteres.'
    });
  }

  try {
    await pool.execute(
      `INSERT INTO resenas_aplicacion (usuario_id, calificacion, comentario)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         calificacion = VALUES(calificacion),
         comentario = VALUES(comentario)`,
      [Number(usuario_id), Number(calificacion), comentario.trim()]
    );

    return res.status(200).json({
      ok: true,
      mensaje: 'Tu reseña de SwiftLoad se guardó correctamente.'
    });
  } catch (err) {
    console.error('Error guardando reseña de aplicación:', err);

    return res.status(500).json({
      mensaje: 'No se pudo guardar tu reseña.'
    });
  }
});

// ===============================
// PRODUCTOS (CRUD PÚBLICO)
// ===============================
app.get('/api/productos', async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, nombre, precio, stock FROM productos WHERE estado = 'activo' ORDER BY id DESC"
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
    return res.status(400).json({
      mensaje: 'Nombre, precio o existencias inválidos.'
    });
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

    res.status(500).json({
      mensaje: 'No se pudo crear el producto.'
    });
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
      return res.status(404).json({
        mensaje: 'Producto no encontrado.'
      });
    }

    res.json({ mensaje: 'Producto actualizado.' });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      mensaje: 'No se pudo actualizar el producto.'
    });
  }
});

app.delete('/api/productos/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ mensaje: 'ID inválido.' });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM productos WHERE id = ?',
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        mensaje: 'Producto no encontrado.'
      });
    }

    res.json({ mensaje: 'Producto eliminado.' });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      mensaje: 'No se pudo eliminar el producto.'
    });
  }
});

// Manejo de errores de Multer
app.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError || err?.message === 'Solo se permiten archivos de imagen.') {
    return res.status(400).json({
      mensaje: err.code === 'LIMIT_FILE_SIZE'
        ? 'La imagen no debe superar los 5 MB.'
        : err.message
    });
  }
  return next(err);
});

// ===============================
// REPARTIDORES (CRUD Admin)
// ===============================
app.get('/api/admin/repartidores', async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, nombre, correo, telefono, vehiculo, estado, creado_en FROM repartidores ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener repartidores:', err);
    res.status(500).json({ mensaje: 'No se pudieron consultar los repartidores.' });
  }
});

app.post('/api/admin/repartidores', async (req, res) => {
  const { nombre, correo, telefono, vehiculo, estado } = req.body;

  if (!nombre?.trim() || !correo?.trim() || !telefono?.trim()) {
    return res.status(400).json({ mensaje: 'Nombre, correo y teléfono son obligatorios.' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO repartidores (nombre, correo, telefono, vehiculo, estado) VALUES (?, ?, ?, ?, ?)',
      [nombre.trim(), correo.trim().toLowerCase(), telefono.trim(), vehiculo || 'Motocicleta', estado || 'activo']
    );

    res.status(201).json({
      id: result.insertId,
      nombre: nombre.trim(),
      correo: correo.trim().toLowerCase(),
      telefono: telefono.trim(),
      vehiculo: vehiculo || 'Motocicleta',
      estado: estado || 'activo'
    });
  } catch (err) {
    console.error('Error al crear repartidor:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'Este correo ya está registrado para otro repartidor.' });
    }
    res.status(500).json({ mensaje: 'No se pudo registrar el repartidor.' });
  }
});

app.put('/api/admin/repartidores/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, correo, telefono, vehiculo, estado } = req.body;

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ mensaje: 'ID inválido.' });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE repartidores SET nombre = ?, correo = ?, telefono = ?, vehiculo = ?, estado = ? WHERE id = ?',
      [nombre.trim(), correo.trim().toLowerCase(), telefono.trim(), vehiculo, estado, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ mensaje: 'Repartidor no encontrado.' });
    }

    res.json({ id, nombre, correo, telefono, vehiculo, estado });
  } catch (err) {
    console.error('Error al actualizar repartidor:', err);
    res.status(500).json({ mensaje: 'No se pudo actualizar el repartidor.' });
  }
});

app.delete('/api/admin/repartidores/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ mensaje: 'ID inválido.' });
  }

  try {
    const [result] = await pool.execute('DELETE FROM repartidores WHERE id = ?', [id]);

    if (!result.affectedRows) {
      return res.status(404).json({ mensaje: 'Repartidor no encontrado.' });
    }

    res.json({ mensaje: 'Repartidor eliminado correctamente.' });
  } catch (err) {
    console.error('Error al eliminar repartidor:', err);
    res.status(500).json({ mensaje: 'No se pudo eliminar el repartidor.' });
  }
});
// ===============================
// REPORTES Y ESTADÍSTICAS (Panel Admin)
// ===============================
app.get('/api/admin/reportes', async (_req, res) => {
  try {
    const [ventasTotal] = await pool.execute(
      "SELECT COALESCE(SUM(total), 0) AS ingresos, COUNT(*) AS total_pedidos FROM pedidos WHERE estado != 'cancelado'"
    );

    const [usuariosTotal] = await pool.execute(
      "SELECT COUNT(*) AS total_usuarios FROM usuarios"
    );

    const [productosTotal] = await pool.execute(
      "SELECT COUNT(*) AS total_productos FROM productos WHERE estado = 'activo'"
    );

    // Consulta de pedidos agrupados por estado
    let pedidosEstado = [];
    try {
      const [rowsEstado] = await pool.execute(
        "SELECT estado, COUNT(*) AS cantidad FROM pedidos GROUP BY estado"
      );
      pedidosEstado = rowsEstado;
    } catch (e) {
      pedidosEstado = [];
    }

    // Consulta de productos más vendidos
    let productosTop = [];
    try {
      const [rowsTop] = await pool.execute(
        `SELECT p.nombre, SUM(dp.cantidad) AS total_vendidos 
         FROM detalle_pedidos dp 
         JOIN productos p ON p.id = dp.producto_id 
         GROUP BY p.id, p.nombre 
         ORDER BY total_vendidos DESC 
         LIMIT 5`
      );
      productosTop = rowsTop;
    } catch (e) {
      productosTop = [];
    }

    res.json({
      ingresos: ventasTotal[0]?.ingresos || 0,
      total_pedidos: ventasTotal[0]?.total_pedidos || 0,
      total_usuarios: usuariosTotal[0]?.total_usuarios || 0,
      total_productos: productosTotal[0]?.total_productos || 0,
      pedidos_por_estado: pedidosEstado,
      productos_mas_vendidos: productosTop
    });
  } catch (err) {
    console.error('Error al generar reportes:', err);
    res.status(500).json({ mensaje: 'No se pudieron generar los reportes.' });
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