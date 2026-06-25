/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage — acepta cualquier proyecto
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Supabase Storage legacy
        protocol: 'https',
        hostname: '**.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Permite cualquier https para logos/fotos en desarrollo
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
