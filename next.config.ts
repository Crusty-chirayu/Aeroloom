import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        {
          key: 'Content-Security-Policy',
          value:
            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data: https://tiles.openfreemap.org https://*.openfreemap.org; img-src 'self' data: blob: https://tilecache.rainviewer.com https://*.rainviewer.com https://tiles.openfreemap.org https://*.openfreemap.org https://*.tile.openstreetmap.org https://images.unsplash.com; connect-src 'self' https://tiles.openfreemap.org https://*.openfreemap.org https://api.airplanes.live https://api.adsb.lol https://opensky-network.org https://api.rainviewer.com https://tilecache.rainviewer.com https://*.rainviewer.com https://aviationweather.gov https://*.supabase.co wss://*.supabase.co; worker-src 'self' blob:; child-src 'self' blob:; frame-ancestors 'none';",
        },
      ],
    },
  ],
};

export default nextConfig;
