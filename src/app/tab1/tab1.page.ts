import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonButton,
  IonContent
} from '@ionic/angular';

import { AyudaPage } from '../components/ayuda/ayuda.page';
import { HistorialComponent } from '../components/historial/historial.component';
import { PedidoComponent } from '../components/pedido/pedido.component';
import { TicketPedidoComponent } from '../components/ticket-pedido/ticket-pedido.component'; // 👈 1. Importar el componente del ticket
import { PedidosService, Pedido } from '../services/pedidos.service';
import { WelcomeComponent } from '../components/welcome/welcome.component';
import { LoginComponent } from '../components/login/login.component';
import { RegistrarComponent } from '../components/registrar/registrar.component';
import { HomeComponent } from '../components/home/home.component';
import { SubcategoriasComponent } from '../components/subcategorias/subcategorias.component';
import { RestaurantesComponent } from '../components/restaurantes/restaurantes.component';
import { ProductosComponent } from '../components/productos/productos.component';
import { Categoria } from '../components/category-card/category-card.component';
import { AuthService } from '../services/auth.service';
import {
  CategoriasService,
  Producto,
  Resena,
  Restaurante,
  Subcategoria
} from '../services/categorias.service';

import { EstadoSwiftLoadService } from '../services/estado-swiftload.service';

type Pantalla =
  | 'bienvenida'
  | 'login'
  | 'registro'
  | 'inicio'
  | 'subcategorias'
  | 'restaurantes'
  | 'productos'
  | 'ayuda'
  | 'pedidos'
  | 'pedido'
  | 'ticket'; // 👈 2. Añadir 'ticket' a los tipos de pantalla permitidos

type Origen = 'inicio' | 'subcategorias' | 'restaurantes';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonButton,
    IonContent,
    WelcomeComponent,
    LoginComponent,
    RegistrarComponent,
    HomeComponent,
    SubcategoriasComponent,
    RestaurantesComponent,
    ProductosComponent,
    AyudaPage,
    HistorialComponent,
    PedidoComponent,
    TicketPedidoComponent // 👈 3. Declararlo en los imports del componente
  ]
})
export class Tab1Page implements OnInit {

  pantalla: Pantalla = 'bienvenida';

  mensajeError = '';
  nombreUsuario = '';
  categorias: Categoria[] = [];

  categoriaPadre: Categoria | null = null;
  subcategorias: Subcategoria[] = [];
  cargandoSub = false;
  errorSub = '';

  subActual: Subcategoria | null = null;
  restaurantes: Restaurante[] = [];
  cargandoRest = false;
  errorRest = '';

  categoriaActual: Categoria | null = null;
  restauranteActual: Restaurante | null = null;
  productos: Producto[] = [];
  resenas: Resena[] = [];
  cargandoProductos = false;
  errorProductos = '';

  origenProductos: Origen = 'inicio';

  carrito: Producto[] = [];

  pedidos: Pedido[] = [];
  cargandoPedidos = false;
  errorPedidos = '';
  mensajePedido = '';

  pedidoSeleccionado: Pedido | null = null; // 👈 4. Variable para guardar el pedido del ticket

