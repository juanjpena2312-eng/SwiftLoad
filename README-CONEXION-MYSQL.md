# SwiftLoad: conexión de ejemplo Ionic + Angular + Node.js + MySQL

Este ZIP añade un CRUD de ejemplo para `productos`. No conocemos aún el esquema real de tu base de datos, así que la tabla es demostrativa y se puede adaptar.

## 1. Requisitos
- Node.js instalado
- XAMPP con MySQL iniciado
- Base de datos existente en phpMyAdmin

## 2. Preparar MySQL
1. Abre `http://localhost/phpmyadmin`.
2. Selecciona tu base de datos.
3. Si no tienes una tabla de prueba llamada `productos`, puedes ejecutar `backend/schema-demo.sql`.
   No ejecutes ese SQL si ya tienes una tabla con ese nombre o prefieres usar tus tablas reales.

## 3. Configurar la API
En terminal:
```bash
cd backend
npm install
```
Copia `backend/.env.example` como `backend/.env` y cambia `DB_NAME` por el nombre exacto de tu base de datos. Introduce `DB_PASSWORD` si tu MySQL tiene contraseña.

Inicia la API:
```bash
npm start
```
Debería indicar que la conexión MySQL es correcta y que la API está en `http://localhost:3000`.
Prueba `http://localhost:3000/api` y `http://localhost:3000/api/productos`.

## 4. Iniciar Ionic
En otra terminal, desde la carpeta raíz del proyecto:
```bash
npm install
npm start
```
Abre la URL que muestre Ionic, normalmente `http://localhost:8100/tabs/tab1`.

## 5. Notas
- La API de ejemplo usa `productos(id, nombre, precio, stock)`.
- El frontend usa `http://localhost:3000/api` para desarrollo local.
- Este ejemplo está configurado para navegador local. Para un celular físico, `localhost` apunta al propio celular; hay que cambiar `apiUrl` por la IP local de la computadora y ajustar CORS/firewall.
- No publiques credenciales de MySQL ni expongas el servidor de desarrollo directamente a Internet.
- Antes de producción, añade autenticación, autorización, validaciones más estrictas y configuración de CORS por dominio.
