/**
 * Aeroloom Icon Registry
 *
 * ARCHITECTURE:
 * - All icons go through this registry. No ad-hoc Lucide imports in components.
 * - Initial set uses Lucide icons with a precise 1.5px stroke width on a 24px grid.
 * - Phase 2: Custom aviation SVG icons will be implemented in CUSTOM_ICONS below.
 *   The IconName type union auto-expands so components need no refactoring.
 *
 * USAGE:
 *   import { Icon } from '@/components/ui/Icon';
 *   <Icon name="plane" size={16} className="text-[var(--signal)]" />
 */

import React from 'react';
import {
  // Navigation & UI
  Search, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  ArrowRight, ArrowLeft, ArrowUpRight, Menu, MoreHorizontal,
  // Status
  AlertTriangle, AlertCircle, CheckCircle2, Info, Loader2,
  // Map / Aviation (Lucide native initial set)
  Plane, PlaneTakeoff, PlaneLanding, Navigation, Compass, Globe, Map, MapPin, Radio,
  // Data / Interface
  Activity, BarChart2, Clock, Eye, Filter, Layers, RefreshCw,
  Settings, Sliders, Star, Bookmark, Download, Upload, Share2,
  // User
  User, LogIn, LogOut,
  // Environment / Weather
  Moon, Sun, Wind, Zap, Flag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Lucide Icons Initial Registry ────────────────────────────────────────────
export const LUCIDE_ICONS = {
  search: Search,
  close: X,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'arrow-right': ArrowRight,
  'arrow-left': ArrowLeft,
  'arrow-up-right': ArrowUpRight,
  menu: Menu,
  'more-horizontal': MoreHorizontal,
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'check-circle': CheckCircle2,
  info: Info,
  loader: Loader2,
  plane: Plane,
  'plane-takeoff': PlaneTakeoff,
  'plane-landing': PlaneLanding,
  navigation: Navigation,
  compass: Compass,
  globe: Globe,
  map: Map,
  'map-pin': MapPin,
  radio: Radio,
  activity: Activity,
  'bar-chart': BarChart2,
  clock: Clock,
  eye: Eye,
  filter: Filter,
  layers: Layers,
  refresh: RefreshCw,
  settings: Settings,
  sliders: Sliders,
  star: Star,
  bookmark: Bookmark,
  download: Download,
  upload: Upload,
  share: Share2,
  user: User,
  login: LogIn,
  logout: LogOut,
  moon: Moon,
  sun: Sun,
  wind: Wind,
  zap: Zap,
  flag: Flag,
} as const satisfies Record<string, LucideIcon>;

// ─── Custom Aviation Icons (Phase 2 TODO Slots) ──────────────────────────────
// In Phase 2, custom hand-drawn SVG icons will be provided for these slots.
// Signature: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element
export const CUSTOM_ICONS = {
  takeoff: null,             // TODO Phase 2: custom 1.5px aviation takeoff icon
  landing: null,             // TODO Phase 2: custom 1.5px aviation touchdown/landing icon
  runway: null,              // TODO Phase 2: runway centerline & thresholds
  tower: null,               // TODO Phase 2: control tower silhouette
  altitude: null,            // TODO Phase 2: vertical altimeter / barometric strata
  'vertical-rate-up': null,  // TODO Phase 2: climbing rate arrow glyph
  'vertical-rate-down': null,// TODO Phase 2: descending rate arrow glyph
  heading: null,             // TODO Phase 2: heading rose / compass needle
  squawk: null,              // TODO Phase 2: transponder pulse / octal beacon
  gate: null,                // TODO Phase 2: terminal jetway / stand gate
  delay: null,               // TODO Phase 2: schedule delta / clock warning
  'route-arc': null,         // TODO Phase 2: great-circle orbital route arc
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────
export type LucideIconName = keyof typeof LUCIDE_ICONS;
export type CustomIconName = keyof typeof CUSTOM_ICONS;
export type IconName = LucideIconName | CustomIconName;

export interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.5,
  className = '',
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden = true,
}: IconProps) {
  if (name in LUCIDE_ICONS) {
    const LucideComponent = LUCIDE_ICONS[name as LucideIconName];
    return (
      <LucideComponent
        size={size}
        strokeWidth={strokeWidth}
        className={className}
        aria-label={ariaLabel}
        aria-hidden={ariaHidden}
      />
    );
  }

  // Custom icon slot fallback (rendered as clean placeholder until Phase 2)
  if (name in CUSTOM_ICONS) {
    // Return empty placeholder box of exact dimensions
    return (
      <span
        className={`inline-block border border-dashed border-[var(--ink-4)] rounded-[2px] opacity-60 ${className}`}
        style={{ width: size, height: size }}
        title={`Custom aviation icon: ${name} (Phase 2 TODO)`}
        aria-label={ariaLabel || `Custom icon ${name}`}
        aria-hidden={ariaHidden}
      />
    );
  }

  return null;
}
