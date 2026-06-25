'use client';

import React, { useState, useRef } from 'react';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string) => void;
  tenantId: string;
  folder: string;
}

export default function ImageUploader({
  value,
  onChange,
  tenantId,
  folder,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    // 1. Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes (JPEG, PNG, WEBP, GIF).');
      return;
    }

    // 2. Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo supera el límite de 5MB.');
      return;
    }

    setIsUploading(true);
    const uploadToastId = toast.loading('Subiendo imagen...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenant_id', tenantId);
      formData.append('folder', folder);

      const res = await fetch('/api/cms/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Fallo en la subida');
      }

      onChange(data.url);
      toast.success('Imagen subida correctamente.', { id: uploadToastId });
    } catch (error: any) {
      console.error('Upload component error:', error);
      toast.error(error.message || 'Error al subir el archivo.', { id: uploadToastId });
    } finally {
      setIsUploading(false);
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
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {value ? (
        <div className="relative aspect-video w-full max-w-sm rounded-xl overflow-hidden border border-border group shadow-inner bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Imagen cargada"
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onButtonClick}
              disabled={isUploading}
              className="px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-white/90 rounded-lg transition-colors shadow flex items-center gap-1"
            >
              Reemplazar
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`aspect-video w-full max-w-sm border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all hover:bg-muted/40 ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">Subiendo...</p>
            </div>
          ) : (
            <div className="space-y-2 text-muted-foreground">
              <UploadCloud className="w-8 h-8 mx-auto" />
              <p className="text-sm font-semibold">Arrastra una imagen aquí</p>
              <p className="text-xs">O haz clic para explorar (Máx. 5MB)</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
