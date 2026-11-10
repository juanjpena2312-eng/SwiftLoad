// Rutas de pedidos de los clientes de la app.
// Se registran desde server.js con: require('./pedidos')(app, pool);

class ErrorPedido extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

module.exports = function registrarPedidos(app, pool) {
  // Historial de UN usuario
  app.get('/api/usuarios/:id/pedidos', async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ mensaje: 'ID inválido.' });
    }

    try {
      const [pedidos] = await pool.execute(
        `SELECT p.id, p.numero_orden, r.nombre AS restaurante,
                p.total, p.estado, p.creado_en
         FROM pedidos p
         LEFT JOIN restaurantes r ON r.id = p.restaurante_id
         WHERE p.usuario_id = ?
         ORDER BY p.creado_en DESC, p.id DESC
         LIMIT 50`,
        [id]
      );

      if (pedidos.length === 0) {
        return res.json([]);
      }

      const ids = pedidos.map((p) => p.id);
      const [items] = await pool.query(
        `SELECT pi.pedido_id, pr.nombre, pi.precio, pi.cantidad
         FROM pedido_items pi
         JOIN productos pr ON pr.id = pi.producto_id
         WHERE pi.pedido_id IN (?)`,
        [ids]
      );

      res.json(
        pedidos.map((p) => ({
          ...p,
          total: Number(p.total),
          items: items
            .filter((i) => i.pedido_id === p.id)
            .map((i) => ({
              nombre: i.nombre,
              precio: Number(i.precio),
              cantidad: i.cantidad
            }))
        }))
      );
    } catch (err) {
      console.error(err);
      res.status(500).json({ mensaje: 'No se pudieron consultar los pedidos.' });
    }
  });

  // Crear pedido
  app.post('/api/pedidos', async (req, res) => {
    const { usuario_id, restaurante_id, items } = req.body;
    const usuarioId = Number(usuario_id);
    const restauranteId = restaurante_id == null ? null : Number(restaurante_id);

    if (
      !Number.isInteger(usuarioId) || usuarioId < 1 ||
      (restauranteId !== null && (!Number.isInteger(restauranteId) || restauranteId < 1)) ||
      !Array.isArray(items) || items.length === 0 || items.length > 50
    ) {
      return res.status(400).json({ mensaje: 'Pedido inválido.' });
    }

    const lineas = [];
    for (const it of items) {
      const productoId = Number(it.producto_id);
      const cantidad = Number(it.cantidad);

      if (
        !Number.isInteger(productoId) || productoId < 1 ||
        !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 50
      ) {
        return res.status(400).json({ mensaje: 'Pedido inválido.' });
      }
      lineas.push({ productoId, cantidad });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [usuarios] = await conn.execute(
        'SELECT id FROM usuarios WHERE id = ?',
        [usuarioId]
      );
      if (usuarios.length === 0) {
        throw new ErrorPedido(404, 'Usuario no encontrado.');
      }

      // El precio y el total se calculan aquí con los datos de la base,
      // no con lo que manda la app.
      let total = 0;
      const detalle = [];

      for (const l of lineas) {
        const [rows] = await conn.execute(
          'SELECT id, nombre, precio, stock FROM productos WHERE id = ? FOR UPDATE',
          [l.productoId]
        );

        if (rows.length === 0) {
          throw new ErrorPedido(404, 'Un producto del pedido ya no existe.');
        }

        const prod = rows[0];
        if (prod.stock < l.cantidad) {
          throw new ErrorPedido(409, `No hay suficientes existencias de ${prod.nombre}.`);
        }

        await conn.execute(
          'UPDATE productos SET stock = stock - ? WHERE id = ?',
          [l.cantidad, prod.id]
        );

        const precio = Number(prod.precio);
        total += precio * l.cantidad;
        detalle.push({ productoId: prod.id, cantidad: l.cantidad, precio });
      }

      total = Math.round(total * 100) / 100;

      const [resultado] = await conn.execute(
        'INSERT INTO pedidos (usuario_id, restaurante_id, total) VALUES (?, ?, ?)',
        [usuarioId, restauranteId, total]
      );

      const pedidoId = resultado.insertId;
      const numeroOrden = `SW4S${pedidoId}`;

      await conn.execute(
        'UPDATE pedidos SET numero_orden = ? WHERE id = ?',
        [numeroOrden, pedidoId]
      );

      for (const d of detalle) {
        await conn.execute(
          'INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio) VALUES (?, ?, ?, ?)',
          [pedidoId, d.productoId, d.cantidad, d.precio]
        );
      }

      await conn.commit();

      res.status(201).json({
        id: pedidoId,
        numero_orden: numeroOrden,
        total,
        estado: 'Pendiente',
        creado_en: new Date().toISOString()
      });
    } catch (err) {
      await conn.rollback();

      if (err instanceof ErrorPedido) {
        return res.status(err.status).json({ mensaje: err.message });
      }

      console.error('Error creando pedido:', err);
      res.status(500).json({ mensaje: 'No se pudo crear el pedido.' });
    } finally {
      conn.release();
    }
  });
};