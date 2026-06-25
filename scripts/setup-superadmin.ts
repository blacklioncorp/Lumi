import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. Cargar .env.local de forma segura (sin dependencias adicionales de dotenv)
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('Cargando variables de entorno locales desde .env.local...');
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    // Saltarse comentarios y líneas vacías
    if (!line || line.trim().startsWith('#')) return;
    
    // Regex sugerido para manejar valores que contienen '=' (como tokens o urls)
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim() || '';
      
      // Quitar comillas simples o dobles de los extremos si existen
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      
      // Solo sobreescribir si no está ya definido en el entorno
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// 2. Resolver parámetros de entrada (de variables de entorno o defaults)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL = process.env.SETUP_ADMIN_EMAIL || 'admin@colegio.edu.mx';
const ADMIN_PASSWORD = process.env.SETUP_ADMIN_PASSWORD || 'SuperSecret123!';
const ADMIN_NAME = process.env.SETUP_ADMIN_NAME || 'Super Admin';

const TENANT_NAME = process.env.SETUP_TENANT_NAME || 'Colegio Español';
const TENANT_SLUG = process.env.SETUP_TENANT_SLUG || 'colegio-espanol';
const TENANT_PRIMARY = process.env.SETUP_TENANT_PRIMARY_COLOR || '#1B3A6B';
const TENANT_SECONDARY = process.env.SETUP_TENANT_SECONDARY_COLOR || '#C4A23A';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\x1b[31mError: Faltan variables de entorno esenciales.\x1b[0m');
  console.error('Asegúrate de configurar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

// 3. Inicializar Cliente Admin de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log('\n==================================================');
  console.log('🚀 INICIANDO CONFIGURACIÓN DE PRIMER SUPERADMIN');
  console.log('==================================================\n');

  // --- PASO 1: Aprovisionar o buscar el Tenant ---
  console.log(`🔍 Buscando tenant con slug "${TENANT_SLUG}"...`);
  const { data: existingTenant, error: selectTenantError } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('slug', TENANT_SLUG)
    .maybeSingle();

  if (selectTenantError) {
    console.error('❌ Error consultando la tabla tenants:', selectTenantError.message);
    process.exit(1);
  }

  let tenantId = '';
  if (existingTenant) {
    console.log(`✅ El tenant "${existingTenant.name}" ya existe con ID: ${existingTenant.id}`);
    tenantId = existingTenant.id;
  } else {
    console.log(`➕ Creando nuevo tenant "${TENANT_NAME}" (slug: ${TENANT_SLUG})...`);
    const { data: newTenant, error: insertTenantError } = await supabase
      .from('tenants')
      .insert({
        name: TENANT_NAME,
        slug: TENANT_SLUG,
        plan: 'premium',
        active_modules: ['crm', 'website', 'whatsapp', 'google_calendar', 'social_media', 'payments', 'parent_portal', 'pwa', 'nfc_access', 'safelunch', 'analytics'],
        primary_color: TENANT_PRIMARY,
        secondary_color: TENANT_SECONDARY,
        timezone: 'America/Mexico_City',
        is_active: true,
      })
      .select('id')
      .single();

    if (insertTenantError) {
      console.error('❌ Error insertando tenant:', insertTenantError.message);
      process.exit(1);
    }

    tenantId = newTenant.id;
    console.log(`🎉 Tenant creado con éxito. ID: ${tenantId}`);
  }

  // --- PASO 2: Aprovisionar o buscar el usuario de Autenticación (Supabase Auth) ---
  console.log(`\n🔍 Buscando usuario en Supabase Auth con email "${ADMIN_EMAIL}"...`);
  const { data: authUsers, error: listUsersError } = await supabase.auth.admin.listUsers();
  
  if (listUsersError) {
    console.error('❌ Error listando usuarios de Supabase Auth:', listUsersError.message);
    process.exit(1);
  }

  const existingAuthUser = authUsers.users.find((u) => u.email === ADMIN_EMAIL);
  let userId = '';

  if (existingAuthUser) {
    console.log(`✅ El usuario de autenticación ya existe con ID: ${existingAuthUser.id}`);
    userId = existingAuthUser.id;
  } else {
    console.log(`➕ Creando usuario en Supabase Auth (${ADMIN_EMAIL})...`);
    const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirmar el correo electrónico
      user_metadata: {
        full_name: ADMIN_NAME,
      },
    });

    if (createAuthError) {
      console.error('❌ Error creando usuario en Auth:', createAuthError.message);
      process.exit(1);
    }

    userId = newAuthUser.user.id;
    console.log(`🎉 Usuario de autenticación creado con éxito. ID: ${userId}`);
  }

  // --- PASO 3: Aprovisionar o actualizar Perfil en public.users ---
  console.log(`\n🔍 Buscando perfil en tabla public.users para ID: "${userId}"...`);
  const { data: existingProfile, error: selectProfileError } = await supabase
    .from('users')
    .select('id, role, tenant_id')
    .eq('id', userId)
    .maybeSingle();

  if (selectProfileError) {
    console.error('❌ Error consultando tabla public.users:', selectProfileError.message);
    process.exit(1);
  }

  if (existingProfile) {
    console.log(`✅ Perfil encontrado en public.users. Rol actual: "${existingProfile.role}"`);
    
    // Si existe pero no tiene rol de superadmin o no coincide el tenant, lo actualizamos
    if (existingProfile.role !== 'superadmin' || existingProfile.tenant_id !== tenantId) {
      console.log(`⚠️ Actualizando perfil a superadmin en el tenant correcto...`);
      const { error: updateProfileError } = await supabase
        .from('users')
        .update({
          role: 'superadmin',
          tenant_id: tenantId,
          full_name: ADMIN_NAME,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateProfileError) {
        console.error('❌ Error actualizando perfil en public.users:', updateProfileError.message);
        process.exit(1);
      }
      console.log('✅ Perfil actualizado con éxito.');
    }
  } else {
    console.log(`➕ Creando perfil en public.users con rol "superadmin" asociado al tenant...`);
    const { error: insertProfileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        tenant_id: tenantId,
        role: 'superadmin',
        full_name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertProfileError) {
      console.error('❌ Error insertando perfil en public.users:', insertProfileError.message);
      process.exit(1);
    }
    console.log('🎉 Perfil insertado exitosamente en public.users.');
  }

  console.log('\n==================================================');
  console.log('📊 RESUMEN DEL APREVISIONAMIENTO');
  console.log('==================================================');
  console.log(`🏢 Tenant Slug:   ${TENANT_SLUG}`);
  console.log(`🏢 Tenant ID:     ${tenantId}`);
  console.log(`👤 Superadmin:    ${ADMIN_NAME}`);
  console.log(`👤 Email:         ${ADMIN_EMAIL}`);
  console.log(`👤 User ID:       ${userId}`);
  console.log('==================================================\n');
  console.log('🔮 PRÓXIMOS PASOS RECOMENDADOS:');
  console.log(`1. Inicia sesión en: https://[tu-dominio]/${TENANT_SLUG}/login`);
  console.log(`2. O accede al dashboard local en: http://localhost:3000/${TENANT_SLUG}/login`);
  console.log(`3. El webhook de access token (Supabase Auth Hook) adjuntará automáticamente`);
  console.log(`   el tenant_id y rol 'superadmin' en el token JWT del usuario.`);
  console.log('==================================================\n');
}

main().catch((err) => {
  console.error('❌ Error inesperado durante la ejecución:', err);
  process.exit(1);
});
