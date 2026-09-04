# Salta Soluciones — paquete listo para Netlify

Este proyecto incluye:

- Web pública responsive para PC y celular.
- Logo de Salta Soluciones integrado.
- Colores azul marino, azul eléctrico, celeste neón y detalles naranjas.
- Efecto luminoso al pasar el puntero en PC y al tocar en celular.
- Buscador de servicios.
- Servicios editables desde ADMIN.
- Profesionales editables desde ADMIN con exactamente estos campos: foto, nombre y apellido, servicios, años de experiencia, WhatsApp, zona, disponibilidad, observaciones privadas y estado.
- Formulario de reserva con nombre, apellido, dirección, WhatsApp y GPS opcional.
- Productos con precio público y hasta 5 fotos.
- Calificación de 1 a 5 estrellas; si es menor a 5, el comentario es obligatorio.
- Moderación de calificaciones desde ADMIN antes de mostrarlas públicamente.
- ADMIN protegido con contraseña y cookie de sesión segura.
- Datos persistentes en Netlify Blobs: los cambios del ADMIN se reflejan en la web sin volver a subir archivos.
- `robots.txt`, `sitemap.xml`, metadatos básicos y estructura responsive.

## IMPORTANTE: forma de subirlo

Como esta versión usa Netlify Functions, Edge Functions y Netlify Blobs, **no conviene usar solamente Netlify Drop/arrastrar una carpeta estática**. Publicalo conectando el proyecto a Git (GitHub/GitLab/Bitbucket) o con Netlify CLI.

### Opción recomendada — Git

1. Descomprimí este ZIP.
2. Subí la carpeta completa a un repositorio Git.
3. En Netlify: **Add new project → Import an existing project**.
4. Elegí el repositorio.
5. Netlify detectará `netlify.toml`.
6. Antes de publicar, agregá las variables de entorno indicadas abajo.
7. Deploy.

No hay comando de build. El directorio de publicación ya está configurado como `public`.

### Variables de entorno obligatorias

En Netlify, entrá a **Project configuration → Environment variables** y agregá:

- `ADMIN_PASSWORD` = la contraseña privada que vos elijas para entrar al panel.
- `SESSION_SECRET` = una cadena aleatoria larga, idealmente de 32 caracteres o más.

Ejemplo de `SESSION_SECRET` (NO uses este ejemplo en producción):

`cambia-esto-por-un-secreto-largo-y-unico-123456`

Después de agregar o cambiar variables, hacé un deploy nuevo.

## Accesos

- Web pública: `/`
- Acceso al administrador: `/acceso.html`
- Panel privado: `/admin/`

No existe ningún enlace público al ADMIN dentro de la web.

## WhatsApp

El número no se muestra en los botones públicos. Los botones dicen solamente **WhatsApp** y redirigen al número configurado.

Número inicial configurado: `543872521955` (Argentina +54 + 3872521955).

Podés cambiarlo desde **ADMIN → Página principal** y también por servicio/producto.

## Datos y almacenamiento

La plataforma usa Netlify Blobs para guardar:

- configuración visual;
- servicios;
- profesionales;
- productos;
- solicitudes;
- calificaciones;
- imágenes cargadas desde ADMIN.

## SEO

La base incluye título, descripción, Open Graph, robots y sitemap. Cuando tengas el dominio definitivo, conviene actualizar la URL canónica, Search Console y el sitemap para páginas específicas de cada servicio.

## Nota sobre privacidad

El formulario puede guardar dirección, WhatsApp y coordenadas GPS si el usuario autoriza la geolocalización. Antes de publicar comercialmente, agregá una política de privacidad y condiciones de uso adaptadas a tu actividad.
