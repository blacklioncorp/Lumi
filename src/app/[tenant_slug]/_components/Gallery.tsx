'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { LandingComponentProps } from '@/types/tenant';
import { ContentBlock } from '@/types/database';

interface GalleryImage {
  url: string;
  alt?: string;
}

// Gradientes de placeholder para cuando no hay imágenes
const PLACEHOLDER_GRADIENTS = [
  'from-blue-400 to-indigo-600',
  'from-amber-400 to-orange-600',
  'from-emerald-400 to-teal-600',
  'from-purple-400 to-pink-600',
  'from-sky-400 to-cyan-600',
  'from-rose-400 to-red-600',
];

export default function Gallery({ config, blocks }: LandingComponentProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const galleryBlock = blocks.find((b: ContentBlock) => b.block_type === 'gallery');
  const images: GalleryImage[] = (galleryBlock?.data?.images as GalleryImage[] | undefined) ?? [];
  const hasImages = images.length > 0;

  // Máximo 12; si showAll = false, mostrar solo 6
  const displayCount = hasImages ? Math.min(images.length, 12) : 6;
  const visibleImages = hasImages
    ? (showAll ? images.slice(0, 12) : images.slice(0, 6))
    : Array.from({ length: showAll ? 6 : 4 });

  const goNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % displayCount);
  };
  const goPrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + displayCount) % displayCount);
  };

  // Navegar lightbox con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft')  goPrev();
    if (e.key === 'Escape')     setLightboxIndex(null);
  };

  return (
    <section id="galeria" className="py-20 bg-white" onKeyDown={handleKeyDown}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="text-center mb-12">
          <span
            className="text-xs font-bold tracking-widest uppercase mb-3 inline-block"
            style={{ color: config.primary_color }}
          >
            Galería
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Nuestras instalaciones
          </h2>
        </div>

        {/* Grid masonry — emulado con columnas CSS */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {visibleImages.map((img, i) => {
            const image = img as GalleryImage | undefined;
            const gradient = PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length];

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.08 }}
                className="relative break-inside-avoid rounded-xl overflow-hidden cursor-pointer group"
                style={{ height: i % 3 === 1 ? 260 : 200 }}
                onClick={() => hasImages && setLightboxIndex(i)}
              >
                {image?.url ? (
                  <Image
                    src={image.url}
                    alt={image.alt ?? `Instalaciones ${config.name} ${i + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  // Placeholder elegante
                  <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <ImageIcon size={32} className="text-white/50" />
                  </div>
                )}
                {/* Overlay en hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </motion.div>
            );
          })}
        </div>

        {/* Botón "Ver más" */}
        {hasImages && images.length > 6 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowAll((v) => !v)}
              className="px-6 py-2.5 rounded-lg border text-sm font-medium transition-all hover:shadow-md"
              style={{ borderColor: config.primary_color, color: config.primary_color }}
            >
              {showAll ? 'Ver menos' : `Ver más (${images.length - 6} fotos)`}
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && hasImages && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxIndex(null)}
          >
            {/* Imagen */}
            <motion.div
              className="relative w-full max-w-4xl max-h-[85vh] mx-4"
              initial={{ scale: 0.93 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.93 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              {images[lightboxIndex]?.url && (
                <Image
                  src={images[lightboxIndex].url}
                  alt={images[lightboxIndex].alt ?? ''}
                  width={1200}
                  height={800}
                  className="rounded-xl object-contain max-h-[80vh] w-full"
                />
              )}
            </motion.div>

            {/* Controles */}
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight size={28} />
            </button>
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={22} />
            </button>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {lightboxIndex + 1} / {Math.min(images.length, 12)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
