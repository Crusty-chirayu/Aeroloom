/**
 * Aeroloom Icon Registry
 *
 * ARCHITECTURE:
 * - All icons go through this registry. No ad-hoc Lucide imports in components.
 * - Initial set uses Lucide icons with a precise 1.5px stroke width on a 24px grid.
 * - Phase 2: Custom aviation SVG icons authored in components/ui/aviationIcons.tsx
 *   in the same 24px / 1.5px-stroke visual style.
 *
 * USAGE:
 *   import { Icon } from '@/components/ui/Icon';
 *   <Icon name="plane" size={16} className="text-[var(--signal)]" />
 *   <Icon name="takeoff" size={20} />
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
  Moon, Flag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import {
  TakeoffIcon,
  LandingIcon,
  RunwayIcon,
  TowerIcon,
  AltitudeIcon,
  VerticalRateUpIcon,
  VerticalRateDownIcon,
  HeadingIcon,
  SquawkIcon,
  GateIcon,
  DelayIcon,
  RouteArcIcon,
} from './aviationIcons';

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
  flag: Flag,
  radar: Radio,
  check: CheckCircle2,
  x: X,
  'external-link': ArrowUpRight,
  'shield-check': CheckCircle2,
} as const satisfies Record<string, LucideIcon>;

// ─── Custom Aviation Icons Registry ──────────────────────────────────────────
export const CUSTOM_ICONS = {
  takeoff: TakeoffIcon,
  landing: LandingIcon,
  runway: RunwayIcon,
  tower: TowerIcon,
  altitude: AltitudeIcon,
  'vertical-rate-up': VerticalRateUpIcon,
  'vertical-rate-down': VerticalRateDownIcon,
  heading: HeadingIcon,
  squawk: SquawkIcon,
  gate: GateIcon,
  delay: DelayIcon,
  'route-arc': RouteArcIcon,
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

  if (name in CUSTOM_ICONS) {
    const CustomComponent = CUSTOM_ICONS[name as CustomIconName];
    return (
      <CustomComponent
        size={size}
        strokeWidth={strokeWidth}
        className={className}
        aria-label={ariaLabel}
        aria-hidden={ariaHidden}
      />
    );
  }

  return null;
}
