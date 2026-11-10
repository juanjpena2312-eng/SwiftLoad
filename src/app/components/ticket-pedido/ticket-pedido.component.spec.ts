import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketPedidoComponent } from './ticket-pedido.component';

describe('TicketPedidoComponent', () => {
  let component: TicketPedidoComponent;
  let fixture: ComponentFixture<TicketPedidoComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TicketPedidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
