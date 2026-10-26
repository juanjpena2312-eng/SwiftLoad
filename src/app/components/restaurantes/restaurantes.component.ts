import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { timeOutline, star, bicycleOutline, storefrontOutline, arrowBackOutline } from 'ionicons/icons';
import { Restaurante, Subcategoria } from '../../services/categorias.service';

@Component({
  selector: 'app-restaurantes',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './restaurantes.component.html',
  styleUrls: ['./restaurantes.component.scss']
})
export class RestaurantesComponent {
  @Input() subcategoria: Subcategoria | null = null;
  @Input() restaurantes: Restaurante[] = [];
  @Input() cargando = false;
  @Input() error = '';

  @Output() volver = new EventEmitter<void>();
  @Output() seleccionar = new EventEmitter<Restaurante>();

  imagenPredeterminada = 'assets/Restaurantes/kfc.png';

  constructor() {
    addIcons({
      timeOutline,
      star,
      bicycleOutline,
      storefrontOutline,
      arrowBackOutline
    });
  }

  volverAtras() {
    this.volver.emit();
  }

  seleccionarRestaurante(restaurante: Restaurante) {
    this.seleccionar.emit(restaurante);
  }

  trackById(index: number, item: Restaurante): number {
    return item.id;
  }

  obtenerImagen(restaurante: Restaurante): string {
    const imagen = restaurante?.imagen;

    if (!imagen || !imagen.trim()) {
      return this.imagenPredeterminada;
    }

    const nombre = imagen.trim();

    if (nombre.startsWith('/assets/')) {
      return nombre.substring(1);
    }

    if (nombre.startsWith('assets/')) {
      return nombre;
    }

    return `assets/Restaurantes/${nombre.replace(/^\/+/, '')}`;
  }

  ocultarImagen(evento: Event): void {
    const elemento = evento.target as HTMLImageElement;
    elemento.onerror = null;
    elemento.src = this.imagenPredeterminada;
  }
}