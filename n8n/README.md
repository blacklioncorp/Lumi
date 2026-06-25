# 🏫 Manual de Configuración e Integración de n8n para Lumis EdTech SaaS

Este directorio contiene los archivos JSON exportados de los tres (3) flujos clave de automatización de n8n, listos para importarse en tu instancia self-hosted de n8n.

---

## 📋 Flujos Disponibles

1. **`01_new_lead_whatsapp.json`**: Envía un WhatsApp de bienvenida mediante plantilla Meta al ingresar un Lead, espera 30 minutos, comprueba si el Lead sigue sin contactar y envía un recordatorio en texto libre actualizando el estado del lead a "contacted".
2. **`02_tour_google_calendar.json`**: Crea un evento en el Google Calendar principal, asocia el ID del evento de vuelta en Supabase (`google_event_id`), envía confirmación por WhatsApp y un recordatorio automático 24 horas antes del tour.
3. **`03_social_media_publish.json`**: Administra la publicación inmediata o programada de contenidos a Facebook, Instagram y TikTok, actualizando el estado de la publicación a "published" con la fecha de publicación final.

---

## 🚀 Guía de Configuración Paso a Paso

Sigue las siguientes instrucciones en el orden indicado para garantizar el correcto funcionamiento de las automatizaciones:

### Paso 1: Importar los Workflows en n8n
1. Abre tu panel de **n8n**.
2. Haz clic en **Add Workflow** (Añadir flujo) en la esquina superior derecha.
3. Abre el menú desplegable en la esquina superior derecha del editor de n8n (tres puntos verticales) y selecciona **Import from File...** (Importar desde archivo).
4. Sube el archivo JSON correspondiente desde la carpeta `n8n/workflows/`.
5. Repite este proceso para los 3 archivos.

### Paso 2: Crear la Credencial de Seguridad (Webhook Secret)
1. En n8n, ve a la sección de **Credentials** (Credenciales) en el menú lateral izquierdo.
2. Haz clic en **Add Credential** (Añadir credencial).
3. Busca y selecciona **Header Auth** (o crea una credencial personalizada tipo cabecera).
4. Asígnale el nombre **`Lumis Webhook Secret`** (tal como está referenciado en los JSON).
5. Configura los campos:
   - **Name (Nombre del Header)**: `x-lumis-secret`
   - **Value (Valor)**: Ingresa un token seguro y aleatorio (este valor será el mismo que configures en la variable `N8N_WEBHOOK_SECRET` de Next.js).

### Paso 3: Configurar Variables de Entorno en n8n
Para que los nodos HTTP funcionen de forma centralizada sin editar cada nodo, asegúrate de que tu contenedor de n8n o entorno tenga acceso a las siguientes variables de entorno. Puedes declararlas en tu configuración de Docker Compose/sistema operativo o usar nodos de Set dinámicos (los flujos de este directorio buscan variables nativas usando la expresión `{{ $env.VARIABLE_NAME }}`):

* **`WHATSAPP_PHONE_ID`**: ID del número de teléfono remitente en el panel de Meta.
* **`WHATSAPP_TOKEN`**: Token de Acceso Permanente (System User Token) de Meta Business Suite.
* **`GOOGLE_CALENDAR_TOKEN`**: Token de acceso de Google OAuth o Cuenta de Servicio.
* **`GOOGLE_CALENDAR_ID`**: ID del calendario donde se agendarán las visitas (usar `primary` por defecto).
* **`FB_PAGE_ID`**: ID de la página de Facebook de la escuela.
* **`FB_PAGE_TOKEN`**: Page Access Token para publicar en el feed.
* **`IG_USER_ID`**: ID del usuario de Instagram Business vinculado a la página de Facebook.
* **`TIKTOK_ACCESS_TOKEN`**: Token de acceso para publicar contenido a través de la API de TikTok.
* **`SUPABASE_SERVICE_ROLE_KEY`**: Clave Service Role de Supabase para poder escribir de forma segura en las tablas `leads`, `tours` y `social_posts` saltando RLS.

### Paso 4: Copiar las URLs del Webhook a `.env.local`
1. Abre cada flujo importado en n8n.
2. Haz doble clic en el nodo inicial **Receptor de Webhook**.
3. Copia la URL de producción (no test) del webhook.
4. Pega la URL en tu archivo `.env.local` de la aplicación Next.js en las siguientes claves:
   - `N8N_WEBHOOK_LEAD_URL` (para el webhook `new-lead`)
   - `N8N_WEBHOOK_TOUR_URL` (para el webhook `new-tour`)
   - `N8N_WEBHOOK_TOUR_CANCELLED_URL` (para el webhook de cancelación, si aplica)
   - `N8N_WEBHOOK_SOCIAL_URL` (para el webhook `social-publish`)

---

## 📲 Configuración de Plantillas y APIs Externas

### A. Plantilla de WhatsApp "lead_welcome" en Meta Business Manager
Para el flujo `01_new_lead_whatsapp` debes configurar una plantilla de mensaje aprobada en la consola de Meta para desarrolladores:
1. Ve a **Meta Business Suite** → **Administrador de WhatsApp** → **Plantillas de mensaje**.
2. Crea una nueva plantilla llamada **`lead_welcome`** de tipo **Marketing** o **Servicio**.
3. Selecciona el idioma **Español (México)** o el código `es_MX`.
4. En el **Body (Cuerpo)** de la plantilla, ingresa un texto con 2 variables, por ejemplo:
   > "¡Hola {{1}}! Gracias por tu interés en {{2}}. Hemos recibido tus datos y un asesor se pondrá en contacto contigo muy pronto."
5. Envía la plantilla a revisión. Una vez aprobada (toma unos minutos), n8n podrá enviarla usando los parámetros provistos en el JSON.

### B. Configuración de Google Calendar OAuth en n8n
1. Crea un proyecto en la **Google Cloud Console**.
2. Habilita la **Google Calendar API**.
3. Configura la pantalla de consentimiento de OAuth y añade las URIs de redirección correspondientes a tu instancia de n8n (generalmente `https://tu-instancia-n8n.com/rest/oauth2-credential/callback`).
4. Genera las credenciales de tipo ID de Cliente OAuth 2.0 y colócalas en el conector de Google de n8n si deseas conectarlo vía interfaz nativa, o mantén el token OAuth configurado en la variable de entorno `GOOGLE_CALENDAR_TOKEN` de n8n.

---

## 🚦 Orden Correcto de Activación

1. **Paso 1**: Ejecuta el script SQL en Supabase para crear la tabla `social_posts`.
2. **Paso 2**: Rellena y actualiza tu `.env.local` en Next.js con los webhooks y claves de Meta/Google. Reinicia el servidor.
3. **Paso 3**: En n8n, crea las credenciales **`Lumis Webhook Secret`** y conéctalas a los nodos Webhook de los 3 flujos.
4. **Paso 4**: Haz clic en el botón **Active (Activar)** (interruptor arriba a la derecha) en cada uno de los 3 flujos en n8n para que queden escuchando en producción.
5. **Paso 5**: Prueba la captación de un Lead desde la Landing para verificar el disparo end-to-end hacia WhatsApp.
