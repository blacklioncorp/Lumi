# Checklist de Lanzamiento: Lumis EdTech SaaS

Este documento contiene la lista detallada de verificaciones requeridas para realizar el lanzamiento del primer colegio piloto en producción, dividido en fases críticas.

---

## 🛠️ Fase 1: Pre-Lanzamiento (Pruebas en Staging/Desarrollo)

Antes de conectar el dominio del colegio y anunciar el sitio, asegúrate de completar estas tareas de infraestructura:

- [ ] **Configurar Variables de Entorno en Vercel**:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` configuradas.
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (privada) configurada.
  - [ ] `NEXTAUTH_SECRET` generado e insertado.
  - [ ] `NEXT_PUBLIC_APP_URL` establecido con la URL del despliegue de Vercel.
- [ ] **Activar "Custom Access Token Hook"**:
  - [ ] Ingresa al panel de Supabase → Authentication → Hooks.
  - [ ] Selecciona la función `public.custom_access_token_hook` y actívala para asegurar que las llamadas incluyan `tenant_id` y `user_role` dentro del JWT.
- [ ] **Ejecutar Script de Superadmin**:
  - [ ] Ejecuta `npx ts-node scripts/setup-superadmin.ts` para aprovisionar el tenant y las credenciales iniciales de administrador.
- [ ] **Verificar Base de Datos**:
  - [ ] Confirma que la tabla `tenants` contiene el colegio piloto con su slug.
  - [ ] Confirma que el perfil del usuario administrador fue creado exitosamente en la tabla `users` con el rol `superadmin`.
- [ ] **Prueba de Autenticación**:
  - [ ] Accede a `/[tenant_slug]/login` e inicia sesión con las credenciales creadas.
  - [ ] Confirma el redireccionamiento correcto al panel de administración.
- [ ] **Renderizado de la Landing Page**:
  - [ ] Abre `/[tenant_slug]` y verifica que la landing page carga correctamente con los colores del tenant (primario y secundario) y el logotipo escolar.
- [ ] **Prueba de Captación de Leads**:
  - [ ] Envía un lead demo desde el formulario de la landing.
  - [ ] Verifica que el registro se inserta con éxito en la tabla `leads` de Supabase.
- [ ] **Verificación de Webhook de Leads**:
  - [ ] Confirma que se dispare la llamada POST al webhook de leads si la variable `N8N_WEBHOOK_LEAD_URL` está configurada y la cabecera `x-lumis-secret` coincide.

---

## 🚀 Fase 2: Lanzamiento (Puesta en Vivo con Dominio Propio)

Sigue estos pasos para realizar el cambio del DNS y poner el sitio oficial en internet:

- [ ] **Configurar Dominio Custom en Vercel**:
  - [ ] Agrega el dominio definitivo (ej. `www.colegio.edu.mx`) en el panel de Vercel.
- [ ] **Configuración DNS en el Proveedor**:
  - [ ] Si usas dominio raíz, añade el registro tipo `A` apuntando a `76.76.21.21`.
  - [ ] Si usas subdominio (ej: `www`), añade el registro `CNAME` apuntando a `cname.vercel-dns.com`.
- [ ] **Validar Propagación DNS**:
  - [ ] Corre el comando `dig www.colegio.edu.mx` en tu terminal para confirmar que resuelve a la infraestructura de Vercel.
- [ ] **Confirmar SSL y HTTPS**:
  - [ ] Abre el dominio final en el navegador. Vercel debe haber emitido el certificado SSL automáticamente.
  - [ ] Comprueba que al ingresar sin `https://` te redirija automáticamente a la versión segura con candado verde.
- [ ] **Sincronizar Dominio en la Tabla de Tenants**:
  - [ ] Modifica el campo `custom_domain` en Supabase con el dominio exacto configurado.
- [ ] **Prueba de Acceso al Dominio Final**:
  - [ ] Navega al dominio personalizado (ej: `https://www.colegio.edu.mx`). El middleware debe resolver internamente el tenant sin mostrar el slug en la URL.
- [ ] **Prueba de Formulario en Producción**:
  - [ ] Envía un registro de lead real desde el dominio customizado.
  - [ ] Confirma en el panel de Supabase que el `tenant_id` se asignó correctamente al lead.
- [ ] **WhatsApp de Bienvenida Automatizado**:
  - [ ] Verifica que el número de teléfono del lead de pruebas reciba el mensaje de WhatsApp de bienvenida automatizado de forma instantánea.

---

## 📈 Fase 3: Post-Lanzamiento (Operación y Automatización - Semana 1)

Verifica que el flujo de trabajo operativo diario del colegio funcione al 100%:

- [ ] **Desplegar Servidor n8n**:
  - [ ] Servidor n8n autohospedado en Contabo activo y seguro.
- [ ] **Importación y Activación de Workflows**:
  - [ ] Importa los archivos `.json` de la carpeta `n8n/workflows/` en tu instancia de n8n.
  - [ ] Configura las variables de credenciales de Supabase y de la API de WhatsApp de Meta.
  - [ ] Activa los workflows 01, 02 y 03 en n8n.
- [ ] **Google Calendar Integrado**:
  - [ ] Conecta OAuth2 de Google en n8n y realiza un agendamiento de tour de prueba para verificar que el evento aparezca en la agenda del coordinador escolar.
- [ ] **WhatsApp de Seguimiento de Leads**:
  - [ ] Monitorea en n8n que el workflow de leads envíe el segundo mensaje automatizado transcurridos los 30 minutos de inactividad, actualizando el estatus en la BD.
- [ ] **Acceso del Director/Coordinador**:
  - [ ] Otorga accesos de rol `school_admin` al personal del colegio.
  - [ ] Guía al director para ingresar a su dashboard y verificar las métricas de captación de leads en tiempo real.
- [ ] **Prueba del CMS Visual**:
  - [ ] Haz que el administrador del colegio edite y renombre un bloque desde el panel de contenido, guarde y presione **Publicar todo**.
  - [ ] Abre la landing pública en otra pestaña y confirma que los cambios visuales se reflejen instantáneamente.
