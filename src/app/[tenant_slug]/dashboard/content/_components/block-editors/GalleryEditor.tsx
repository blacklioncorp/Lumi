'use client';

import React, { useState, useRef } from 'react';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';

interface GalleryEditorProps {
  data: any;
  onChange: (newData: any) => void;
  tenantId: string;
}

export default function GalleryEditor({ data = {}, onChange, tenantId }: GalleryEditorProps) {
  const imagesList: string[] = data.images || [];
  const [uploadingCount, setUploadingCount] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateImages = (newList: string[]) => {
    onChange({
      ...data,
      images: newList,
    });
  };

  const handleUploadFiles = async (files: FileList) => {
    const spaceLeft = 20 - imagesList.length;
    if (spaceLeft <= 0) {
      toast.error('Has alcanzado el límite de 20 imágenes en la galería.');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, spaceLeft);
    if (files.length > spaceLeft) {
      toast.warning(`Solo se subirán las primeras ${spaceLeft} imágenes para no superar el límite de 20.`);
    }

    setUploadingCount((prev) => prev + filesToUpload.length);

    // Subir cada archivo individualmente
    const uploadPromises = filesToUpload.map(async (file) => {
      // 1. Validar tipo
      if (!file.type.startsWith('image/')) {
        toast.error(`"${file.name}" no es una imagen válida.`);
        setUploadingCount((prev) => Math.max(0, prev - 1));
        return null;
      }

      // 2. Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" supera el límite de 5MB.`);
        setUploadingCount((prev) => Math.max(0, prev - 1));
        return null;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tenant_id', tenantId);
        formData.append('folder', 'gallery');

        const res = await fetch('/api/cms/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await res.json();
        if (!res.ok || result.error) {
          throw new Error(result.error || 'Upload error');
        }

        setUploadingCount((prev) => Math.max(0, prev - 1));
        return result.url as string;
      } catch (err: any) {
        console.error('File upload error:', err);
        toast.error(`Error al subir "${file.name}": ${err.message || 'Error de red'}`);
        setUploadingCount((prev) => Math.max(0, prev - 1));
        return null;
      }
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    const validUrls = uploadedUrls.filter((url): url is string => url !== null);

    if (validUrls.length > 0) {
      updateImages([...imagesList, ...validUrls]);
      toast.success(`${validUrls.length} imagen(es) agregada(s) con éxito.`);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFiles(e.target.files);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const updated = imagesList.filter((_, idx) => idx !== indexToRemove);
    updateImages(updated);
  };

  const triggerSelectFiles = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Header and Limits */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Imágenes de la Galería ({imagesList.length}/20)</h3>
        {uploadingCount > 0 && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium bg-muted px-2.5 py-1 rounded-full border border-border">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Subiendo {uploadingCount} imagen(es)...</span>
          </div>
        )}
      </div>

      {/* Grid of current images */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {imagesList.map((imgUrl, idx) => (
          <div
            key={idx}
            className="relative aspect-square w-full rounded-xl overflow-hidden border border-border bg-muted group shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgUrl}
              alt={`Imagen de galería ${idx + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow"
                title="Eliminar imagen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {/* Uploading Placeholders */}
        {Array.from({ length: uploadingCount }).map((_, idx) => (
          <div
            key={`placeholder-${idx}`}
            className="aspect-square w-full border border-border rounded-xl bg-muted/40 flex flex-col items-center justify-center text-center p-4"
          >
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-2" />
            <span className="text-[10px] text-muted-foreground font-semibold">Subiendo...</span>
          </div>
        ))}
      </div>

      {/* Upload Drag zone */}
      {imagesList.length < 20 && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerSelectFiles}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-muted/40 flex flex-col items-center justify-center gap-3 ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <UploadCloud className="w-10 h-10 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">Arrastra tus fotos de la escuela aquí</p>
            <p className="text-xs text-muted-foreground">
              Sube una o varias imágenes (JPG, PNG, WEBP, GIF, máx. 5MB c/u)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
