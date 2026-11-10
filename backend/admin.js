
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = function registrarAdmin(app, pool) {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    console.warn('AVISO: falta JWT_SECRET en backend/.env.');
  }

  const ETIQUETA_ROL = {
    admin: 'Administrador',
    cliente: 'Cliente',
    repartidor: 'Repartidor'
  };

  // ===============================
  // AUTENTICACIÓN DE ADMINISTRADOR
  // ===============================

  function requireAdmin(req, res, next) {
    const cabecera = req.headers.authorization || '';
    const token = cabecera.startsWith('Bearer ')
      ? cabecera.slice(7)
      : null;

    if (!token || !JWT_SECRET) {
      return res.status(401).json({
        mensaje: 'No autorizado.'
      });
    }

    try {
      const datos = jwt.verify(token, JWT_SECRET);

      if (datos.rol !== 'admin') {
        return res.status(403).json({
          mensaje: 'Acceso solo para administradores.'
        });
      }

      req.admin = datos;
      next();
    } catch (err) {
      return res.status(401).json({
        mensaje: 'Sesión inválida o expirada.'
      });
    }
  }

  // ===============================
  // INICIO DE SESIÓN ADMINISTRADOR
  // ===============================

  app.post('/api/admin/login', async (req, res) => {
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

    if (!JWT_SECRET) {
      return res.status(500).json({
        mensaje: 'Servidor sin JWT_SECRET configurado.'
      });
    }

    try {
      const [filas] = await pool.execute(
        `SELECT id, nombre, correo, contrasena, rol, activo
         FROM usuarios
         WHERE correo = ?`,
        [correo.trim().toLowerCase()]
      );

      const usuario = filas[0];

      const coincide = usuario
        ? await bcrypt.compare(contrasena, usuario.contrasena)
        : false;

      if (!usuario || !coincide) {
        return res.status(401).json({
          mensaje: 'Correo o contraseña incorrectos.'
        });
      }

      if (usuario.rol !== 'admin' || !usuario.activo) {
        return res.status(403).json({
          mensaje: 'Esta cuenta no tiene acceso al panel.'
        });
      }

      const token = jwt.sign(
        {
          id: usuario.id,
          rol: usuario.rol
        },
        JWT_SECRET,
        {
          expiresIn: '8h'
        }
      );

      return res.json({
        ok: true,
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo
        }
      });
    } catch (err) {
      console.error('Error en login admin:', err);

      return res.status(500).json({
        mensaje: 'No se pudo iniciar sesión.'
      });
    }
  });

  // ===============================
  // USUARIOS
  // ===============================

  app.get('/api/admin/usuarios', requireAdmin, async (req, res) => {
    try {
      const [rows] = await pool.execute(
        `SELECT id, nombre, correo, rol, activo
         FROM usuarios
         ORDER BY id`
      );

      res.json(rows.map(u => ({
        id: u.id,
        nombre: u.nombre,
        correo: u.correo,
        rol: ETIQUETA_ROL[u.rol] || u.rol,
        estado: u.activo ? 'Activo' : 'Inactivo'
      })));
    } catch (err) {
      console.error(err);

      res.status(500).json({
        mensaje: 'No se pudieron consultar los usuarios.'
      });
    }
  });

  app.delete('/api/admin/usuarios/:id', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        mensaje: 'ID inválido.'
      });
    }

    if (id === req.admin.id) {
      return res.status(400).json({
        mensaje: 'No puedes eliminar tu propia cuenta.'
      });
    }

    try {
      const [result] = await pool.execute(
        'DELETE FROM usuarios WHERE id = ?',
        [id]
      );

      if (!result.affectedRows) {
        return res.status(404).json({
          mensaje: 'Usuario no encontrado.'
        });
      }

      res.json({
        mensaje: 'Usuario eliminado.'
      });
    } catch (err) {
      console.error(err);

      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({
          mensaje: 'El usuario tiene registros asociados (reseñas, pedidos).'
        });
      }

      res.status(500).json({
        mensaje: 'No se pudo eliminar el usuario.'
      });
    }
  });

  // ===============================
  // ESTADÍSTICAS
  // ===============================

  app.get('/api/admin/estadisticas', requireAdmin, async (req, res) => {
    try {
      const [[u]] = await pool.execute(
        'SELECT COUNT(*) AS total FROM usuarios'
      );

      const [[p]] = await pool.execute(
        'SELECT COUNT(*) AS total FROM productos'
      );

      const [[r]] = await pool.execute(
        "SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'repartidor'"
      );

      res.json({
        usuarios: u.total,
        productos: p.total,
        repartidores: r.total
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        mensaje: 'No se pudieron consultar las estadísticas.'
      });
    }
  });

  // ===============================
  // CATEGORÍAS Y SUBCATEGORÍAS
  // ===============================

  app.get('/api/admin/categorias', requireAdmin, async (req, res) => {
    try {
      const [rows] = await pool.execute(
        'SELECT id, nombre FROM categorias ORDER BY nombre'
      );

      res.json(rows);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        mensaje: 'No se pudieron consultar las categorías.'
      });
    }
  });

  app.get('/api/admin/subcategorias', requireAdmin, async (req, res) => {
    try {
      const [rows] = await pool.execute(
        `SELECT id, categoria_id, nombre
         FROM subcategorias
         ORDER BY nombre`
      );

      res.json(rows);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        mensaje: 'No se pudieron consultar las subcategorías.'
      });
    }
  });

  // ===============================
  // FUNCIONES DE VALIDACIÓN
  // ===============================

  function convertirId(valor) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ''
    ) {
      return null;
    }

    const id = Number(valor);

    return Number.isInteger(id) && id > 0
      ? id
      : undefined;
  }

  function validarProducto(body) {
    const {
      nombre,
      precio,
      stock,
      descripcion = '',
      estado = 'activo',
      categoria_id = null,
      subcategoria_id = null,
      restaurante_id = null,
      tipo = 'comida',
      imagen = null
    } = body;

    const categoriaId = convertirId(categoria_id);
    const subcategoriaId = convertirId(subcategoria_id);
    const restauranteId = convertirId(restaurante_id);

    if (
      typeof nombre !== 'string' ||
      !nombre.trim() ||
      nombre.trim().length > 120 ||
      !Number.isFinite(Number(precio)) ||
      Number(precio) < 0 ||
      !Number.isInteger(Number(stock)) ||
      Number(stock) < 0 ||
      typeof descripcion !== 'string' ||
      descripcion.length > 5000 ||
      !['activo', 'inactivo'].includes(estado) ||
      !['comida', 'bebida'].includes(tipo) ||
      categoriaId === undefined ||
      subcategoriaId === undefined ||
      restauranteId === undefined ||
      (typeof imagen !== 'string' && imagen !== null) ||
      (typeof imagen === 'string' && imagen.length > 255)
    ) {
      return null;
    }

    if (
      subcategoriaId !== null &&
      categoriaId === null
    ) {
      return null;
    }

    return {
      nombre: nombre.trim(),
      precio: Number(precio),
      stock: Number(stock),
      descripcion: descripcion.trim(),
      estado,
      tipo,
      categoria_id: categoriaId,
      subcategoria_id: subcategoriaId,
      restaurante_id: restauranteId,
      imagen: imagen ? imagen.trim() : null
    };
  }

  async function validarRelaciones(datos) {
    // Validar restaurante
    if (datos.restaurante_id !== null) {
      const [restaurantes] = await pool.execute(
        'SELECT id FROM restaurantes WHERE id = ?',
        [datos.restaurante_id]
      );

      if (!restaurantes.length) {
        return false;
      }
    }

    // Validar categoría
    if (datos.categoria_id !== null) {
      const [categorias] = await pool.execute(
        'SELECT id FROM categorias WHERE id = ?',
        [datos.categoria_id]
      );

      if (!categorias.length) {
        return false;
      }
    }

    // Validar subcategoría
    if (datos.subcategoria_id !== null) {
      const [subcategorias] = await pool.execute(
        `SELECT id FROM subcategorias
         WHERE id = ? AND categoria_id = ?`,
        [
          datos.subcategoria_id,
          datos.categoria_id
        ]
      );

      if (!subcategorias.length) {
        return false;
      }
    }

    // Las bebidas pertenecen a un restaurante
    // y utilizan la categoría Bebidas (ID 2).
    if (
      datos.tipo === 'bebida' &&
      (
        datos.restaurante_id === null ||
        datos.categoria_id !== 2 ||
        datos.subcategoria_id !== null
      )
    ) {
      return false;
    }

    return true;
  }

  // ===============================
  // CONSULTAR PRODUCTOS
  // ===============================

  app.get('/api/admin/productos', requireAdmin, async (req, res) => {
    try {
      const [rows] = await pool.execute(
        `SELECT id, nombre, precio, stock, descripcion,
                estado, categoria_id, subcategoria_id,
                restaurante_id, tipo, imagen
         FROM productos
         ORDER BY id DESC`
      );

      res.json(rows.map(p => ({
        ...p,
        precio: Number(p.precio)
      })));
    } catch (err) {
      console.error(err);

      res.status(500).json({
        mensaje: 'No se pudieron consultar los productos.'
      });
    }
  });

  // ===============================
  // CREAR PRODUCTO
  // ===============================

  app.post('/api/admin/productos', requireAdmin, async (req, res) => {
    const datos = validarProducto(req.body);

    if (!datos) {
      return res.status(400).json({
        mensaje: 'Los datos del producto son inválidos.'
      });
    }

    try {
      const relacionesValidas = await validarRelaciones(datos);

      if (!relacionesValidas) {
        return res.status(400).json({
          mensaje: 'La categoría, subcategoría o restaurante no es válido.'
        });
      }

      const [resultado] = await pool.execute(
        `INSERT INTO productos
         (
           nombre,
           precio,
           stock,
           descripcion,
           estado,
           categoria_id,
           subcategoria_id,
           restaurante_id,
           tipo,
           imagen
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          datos.nombre,
          datos.precio,
          datos.stock,
          datos.descripcion,
          datos.estado,
          datos.categoria_id,
          datos.subcategoria_id,
          datos.restaurante_id,
          datos.tipo,
          datos.imagen
        ]
      );

      res.status(201).json({
        id: resultado.insertId,
        ...datos
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        mensaje: 'No se pudo crear el producto.'
      });
    }
  });

  // ===============================
  // ACTUALIZAR PRODUCTO
  // ===============================

  app.put('/api/admin/productos/:id', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        mensaje: 'ID inválido.'
      });
    }

    try {
      const [actuales] = await pool.execute(
        `SELECT nombre, precio, stock, descripcion, estado,
                categoria_id, subcategoria_id,
                restaurante_id, tipo, imagen
         FROM productos
         WHERE id = ?`,
        [id]
      );

      if (!actuales.length) {
        return res.status(404).json({
          mensaje: 'Producto no encontrado.'
        });
      }

      // Conserva los campos que el formulario no envíe.
      const datosCompletos = {
        ...actuales[0],
        ...req.body
      };

      const datos = validarProducto(datosCompletos);

      if (!datos) {
        return res.status(400).json({
          mensaje: 'Los datos del producto son inválidos.'
        });
      }

      const relacionesValidas = await validarRelaciones(datos);

      if (!relacionesValidas) {
        return res.status(400).json({
          mensaje: 'La categoría, subcategoría o restaurante no es válido.'
        });
      }

      await pool.execute(
        `UPDATE productos
         SET nombre = ?,
             precio = ?,
             stock = ?,
             descripcion = ?,
             estado = ?,
             categoria_id = ?,
             subcategoria_id = ?,
             restaurante_id = ?,
             tipo = ?,
             imagen = ?
         WHERE id = ?`,
        [
          datos.nombre,
          datos.precio,
          datos.stock,
          datos.descripcion,
          datos.estado,
          datos.categoria_id,
          datos.subcategoria_id,
          datos.restaurante_id,
          datos.tipo,
          datos.imagen,
          id
        ]
      );

      res.json({
        id,
        ...datos
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        mensaje: 'No se pudo actualizar el producto.'
      });
    }
  });

  // ===============================
  // ELIMINAR PRODUCTO
  // ===============================

  app.delete('/api/admin/productos/:id', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        mensaje: 'ID inválido.'
      });
    }

    try {
      const [resultado] = await pool.execute(
        'DELETE FROM productos WHERE id = ?',
        [id]
      );

      if (!resultado.affectedRows) {
        return res.status(404).json({
          mensaje: 'Producto no encontrado.'
        });
      }

      res.json({
        mensaje: 'Producto eliminado.'
      });
    } catch (err) {
      console.error(err);

      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({
          mensaje: 'El producto está ligado a otros registros.'
        });
      }

      res.status(500).json({
        mensaje: 'No se pudo eliminar el producto.'
      });
    }
  });
};
