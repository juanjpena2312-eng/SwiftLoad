import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pedido } from '../../services/pedidos.service';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="historial-contenido">
      <button type="button" class="historial-volver" (click)="volver.emit()">
        ← Volver a Inicio
      </button>

      <h1 class="historial-titulo">Mis pedidos</h1>
      <p class="historial-sub">Toca cualquier pedido para ver su ticket y detalles de gasto</p>

      @if (cargando) {
        <p class="historial-estado">Cargando pedidos...</p>
      } @else if (error) {
        <p class="historial-error">{{ error }}</p>
      } @else if (pedidos.length === 0) {
        <div class="historial-vacio">
          <h3>Aún no tienes pedidos</h3>
          <p>Cuando hagas tu primer pedido aparecerá aquí.</p>
        </div>
      } @else {
        @for (p of pedidos; track p.id) {
          <!-- Tarjeta interactiva que ahora abre el ticket -->
          <div class="pedido-card" (click)="verTicket.emit(p)" style="cursor: pointer;">
            <div class="pedido-cabecera">
              <strong>{{ p.numero_orden ? '#' + p.numero_orden : 'Pedido ' + p.id }}</strong>
              <span class="pedido-estado" [attr.data-estado]="p.estado">{{ p.estado }}</span>
            </div>
            @if (p.restaurante) {
              <div class="pedido-meta">{{ p.restaurante }}</div>
            }
            <small>{{ p.creado_en | date: 'dd/MM/yyyy HH:mm' }}</small>

            @if (p.items?.length) {
              <ul>
                @for (i of p.items; track $index) {
                  <li>
                    {{ i.cantidad }} × {{ i.nombre }}
                    <span>\${{ i.precio * i.cantidad | number: '1.2-2' }}</span>
                  </li>
                }
              </ul>
            }

            <div class="pedido-total" style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
              <span style="font-size: 0.8rem; color: #0d9488; font-weight: 700;">🧾 Toca para ver ticket y gasto</span>
              <span>Total: \${{ p.total | number: '1.2-2' }}</span>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .historial-contenido { padding: 16px; }
    .historial-volver {
      background: #e8f0ff; color: #1a56ff; border: 0; border-radius: 999px;
      padding: 8px 14px; font-weight: 600; cursor: pointer; margin-bottom: 12px;
    }
    .historial-titulo { margin: 8px 0 0; font-size: 1.4rem; }
    .historial-sub { margin: 2px 0 16px; color: #64708a; }
    .historial-vacio { text-align: center; padding: 40px 0; color: #64708a; }
    .historial-estado { text-align: center; color: #64708a; }
    .historial-error { text-align: center; color: #d93025; }
    .pedido-card {
      background: #fff; border-radius: 16px; padding: 14px 16px;
      margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.06);
      transition: all 0.2s ease-in-out;
    }
    .pedido-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(13, 148, 136, 0.2);
      border: 1.5px solid #0d9488;
    }
    .pedido-cabecera { display: flex; justify-content: space-between; align-items: center; }
    .pedido-meta { color: #64708a; margin-top: 2px; }
    .pedido-estado {
      border-radius: 999px; padding: 2px 10px; font-size: .75rem;
      font-weight: 600; color: #fff; background: #64708a;
    }
    .pedido-estado[data-estado="Pendiente"] { background: #f5a623; }
    .pedido-estado[data-estado="En preparación"] { background: #ff9800; }
    .pedido-estado[data-estado="En camino"] { background: #2196f3; }
    .pedido-estado[data-estado="Entregado"] { background: #4caf50; }
    .pedido-estado[data-estado="Cancelado"] { background: #f44336; }
    .pedido-card small { color: #64708a; }
    .pedido-card ul { list-style: none; padding: 0; margin: 10px 0; }
    .pedido-card li { display: flex; justify-content: space-between; padding: 3px 0; }
    .pedido-total { font-weight: 700; }
  `],
})
export class HistorialComponent {
  @Input() pedidos: Pedido[] = [];
  @Input() cargando = false;
  @Input() error = '';
  @Output() volver = new EventEmitter<void>();
  @Output() verTicket = new EventEmitter<Pedido>(); // 👈 Nuevo evento para emitir el pedido al ticket
}