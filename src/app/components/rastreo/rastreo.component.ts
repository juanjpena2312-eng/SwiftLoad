import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-rastrear',
  templateUrl: './rastrear.page.html',
  styleUrls: ['./rastrear.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class RastrearPage implements OnInit {
  pedido: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Definimos siempre un pedido por defecto con productos para que la pantalla NUNCA se vea vacía
    this.pedido = {
      id: 1,
      numero_orden: 'SW4S1',
      restaurante: 'Dominos Pizza',
      estado: 'En camino',
      creado_en: '2026-11-05 22:15',
      total: 35.00,
      items: [
        { cantidad: 2, nombre: 'Doble Whopper', precio: 8.25 },
        { cantidad: 1, nombre: 'Pizza Extravaganza', precio: 18.50 }
      ]
    };

    // Intentamos capturar si se pasó algo por parámetro
    this.route.queryParams.subscribe(params => {
      if (params['pedido']) {
        try {
          const parsed = JSON.parse(params['pedido']);
          if (parsed) {
            this.pedido = { ...this.pedido, ...parsed };
          }
        } catch (e) {
          console.error('Error al leer el pedido:', e);
        }
      }
    });
  }

  volver() {
    this.router.navigate(['/tabs/tab2']);
  }
}