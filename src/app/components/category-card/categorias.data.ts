import { Categoria } from './category-card.component';

export const CATEGORIAS: Categoria[] = [
  { nombre: 'Comida',         descripcion: 'Restaurantes y comida rápida',  icono: 'restaurant-outline', color: '#ff5a1f' },
  { nombre: 'Bebidas',        descripcion: 'Café, jugos y más',             icono: 'cafe-outline',       color: '#92400e' },
  { nombre: 'Supermercado',   descripcion: 'Tus compras del hogar',         icono: 'cart-outline',       color: '#16a34a' },
  { nombre: 'Farmacia',       descripcion: 'Medicinas y cuidado personal',  icono: 'medkit-outline',     color: '#dc2626' },
  { nombre: 'Regalos',        descripcion: 'Sorprende a alguien especial',  icono: 'gift-outline',       color: '#db2777' },
  { nombre: 'Paquetes',       descripcion: 'Envía y recibe paquetes',       icono: 'cube-outline',       color: '#1557f6' },
  { nombre: 'Envío express',  descripcion: 'Entrega en el mismo día',       icono: 'flash-outline',      color: '#f59e0b' },
  { nombre: 'Rastrear pedido',descripcion: 'Mira dónde va tu pedido',       icono: 'location-outline',   color: '#0891b2' },
  { nombre: 'Mis pedidos',    descripcion: 'Historial de tus pedidos',      icono: 'receipt-outline',    color: '#7c3aed' },
  { nombre: 'Ayuda',          descripcion: 'Soporte y preguntas',           icono: 'help-buoy-outline',  color: '#0f1b3d' },
];