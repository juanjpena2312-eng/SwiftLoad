import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, addOutline, cartOutline, alertCircleOutline, star,
  starOutline, timeOutline, bicycleOutline, storefrontOutline,
  restaurantOutline, cafeOutline, medkitOutline, giftOutline, cubeOutline,
  flashOutline, locationOutline, receiptOutline, helpBuoyOutline,
  fastFoodOutline, pizzaOutline, flameOutline, fishOutline, leafOutline,
  iceCreamOutline,
} from 'ionicons/icons';
import { Categoria } from '../category-card/category-card.component';
import { Producto, Restaurante, Resena, urlImg } from '../../services/categorias.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, IonButton, IonIcon],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss'],
})
export class ProductosComponent {
  @Input() categoria: Categoria | null = null;
  @Input() restaurante: Restaurante | null = null;
  @Input() productos: Producto[] = [];
  @Input() resenas: Resena[] = [];
  @Input() cargando = false;
  @Input() error = '';
  @Input() cantidadCarrito = 0;

  @Output() volver = new EventEmitter<void>();
  @Output() agregar = new EventEmitter<Producto>();
  @Output() enviarResena = new EventEmitter<{ calificacion: number; comentario: string }>();

  estrellas = [1, 2, 3, 4, 5];
  nuevaCalificacion = 0;
  nuevoComentario = '';
  errorResena = '';

  urlImg = urlImg;

  constructor() {
    addIcons({
      arrowBackOutline, addOutline, cartOutline, alertCircleOutline, star,
      starOutline, timeOutline, bicycleOutline, storefrontOutline,
      restaurantOutline, cafeOutline, medkitOutline, giftOutline, cubeOutline,
      flashOutline, locationOutline, receiptOutline, helpBuoyOutline,
      fastFoodOutline, pizzaOutline, flameOutline, fishOutline, leafOutline,
      iceCreamOutline,
    });
  }

  ocultarImagen(evento: Event) {
    (evento.target as HTMLImageElement).style.display = 'none';
  }

  elegirEstrellas(valor: number) {
    this.nuevaCalificacion = valor;
    this.errorResena = '';
  }

  publicar() {
    if (this.nuevaCalificacion < 1) {
      this.errorResena = 'Elige de 1 a 5 estrellas.';
      return;
    }

    this.enviarResena.emit({
      calificacion: this.nuevaCalificacion,
      comentario: this.nuevoComentario.trim(),
    });

    this.nuevaCalificacion = 0;
    this.nuevoComentario = '';
    this.errorResena = '';
  }
}