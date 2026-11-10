import {
  Component,
  EventEmitter,
  Input,
  Output,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
  ElementRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Pedido } from '../../services/pedidos.service';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-ticket-pedido',
  templateUrl: './ticket-pedido.component.html',
  styleUrls: ['./ticket-pedido.component.scss'],
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TicketPedidoComponent {

  @Input() pedido: Pedido | null = null;

  @Output() volver = new EventEmitter<void>();

  @ViewChild('ticketContainer', { static: false })
  ticketContainer!: ElementRef;

  async imprimirTicket() {
    try {
      const element = this.ticketContainer.nativeElement;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(
        imgData,
        'PNG',
        0,
        0,
        pdfWidth,
        pdfHeight
      );

      pdf.save(
        `Ticket-${this.pedido?.id || 'SwiftLoad'}.pdf`
      );

    } catch (error) {
      console.error('Error al generar PDF:', error);
    }
  }
}