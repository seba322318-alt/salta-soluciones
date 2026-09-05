# Salta Soluciones — V2 contacto directo cliente-profesional

Esta versión mantiene la estructura para Netlify (Functions + Edge Functions + Netlify Blobs) y cambia el flujo operativo:

- El cliente elige un servicio y luego un profesional.
- El botón **Contactar por WhatsApp** registra primero el contacto en Salta Soluciones y después abre WhatsApp directo con el profesional.
- El ADMIN ya no tiene que asignar manualmente cada trabajo.
- El cliente puede entrar a **Mi solicitud** con su código + WhatsApp.
- Desde Mi solicitud confirma si el profesional asistió, si el trabajo se realizó y puede calificar de 1 a 5 estrellas.
- La calificación queda pendiente de moderación en ADMIN antes de publicarse.
- El ADMIN ve contactos, visitas, trabajos confirmados y calificaciones por profesional.
- En cada profesional se puede registrar una mensualidad fija, próximo vencimiento y estado de pago.
- La página principal incluye una bienvenida separada de los servicios y un botón de WhatsApp general de Salta Soluciones.
- Los datos privados del profesional (WhatsApp, notas privadas y mensualidad) ya no se entregan en el API público; el número de WhatsApp se devuelve solamente después de registrar el contacto.

## Archivos nuevos

- `netlify/functions/direct-contact.mjs` → `/api/contact`
- `netlify/functions/client-status.mjs` → `/api/client-status`

## Publicación

Este proyecto usa Netlify Functions, Edge Functions y Netlify Blobs. Publicalo desde el repositorio Git conectado a Netlify, igual que la versión anterior.

1. Reemplazá en GitHub los archivos del proyecto por los de esta carpeta.
2. Hacé **Commit changes**.
3. Netlify hará el deploy automáticamente.
4. No cambies las variables de entorno existentes (`ADMIN_PASSWORD` y `SESSION_SECRET`).

Los datos guardados en Netlify Blobs no están dentro del ZIP y no deberían borrarse por actualizar el código.

## Preparado para dominio y Google

Esta versión queda preparada para conectar un dominio propio sin reescribir las URLs SEO.

Cuando compres el dominio:

1. Configuralo como dominio principal del proyecto en Netlify.
2. Agregá la variable de entorno `PUBLIC_SITE_URL` con la URL final, por ejemplo `https://www.tudominio.com.ar`.
3. Hacé un nuevo deploy.
4. Verificá en el navegador:
   - `/robots.txt`
   - `/sitemap.xml`
   - `/servicios/electricista-salta`
5. En Google Search Console, agregá la propiedad del dominio, completá la verificación DNS y enviá `https://TU-DOMINIO/sitemap.xml`.

### SEO incluido

- canonical dinámico en la portada;
- sitemap dinámico con cada servicio activo;
- robots.txt dinámico;
- páginas individuales indexables por servicio (`/servicios/<slug>-salta`);
- datos estructurados `Organization`, `WebSite`, `WebPage`, `BreadcrumbList` e `ItemList`;
- Open Graph básico;
- contenido visible de “Cómo funciona” y preguntas frecuentes;
- ADMIN, acceso, seguimiento privado y portal profesional marcados como `noindex`.

### Perfil de Empresa / Google Maps

No se configura automáticamente desde el código. Además, si Salta Soluciones funciona únicamente como plataforma/directorio que genera contactos entre clientes y profesionales, hay que revisar la elegibilidad antes de crear un Perfil de Empresa de Google. Los perfiles individuales de profesionales pueden ser una mejor opción cuando cada profesional cumple los requisitos de Google.

## Enlaces privados sin contraseña

Esta versión incorpora dos accesos privados:

- **Profesional:** cada profesional tiene un enlace permanente generado desde ADMIN. Desde su portal puede marcar “Tomé el trabajo”, “No se concretó” o “Trabajo finalizado”. En ADMIN se puede copiar, enviar por WhatsApp o regenerar el enlace.
- **Cliente:** cada solicitud nueva recibe un número de 5 dígitos. El cliente entra a **Mi solicitud** con esos 5 números + su WhatsApp y desde ahí confirma asistencia, trabajo realizado y califica de 1 a 5 estrellas sin usuario ni contraseña.

El portal `/profesional.html` y la página heredada `/evaluar.html` están marcados como `noindex,nofollow` y no forman parte del SEO público. La experiencia principal del cliente usa **Mi solicitud** con número de 5 dígitos + WhatsApp.


## Actualización V3 — solicitudes, GPS y evaluación visible

Esta versión agrega:
- WhatsApp del cliente visible y accionable desde ADMIN.
- Botón ADMIN “WhatsApp para calificar” con enlace privado único de evaluación.
- Estado del profesional visible: pendiente, aceptó, rechazó o indicó finalizado.
- Estado del cliente visible: visita, trabajo y calificación de 1 a 5 estrellas.
- Contacto directo con profesional con dirección, descripción y GPS antes de abrir WhatsApp.
- Si un servicio no tiene profesionales activos, aparece un formulario para nombre, apellido, WhatsApp, dirección, descripción y GPS.
- La solicitud sin profesional llega al ADMIN con estado “Pendiente de profesional”.
- Desde ADMIN se puede asignar un profesional compatible con el servicio.
- Después de asignar, ADMIN puede avisar al profesional por WhatsApp con los datos del cliente y su portal privado.

El profesional no califica al cliente: confirma si tomó, rechazó o finalizó el trabajo. La calificación de estrellas la realiza el cliente.


## Flujo de solicitud simplificado (versión 5 dígitos)

- Cada solicitud nueva recibe un número simple de **5 dígitos** (por ejemplo `48317`).
- El cliente consulta en **Mi solicitud** usando esos 5 números + el mismo WhatsApp registrado.
- Desde esa pantalla puede confirmar visita, confirmar trabajo y calificar de 1 a 5 estrellas.
- En ADMIN aparece el WhatsApp del cliente y el botón **WhatsApp para calificar**, que abre el chat con el número de solicitud y el enlace a Mi solicitud.
- El profesional mantiene su enlace privado permanente, sin usuario ni contraseña.
- Si un servicio no tiene profesionales disponibles, el sitio muestra el formulario con nombre, apellido, WhatsApp, dirección, descripción y GPS para dejar la solicitud pendiente de asignación.


## Versión V5 — limpieza y eliminación de solicitudes

- Al abrir ADMIN por primera vez después de desplegar esta versión, se ejecuta una limpieza única solicitada de los registros de prueba en solicitudes, índices de seguimiento y calificaciones.
- La limpieza NO borra configuración, profesionales, servicios, productos ni imágenes.
- Cada solicitud tiene ahora un botón **Eliminar** en ADMIN. El borrado elimina también el índice del código, el acceso de evaluación y la calificación vinculada.
- La limpieza inicial tiene un marcador persistente (`salta-maintenance`) para que no vuelva a ejecutarse en despliegues posteriores.
