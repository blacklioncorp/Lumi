# Guía de Configuración de Variables de Entorno en Vercel

Esta guía detalla paso a paso cómo configurar las variables de entorno necesarias para la plataforma **Lumis EdTech SaaS** dentro del panel de control de Vercel.

---

## 🚀 Pasos para Configurar en Vercel

1. Ingresa al panel de control de [Vercel](https://vercel.com).
2. Selecciona tu proyecto desplegado.
3. Ve a la pestaña **Settings** (Configuración) en la barra superior.
4. En la barra lateral izquierda, selecciona **Environment Variables**.
5. Agrega cada una de las siguientes variables ingresando su **Key** (Clave) y **Value** (Valor).
6. Asegúrate de marcar los entornos apropiados (Production, Preview, Development) y haz clic en **Save** (Guardar).
7. **IMPORTANTE**: Una vez que hayas agregado o modificado variables de entorno, debes realizar un nuevo despliegue (Redeploy) en Vercel para que los cambios surtan efecto.

---

## 🔑 1. Variables de Entorno CRÍTICAS (Obligatorias para el MVP)

Sin estas variables, el sistema no podrá conectarse a la base de datos, autenticar usuarios o cargar la página del colegio.

| Variable | Tipo / Ámbito | Requerido | Descripción y Dónde Encontrarla |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Público (`NEXT_PUBLIC_`) | **Sí** | URL de tu API del proyecto de Supabase.<br>📍 *Supabase Dashboard → Settings → API → Project URL*. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Público (`NEXT_PUBLIC_`) | **Sí** | Clave anónima pública para operaciones básicas del cliente.<br>📍 *Supabase Dashboard → Settings → API → Project API Keys → `anon public`*. |
| `SUPABASE_SERVICE_ROLE_KEY` | Privado (Server-side) | **Sí** | Clave de rol de servicio (bypasea RLS). **Nunca la expongas al cliente**.<br>📍 *Supabase Dashboard → Settings → API → Project API Keys → `service_role`*. |
| `NEXTAUTH_SECRET` | Privado (Server-side) | **Sí** | Clave criptográfica para encriptar sesiones y tokens.<br>📍 *Genera una nueva ejecutando en terminal:* `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Público (`NEXT_PUBLIC_`) | **Sí** | URL base de la aplicación de producción desplegada.<br>📍 *Ejemplo: `https://lumis.vercel.app` o tu dominio personalizado `https://colegiodemo.edu.mx`*. |

---

## 🤖 2. Variables de Integración con n8n

Estas variables permiten enviar eventos y flujos de automatización asíncronos a tu servidor n8n autohospedado. Pueden dejarse vacías en el despliegue inicial y completarse cuando configures n8n.

| Variable | Tipo / Ámbito | Requerido | Descripción y Dónde Encontrarla |
| :--- | :--- | :--- | :--- |
| `N8N_WEBHOOK_SECRET` | Privado (Server-side) | Opcional | Clave secreta que se envía en las cabeceras (`x-lumis-secret`) para validar que las peticiones a n8n provienen de Lumis.<br>📍 *Crea una frase o hash complejo y configúralo igual en el nodo webhook de n8n*. |
| `N8N_WEBHOOK_LEAD_URL` | Privado (Server-side) | Opcional | URL del webhook activo en n8n que procesa nuevos leads.<br>📍 *n8n Dashboard → Workflow "01_new_lead_whatsapp" → Doble click en nodo Webhook → Production URL*. |
| `N8N_WEBHOOK_TOUR_URL` | Privado (Server-side) | Opcional | URL del webhook en n8n que procesa agendamiento de visitas escolares.<br>📍 *n8n Dashboard → Workflow "02_tour_google_calendar" → Production URL*. |
| `N8N_WEBHOOK_TOUR_CANCELLED_URL` | Privado (Server-side) | Opcional | URL del webhook en n8n que procesa la cancelación de una visita para borrarla de Calendar.<br>📍 *n8n Dashboard → Workflow "02_tour_google_calendar" (Webhook cancelación) → Production URL*. |
| `N8N_WEBHOOK_SOCIAL_URL` | Privado (Server-side) | Opcional | URL del webhook en n8n que automatiza la publicación en redes sociales.<br>📍 *n8n Dashboard → Workflow "03_social_media_publish" → Production URL*. |

---

## 🔌 3. Variables de APIs Externas (Opcionales para el MVP)

Se configuran en Vercel para que las funciones del servidor y los flujos automatizados de n8n tengan acceso a los SDKs y APIs de proveedores de terceros.

### WhatsApp (Meta Business API)
* `WHATSAPP_PHONE_ID`: Identificador de número telefónico de Meta. Encontrado en: *Meta for Developers portal → WhatsApp → Configuración de API*. (Privado)
* `WHATSAPP_TOKEN`: Token de acceso permanente del sistema de Meta. (Privado)

### Google Calendar
* `GOOGLE_CALENDAR_ID`: ID del calendario de Google en el que se agendarán los tours (suele ser el correo de la cuenta o un hash). *Google Calendar Settings → Integrar el calendario*. (Privado)
* `GOOGLE_CALENDAR_TOKEN`: Credenciales OAuth2 o de cuenta de servicio para escribir eventos. (Privado)

### Publicación en Redes Sociales (Facebook, Instagram, TikTok)
* `FB_PAGE_ID`: ID de la página de Facebook del colegio. (Privado)
* `FB_PAGE_TOKEN`: Token de acceso permanente para publicar en la página de Facebook. (Privado)
* `IG_USER_ID`: ID de la cuenta comercial de Instagram vinculada a la página de Facebook. (Privado)
* `TIKTOK_ACCESS_TOKEN`: Token de acceso para subir videos a través de la API de TikTok. (Privado)

### Pasarelas de Pago (Stripe y Mercado Pago)
* `STRIPE_PUBLIC_KEY`: Clave pública de Stripe para el formulario de pagos en cliente. (Público `NEXT_PUBLIC_`)
* `STRIPE_SECRET_KEY`: Clave secreta de Stripe para procesar cargos y suscripciones en el servidor. (Privado)
* `MERCADOPAGO_ACCESS_TOKEN`: Token de producción de Mercado Pago para generar preferencias de pago en México. (Privado)
