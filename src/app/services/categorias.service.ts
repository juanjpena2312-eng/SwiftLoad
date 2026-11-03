
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { Categoria } from '../components/category-card/category-card.component';

const BASE = 'http://localhost:3000';
const API = `${BASE}/api`;

export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  imagen?: string | null;
  descripcion?: string | null;
  estado?: string | null;
}

export interface Subcategoria {
  id: number;
  categoria_id: number;
  nombre: string;
  icono: string;
  color: string;
}

export interface Restaurante {
  id: number;
  nombre: string;
  imagen: string | null;
  tiempo_min: number;
  costo_envio: number;
  calificacion: number;
  total_resenas: number;
}

export interface Resena {
  id: number;
  calificacion: number;
  comentario: string | null;
  creado_en: string;
  usuario: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  constructor(private http: HttpClient) {}

  obtenerCategorias(): Promise<Categoria[]> {
    return firstValueFrom(
      this.http.get<Categoria[]>(`${API}/categorias`)
    );
  }

  obtenerSubcategorias(categoriaId: number): Promise<Subcategoria[]> {
    return firstValueFrom(
      this.http.get<Subcategoria[]>(
        `${API}/categorias/${categoriaId}/subcategorias`
      )
    );
  }

  obtenerProductos(categoriaId: number): Promise<Producto[]> {
    return firstValueFrom(
      this.http.get<Producto[]>(
        `${API}/categorias/${categoriaId}/productos`
      )
    );
  }

  obtenerProductosSubcategoria(subcategoriaId: number): Promise<Producto[]> {
    return firstValueFrom(
      this.http.get<Producto[]>(
        `${API}/subcategorias/${subcategoriaId}/productos`
      )
    );
  }

  obtenerRestaurantes(subcategoriaId: number): Promise<Restaurante[]> {
    return firstValueFrom(
      this.http.get<Restaurante[]>(
        `${API}/subcategorias/${subcategoriaId}/restaurantes`
      )
    );
  }

  obtenerMenu(restauranteId: number): Promise<Producto[]> {
    return firstValueFrom(
      this.http.get<Producto[]>(
        `${API}/restaurantes/${restauranteId}/productos`
      )
    );
  }

  obtenerResenas(restauranteId: number): Promise<Resena[]> {
    return firstValueFrom(
      this.http.get<Resena[]>(
        `${API}/restaurantes/${restauranteId}/resenas`
      )
    );
  }

  crearResena(
    restauranteId: number,
    usuarioId: number,
    calificacion: number,
    comentario: string
  ): Promise<unknown> {
    return firstValueFrom(
      this.http.post(
        `${API}/restaurantes/${restauranteId}/resenas`,
        {
          usuario_id: usuarioId,
          calificacion,
          comentario
        }
      )
    );
  }
}
