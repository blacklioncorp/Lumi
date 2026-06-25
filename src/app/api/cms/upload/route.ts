import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth';

/**
 * POST /api/cms/upload
 * Sube una imagen a Supabase Storage (bucket tenant-assets) de forma segura.
 * Solo permitido para school_admin, editor y superadmin dentro de su propio tenant.
 */
export async function POST(request: Request) {
  try {
    // 1. Verificar autenticación del usuario
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar roles permitidos
    const isAuthorizedRole = ['school_admin', 'editor', 'superadmin'].includes(user.user_role || '');
    if (!isAuthorizedRole) {
      return NextResponse.json({ error: 'Permisos insuficientes para realizar cargas' }, { status: 403 });
    }

    // 2. Extraer datos del formulario
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tenantId = formData.get('tenant_id') as string | null;
    const folder = (formData.get('folder') as string | null) || 'gallery';

    if (!file || !tenantId) {
      return NextResponse.json(
        { error: 'Faltan parámetros obligatorios (file y tenant_id)' },
        { status: 400 }
      );
    }

    // Aislamiento: El usuario debe pertenecer al tenant especificado (excepto superadmin)
    if (user.user_role !== 'superadmin' && user.tenant_id !== tenantId) {
      return NextResponse.json(
        { error: 'Acceso denegado. No puedes subir archivos para otro colegio.' },
        { status: 403 }
      );
    }

    // 3. Validaciones de archivo
    // Tamaño máximo: 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido de 5MB.' },
        { status: 400 }
      );
    }

    // Tipo de archivo: solo imágenes específicas
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se aceptan JPEG, PNG, WEBP y GIF.' },
        { status: 400 }
      );
    }

    // 4. Procesar y cargar a Supabase Storage
    const buffer = await file.arrayBuffer();
    const ext = file.name.split('.').pop() || 'png';
    const filename = `${tenantId}/${folder}/${crypto.randomUUID()}.${ext}`;

    const supabase = createAdminClient();

    // Cargar usando cliente admin (service_role) para saltarse las restricciones de subida directa
    const { error: uploadError } = await supabase.storage
      .from('tenant-assets')
      .upload(filename, Buffer.from(buffer), {
        contentType: file.type,
        duplex: 'half',
      });

    if (uploadError) {
      console.error('Error subiendo archivo a Supabase:', uploadError);
      return NextResponse.json(
        { error: 'Error al subir el archivo al almacenamiento en la nube.' },
        { status: 500 }
      );
    }

    // 5. Obtener y retornar la URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from('tenant-assets')
      .getPublicUrl(filename);

    return NextResponse.json({ url: publicUrl });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error en POST /api/cms/upload:', msg);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
