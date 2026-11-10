import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonBadge, 
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, 
  IonCardContent, IonButton, IonIcon, IonItem, IonTextarea 
} from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { personOutline, mailOutline, fingerPrintOutline, logOutOutline, star, starOutline } from 'ionicons/icons';
import { AuthService, Usuario } from '../services/auth.service';
import { ResenasAplicacionService } from '../services/resenas-aplicacion.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    FormsModule, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonBadge, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardSubtitle, 
    IonCardContent, 
    IonButton, 
    IonIcon, 
    IonItem, 
    IonTextarea
  ]
})
export class Tab3Page {
  usuario: Usuario | null = null;
  readonly estrellas = [1, 2, 3, 4, 5];
  calificacion = 0;
  comentario = '';
  mensaje = '';
  enviando = false;

  constructor(
    private authService: AuthService,
    private resenasService: ResenasAplicacionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ personOutline, mailOutline, fingerPrintOutline, logOutOutline, star, starOutline });
  }

  ionViewWillEnter(): void {
    this.cargarPerfil();
  }

  async cargarPerfil(): Promise<void> {
    this.usuario = this.authService.obtenerSesion();
    this.mensaje = '';
    this.cdr.detectChanges();

    if (!this.usuario) {
      this.calificacion = 0;
      this.comentario = '';
      this.cdr.detectChanges();
      return;
    }

    try {
      const resena = await this.resenasService.obtenerResena(this.usuario.id);
      this.calificacion = resena?.calificacion ?? 0;
      this.comentario = resena?.comentario ?? '';
    } catch (error) {
      console.error('Error consultando la reseña de la aplicación:', error);
    } finally {
      this.cdr.detectChanges();
    }
  }

  get iniciales(): string {
    if (!this.usuario?.nombre) return 'US';
    return this.usuario.nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(parte => parte.charAt(0).toUpperCase())
      .join('');
  }

  seleccionarCalificacion(valor: number): void {
    this.calificacion = valor;
  }

  async enviarResena(): Promise<void> {
    const usuario = this.authService.obtenerSesion();
    if (!usuario) {
      this.mensaje = 'Debes iniciar sesión para enviar una reseña.';
      return;
    }

    if (this.calificacion < 1 || this.calificacion > 5) {
      this.mensaje = 'Selecciona una calificación.';
      return;
    }

    if (!this.comentario.trim()) {
      this.mensaje = 'Escribe un comentario.';
      return;
    }

    this.enviando = true;
    this.mensaje = '';

    try {
      await this.resenasService.guardarResena({
        usuario_id: usuario.id,
        calificacion: this.calificacion,
        comentario: this.comentario.trim()
      });
      this.mensaje = '¡Tu reseña se guardó correctamente!';
    } catch (error: any) {
      console.error('Error enviando reseña:', error);
      this.mensaje = error?.error?.mensaje || 'No se pudo enviar la reseña.';
    } finally {
      this.enviando = false;
      this.cdr.detectChanges();
    }
  }

  verEnvios(): void {
    this.router.navigateByUrl('/tabs/tab2');
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.usuario = null;
    this.calificacion = 0;
    this.comentario = '';
    this.mensaje = '';
    this.router.navigateByUrl('/', { replaceUrl: true });
  }
}