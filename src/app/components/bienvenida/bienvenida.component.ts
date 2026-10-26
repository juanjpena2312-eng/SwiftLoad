
import { Component, EventEmitter, Output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  rocketOutline,
  cubeOutline,
  locationOutline,
  airplaneOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [IonButton, IonIcon],
  templateUrl: './bienvenida.component.html',
  styleUrls: ['./bienvenida.component.scss']
})
export class BienvenidaComponent {
  @Output() comenzarClick = new EventEmitter<void>();

  constructor() {
    addIcons({
      rocketOutline,
      cubeOutline,
      locationOutline,
      airplaneOutline
    });
  }

  comenzar(): void {
    this.comenzarClick.emit();
  }
}
