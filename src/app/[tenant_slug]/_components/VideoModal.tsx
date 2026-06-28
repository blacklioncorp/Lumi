'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'youtube' | 'instagram';
  videoId: string;
  title: string;
}

export default function VideoModal({ isOpen, onClose, type, videoId, title }: VideoModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative w-full z-10 flex flex-col ${
              type === 'youtube' ? 'max-w-4xl' : 'max-w-[400px]'
            }`}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white/10"
              aria-label="Cerrar modal"
            >
              <X size={32} />
            </button>

            {/* Video Content */}
            <div className="w-full bg-black rounded-xl overflow-hidden shadow-2xl relative">
              {type === 'youtube' ? (
                <div className="relative w-full aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={title}
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="relative w-full h-[580px] bg-white flex items-center justify-center">
                  <iframe
                    src={`https://www.instagram.com/p/${videoId}/embed/`}
                    className="w-full h-full border-0"
                    scrolling="no"
                    allowTransparency={true}
                    allowFullScreen
                    title={title}
                    loading="lazy"
                  />
                </div>
              )}
            </div>

            {/* Title */}
            <div className="mt-4 text-center">
              <h3 className="text-white font-medium text-lg lg:text-xl drop-shadow-md">
                {title}
              </h3>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
