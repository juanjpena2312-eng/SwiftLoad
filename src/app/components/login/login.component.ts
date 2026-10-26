import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonLabel, IonItem, IonInput, IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, rocketOutline, mailOutline,
  lockClosedOutline, logInOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IonLabel, IonItem, IonInput, IonButton, IonIcon],
  templateUrl: './login.component.html',
  styleUrls: ['../shared/auth.shared.scss', './login.component.scss'],
})
export class LoginComponent {
  @Input() mensajeError = '';
  @Output() ingresar = new EventEmitter<{ correo: string; contrasena: string }>();
  @Output() volver = new EventEmitter<void>();
  @Output() irARegistro = new EventEmitter<void>();

  correo = '';
  contrasena = '';

  constructor() {
    addIcons({ arrowBackOutline, rocketOutline, mailOutline, lockClosedOutline, logInOutline });
  }

  enviar() {
    this.ingresar.emit({ correo: this.correo, contrasena: this.contrasena });
  }
}