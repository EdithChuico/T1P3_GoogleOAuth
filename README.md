# Sistema de Gestión Comercial y Autenticación OAuth

**Nombre del estudiante:** Edith Liliana Chuico Navarrete  
**Nombre del proyecto:** Implementación de un flujo distribuido seguro con autenticación, roles y registro de eventos


---

## Descripción de la solución
Esta solución es una aplicación web transaccional de arquitectura cliente-servidor basada en la base de datos Northwind. Implementa un sistema seguro de identidad federada (Google OAuth 2.0) y delegación de acceso mediante JSON Web Tokens (JWT) propios. El sistema permite la consulta del catálogo de productos y la ejecución de compras garantizando la integridad de los datos mediante transacciones atómicas (bloqueos pesimistas en base de datos) y un modelo de Control de Acceso Basado en Roles (RBAC).

---

## Stack Tecnológico
* **Frontend:** React, Vite, TypeScript.
* **Backend:** Node.js, Express, TypeScript.
* **Seguridad:** `google-auth-library`, `jsonwebtoken` (JWT).
* **Patrón de Diseño:** Repository Pattern, Proxy (Middlewares).
* **Control de Versiones:** Git / GitHub.

---

## Base de datos seleccionada
Se utiliza **MySQL** como motor de base de datos relacional (ejecutándose en el puerto `3307`). La estructura principal se apoya en el esquema de **Northwind**, utilizando y afectando directamente las tablas `products`, `orders`, `order_details` y una tabla personalizada `AppUsers` para la persistencia de identidades de Google.

---

## Requisitos previos
Para levantar este proyecto de forma local, asegúrese de contar con:
* **Node.js** (v18 o superior).
* **MySQL Server** (ejecutándose en el puerto 3307).
* Credenciales válidas de la consola de Google Cloud Platform (GCP).

---

## Estructura general del proyecto
El repositorio está dividido en dos aplicaciones independientes:
```text
/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Controladores de la API
│   │   ├── database/       # Conexión al pool de MySQL
│   │   ├── middlewares/    # Proxies de seguridad (Auth, Roles, ErrorHandler)
│   │   ├── repositories/   # Acceso directo a base de datos (Northwind)
│   │   ├── routes/         # Definición de endpoints
│   │   ├── services/       # Lógica de negocio y reglas comerciales
│   │   ├── utils/          # Utilidades (Logger UTC, Custom Errors)
│   │   └── app.ts          # Orquestador principal de Express
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/     # Componentes de React (Login, Catálogo, Carrito)
    │   └── ...
    └── .env.example
```
##  Instrucciones de instalación
1. Clonar el repositorio: `git clone [tu-enlace-de-github]`
2. Instalar dependencias del backend:
   ```bash
   cd backend
   npm install
   ```
3. Instalar dependencias del frontend:
    ``` bash
    cd ../frontend
    npm install
    ```
##  Configuración de la base de datos
1. Inicie su servidor MySQL en el puerto 3307.
2. Ejecute el script de creación de la base de datos Northwind proporcionado en la carpeta backend/database/northwind_dump.sql (o el nombre de su archivo script).
3. Asegúrese de que exista la tabla AppUsers para el registro de clientes.
## Configuración de Google OAuth
1. Ingrese a Google Cloud Console.
2. Cree un nuevo proyecto y navegue a API & Services > Credentials.
3. Configure la pantalla de consentimiento de OAuth.
4. Cree unas credenciales de tipo OAuth client ID para Aplicación Web.
5. Agregue el origen autorizado: http://localhost:5173.
6. Copie el Client ID y el Client Secret para utilizarlos en las variables de entorno.

## Variables de entorno
Cree un archivo .env en la raíz de la carpeta backend/ e ingrese la siguiente estructura (no utilice comillas y NO exponga credenciales reales en el control de versiones):
``` bash
    # Configuración del Servidor
    PORT=3000

    # Base de datos MySQL
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=tu_password_local
    DB_NAME=northwind
    DB_PORT=3307

    # Seguridad y Autenticación
    JWT_SECRET=tu_clave_secreta_super_segura
    JWT_EXPIRATION=1h

    # Credenciales de Google OAuth
    GOOGLE_CLIENT_ID=tu_client_id_de_google.apps.googleusercontent.com
``` 
En el frontend/, configure la variable necesaria para el Client ID de Google si su paquete lo requiere.

## Comandos de ejecución
Para iniciar los servidores en entorno de desarrollo:

En la terminal del Backend:
``` bash
npm run dev
```
En la terminal del Frontend:
``` bash
npm run dev
```

## Direcciones
Dirección del Backend (API REST): http://localhost:3000  
Dirección del Cliente (React): http://localhost:5173

## Roles implementados
Admin: Tiene acceso total para gestionar el inventario (operaciones POST, PUT, DELETE sobre los productos). No tiene habilitado el flujo de compras.

Customer: Rol asignado por defecto a los nuevos registros mediante Google. Solo tiene permisos de lectura sobre los productos activos y acceso al flujo de checkout (POST /api/products/buy) y revisión de sus propias órdenes.

## Instrucciones para probar el flujo
1. Acceder al cliente web en el puerto 5173.
2. Hacer clic en "Continuar con Google" e iniciar sesión.
3. El sistema lo registrará automáticamente como Customer.
4. Navegar por el catálogo de productos disponibles.
5. Añadir artículos al carrito verificando que la cantidad no supere el stock mostrado.
6. Presionar "Pagar". El sistema verificará el stock real en el backend, realizará la compra e imprimirá los logs en UTC en la consola del servidor.
7. Verificar en la base de datos MySQL (tabla products) la disminución exacta del campo target_level (stock) para confirmar la transacción atómica.
