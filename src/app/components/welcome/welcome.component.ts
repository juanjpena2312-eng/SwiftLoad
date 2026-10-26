import { Component, EventEmitter, Output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  rocketOutline, cubeOutline, locationOutline,
  airplaneOutline, arrowBackOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [IonButton, IonIcon],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent {
  @Output() comenzar = new EventEmitter<void>();

  constructor() {
    addIcons({ rocketOutline, cubeOutline, locationOutline, airplaneOutline, arrowBackOutline });
  }
}