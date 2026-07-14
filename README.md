# API Taller Mecánico

API REST hecha en Node.js + Express, conectada a PostgreSQL (Neon).

## Instalación local

```bash
cd taller-api
npm install
cp .env.example .env
```

Edita `.env` y coloca tu `DATABASE_URL` de Neon y un `JWT_SECRET` propio.

Ejecuta el script `taller_mecanico_schema.sql` en tu base de Neon (SQL Editor o psql) antes de iniciar la API.

```bash
npm run dev
```

La API queda corriendo en `http://localhost:3000`.

## Endpoints principales

| Método | Ruta | Descripción | Requiere token |
|---|---|---|---|
| POST | /api/auth/registro | Crear usuario | No |
| POST | /api/auth/login | Iniciar sesión (devuelve token) | No |
| GET | /api/clientes | Listar clientes | Sí |
| POST | /api/clientes | Crear cliente | Sí |
| GET | /api/vehiculos?cliente_id=1 | Vehículos de un cliente | Sí |
| GET | /api/vehiculos/:id/historial | Historial de mantenimiento | Sí |
| POST | /api/vehiculos | Registrar vehículo | Sí |
| GET | /api/mecanicos | Listar mecánicos | Sí |
| GET | /api/servicios | Catálogo de servicios | Sí |
| POST | /api/servicios | Agregar servicio nuevo | Sí |
| GET | /api/ordenes?estado=pendiente | Listar órdenes | Sí |
| GET | /api/ordenes/:id | Detalle de una orden | Sí |
| POST | /api/ordenes | Crear orden con servicios | Sí |
| PUT | /api/ordenes/:id/estado | Cambiar estado de la orden | Sí |

Para las rutas protegidas, envía el token así:
```
Authorization: Bearer <token>
```

## Probar rápido con los datos de ejemplo

Usuario ya cargado en el script SQL:
- email: `juan@correo.com`
- Nota: el password_hash de prueba NO es un hash real de bcrypt.
  Regístrate con `/api/auth/registro` para crear un usuario funcional,
  o actualiza el password_hash manualmente con un hash generado por bcrypt.

## Despliegue a hosting (para la sustentación)

Opciones gratuitas recomendadas:
- **Render.com** (Web Service, conecta tu repo de GitHub, agrega las variables de entorno)
- **Railway.app**
- **Vercel** (para APIs serverless, requiere adaptar un poco la estructura)

Pasos generales (Render):
1. Sube esta carpeta a un repositorio de GitHub.
2. En Render, crea un "New Web Service" y conecta el repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Agrega las variables de entorno `DATABASE_URL`, `JWT_SECRET`, `PORT` en la sección Environment.
6. Una vez desplegado, usa esa URL pública en tu app de Android Studio en vez de `localhost`.
