import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, alertCircleOutline, restaurantOutline, cafeOutline,
  cartOutline, medkitOutline, giftOutline, cubeOutline, flashOutline,
  locationOutline, receiptOutline, helpBuoyOutline, fastFoodOutline,
  pizzaOutline, flameOutline, fishOutline, leafOutline, iceCreamOutline,
} from 'ionicons/icons';
import { Categoria } from '../category-card/category-card.component';
import { Subcategoria } from '../../services/categorias.service';

@Component({
  selector: 'app-subcategorias',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './subcategorias.component.html',
  styleUrls: ['./subcategorias.component.scss'],
})
export class SubcategoriasComponent {
  @Input() categoria: Categoria | null = null;
  @Input() subcategorias: Subcategoria[] = [];
  @Input() cargando = false;
  @Input() error = '';

  @Output() volver = new EventEmitter<void>();
  @Output() seleccionar = new EventEmitter<Subcategoria>();

  constructor() {
    addIcons({
      arrowBackOutline, alertCircleOutline, restaurantOutline, cafeOutline,
      cartOutline, medkitOutline, giftOutline, cubeOutline, flashOutline,
      locationOutline, receiptOutline, helpBuoyOutline, fastFoodOutline,
      pizzaOutline, flameOutline, fishOutline, leafOutline, iceCreamOutline,
    });
  }
}