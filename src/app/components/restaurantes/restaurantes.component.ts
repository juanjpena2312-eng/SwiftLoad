import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, star, timeOutline, bicycleOutline, storefrontOutline,
  alertCircleOutline, fastFoodOutline, pizzaOutline, flameOutline,
  fishOutline, leafOutline, iceCreamOutline,
} from 'ionicons/icons';
import { Restaurante, Subcategoria, urlImg } from '../../services/categorias.service';

@Component({
  selector: 'app-restaurantes',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './restaurantes.component.html',
  styleUrls: ['./restaurantes.component.scss'],
})
export class RestaurantesComponent {
  @Input() subcategoria: Subcategoria | null = null;
  @Input() restaurantes: Restaurante[] = [];
  @Input() cargando = false;
  @Input() error = '';

  @Output() volver = new EventEmitter<void>();
  @Output() seleccionar = new EventEmitter<Restaurante>();

  urlImg = urlImg;

  constructor() {
    addIcons({
      arrowBackOutline, star, timeOutline, bicycleOutline, storefrontOutline,
      alertCircleOutline, fastFoodOutline, pizzaOutline, flameOutline,
      fishOutline, leafOutline, iceCreamOutline,
    });
  }

  ocultarImagen(evento: Event) {
    (evento.target as HTMLImageElement).style.display = 'none';
  }
}