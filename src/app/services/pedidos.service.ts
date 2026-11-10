import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { Producto } from './categorias.service';

const API = 'http://localhost:3000/api';

export interface PedidoItem {
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface Pedido {
  id: number;
  numero_orden?: string | null;
  restaurante?: string | null;
  total: number;
  estado: string;
  creado_en: string;
  items?: PedidoItem[];
}

@Injectable({ providedIn: 'root' })
export class PedidosService {
  constructor(private http: HttpClient) {}

  /** Pedidos de UN usuario (el servidor filtra por usuario_id). */
  obtenerPedidos(usuarioId: number): Promise<Pedido[]> {
    return firstValueFrom(
      this.http.get<Pedido[]>(`${API}/usuarios/${usuarioId}/pedidos`)
    );
  }

  /** Crea el pedido en la misma base de datos que ve el panel de administración. */
  crearPedido(
    usuarioId: number,
    restauranteId: number | null,
    productos: Producto[],
  ): Promise<Pedido> {
    // Agrupa productos repetidos: 3 veces la misma pizza = cantidad 3
    const mapa = new Map<number, { producto_id: number; cantidad: number; precio: number }>();
    for (const p of productos) {
      const existente = mapa.get(p.id);
      if (existente) existente.cantidad++;
      else mapa.set(p.id, { producto_id: p.id, cantidad: 1, precio: Number(p.precio) || 0 });
    }

    const items = Array.from(mapa.values());
    const total = items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);

    return firstValueFrom(
      this.http.post<Pedido>(`${API}/pedidos`, {
        usuario_id: usuarioId,
        restaurante_id: restauranteId,
        total,
        items,
      })
    );
  }
}