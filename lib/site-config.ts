/**
 * Aeroloom Site Configuration
 *
 * CANONICAL SOURCE OF TRUTH for site identity, branding, developer credits,
 * and environment bindings. To rename the application or update developer profiles,
 * modify this file ONLY.
 */

export const siteConfig = {
  // Brand & Application Identity
  name: 'Aeroloom',
  shortName: 'Aeroloom',
  tagline: 'Live Flight Intelligence',
  description:
    'Real-time ADS-B flight tracking with editorial cartography, sub-pixel dead reckoning, and verified telemetry provenance.',
  
  // Canonical URL Resolution
  // Defaults to localhost:3000 in development, overridden by NEXT_PUBLIC_SITE_URL in production
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, ''),

  // Creator & Developer Information
  developer: {
    name: 'Chirayu',
    role: 'Computer Engineering Student & Full-Stack Developer',
    location: 'Bangalore, India',
    email: 'chirayujaysawal7@gmail.com',
    links: {
      portfolio: 'https://portfolio-lac-kappa-49.vercel.app/',
      linkedin: 'https://www.linkedin.com/in/chirayu-babu-jaysawal/',
      github: 'https://github.com/Crusty-chirayu',
    },
  },

  // Owner Placeholders (To be completed by repository owner prior to commercial launch)
  owner: {
    legalEntity: 'TODO_OWNER: Legal Entity Name (e.g. Aeroloom Technologies / Personal)',
    governingLaw: 'TODO_OWNER: Governing Jurisdiction (e.g. State of Karnataka, India)',
    customDomain: 'TODO_OWNER: Production Custom Domain (e.g. aeroloom.com)',
    supportEmail: 'chirayujaysawal7@gmail.com',
  },

  // Telemetry & Feed Metadata
  metadata: {
    version: '2.0.0-editorial',
    radarProvider: 'RainViewer',
    adsbPrimary: 'airplanes.live',
    adsbFallback: 'adsb.lol',
    weatherProvider: 'NOAA / Aviation Weather Center',
    mapProvider: 'OpenFreeMap & OpenStreetMap Contributors',
  },

  // Navigation Links
  nav: {
    primary: [
      { label: 'Map', href: '/map' },
      { label: 'Airports', href: '/airports' },
      { label: 'Search', href: '/search' },
      { label: 'Data', href: '/about/data' },
    ],
    legal: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Data & Safety Disclaimer', href: '/disclaimer' },
      { label: 'Accessibility', href: '/accessibility' },
    ],
    company: [
      { label: 'About & Case Study', href: '/about' },
      { label: 'System Status', href: '/status' },
      { label: 'Credits & Attributions', href: '/credits' },
      { label: 'Contact', href: '/contact' },
    ],
  },
} as const;

export type SiteConfig = typeof siteConfig;

/**
 * Helper to construct absolute canonical URLs based on siteConfig.url
 */
export function absoluteUrl(path = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteConfig.url}${cleanPath}`;
}
