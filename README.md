# Memories Album

## Descripción General del Proyecto

Memories Album es un álbum interactivo que permite a los usuarios subir, organizar y compartir contenido multimedia
como imágenes y videos cortos. La aplicación ofrece una interfaz intuitiva para crear álbumes personalizados,
añadir descripciones y gestionar la privacidad del contenido.

## Prerrequisitos Globales

Antes de comenzar a trabajar con el proyecto, asegúrate de tener instalado el siguiente software:

- **Node.js**: v18.x o v20.x (recomendado)
- **npm**: v9.x o superior (los comandos de ejemplo utilizarán npm)
- **Git**: Última versión estable
- **MongoDB**: Una cuenta en MongoDB Atlas y la URL de conexión a tu clúster
- **Cloudinary**: Una cuenta en Cloudinary y las credenciales necesarias (Cloud Name, API Key, API Secret)

## Flujo de Trabajo y Configuración Inicial

### Clonación del Repositorio

Para obtener una copia local del proyecto, ejecuta el siguiente comando:

```bash
git clone https://github.com/Dejatori/memories-album.git
cd memories-album
```

### Configuración del Backend

#### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```
# Puerto del servidor
PORT=3001

# Conexión a MongoDB
DATABASE_URL=tu_mongodb_connection_string

# JWT para autenticación
JWT_SECRET=tu_secreto_jwt_muy_seguro

# Configuración de Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloudinary_cloud_name
CLOUDINARY_API_KEY=tu_cloudinary_api_key
CLOUDINARY_API_SECRET=tu_cloudinary_api_secret

# URL del frontend para CORS
FRONTEND_URL=http://localhost:5173
```

Reemplaza los valores de placeholder con tus credenciales reales.

#### Instalación de Dependencias

Instala todas las dependencias del proyecto ejecutando:

```bash
npm install
```

#### Ejecutar el Backend (Desarrollo)

Para iniciar el servidor de desarrollo del backend, ejecuta:

```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:3001` (o el puerto que hayas configurado en el archivo `.env`).

### Configuración del Frontend

El frontend está integrado en el mismo proyecto y se ejecuta con el mismo comando que el backend.

#### Variables de Entorno para el Frontend

El frontend utiliza las variables de entorno definidas en el archivo `.env` de la raíz del proyecto. Asegúrate de
que la variable `FRONTEND_URL` esté correctamente configurada.

Si necesitas configurar variables específicas para el frontend, puedes crear un archivo `.env.local` en la raíz del
proyecto con el siguiente contenido:

```
VITE_API_BASE_URL=http://localhost:3001/api
```

### Ejecución Completa del Proyecto (Desarrollo)

Para ejecutar tanto el backend como el frontend simultáneamente en modo desarrollo, simplemente ejecuta:

```bash
npm run dev
```

- El backend estará disponible en: `http://localhost:3001`
- El frontend estará disponible en: `http://localhost:5173`

## Próximos Pasos

Una vez que tengas el proyecto en funcionamiento, puedes:

1. **Explorar la API**: Revisa los endpoints disponibles y cómo interactuar con ellos.
2. **Crear un usuario**: Regístrate en la aplicación para comenzar a crear álbumes.
3. **Subir contenido**: Prueba la funcionalidad de subida de imágenes y videos.
4. **Ejecutar pruebas**: Si deseas contribuir al proyecto, ejecuta las pruebas para asegurarte de que tus cambios
   no rompen la funcionalidad existente.

## Stack Tecnológico

### Backend

- Express.js con TypeScript
- MongoDB con Mongoose
- Cloudinary para gestión de multimedia
- JWT para autenticación
- bcryptjs para hashing de contraseñas
- Zod para validación de datos

### Frontend

- React con TypeScript
- Vite como herramienta de build
- Zustand para gestión de estado
- React Query para manejo de datos
- React Router para navegación
- Axios para peticiones HTTP
- TailwindCSS para estilos

## Licencia

Este proyecto está licenciado bajo la Licencia GPL-3.0 - ver el archivo [LICENSE](LICENSE) para más detalles.