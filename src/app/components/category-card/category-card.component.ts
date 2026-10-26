import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonCard, IonCardContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, restaurantOutline, cafeOutline, cartOutline,
  medkitOutline, giftOutline, cubeOutline, flashOutline,
  locationOutline, receiptOutline, helpBuoyOutline,
} from 'ionicons/icons';

export interface Categoria {
  id?: number;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
}

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [IonCard, IonCardContent, IonIcon],
  templateUrl: './category-card.component.html',
  styleUrls: ['./category-card.component.scss'],
})
export class CategoryCardComponent {
  @Input() categoria!: Categoria;
  @Output() seleccionar = new EventEmitter<Categoria>();

  constructor() {
    addIcons({
      arrowBackOutline, restaurantOutline, cafeOutline, cartOutline,
      medkitOutline, giftOutline, cubeOutline, flashOutline,
      locationOutline, receiptOutline, helpBuoyOutline,
    });
  }
}