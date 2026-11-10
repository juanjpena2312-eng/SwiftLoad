import { ChangeDetectorRef, Component, inject } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar
} from '@ionic/angular';
import { Router } from '@angular/router';
import { HistorialComponent } from '../components/historial/historial.component';
import { AuthService } from '../services/auth.service';
import { Pedido, PedidosService } from '../services/pedidos.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    HistorialComponent
  ]
})
export class Tab2Page {
  pedidos: Pedido[] = [];
  cargando = false;
  error = '';
  private usuarioId: number | null = null;

  private readonly authService = inject(AuthService);
  private readonly pedidosService = inject(PedidosService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  get hayUsuario(): boolean {
    return this.usuarioId !== null;
  }

  ionViewWillEnter() {
    this.usuarioId = this.authService.obtenerSesion()?.id ?? null;

    if (this.usuarioId === null) {
      this.pedidos = [];
      this.error = '';
      this.cargando = false;
      this.cdr.detectChanges();
      return;
    }

    void this.cargarPedidos();
  }

  async cargarPedidos() {
    if (this.usuarioId === null) {
      return;
    }

    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    try {
      this.pedidos = await this.pedidosService.obtenerPedidos(this.usuarioId);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      this.error = 'No se pudieron cargar tus envíos. Intenta de nuevo.';
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  irAInicio() {
    void this.router.navigateByUrl('/tabs/tab1');
  }

  iniciarSesion() {
    void this.router.navigateByUrl('/tabs/tab1');
  }
}