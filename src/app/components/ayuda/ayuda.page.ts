import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonAccordion,
  IonAccordionGroup,
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  helpCircleOutline,
  mailOutline,
  callOutline,
  arrowBackOutline,
  sendOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-ayuda',
  standalone: true,
  templateUrl: './ayuda.page.html',
  styleUrls: ['./ayuda.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonAccordion,
    IonAccordionGroup,
  ],
})
export class AyudaPage {
  @Output() volver = new EventEmitter<void>();

  nombre = '';
  correo = '';
  mensaje = '';

  constructor() {
    addIcons({
      helpCircleOutline,
      mailOutline,
      callOutline,
      arrowBackOutline,
      sendOutline,
    });
  }

  enviarSolicitud() {
    if (!this.nombre.trim() || !this.correo.trim() || !this.mensaje.trim()) {
      alert('Completa todos los campos para solicitar asistencia.');
      return;
    }

    alert('Tu solicitud ha sido preparada. Gracias por contactar a SwiftLoad.');

    this.nombre = '';
    this.correo = '';
    this.mensaje = '';
  }
}