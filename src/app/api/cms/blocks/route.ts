import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { withTenantGuard } from '@/lib/auth';

// Esquemas por defecto para nuevos bloques
const DEFAULT_BLOCK_TEMPLATES: Record<string, any> = {
  hero: {
    headline: 'Nuevo Título Hero',
    subheadline: 'Ingresa una sub-headline o descripción corta para tu landing aquí.',
    bg_image_url: '',
    cta_primary_text: 'Agendar visita',
    cta_secondary_text: 'Conocer más',
    show_badge: true,
    badge_text: 'Admisiones Abiertas',
  },
  stats: {
    stats: [
      { value: 25, label: 'Años de Trayectoria', suffix: '+' },
      { value: 100, label: 'Docentes Certificados', suffix: '%' },
      { value: 1500, label: 'Egresados Exitosos', suffix: '+' },
    ],
  },
  testimonial: {
    items: [
      {
        id: '1',
        author: 'Sofía García',
        role: 'Mamá de Mateo, 3° Primaria',
        text: 'Excelente nivel académico y un ambiente escolar inigualable.',
        stars: 5,
      },
    ],
  },
  gallery: {
    images: [],
  },
  map: {
    address: 'Av. Universidad 120, Col. Centro, Querétaro, Qro.',
    phone: '4421234567',
    email: 'contacto@colegio.edu.mx',
    schedule: 'Lunes a Viernes de 8:00 AM a 3:00 PM',
    maps_embed:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3734.9080277340277!2d-100.39247668507466!3d20.591782985966453!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d35ad33b3b3b3b%3A0x3b3b3b3b3b3b3b3b!2sCentro%20de%20Quer%C3%A9taro!5e0!3m2!1ses-419!2smx!4v1624647362391!5m2!1ses-419!2smx',
    social_facebook: 'https://facebook.com',
    social_instagram: 'https://instagram.com',
    social_tiktok: 'https://tiktok.com',
    social_whatsapp: '4421234567',
  },
  education_levels: {
    levels: [
      { id: 'maternal', name: 'Maternal', description: 'Estimulación temprana y desarrollo integral.', icon: 'baby' },
      { id: 'preescolar', name: 'Preescolar', description: 'Aprendizaje lúdico y socialización.', icon: 'palette' },
      { id: 'primaria', name: 'Primaria', description: 'Formación académica bilingüe sólida.', icon: 'book-open' },
    ],
  },
  why_us: {
    points: [
      { title: 'Educación Bilingüe', description: 'Certificaciones Cambridge.', icon: 'languages' },
      { title: 'Deportes y Arte', description: 'Desarrollo integral extracurricular.', icon: 'trophy' },
      { title: 'Tecnología', description: 'Aulas equipadas e integración SafeLunch.', icon: 'laptop' },
    ],
  },
  custom: {
    title: 'Nueva Sección Personalizada',
    html: '<p>Ingresa contenido personalizado en formato HTML para esta sección.</p>',
  },
};

/**
 * GET /api/cms/blocks
 * Obtiene todos los bloques del tenant autenticado, ordenados por order_index.
 */
