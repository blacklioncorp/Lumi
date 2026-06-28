'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Megaphone, Trophy, Play, Image as ImageIcon } from 'lucide-react';
import { LandingComponentProps } from '@/types/tenant';
import { InstitutionalPost } from '@/types/database';
import Image from 'next/image';
import VideoModal from './VideoModal';
import ImageLightbox from './ImageLightbox';

interface InstitutionalFeedProps extends LandingComponentProps {
  initialPosts: InstitutionalPost[];
  tenantSlug: string;
}

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'announcement', label: '📢 Noticias' },
  { id: 'event', label: '📅 Eventos' },
  { id: 'achievement', label: '🏆 Logros' },
  { id: 'video_youtube', label: '▶ Videos' },
  { id: 'gallery_post', label: '📸 Fotos' },
];

export default function InstitutionalFeed({ config, initialPosts, tenantSlug }: InstitutionalFeedProps) {
  const [posts, setPosts] = useState<InstitutionalPost[]>(initialPosts);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialPosts.length >= 6);
  const [offset, setOffset] = useState(initialPosts.length);

  // Modals state
  const [videoModal, setVideoModal] = useState<{ isOpen: boolean; type: 'youtube' | 'instagram'; videoId: string; title: string }>({
    isOpen: false, type: 'youtube', videoId: '', title: ''
  });
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; images: string[]; initialIndex: number }>({
    isOpen: false, images: [], initialIndex: 0
  });

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/feed/posts?tenant_slug=${tenantSlug}&offset=${offset}&limit=6${activeFilter !== 'all' ? `&type=${activeFilter}` : ''}`);
      const data = await res.json();
      if (data.posts) {
        setPosts(prev => [...prev, ...data.posts]);
        setOffset(prev => prev + data.posts.length);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Error loading more posts', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFilterClick = async (filterId: string) => {
    setActiveFilter(filterId);
    setOffset(0);
    setLoadingMore(true);
    
    try {
      let typeParam = '';
      if (filterId !== 'all') {
        typeParam = `&type=${filterId}`;
      }
      
      const res = await fetch(`/api/feed/posts?tenant_slug=${tenantSlug}&offset=0&limit=6${typeParam}`);
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
        setOffset(data.posts.length);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Error filtering posts', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getInstagramId = (url: string) => {
    const regExp = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([^\/?#&]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Helper to render specific card types
  const renderCard = (post: InstitutionalPost, index: number) => {
    const isFeatured = post.is_pinned;
    const colSpanClass = isFeatured ? 'md:col-span-2' : 'col-span-1';

    switch (post.post_type) {
      case 'announcement':
        return (
          <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: (index % 6) * 0.1 }}
            className={`bg-white rounded-2xl shadow-sm border-l-4 p-6 hover:shadow-md transition-all flex flex-col h-full`}
            style={{ borderLeftColor: config.primary_color }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 rounded-full text-xs font-bold bg-opacity-10 text-opacity-90 flex items-center gap-1.5"
                   style={{ backgroundColor: `${config.primary_color}1a`, color: config.primary_color }}>
                <Megaphone size={14} /> 📢 Comunicado
              </div>
              <span className="text-sm text-slate-400">
                {post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}
              </span>
            </div>
            <h3 className={`font-bold text-slate-900 mb-3 ${isFeatured ? 'text-2xl' : 'text-lg line-clamp-2'}`}>
              {post.title}
            </h3>
            {post.content && (
              <p className={`text-slate-600 ${isFeatured ? '' : 'line-clamp-3'} mb-4 fade-out`}>
                {post.content}
              </p>
            )}
            {post.cta_url && post.cta_label && (
              <div className="mt-auto pt-2">
                <a
                  href={post.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 text-sm font-semibold border rounded-lg hover:bg-slate-50 transition-colors"
                  style={{ borderColor: config.primary_color, color: config.primary_color }}
                >
                  {post.cta_label}
                </a>
              </div>
            )}
          </motion.article>
        );

      case 'event':
        return (
          <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: (index % 6) * 0.1 }}
            className={`bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all flex h-full ${isFeatured ? 'flex-col md:flex-row' : 'flex-col'}`}
          >
            <div className={`relative ${isFeatured ? 'md:w-1/2 min-h-[300px]' : 'w-full h-48'} shrink-0`} style={{ backgroundColor: config.primary_color }}>
              {post.thumbnail_url && (
                <Image src={post.thumbnail_url} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute top-4 left-4 backdrop-blur-md bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5 shadow-sm">
                <Calendar size={14} /> 📅 EVENTO
              </div>
              <div className="absolute bottom-4 left-4 text-white">
                 <div className="text-4xl font-black leading-none shadow-black drop-shadow-md">
                   {post.scheduled_at ? new Date(post.scheduled_at).getDate() : ''}
                 </div>
                 <div className="text-lg font-bold uppercase tracking-wider drop-shadow-md">
                   {post.scheduled_at ? new Date(post.scheduled_at).toLocaleString('es-MX', { month: 'short' }) : ''}
                 </div>
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className={`font-bold text-slate-900 mb-3 ${isFeatured ? 'text-2xl' : 'text-lg line-clamp-2'}`}>
                {post.title}
              </h3>
              {post.content && (
                <p className={`text-slate-600 mb-6 ${isFeatured ? '' : 'line-clamp-2'}`}>
                  {post.content}
                </p>
              )}
              {post.cta_url && post.cta_label && (
                <div className="mt-auto">
                  <a
                    href={post.cta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 shadow-sm"
                    style={{ backgroundColor: config.primary_color }}
                  >
                    {post.cta_label}
                  </a>
                </div>
              )}
            </div>
          </motion.article>
        );

      case 'achievement':
        return (
          <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: (index % 6) * 0.1 }}
            className={`rounded-2xl p-8 hover:-translate-y-1 transition-transform flex flex-col relative overflow-hidden group h-full`}
            style={{ 
              background: `linear-gradient(135deg, ${config.primary_color}0d 0%, transparent 100%)`,
              border: `1px solid ${config.primary_color}33`
            }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-600 group-hover:-translate-y-2 group-hover:scale-110 transition-transform duration-300">
                <Trophy size={32} />
              </div>
              <div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 mb-2 shadow-sm">
                  🏆 Reconocimiento
                </div>
                <h3 className={`font-bold text-slate-900 ${isFeatured ? 'text-2xl' : 'text-xl'}`}>
                  {post.title}
                </h3>
              </div>
            </div>
            {post.content && (
              <p className="text-slate-700 font-medium leading-relaxed mt-2">
                {post.content}
              </p>
            )}
          </motion.article>
        );

      case 'video_youtube':
        const ytId = post.media_url ? getYouTubeId(post.media_url) : null;
        return (
          <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: (index % 6) * 0.1 }}
            className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer group h-full flex flex-col`}
            onClick={() => ytId && setVideoModal({ isOpen: true, type: 'youtube', videoId: ytId, title: post.title })}
          >
            <div className="relative aspect-video w-full bg-slate-900 overflow-hidden shrink-0">
              {ytId && (
                <img 
                  src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  loading="lazy" 
                />
              )}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,255,255,0.4)] group-hover:scale-110 transition-transform">
                  <Play size={32} className="ml-1" fill="currentColor" />
                </div>
              </div>
              <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
                <Play size={12} fill="currentColor" /> YouTube
              </div>
            </div>
            <div className="p-5 flex-1">
              <h3 className="font-bold text-slate-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                {post.title}
              </h3>
            </div>
          </motion.article>
        );

      case 'video_tiktok':
        return (
          <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: (index % 6) * 0.1 }}
            className={`bg-black rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group h-full`}
          >
            <a 
              href={post.media_url || '#'} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block w-full h-full relative min-h-[300px]"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-black via-zinc-900 to-[#25F4EE]/20 opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-transparent to-[#FE2C55]/20 opacity-80" />
              
              <div className="relative p-8 h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 mb-6 rounded-2xl bg-white flex items-center justify-center shadow-[4px_4px_0px_#25F4EE,-4px_-4px_0px_#FE2C55] group-hover:scale-110 transition-transform">
                  <Play size={32} className="text-black ml-1" fill="currentColor" />
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white backdrop-blur-md mb-4 border border-white/20">
                  TikTok
                </div>
                <h3 className="font-bold text-white text-xl mb-6 drop-shadow-md">
                  {post.title}
                </h3>
                <span className="text-[#25F4EE] font-semibold text-sm hover:text-white transition-colors">
                  Ver en TikTok &rarr;
                </span>
              </div>
            </a>
          </motion.article>
        );

      case 'reel_instagram':
        const igId = post.media_url ? getInstagramId(post.media_url) : null;
        return (
          <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: (index % 6) * 0.1 }}
            className={`rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group h-full`}
            style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}
          >
            <a 
               href={post.media_url || '#'} 
               target="_blank" 
               rel="noopener noreferrer" 
               className="block w-full h-full relative min-h-[300px]"
               onClick={(e) => {
                 if (post.embed_code || igId) {
                   e.preventDefault();
                   if (igId) {
                     setVideoModal({ isOpen: true, type: 'instagram', videoId: igId, title: post.title });
                   } else {
                     window.open(post.media_url || '', '_blank');
                   }
                 }
               }}
            >
              <div className="relative p-8 h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 mb-6 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 group-hover:scale-110 transition-transform shadow-sm">
                  <Play size={32} className="text-white ml-1" fill="currentColor" />
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md mb-4 shadow-sm">
                  Instagram
                </div>
                <h3 className="font-bold text-white text-xl mb-6 drop-shadow-md">
                  {post.title}
                </h3>
                <span className="text-white font-semibold text-sm hover:underline">
                  Ver en Instagram &rarr;
                </span>
              </div>
            </a>
          </motion.article>
        );

      case 'gallery_post':
        const displayImages = post.images?.slice(0, 4) || [];
        const hasMoreImages = (post.images?.length || 0) > 4;
        const extraImagesCount = (post.images?.length || 0) - 4;
        
        return (
          <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: (index % 6) * 0.1 }}
            className={`bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col`}
          >
            <div className="grid grid-cols-2 grid-rows-2 aspect-square md:aspect-[4/3] gap-1 p-1 bg-slate-100 cursor-pointer shrink-0"
                 onClick={() => post.images?.length && setLightbox({ isOpen: true, images: post.images, initialIndex: 0 })}>
              {displayImages.map((img, i) => (
                <div key={i} className="relative w-full h-full overflow-hidden rounded-sm group">
                  <Image src={img} alt={`Gallery ${i}`} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="(max-width: 768px) 50vw, 33vw" />
                  {i === 3 && hasMoreImages && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                      <span className="text-white font-bold text-2xl">+{extraImagesCount}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-5 flex-1">
              <h3 className="font-bold text-slate-900 mb-2">
                {post.title}
              </h3>
              {post.content && (
                <p className="text-slate-600 text-sm line-clamp-2">
                  {post.content}
                </p>
              )}
            </div>
          </motion.article>
        );

      default:
        return null;
    }
  };

  return (
    <section id="vida-escolar" className="py-24 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span
            className="text-sm font-black tracking-[0.2em] uppercase mb-4 inline-block"
            style={{ color: config.primary_color }}
          >
            VIDA EN EL COLEGIO
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Todo lo que nos hace únicos
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Noticias, eventos, logros y momentos que definen nuestra comunidad escolar
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {FILTERS.map(filter => (
            <button
              key={filter.id}
              onClick={() => handleFilterClick(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${
                activeFilter === filter.id 
                  ? 'bg-slate-900 text-white shadow-md scale-105' 
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Masonry Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 auto-rows-max">
          <AnimatePresence mode="popLayout">
            {posts.map((post, index) => (
              <div key={post.id} className={post.is_pinned ? 'md:col-span-2' : 'col-span-1'}>
                {renderCard(post, index)}
              </div>
            ))}
          </AnimatePresence>
        </motion.div>

        {posts.length === 0 && !loadingMore && (
          <div className="text-center py-20">
            <p className="text-slate-500">No hay publicaciones disponibles para esta categoría.</p>
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="mt-16 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-bold text-slate-700 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loadingMore ? 'Cargando...' : 'Ver más publicaciones'}
            </button>
          </div>
        )}

      </div>

      {/* Modals */}
      <VideoModal
        isOpen={videoModal.isOpen}
        onClose={() => setVideoModal(prev => ({ ...prev, isOpen: false }))}
        type={videoModal.type}
        videoId={videoModal.videoId}
        title={videoModal.title}
      />
      
      <ImageLightbox
        isOpen={lightbox.isOpen}
        images={lightbox.images}
        initialIndex={lightbox.initialIndex}
        onClose={() => setLightbox(prev => ({ ...prev, isOpen: false }))}
      />
    </section>
  );
}
