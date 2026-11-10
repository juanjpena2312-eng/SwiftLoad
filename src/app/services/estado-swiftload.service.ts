
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class EstadoSwiftLoadService {

    estado: any = null;

    guardarEstado(datos: any): void {
        this.estado = datos;
    }

    obtenerEstado(): any {
        return this.estado;
    }

    limpiarEstado(): void {
        this.estado = null;
    }
}