  private readonly auth = inject(AuthService);
  private readonly categoriasService = inject(CategoriasService);
  private readonly pedidosService = inject(PedidosService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly estadoSwiftLoad = inject(EstadoSwiftLoadService);
  private readonly router = inject(Router);

  get hayUsuario(): boolean {
    return [
      'inicio',
      'subcategorias',
      'restaurantes',
      'productos',
      'ayuda',
      'pedidos',
      'pedido',
      'ticket'
    ].includes(this.pantalla);
  }

  ngOnInit(): void {
    const usuario = this.auth.obtenerSesion();

    if (usuario) {
      this.nombreUsuario = usuario.nombre;
    }

    const estado = this.estadoSwiftLoad.obtenerEstado();

    if (estado && usuario) {
      this.pantalla = estado.pantalla;
      this.nombreUsuario = usuario.nombre;
      this.categorias = estado.categorias;
      this.categoriaPadre = estado.categoriaPadre;
      this.subcategorias = estado.subcategorias;
      this.subActual = estado.subActual;
      this.restaurantes = estado.restaurantes;
      this.categoriaActual = estado.categoriaActual;
      this.restauranteActual = estado.restauranteActual;
      this.productos = estado.productos;
      this.resenas = estado.resenas;
      this.origenProductos = estado.origenProductos;
      this.carrito = estado.carrito;
      this.pedidos = estado.pedidos;
      this.mensajePedido = estado.mensajePedido;

      this.cdr.detectChanges();
      return;
    }

    if (usuario) {
      this.pantalla = 'inicio';
      this.cargarCategorias();
    }
  }

  ionViewWillEnter(): void {
    const usuario = this.auth.obtenerSesion();

    if (!usuario && this.pantalla !== 'bienvenida') {
      this.cerrarSesion();
      return;
    }

    if (usuario) {
      this.nombreUsuario = usuario.nombre;
      this.cdr.detectChanges();
    }
  }

  guardarEstado(): void {
    if (!this.auth.obtenerSesion()) {
      return;
    }

    this.estadoSwiftLoad.guardarEstado({
      pantalla: this.pantalla,
      nombreUsuario: this.nombreUsuario,
      categorias: this.categorias,
      categoriaPadre: this.categoriaPadre,
      subcategorias: this.subcategorias,
      subActual: this.subActual,
      restaurantes: this.restaurantes,
      categoriaActual: this.categoriaActual,
      restauranteActual: this.restauranteActual,
      productos: this.productos,
      resenas: this.resenas,
      origenProductos: this.origenProductos,
      carrito: this.carrito,
      pedidos: this.pedidos,
      mensajePedido: this.mensajePedido
    });
  }

  ionViewWillLeave(): void {
    this.guardarEstado();
  }

  async cargarCategorias(): Promise<void> {
    try {
      this.categorias = await this.categoriasService.obtenerCategorias();
    } catch (error) {
      console.error('Error cargando categorías:', error);
      this.mensajeError = 'No se pudieron cargar las categorías.';
    } finally {
      this.guardarEstado();
      this.cdr.detectChanges();
    }
  }

  comenzar(): void {
    this.mensajeError = '';
    this.pantalla = 'login';
  }

  volverBienvenida(): void {
    this.mensajeError = '';
    this.pantalla = 'bienvenida';
  }

  mostrarLogin(): void {
    this.mensajeError = '';
    this.pantalla = 'login';
  }

  mostrarRegistro(): void {
    this.mensajeError = '';
    this.pantalla = 'registro';
  }

  async iniciarSesion(datos: { correo: string; contrasena: string }): Promise<void> {
    if (!datos.correo || !datos.contrasena) {
      this.mensajeError = 'Completa todos los campos.';
      this.cdr.detectChanges();
      return;
    }

    try {
      const usuario = await this.auth.iniciarSesion(
        datos.correo.trim(),
        datos.contrasena
      );

      if (!usuario || !usuario.id || !usuario.nombre || !usuario.correo) {
        throw new Error('El servidor no devolvió correctamente los datos del usuario.');
      }

      this.auth.guardarSesion(usuario);
      this.estadoSwiftLoad.limpiarEstado();

      this.nombreUsuario = usuario.nombre;
      this.mensajeError = '';
      this.pantalla = 'inicio';

      await this.cargarCategorias();
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      this.mensajeError = this.auth.traducirError(error);
    } finally {
      this.cdr.detectChanges();
    }
  }

  async registrarUsuario(datos: {
    nombre: string;
    correo: string;
    contrasena: string;
    confirmarContrasena: string;
  }): Promise<void> {
    const { nombre, correo, contrasena, confirmarContrasena } = datos;

    if (!nombre || !correo || !contrasena || !confirmarContrasena) {
      this.mensajeError = 'Completa todos los campos.';
      this.cdr.detectChanges();
      return;
    }

    if (contrasena.length < 8) {
      this.mensajeError = 'La contraseña debe tener mínimo 8 caracteres.';
      this.cdr.detectChanges();
      return;
    }

    if (contrasena !== confirmarContrasena) {
      this.mensajeError = 'Las contraseñas no coinciden.';
      this.cdr.detectChanges();
      return;
    }

    try {
      const usuario = await this.auth.registrar(
        nombre.trim(),
        correo.trim(),
        contrasena
      );

      if (!usuario || !usuario.id || !usuario.nombre || !usuario.correo) {
        throw new Error('El servidor no devolvió correctamente los datos del usuario.');
      }

      this.auth.guardarSesion(usuario);
      this.estadoSwiftLoad.limpiarEstado();

      this.nombreUsuario = usuario.nombre;
      this.mensajeError = '';
      this.pantalla = 'inicio';

      await this.cargarCategorias();
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      this.mensajeError = this.auth.traducirError(error);
    } finally {
      this.cdr.detectChanges();
    }
  }

  cerrarSesion(): void {
    this.estadoSwiftLoad.limpiarEstado();
    this.auth.cerrarSesion();

    this.nombreUsuario = '';
    this.mensajeError = '';
    this.categorias = [];
    this.subcategorias = [];
    this.restaurantes = [];
    this.productos = [];
    this.resenas = [];
    this.carrito = [];
    this.pedidos = [];
    this.mensajePedido = '';

    this.categoriaPadre = null;
    this.subActual = null;
    this.categoriaActual = null;
    this.restauranteActual = null;
    this.pantalla = 'bienvenida';

    this.cdr.detectChanges();
  }

  async seleccionarCategoria(categoria: Categoria): Promise<void> {
    if (!categoria.id) return;

    if (categoria.nombre?.trim().toLowerCase() === 'ayuda') {
      this.mostrarAyuda();
      return;
    }

    if (categoria.nombre?.trim().toLowerCase() === 'mis pedidos') {
      await this.mostrarPedidos();
      return;
    }

    this.categoriaPadre = categoria;
    this.subcategorias = [];
    this.errorSub = '';
    this.cargandoSub = true;
    this.pantalla = 'subcategorias';

    try {
      this.subcategorias = await this.categoriasService.obtenerSubcategorias(categoria.id);

      if (this.subcategorias.length === 0) {
        this.origenProductos = 'inicio';
        this.restauranteActual = null;
        this.resenas = [];

        await this.abrirProductos(
          categoria,
          () => this.categoriasService.obtenerProductos(categoria.id!)
        );
      }
    } catch (error) {
      console.error('Error cargando subcategorías:', error);
      this.errorSub = 'No se pudieron cargar las opciones.';
    } finally {
      this.cargandoSub = false;
      this.guardarEstado();
      this.cdr.detectChanges();
    }
  }

  async seleccionarSubcategoria(sub: Subcategoria): Promise<void> {
    this.subActual = sub;
    this.restaurantes = [];
    this.errorRest = '';
    this.cargandoRest = true;
    this.pantalla = 'restaurantes';

    try {
      this.restaurantes = await this.categoriasService.obtenerRestaurantes(sub.id);

      if (this.restaurantes.length === 0) {
        this.origenProductos = 'subcategorias';
        this.restauranteActual = null;
        this.resenas = [];

        await this.abrirProductos(
          this.visualDeSub(sub),
          () => this.categoriasService.obtenerProductosSubcategoria(sub.id)
        );
      }
    } catch (error) {
      console.error('Error cargando restaurantes:', error);
      this.errorRest = 'No se pudieron cargar los restaurantes.';
    } finally {
      this.cargandoRest = false;
      this.guardarEstado();
      this.cdr.detectChanges();
    }
  }

  async seleccionarRestaurante(restaurante: Restaurante): Promise<void> {
    this.restauranteActual = restaurante;
    this.origenProductos = 'restaurantes';

    this.categoriaActual = this.subActual
      ? this.visualDeSub(this.subActual)
      : null;

    this.productos = [];
    this.resenas = [];
    this.errorProductos = '';
    this.cargandoProductos = true;
    this.pantalla = 'productos';

    try {
      const [menu, resenas] = await Promise.all([
        this.categoriasService.obtenerMenu(restaurante.id),
        this.categoriasService.obtenerResenas(restaurante.id)
      ]);

      this.productos = menu;
      this.resenas = resenas;
    } catch (error) {
      console.error('Error cargando el menú:', error);
      this.errorProductos = 'No se pudo cargar el menú.';
    } finally {
      this.cargandoProductos = false;
      this.guardarEstado();
      this.cdr.detectChanges();
    }
  }

  async publicarResena(datos: { calificacion: number; comentario: string }): Promise<void> {
    const usuario = this.auth.obtenerSesion();
    const restaurante = this.restauranteActual;

    if (!usuario || !restaurante) {
      this.errorProductos = 'Debes iniciar sesión para publicar una reseña.';
      this.cdr.detectChanges();
      return;
    }

    try {
      this.errorProductos = '';

      await this.categoriasService.crearResena(
        restaurante.id,
        usuario.id,
        datos.calificacion,
        datos.comentario
      );

      this.resenas = await this.categoriasService.obtenerResenas(restaurante.id);

      if (this.subActual) {
        this.restaurantes = await this.categoriasService.obtenerRestaurantes(this.subActual.id);
        const actualizado = this.restaurantes.find(r => r.id === restaurante.id);
        if (actualizado) {
          this.restauranteActual = actualizado;
        }
      }
    } catch (error) {
      console.error('Error guardando reseña:', error);
      this.errorProductos = 'No se pudo guardar la reseña.';
    } finally {
      this.guardarEstado();
      this.cdr.detectChanges();
    }
  }

  private visualDeSub(sub: Subcategoria): Categoria {
    return {
      id: sub.id,
      nombre: sub.nombre,
      descripcion: this.categoriaPadre ? `Dentro de ${this.categoriaPadre.nombre}` : '',
      icono: sub.icono,
      color: sub.color
    };
  }

  private async abrirProductos(
    cabecera: Categoria,
    cargar: () => Promise<Producto[]>
  ): Promise<void> {
    this.categoriaActual = cabecera;
    this.productos = [];
    this.errorProductos = '';
    this.cargandoProductos = true;
    this.pantalla = 'productos';

    try {
      this.productos = await cargar();
    } catch (error) {
      console.error('Error cargando productos:', error);
      this.errorProductos = 'No se pudieron cargar los productos.';
    } finally {
      this.cargandoProductos = false;
      this.guardarEstado();
      this.cdr.detectChanges();
    }
  }

  volverDesdeSubcategorias(): void {
    this.pantalla = 'inicio';
    this.guardarEstado();
  }

  volverDesdeRestaurantes(): void {
    this.pantalla = 'subcategorias';
    this.guardarEstado();
  }

  volverDesdeProductos(): void {
    this.pantalla = this.origenProductos;
    this.guardarEstado();
  }

  volverDesdeAyuda(): void {
    this.pantalla = 'inicio';
    this.guardarEstado();
  }

  mostrarAyuda(): void {
    this.pantalla = 'ayuda';
    this.guardarEstado();
  }

  async mostrarPedidos(): Promise<void> {
    const usuario = this.auth.obtenerSesion();

    this.pedidos = [];
    this.errorPedidos = '';
    this.pantalla = 'pedidos';

    if (!usuario) {
      this.errorPedidos = 'Debes iniciar sesión para ver tus pedidos.';
      this.cdr.detectChanges();
      return;
    }

    this.cargandoPedidos = true;

    try {
      this.pedidos = await this.pedidosService.obtenerPedidos(usuario.id);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      this.errorPedidos = 'No se pudieron cargar tus pedidos.';
    } finally {
      this.cargandoPedidos = false;
      this.guardarEstado();
      this.cdr.detectChanges();
    }
  }

  volverDesdePedidos(): void {
    this.pantalla = 'inicio';
    this.guardarEstado();
  }

  // 👈 5. Método para abrir el ticket con el pedido seleccionado
  verTicket(pedido: Pedido): void {
    this.pedidoSeleccionado = pedido;
    this.pantalla = 'ticket';
    this.cdr.detectChanges();
  }

  volverDesdeTicket(): void {
    this.pantalla = 'pedidos';
    this.cdr.detectChanges();
  }

  irARastreo(pedido: Pedido): void {
    this.router.navigate(['/rastrear'], {
      queryParams: { pedido: JSON.stringify(pedido) }
    });
  }

  mostrarPedido(): void {
    this.mensajePedido = '';
    this.pantalla = 'pedido';
    this.guardarEstado();
    this.cdr.detectChanges();
  }

  volverDesdePedido(): void {
    this.pantalla = this.categoriaActual ? 'productos' : 'inicio';
    this.guardarEstado();
  }

  quitarDelCarrito(indice: number): void {
    this.carrito = this.carrito.filter((_, i) => i !== indice);
    this.guardarEstado();
    this.cdr.detectChanges();
  }

  async confirmarPedido(): Promise<void> {
    const usuario = this.auth.obtenerSesion();

    if (!usuario) {
      this.mensajePedido = 'Debes iniciar sesión para hacer un pedido.';
      this.cdr.detectChanges();
      return;
    }

    if (this.carrito.length === 0) {
      this.mensajePedido = 'Tu carrito está vacío.';
      this.cdr.detectChanges();
      return;
    }

    try {
      await this.pedidosService.crearPedido(
        usuario.id,
        this.restauranteActual?.id ?? null,
        this.carrito
      );

      this.carrito = [];
      this.mensajePedido = '';

      await this.mostrarPedidos();
    } catch (error) {
      console.error('Error creando el pedido:', error);
      this.mensajePedido = error instanceof Error ? error.message : 'No se pudo enviar el pedido. Intenta de nuevo.';
      this.cdr.detectChanges();
    }
  }

  agregarAlCarrito(producto: Producto): void {
    this.carrito = [...this.carrito, producto];
    this.guardarEstado();
    this.cdr.detectChanges();
  }
}