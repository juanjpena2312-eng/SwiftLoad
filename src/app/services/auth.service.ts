
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
  usuario?: Usuario;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {}

  async registrar(
    nombre: string,
    correo: string,
    contrasena: string
  ): Promise<Usuario> {

    const resp = await firstValueFrom(
      this.http.post<RespuestaAuth>(
        `${API}/registro`,
        { nombre, correo, contrasena }
      )
    );

    console.log('Respuesta del registro:', resp);

    return this.procesarUsuario(resp);
  }

  async iniciarSesion(
    correo: string,
    contrasena: string
  ): Promise<Usuario> {

    const resp = await firstValueFrom(
      this.http.post<RespuestaAuth>(
        `${API}/login`,
        { correo, contrasena }
      )
    );

    console.log('Respuesta del inicio de sesión:', resp);

    return this.procesarUsuario(resp);
  }

  private procesarUsuario(resp: RespuestaAuth): Usuario {
    const usuario = resp?.usuario;

    if (
      !usuario ||
      !usuario.id ||
      !usuario.nombre ||
      !usuario.correo
    ) {
      console.error('La respuesta no contiene un usuario válido:', resp);

      throw new Error(
        'El servidor no devolvió correctamente los datos del usuario.'
      );
    }

    this.guardarSesion(usuario);

    return usuario;
  }

  guardarSesion(usuario: Usuario): void {
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  obtenerSesion(): Usuario | null {
    try {
      const dato = localStorage.getItem('usuario');

      if (!dato) {
        return null;
      }

      const usuario = JSON.parse(dato) as Usuario;

      if (!usuario.id || !usuario.nombre || !usuario.correo) {
        return null;
      }

      return usuario;

    } catch (error) {
      console.error('Error recuperando la sesión:', error);
      return null;
    }
  }

  cerrarSesion(): void {
    localStorage.removeItem('usuario');
  }

  traducirError(error: unknown): string {
    const e = error as HttpErrorResponse;

    if (e.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }

    return e.error?.mensaje ||
      (error instanceof Error
        ? error.message
        : 'Ocurrió un error. Intenta de nuevo.');
  }
}
