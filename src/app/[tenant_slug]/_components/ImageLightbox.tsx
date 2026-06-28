'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightbox({ images, initialIndex, isOpen, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentIndex, images.length]);

  const showNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const showPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
          />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 text-white/70 hover:text-white p-2 transition-colors"
          >
            <X size={32} />
          </button>

          {/* Counter */}
          <div className="absolute top-6 right-20 z-50 text-white/70 font-medium tracking-widest text-sm">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Main Image */}
          <div className="relative z-10 w-full h-full flex items-center justify-center px-12 md:px-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset }) => {
                  const swipe = offset.x;
                  if (swipe < -50) showNext();
                  else if (swipe > 50) showPrev();
                }}
                className="relative w-full max-w-5xl h-[80vh] cursor-grab active:cursor-grabbing"
              >
                <Image
                  src={images[currentIndex]}
                  alt={`Imagen ${currentIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); showPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white/50 hover:text-white p-4 transition-colors"
              >
                <ChevronLeft size={48} strokeWidth={1.5} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); showNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white/50 hover:text-white p-4 transition-colors"
              >
                <ChevronRight size={48} strokeWidth={1.5} />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentIndex ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
