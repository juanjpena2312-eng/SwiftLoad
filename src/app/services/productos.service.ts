import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const API = 'http://localhost:3000/api';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
}

interface RespuestaAuth {
  ok: boolean;
  mensaje: string;
  usuario: Usuario;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  async registrar(nombre: string, correo: string, contrasena: string): Promise<Usuario> {
    const resp = await firstValueFrom(
      this.http.post<RespuestaAuth>(`${API}/registro`, { nombre, correo, contrasena })
    );
    return resp.usuario;
  }

  async iniciarSesion(correo: string, contrasena: string): Promise<Usuario> {
    const resp = await firstValueFrom(
      this.http.post<RespuestaAuth>(`${API}/login`, { correo, contrasena })
    );
    return resp.usuario;
  }

  guardarSesion(usuario: Usuario) {
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  obtenerSesion(): Usuario | null {
    const dato = localStorage.getItem('usuario');
    return dato ? JSON.parse(dato) : null;
  }

  cerrarSesion() {
    localStorage.removeItem('usuario');
  }

  // El backend manda el mensaje de error en el campo "mensaje"
  traducirError(error: unknown): string {
    const e = error as HttpErrorResponse;

    if (e.status === 0) return 'No se pudo conectar con el servidor.';
    return e.error?.mensaje || 'Ocurrió un error. Intenta de nuevo.';
  }
}