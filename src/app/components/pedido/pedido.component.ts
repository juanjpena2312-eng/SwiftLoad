import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pedido',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pedido.component.html',
  styleUrls: ['./pedido.component.scss'],
})
export class PedidoComponent {
  @Input() productos: any[] = [];
  @Input() restaurante = '';
  @Input() mensaje = '';

  @Output() volver = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<void>();
  @Output() quitar = new EventEmitter<number>();

  precio(p: any): number {
    return Number(p?.precio) || 0;
  }

  get total(): number {
    return this.productos.reduce((suma, p) => suma + this.precio(p), 0);
  }
}