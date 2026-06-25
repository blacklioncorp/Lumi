'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Monitor, AlertTriangle, Eye, Save, Globe, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';
import { ContentBlock, TenantConfig } from '@/types/tenant';
import BlockList from './BlockList';
import BlockEditor from './BlockEditor';
import { Button, buttonVariants } from '@/components/ui/button';

interface CMSEditorProps {
  config: TenantConfig;
  initialBlocks: ContentBlock[];
  userRole: string;
}

export default function CMSEditor({
  config,
  initialBlocks,
  userRole,
}: CMSEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [originalBlocks, setOriginalBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // 1. Detectar si es mobile/tablet en base al ancho de ventana (CMS solo para desktop)
  useEffect(() => {
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // 2. Controlar si hay cambios sin guardar
  useEffect(() => {
    const hasChanges = JSON.stringify(blocks) !== JSON.stringify(originalBlocks);
    setIsDirty(hasChanges);
  }, [blocks, originalBlocks]);

  if (!isDesktop) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-border rounded-2xl bg-card">
        <Monitor className="w-12 h-12 text-muted-foreground animate-pulse mb-4" />
        <h2 className="text-xl font-bold text-foreground">Editor de contenido no disponible</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          El editor de contenido (CMS) está disponible solo en computadoras de escritorio (desktop) debido a la complejidad del diseño visual interactivo.
        </p>
      </div>
    );
  }

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  // Acciones:
  // A. Seleccionar bloque
  const handleSelectBlock = (id: string) => {
    setSelectedBlockId(id);
  };

  // B. Toggle publicado/borrador de un bloque (Guardado optimista)
  const handleTogglePublish = async (id: string) => {
    const blockToToggle = blocks.find((b) => b.id === id);
    if (!blockToToggle) return;

    const previousState = [...blocks];
    const newPublishState = !blockToToggle.published;

    // Actualización optimista en cliente
    const updated = blocks.map((b) =>
      b.id === id ? { ...b, published: newPublishState } : b
    );
    setBlocks(updated);
    // Si el bloque original también se actualiza para la comparación
    const updatedOriginal = originalBlocks.map((b) =>
      b.id === id ? { ...b, published: newPublishState } : b
    );
    setOriginalBlocks(updatedOriginal);

    try {
      const res = await fetch('/api/cms/blocks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_id: id, published: newPublishState }),
      });

      if (!res.ok) {
        throw new Error();
      }

      toast.success(
        newPublishState
          ? `Sección "${blockToToggle.data?.title || blockToToggle.block_type}" publicada.`
          : `Sección "${blockToToggle.data?.title || blockToToggle.block_type}" guardada como borrador.`
      );
    } catch {
      // Revertir en caso de fallo
      setBlocks(previousState);
      const originalRevert = originalBlocks.map((b) =>
        b.id === id ? { ...b, published: blockToToggle.published } : b
      );
      setOriginalBlocks(originalRevert);
      toast.error('Error al actualizar el estado de publicación en el servidor.');
    }
  };

  // C. Eliminar bloque (Guardado optimista)
  const handleDeleteBlock = async (id: string) => {
    const blockToDelete = blocks.find((b) => b.id === id);
    if (!blockToDelete) return;

    const previousState = [...blocks];
    const previousOriginal = [...originalBlocks];

    // Actualización optimista
    setBlocks(blocks.filter((b) => b.id !== id));
    setOriginalBlocks(originalBlocks.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);

    try {
      const res = await fetch('/api/cms/blocks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_id: id }),
      });

      if (!res.ok) {
        throw new Error();
      }

      toast.success(`Sección "${blockToDelete.data?.title || blockToDelete.block_type}" eliminada.`);
    } catch {
      // Revertir
      setBlocks(previousState);
      setOriginalBlocks(previousOriginal);
      toast.error('Error al eliminar la sección.');
    }
  };

  // D. Renombrar bloque (Cambio local, se guarda al hacer click en Guardar)
  const handleRenameBlock = (id: string, newName: string) => {
    const updated = blocks.map((b) =>
      b.id === id ? { ...b, data: { ...b.data, title: newName } } : b
    );
    setBlocks(updated);
  };

  // E. Reordenar bloques (Guardado optimista - Open Question 2)
  const handleReorderBlocks = async (reorderedList: ContentBlock[]) => {
    const previousState = [...blocks];

    // optimista
    setBlocks(reorderedList);

    try {
      const res = await fetch('/api/cms/blocks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: reorderedList.map((b) => ({ id: b.id, order_index: b.order_index })),
        }),
      });

      if (!res.ok) {
        throw new Error();
      }

      // Actualizar también originalBlocks para reflejar el nuevo orden en las comparaciones de datos
      const updatedOriginal = [...originalBlocks].sort(
        (a, b) =>
          reorderedList.findIndex((x) => x.id === a.id) -
          reorderedList.findIndex((x) => x.id === b.id)
      );
      setOriginalBlocks(updatedOriginal);
      toast.success('Orden de las secciones guardado.');
    } catch {
      // Revertir
      setBlocks(previousState);
      toast.error('Error al guardar el nuevo orden de las secciones en el servidor.');
    }
  };

  // F. Agregar nuevo bloque
  const handleAddBlock = async (blockType: string) => {
    try {
      const res = await fetch('/api/cms/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block_type: blockType }),
      });

      const newBlock = await res.json();

      if (!res.ok || newBlock.error) {
        throw new Error(newBlock.error || 'Fallo al agregar bloque');
      }

      setBlocks([...blocks, newBlock]);
      setOriginalBlocks([...originalBlocks, newBlock]);
      setSelectedBlockId(newBlock.id);
      toast.success('Nueva sección agregada con plantilla base.');
    } catch (err: any) {
      toast.error(err.message || 'Error al agregar la sección.');
    }
  };

  // G. Cambios del contenido del editor de bloques
  const handleBlockContentChange = (newData: any) => {
    if (!selectedBlockId) return;
    const updated = blocks.map((b) =>
      b.id === selectedBlockId ? { ...b, data: newData } : b
    );
    setBlocks(updated);
  };

  // H. Guardar todos los cambios locales pendientes
  const handleSaveChanges = async () => {
    // Buscar los bloques modificados
    const changedBlocks = blocks.filter((b) => {
      const original = originalBlocks.find((orig) => orig.id === b.id);
      return original && JSON.stringify(original.data) !== JSON.stringify(b.data);
    });

    if (changedBlocks.length === 0) return;

    setIsSaving(true);
    const saveToastId = toast.loading('Guardando cambios locales...');

    try {
      const savePromises = changedBlocks.map(async (block) => {
        const res = await fetch('/api/cms/blocks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ block_id: block.id, data: block.data }),
        });
        if (!res.ok) {
          throw new Error(`Error en bloque: ${block.block_type}`);
        }
        return res.json();
      });

      await Promise.all(savePromises);

      setOriginalBlocks([...blocks]);
      toast.success('Todos los cambios se han guardado con éxito.', { id: saveToastId });
    } catch (err: any) {
      console.error(err);
      toast.error('Fallo al guardar algunos cambios en el servidor.', { id: saveToastId });
    } finally {
      setIsSaving(false);
    }
  };

  // I. Publicar todo (published = true para todos los bloques)
  const handlePublishAll = async () => {
    setIsPublishing(true);
    const publishToastId = toast.loading('Publicando todas las secciones...');

    try {
      const res = await fetch('/api/cms/publish', {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error publicando');
      }

      // Sincronizar estado local como publicado
      const publishedBlocks = blocks.map((b) => ({ ...b, published: true }));
      setBlocks(publishedBlocks);
      setOriginalBlocks(publishedBlocks);

      toast.success(`¡Sitio actualizado! Se han publicado ${data.count} secciones.`, {
        id: publishToastId,
      });
    } catch (err: any) {
      console.error('Error publicando:', err);
      toast.error('Fallo al publicar el contenido web.', { id: publishToastId });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Editor */}
      <div className="bg-card border border-border p-4 md:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Editor de Contenido</h1>
            {isDirty && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30">
                <AlertTriangle className="w-3 h-3" /> Cambios sin guardar
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Modifica la landing pública de tu colegio de forma visual y arrastra para reordenar secciones.
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Vista previa en pestaña nueva */}
          <a
            href={`/${config.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <Eye className="w-4 h-4 mr-1.5" /> Vista Previa
          </a>

          {/* Guardar cambios locales */}
          <Button
            onClick={handleSaveChanges}
            disabled={!isDirty || isSaving}
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white border-green-700 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            Guardar cambios
          </Button>

          {/* Publicar todo */}
          <Button
            onClick={handlePublishAll}
            disabled={isPublishing}
            variant="secondary"
            size="sm"
            className="bg-primary text-white hover:bg-primary/95 disabled:opacity-50"
          >
            {isPublishing ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Globe className="w-4 h-4 mr-1.5" />
            )}
            Publicar todo
          </Button>
        </div>
      </div>

      {/* Editor Grid: 40% Lista, 60% Editor específico */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Estructura de Secciones
          </h2>
          <BlockList
            blocks={blocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={handleSelectBlock}
            onTogglePublish={handleTogglePublish}
            onDeleteBlock={handleDeleteBlock}
            onRenameBlock={handleRenameBlock}
            onReorderBlocks={handleReorderBlocks}
            onAddBlock={handleAddBlock}
          />
        </div>

        <div className="lg:col-span-6">
          {selectedBlock ? (
            <BlockEditor
              block={selectedBlock}
              onChange={handleBlockContentChange}
              tenantId={config.id}
              userRole={userRole}
            />
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 border border-dashed rounded-2xl text-center bg-card text-muted-foreground">
              <LayoutTemplate className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold text-sm">Ninguna sección seleccionada</h3>
              <p className="text-xs mt-1 max-w-xs">
                Selecciona o haz clic en ✏️ &quot;Editar&quot; en cualquiera de las secciones del listado de la izquierda para comenzar a personalizar sus datos.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
