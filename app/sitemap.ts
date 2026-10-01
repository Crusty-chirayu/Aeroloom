import { MetadataRoute } from 'next';
import { GLOBAL_AIRPORTS } from '@/lib/airports/airportData';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://aeroloom.vercel.app';
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/airports`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about/data`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  const airportRoutes: MetadataRoute.Sitemap = GLOBAL_AIRPORTS.slice(0, 100).map((airport) => ({
    url: `${baseUrl}/airport/${airport.icao}`,
    lastModified: now,
    changeFrequency: 'hourly',
    priority: 0.75,
  }));

  return [...staticRoutes, ...airportRoutes];
}
