import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const API = 'http://localhost:3000/api';

export interface ResenaAplicacion {
  id?: number;
  usuario_id: number;
  calificacion: number;
  comentario: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResenasAplicacionService {
  constructor(private http: HttpClient) {}

  async guardarResena(resena: ResenaAplicacion) {
    return await firstValueFrom(
      this.http.post(`${API}/resenas-aplicacion`, resena)
    );
  }

  async obtenerResena(usuarioId: number) {
    return await firstValueFrom(
      this.http.get<ResenaAplicacion | null>(`${API}/resenas-aplicacion/${usuarioId}`)
    );
  }
}