import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Pedido } from '../../services/pedidos.service';

@Component({
  selector: 'app-detalle-pedido',
  templateUrl: './detalle-pedido.component.html',
  styleUrls: ['./detalle-pedido.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class DetallePedidoComponent {
  @Input() pedido: Pedido | null = null;
  @Output() volver = new EventEmitter<void>();
}