'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Megaphone, Trophy, Video, PlaySquare, Image as ImageIcon } from 'lucide-react';
import { LandingComponentProps } from '@/types/tenant';
import { InstitutionalPost } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

const POST_ICONS: Record<string, React.ElementType> = {
  announcement: Megaphone,
  event: Calendar,
  achievement: Trophy,
  video_youtube: Video,
  video_tiktok: PlaySquare,
  reel_instagram: PlaySquare,
  gallery_post: ImageIcon,
};

const POST_COLORS: Record<string, string> = {
  announcement: 'text-blue-600 bg-blue-50',
  event: 'text-orange-600 bg-orange-50',
  achievement: 'text-yellow-600 bg-yellow-50',
  video_youtube: 'text-red-600 bg-red-50',
  video_tiktok: 'text-zinc-900 bg-zinc-100',
  reel_instagram: 'text-pink-600 bg-pink-50',
  gallery_post: 'text-indigo-600 bg-indigo-50',
};

export default function InstitutionalFeed({ config }: LandingComponentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [posts, setPosts] = useState<InstitutionalPost[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('institutional_posts')
          .select('*')
          .eq('tenant_id', config.id)
          .eq('published', true)
          .order('is_pinned', { ascending: false })
          .order('published_at', { ascending: false })
          .limit(6);

        if (!error && data) {
          setPosts(data as InstitutionalPost[]);
        }
      } catch (err) {
        console.error('Error fetching feed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [config.id, supabase]);

  if (loading || posts.length === 0) {
    return null; // Omitir sección si no hay contenido
  }

  return (
    <section ref={ref} id="feed" className="py-20 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado */}
        <div className="text-center mb-14">
          <span
            className="text-xs font-bold tracking-widest uppercase mb-3 inline-block"
            style={{ color: config.primary_color }}
          >
            Actualidad
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Novedades del Colegio
          </h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto text-base">
            Mantente al tanto de nuestros eventos, logros, noticias y contenido especial.
          </p>
        </div>

        {/* Grid de Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, i) => {
            const Icon = POST_ICONS[post.post_type] || Megaphone;
            const colorClass = POST_COLORS[post.post_type] || 'text-slate-600 bg-slate-100';

            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={visible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Etiqueta de tipo de post */}
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${colorClass}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {post.post_type.replace('_', ' ')}
                  </div>
                  {post.is_pinned && (
                    <div className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white shadow-sm">
                      Fijado
                    </div>
                  )}
                </div>

                {/* Media (Thumbnail o Video Embed) */}
                {post.thumbnail_url ? (
                  <div className="relative w-full h-48 bg-slate-100">
                    <Image
                      src={post.thumbnail_url}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : post.embed_code ? (
                  <div 
                    className="w-full h-48 bg-black overflow-hidden flex items-center justify-center [&>iframe]:w-full [&>iframe]:h-full"
                    dangerouslySetInnerHTML={{ __html: post.embed_code }}
                  />
                ) : (
                  <div className="w-full h-32 bg-slate-50 border-b border-slate-100" />
                )}

                {/* Contenido */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  {post.content && (
                    <p className="text-slate-600 text-sm mb-6 line-clamp-3">
                      {post.content}
                    </p>
                  )}

                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                    <span className="text-xs font-medium text-slate-400">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString('es-MX', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      }) : ''}
                    </span>
                    
                    {post.cta_url && post.cta_label && (
                      <a
                        href={post.cta_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold hover:underline"
                        style={{ color: config.primary_color }}
                      >
                        {post.cta_label} &rarr;
                      </a>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
