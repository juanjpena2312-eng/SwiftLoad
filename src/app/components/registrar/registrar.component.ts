import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonLabel, IonItem, IonInput, IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, personOutline, mailOutline, lockClosedOutline,
  shieldCheckmarkOutline, createOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-registrar',
  standalone: true,
  imports: [CommonModule, FormsModule, IonLabel, IonItem, IonInput, IonButton, IonIcon],
  templateUrl: './registrar.component.html',
  styleUrls: ['../shared/auth.shared.scss', './registrar.component.scss'],
})
export class RegistrarComponent {
  @Input() mensajeError = '';
  @Output() registrar = new EventEmitter<{
    nombre: string;
    correo: string;
    contrasena: string;
    confirmarContrasena: string;
  }>();
  @Output() irALogin = new EventEmitter<void>();

  nombre = '';
  correo = '';
  contrasena = '';
  confirmarContrasena = '';

  constructor() {
    addIcons({
      arrowBackOutline, personOutline, mailOutline, lockClosedOutline,
      shieldCheckmarkOutline, createOutline,
    });
  }

  enviar() {
    this.registrar.emit({
      nombre: this.nombre,
      correo: this.correo,
      contrasena: this.contrasena,
      confirmarContrasena: this.confirmarContrasena,
    });
  }
}