export const GET = withTenantGuard(async (request, _context) => {
  const tenantId = request.headers.get('x-tenant-id');
  const supabase = createAdminClient();

  const { data, error } = await (supabase as any)
    .from('content_blocks')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('order_index', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
});

/**
 * PATCH /api/cms/blocks
 * Actualiza data y/o el estado publicado de un bloque del tenant.
 */
export const PATCH = withTenantGuard(async (request, _context) => {
  const tenantId = request.headers.get('x-tenant-id');
  const body = await request.json();

  if (!body.block_id) {
    return NextResponse.json({ error: 'Se requiere block_id' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Validar que el bloque pertenezca al tenant del usuario
  const { data: block, error: checkError } = await (supabase as any)
    .from('content_blocks')
    .select('tenant_id')
    .eq('id', body.block_id)
    .maybeSingle();

  if (checkError || !block) {
    return NextResponse.json({ error: 'Bloque no encontrado' }, { status: 404 });
  }

  if (block.tenant_id !== tenantId) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  // 2. Ejecutar la actualización
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (body.data !== undefined) {
    updateData.data = body.data;
  }
  if (body.published !== undefined) {
    updateData.published = body.published;
  }
  if (body.order_index !== undefined) {
    updateData.order_index = body.order_index;
  }

  const { data: updatedBlock, error: updateError } = await (supabase as any)
    .from('content_blocks')
    .update(updateData)
    .eq('id', body.block_id)
    .select()
    .single();

  if (updateError) {
    console.error('Error actualizando bloque:', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Revalidar la landing pública y el panel CMS
  const tenantSlug = request.headers.get('x-tenant-slug');
  if (tenantSlug) {
    revalidatePath(`/${tenantSlug}`);
    revalidatePath(`/${tenantSlug}/dashboard/content`);
  }

  return NextResponse.json(updatedBlock);
});

/**
 * POST /api/cms/blocks
 * Agrega un nuevo bloque asignando por defecto el siguiente order_index.
 */
export const POST = withTenantGuard(async (request, _context) => {
  const tenantId = request.headers.get('x-tenant-id');
  const body = await request.json();

  if (!body.block_type) {
    return NextResponse.json({ error: 'Se requiere block_type' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Calcular el siguiente order_index
  const { data: existingBlocks } = await (supabase as any)
    .from('content_blocks')
    .select('order_index')
    .eq('tenant_id', tenantId)
    .order('order_index', { ascending: false })
    .limit(1);

  const nextIndex =
    existingBlocks && existingBlocks.length > 0
      ? existingBlocks[0].order_index + 1
      : 0;

  // Mapear tipos de bloques que no existen en el enum de la BD a 'custom' con propiedad section
  let finalBlockType = body.block_type;
  let customSection = undefined;

  if (finalBlockType === 'education_levels') {
    finalBlockType = 'custom';
    customSection = 'levels';
  } else if (finalBlockType === 'why_us') {
    finalBlockType = 'custom';
    customSection = 'why_us';
  }

  // 2. Determinar data por defecto
  const defaultData = DEFAULT_BLOCK_TEMPLATES[body.block_type] || {};
  const mergedData = { ...defaultData, ...(body.data || {}) };
  if (customSection) {
    mergedData.section = customSection;
  }

  // 3. Crear el bloque (comienza despublicado)
  const { data: newBlock, error: insertError } = await (supabase as any)
    .from('content_blocks')
    .insert({
      tenant_id: tenantId,
      page: body.page || 'home',
      block_type: finalBlockType,
      data: mergedData,
      order_index: nextIndex,
      published: false,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creando bloque:', insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Revalidar la landing pública
  const tenantSlug = request.headers.get('x-tenant-slug');
  if (tenantSlug) {
    revalidatePath(`/${tenantSlug}`);
    revalidatePath(`/${tenantSlug}/dashboard/content`);
  }

  return NextResponse.json(newBlock, { status: 201 });
});

/**
 * DELETE /api/cms/blocks
 * Elimina un bloque validando pertenencia al tenant.
 */
export const DELETE = withTenantGuard(async (request, _context) => {
  const tenantId = request.headers.get('x-tenant-id');
  const body = await request.json();

  if (!body.block_id) {
    return NextResponse.json({ error: 'Se requiere block_id' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Validar que el bloque pertenezca al tenant del usuario
  const { data: block, error: checkError } = await (supabase as any)
    .from('content_blocks')
    .select('tenant_id')
    .eq('id', body.block_id)
    .maybeSingle();

  if (checkError || !block) {
    return NextResponse.json({ error: 'Bloque no encontrado' }, { status: 404 });
  }

  if (block.tenant_id !== tenantId) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  // 2. Eliminar el bloque
  const { error: deleteError } = await (supabase as any)
    .from('content_blocks')
    .delete()
    .eq('id', body.block_id);

  if (deleteError) {
    console.error('Error eliminando bloque:', deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Revalidar la landing pública
  const tenantSlug = request.headers.get('x-tenant-slug');
  if (tenantSlug) {
    revalidatePath(`/${tenantSlug}`);
    revalidatePath(`/${tenantSlug}/dashboard/content`);
  }

  return NextResponse.json({ success: true });
});
