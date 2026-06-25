# Guía de Configuración de Dominio Custom (Multi-tenant)

Esta guía detalla los pasos técnicos para asociar un dominio propio (por ejemplo, `www.colegioespanol.edu.mx` o `landing.colegioespanol.edu.mx`) al proyecto desplegado en Vercel, permitiendo al middleware dinámico mapear el hostname al tenant correspondiente.

---

## 🌐 Paso 1: Configurar el Dominio en Vercel

1. Entra al dashboard de [Vercel](https://vercel.com) y ve al proyecto.
2. Navega a **Settings** (Configuración) en la barra superior.
3. En la barra lateral izquierda, selecciona **Domains** (Dominios).
4. Escribe el dominio que deseas agregar (ej. `www.colegioespanol.edu.mx`) y haz clic en **Add**.
5. Vercel te preguntará si deseas redirigir la versión sin `www` a la versión con `www` (o viceversa). Elige la opción recomendada según la preferencia de la institución.

---

## 📝 Paso 2: Configurar los Registros DNS en tu Proveedor

Debes ingresar al panel del registrador DNS (ej. GoDaddy, Neubox, Cloudflare, Akamai, etc.) donde se compró el dominio del colegio y configurar los siguientes registros:

### Caso A: Dominio Principal (Ápice, ej: `colegioespanol.edu.mx`)
Si el colegio usará el dominio raíz sin subdominios para la landing:
* **Tipo**: `A`
* **Nombre / Host**: `@` (o déjalo vacío)
* **Valor / IP**: `76.76.21.21` (Dirección IP global de Vercel)
* **TTL**: Automático o `3600`

### Caso B: Subdominio (ej: `www.colegioespanol.edu.mx` o `inscripciones.colegioespanol.edu.mx`)
Si se usará un subdominio específico:
* **Tipo**: `CNAME`
* **Nombre / Host**: `www` (o `inscripciones` o el slug que decida el colegio)
* **Valor / Destino**: `cname.vercel-dns.com`
* **TTL**: Automático o `3600`

> [!NOTE]
> **SSL Automático**: Vercel provee y renueva automáticamente certificados Let's Encrypt de forma gratuita para todos tus dominios y subdominios una vez que los registros DNS se resuelven correctamente. No es necesario realizar pasos de configuración para forzar HTTPS, Vercel redirige automáticamente todo el tráfico HTTP a HTTPS de manera nativa.

---

## 🗄️ Paso 3: Asociar el Dominio al Tenant en Supabase

Una vez configurado el dominio en Vercel, debes asociarlo al tenant en la base de datos de Supabase para que el middleware pueda reconocerlo.

1. Ve al panel de control de **Supabase** y abre el SQL Editor.
2. Ejecuta la siguiente consulta SQL reemplazando el `slug` del colegio y el dominio configurado:

```sql
UPDATE public.tenants
SET custom_domain = 'www.colegioespanol.edu.mx'
WHERE slug = 'colegio-espanol';
```

3. Verifica que la actualización se realizó correctamente:

```sql
SELECT id, name, slug, custom_domain FROM public.tenants WHERE slug = 'colegio-espanol';
```

---

## 🛠️ Paso 4: Cómo el Middleware Resuelve el Tenant

El archivo `middleware.ts` en la raíz de la aplicación intercepta todas las solicitudes entrantes y realiza las siguientes operaciones:

1. **Lectura de Hostname**: Lee la cabecera `host` de la petición (ej: `www.colegioespanol.edu.mx` o `colegio-espanol.lumis.app`).
2. **Búsqueda**:
   * Si el host termina con el dominio principal del SaaS (ej: `.lumis.app`), extrae la primera sección como el `tenant_slug` (ej: `colegio-espanol`).
   * Si el host es un dominio personalizado (ej: `www.colegioespanol.edu.mx`), busca en la base de datos un tenant cuyo campo `custom_domain` coincida con ese valor.
3. **Inyección de Cabeceras**: Adjunta cabeceras como `x-tenant-id`, `x-tenant-slug` y los colores de marca (`x-tenant-primary-color`), reescribiendo la ruta internamente al path dinámico de Next.js sin que el navegador cambie la URL visible.

---

## ⏳ Tiempo de Propagación y Diagnóstico

* **Propagación DNS**: Los cambios en los registros DNS pueden tardar de **24 a 48 horas** en propagarse globalmente, aunque típicamente toman menos de 2 horas.
* **Comprobación**: Puedes verificar si los registros DNS ya apuntan correctamente a Vercel ejecutando en tu terminal:

```bash
dig www.colegioespanol.edu.mx
```

O utilizando herramientas visuales en línea como [DNSChecker.org](https://dnschecker.org).
* Si el dominio está activo en Vercel pero la base de datos no tiene configurado el campo `custom_domain`, la aplicación podría retornar una pantalla de error 404 de tenant no encontrado. Asegúrate de sincronizar ambos lados.
