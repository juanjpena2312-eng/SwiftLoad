import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonSearchbar, IonGrid, IonRow, IonCol, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personOutline, searchOutline, locationOutline } from 'ionicons/icons';
import { Categoria, CategoryCardComponent } from '../category-card/category-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, IonSearchbar, IonGrid, IonRow, IonCol, IonIcon, CategoryCardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  @Input() nombreUsuario = '';
  @Input() categorias: Categoria[] = [];
  @Input() mensajeError = '';
  @Output() categoriaSeleccionada = new EventEmitter<Categoria>();

  textoBusqueda = '';

  constructor() {
    addIcons({ personOutline, searchOutline, locationOutline });
  }

  get categoriasFiltradas(): Categoria[] {
    const texto = this.textoBusqueda.trim().toLowerCase();
    if (!texto) return this.categorias;
    return this.categorias.filter(
      c => c.nombre.toLowerCase().includes(texto) ||
           c.descripcion.toLowerCase().includes(texto)
    );
  }
}