
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonButton, IonContent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { rocketOutline } from 'ionicons/icons';

import { WelcomeComponent } from '../components/welcome/welcome.component';
import { LoginComponent } from '../components/login/login.component';
import { RegistrarComponent } from '../components/registrar/registrar.component';
import { HomeComponent } from '../components/home/home.component';
import { SubcategoriasComponent } from '../components/subcategorias/subcategorias.component';
import { RestaurantesComponent } from '../components/restaurantes/restaurantes.component';
import { ProductosComponent } from '../components/productos/productos.component';
import { Categoria } from '../components/category-card/category-card.component';
import { AyudaPage } from '../ayuda/ayuda.page';

import { AuthService } from '../services/auth.service';
import {
  CategoriasService, Producto, Resena, Restaurante, Subcategoria,
} from '../services/categorias.service';

type Pantalla =
  | 'bienvenida'
  | 'login'
  | 'registro'
  | 'inicio'
  | 'subcategorias'
  | 'restaurantes'
  | 'productos'
  | 'ayuda';

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
    AyudaPage
  ],
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

  constructor(
    private auth: AuthService,
    private categoriasService: CategoriasService,
    private cdr: ChangeDetectorRef,
  ) {
    addIcons({ rocketOutline });
  }

  get hayUsuario(): boolean {
    return [
      'inicio',
      'subcategorias',
      'restaurantes',
      'productos',
      'ayuda'
    ].includes(this.pantalla);
  }

  ngOnInit() {
    const usuario = this.auth.obtenerSesion();

    if (usuario) {
      this.nombreUsuario = usuario.nombre;
      this.pantalla = 'inicio';
      this.cargarCategorias();
    }
  }

  async cargarCategorias() {
    try {
      this.categorias = await this.categoriasService.obtenerCategorias();
    } catch (error) {
      this.mensajeError = 'No se pudieron cargar las categorías.';
    } finally {
      this.cdr.detectChanges();
    }
  }

  // Navegación de acceso
  comenzar() {
    this.mensajeError = '';
    this.pantalla = 'login';
  }

  volverBienvenida() {
    this.mensajeError = '';
    this.pantalla = 'bienvenida';
  }

  mostrarLogin() {
    this.mensajeError = '';
    this.pantalla = 'login';
  }

  mostrarRegistro() {
    this.mensajeError = '';
    this.pantalla = 'registro';
  }

  async iniciarSesion(datos: { correo: string; contrasena: string }) {
    if (!datos.correo || !datos.contrasena) {
      this.mensajeError = 'Completa todos los campos.';
      return;
    }

    try {
      const usuario = await this.auth.iniciarSesion(
        datos.correo.trim(),
        datos.contrasena
      );

      this.auth.guardarSesion(usuario);
      this.nombreUsuario = usuario.nombre;
      this.mensajeError = '';
      this.pantalla = 'inicio';
      this.cargarCategorias();
    } catch (error) {
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
  }) {
    const { nombre, correo, contrasena, confirmarContrasena } = datos;

    if (!nombre || !correo || !contrasena || !confirmarContrasena) {
      this.mensajeError = 'Completa todos los campos.';
      return;
    }

    if (contrasena.length < 8) {
      this.mensajeError = 'La contraseña debe tener mínimo 8 caracteres.';
      return;
    }

    if (contrasena !== confirmarContrasena) {
      this.mensajeError = 'Las contraseñas no coinciden.';
      return;
    }

    try {
      const usuario = await this.auth.registrar(
        nombre.trim(),
        correo.trim(),
        contrasena
      );

      this.auth.guardarSesion(usuario);
      this.nombreUsuario = usuario.nombre;
      this.mensajeError = '';
      this.pantalla = 'inicio';
      this.cargarCategorias();
    } catch (error) {
      this.mensajeError = this.auth.traducirError(error);
    } finally {
      this.cdr.detectChanges();
    }
  }

  cerrarSesion() {
    this.auth.cerrarSesion();
    this.nombreUsuario = '';
    this.mensajeError = '';
    this.categorias = [];
    this.subcategorias = [];
    this.restaurantes = [];
    this.productos = [];
    this.resenas = [];
    this.carrito = [];
    this.categoriaPadre = null;
    this.subActual = null;
    this.categoriaActual = null;
    this.restauranteActual = null;
    this.pantalla = 'bienvenida';
  }

  // Categoría → tipos
  async seleccionarCategoria(categoria: Categoria) {

    if (categoria.nombre.trim().toLowerCase() === 'ayuda') {
      this.pantalla = 'ayuda';
      return;
    }

    if (!categoria.id) return;

    this.categoriaPadre = categoria;
    this.subcategorias = [];
    this.errorSub = '';
    this.cargandoSub = true;
    this.pantalla = 'subcategorias';

    try {
      this.subcategorias =
        await this.categoriasService.obtenerSubcategorias(categoria.id);

      if (this.subcategorias.length === 0) {
        this.origenProductos = 'inicio';
        this.restauranteActual = null;
        this.resenas = [];

        await this.abrirProductos(categoria, () =>
          this.categoriasService.obtenerProductos(categoria.id!)
        );
      }
    } catch (error) {
      console.error('Error cargando subcategorías:', error);
      this.errorSub = 'No se pudieron cargar las opciones.';
    } finally {
      this.cargandoSub = false;
      this.cdr.detectChanges();
    }
  }

  // Tipo → restaurantes
  async seleccionarSubcategoria(sub: Subcategoria) {
    this.subActual = sub;
    this.restaurantes = [];
    this.errorRest = '';
    this.cargandoRest = true;
    this.pantalla = 'restaurantes';

    try {
      this.restaurantes =
        await this.categoriasService.obtenerRestaurantes(sub.id);

      if (this.restaurantes.length === 0) {
        this.origenProductos = 'subcategorias';
        this.restauranteActual = null;
        this.resenas = [];

        await this.abrirProductos(this.visualDeSub(sub), () =>
          this.categoriasService.obtenerProductosSubcategoria(sub.id)
        );
      }
    } catch (error) {
      console.error('Error cargando restaurantes:', error);
      this.errorRest = 'No se pudieron cargar los restaurantes.';
    } finally {
      this.cargandoRest = false;
      this.cdr.detectChanges();
    }
  }

  // Restaurante → menú y reseñas
  async seleccionarRestaurante(restaurante: Restaurante) {
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
        this.categoriasService.obtenerResenas(restaurante.id),
      ]);

      this.productos = menu;
      this.resenas = resenas;
    } catch (error) {
      console.error('Error cargando el menú:', error);
      this.errorProductos = 'No se pudo cargar el menú.';
    } finally {
      this.cargandoProductos = false;
      this.cdr.detectChanges();
    }
  }

  async publicarResena(datos: {
    calificacion: number;
    comentario: string;
  }) {
    const usuario = this.auth.obtenerSesion();
    const restaurante = this.restauranteActual;

    if (!usuario || !restaurante) return;

    try {
      await this.categoriasService.crearResena(
        restaurante.id,
        usuario.id,
        datos.calificacion,
        datos.comentario
      );

      this.resenas =
        await this.categoriasService.obtenerResenas(restaurante.id);

      if (this.subActual) {
        this.restaurantes =
          await this.categoriasService.obtenerRestaurantes(this.subActual.id);

        const actualizado = this.restaurantes.find(
          r => r.id === restaurante.id
        );

        if (actualizado) this.restauranteActual = actualizado;
      }
    } catch (error) {
      console.error('Error guardando reseña:', error);
      this.errorProductos = 'No se pudo guardar la reseña.';
    } finally {
      this.cdr.detectChanges();
    }
  }

  private visualDeSub(sub: Subcategoria): Categoria {
    return {
      id: sub.id,
      nombre: sub.nombre,
      descripcion: this.categoriaPadre
        ? `Dentro de ${this.categoriaPadre.nombre}`
        : '',
      icono: sub.icono,
      color: sub.color,
    };
  }

  private async abrirProductos(
    cabecera: Categoria,
    cargar: () => Promise<Producto[]>,
  ) {
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
      this.cdr.detectChanges();
    }
  }

  // Botones Volver
  volverDesdeSubcategorias() {
    this.pantalla = 'inicio';
  }

  volverDesdeRestaurantes() {
    this.pantalla = 'subcategorias';
  }

  volverDesdeProductos() {
    this.pantalla = this.origenProductos;
  }

  volverDesdeAyuda() {
    this.pantalla = 'inicio';
  }

  agregarAlCarrito(producto: Producto) {
    this.carrito.push(producto);
  }
}
