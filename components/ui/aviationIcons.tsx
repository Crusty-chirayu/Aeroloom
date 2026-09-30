import React from 'react';

export interface AviationIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/**
 * 1. TAKEOFF
 * Clean 1.5px aviation takeoff icon showing climb angle relative to ground reference
 */
export function TakeoffIcon({
  size = 24,
  strokeWidth = 1.5,
  className = '',
  ...props
}: AviationIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Ground reference line */}
      <line x1="2" y1="20" x2="22" y2="20" />
      {/* 25° climb trajectory */}
      <path d="M4 17 L10 13 L19 5" />
      {/* Aircraft silhouette in climb */}
      <path d="M14 4 L20 4 L20 10" />
      <path d="M10 13 L8 9 L11 7 L14 10" />
    </svg>
  );
}

/**
 * 2. LANDING
 * Clean 1.5px aviation landing/touchdown icon with descent slope onto threshold
 */
export function LandingIcon({
  size = 24,
  strokeWidth = 1.5,
  className = '',
  ...props
}: AviationIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Runway surface line */}
      <line x1="2" y1="20" x2="22" y2="20" />
      {/* 3° glideslope descent vector */}
      <path d="M4 5 L14 13 L19 16" />
      {/* Touchdown arrowhead */}
      <path d="M15 16 L20 16 L18 11" />
      {/* Aircraft wings in flare */}
      <path d="M7 6 L10 10 L13 8" />
    </svg>
  );
}

/**
 * 3. RUNWAY
 * Centerline markings, edge lines, and threshold piano keys
 */
export function RunwayIcon({
  size = 24,
  strokeWidth = 1.5,
  className = '',
  ...props
}: AviationIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Left and right runway edges (perspective or straight) */}
      <line x1="5" y1="21" x2="7" y2="3" />
      <line x1="19" y1="21" x2="17" y2="3" />
      {/* Runway Centerline dashes */}
      <line x1="12" y1="5" x2="12" y2="8" strokeDasharray="3 0" />
      <line x1="12" y1="11" x2="12" y2="14" strokeDasharray="3 0" />
      <line x1="12" y1="17" x2="12" y2="20" strokeDasharray="3 0" />
      {/* Threshold markings */}
      <line x1="8" y1="20" x2="16" y2="20" />
    </svg>
  );
}

/**
 * 4. TOWER
 * Air traffic control cab, viewing gallery, and radar antenna
 */
export function TowerIcon({
  size = 24,
  strokeWidth = 1.5,
  className = '',
  ...props
}: AviationIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Base Foundation */}
      <line x1="4" y1="21" x2="20" y2="21" />
      {/* Tapered Tower Shaft */}
      <path d="M8 21 L10 11 L14 11 L16 21" />
      {/* ATC Cab Observation Gallery */}
      <path d="M7 11 L6 8 L18 8 L17 11 Z" />
      {/* Cab Windows */}
      <line x1="10" y1="8" x2="10" y2="11" />
      <line x1="14" y1="8" x2="14" y2="11" />
      {/* Roof dome & radar / communication mast */}
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <circle cx="12" cy="3" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * 5. ALTITUDE
 * Barometric flight levels with altimeter elevation marker
 */
export function AltitudeIcon({
  size = 24,
  strokeWidth = 1.5,
  className = '',
  ...props
}: AviationIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Vertical Altitude Scale Axis */}
      <line x1="6" y1="3" x2="6" y2="21" />
      {/* Flight Level Graduations */}
      <line x1="6" y1="4" x2="10" y2="4" />
      <line x1="6" y1="9" x2="13" y2="9" />
      <line x1="6" y1="14" x2="10" y2="14" />
      <line x1="6" y1="19" x2="13" y2="19" />
      {/* Aircraft Elevation Indexer / Indicator Arrow */}
      <path d="M19 8 L14 12 L19 16 Z" fill="none" />
      <line x1="14" y1="12" x2="7" y2="12" />
    </svg>
  );
}

/**
 * 6. VERTICAL RATE UP
 * Climb rate indicator
 */
export function VerticalRateUpIcon({
  size = 24,
  strokeWidth = 1.5,
  className = '',
  ...props
}: AviationIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
      {/* Rate telemetry bar */}
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  );
}

/**
 * 7. VERTICAL RATE DOWN
 * Descent rate indicator
 */
export function VerticalRateDownIcon({
  size = 24,
  strokeWidth = 1.5,
  className = '',
  ...props
}: AviationIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
      {/* Rate telemetry bar */}
      <line x1="4" y1="3" x2="20" y2="3" />
    </svg>
  );
}

/**
 * 8. HEADING
 * True heading compass rose needle
 */
export function HeadingIcon({
  size = 24,
  strokeWidth = 1.5,
  className = '',
  ...props
}: AviationIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      {/* Compass Needle Oriented to Heading */}
      <polygon points="12 6 15 13 12 11 9 13" fill="currentColor" fillOpacity="0.2" />
      <polygon points="12 18 15 13 12 11 9 13" />
      <line x1="12" y1="3" x2="12" y2="5" />
    </svg>
  );
}

/**
 * 9. SQUAWK
 * Mode-S transponder pulse beacon
 */
export function SquawkIcon({
  size = 24,
  strokeWidth = 1.5,
  className = '',
  ...props
}: AviationIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Center Transponder Beacon */}
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      {/* Concentric Mode-S Radio Wave Arcs */}
      <path d="M7.8 7.8 A6 6 0 0 0 7.8 16.2" />
      <path d="M16.2 7.8 A6 6 0 0 1 16.2 16.2" />
      <path d="M4.9 4.9 A10 10 0 0 0 4.9 19.1" />
      <path d="M19.1 4.9 A10 10 0 0 1 19.1 19.1" />
    </svg>
  );
}

/**
 * 10. GATE
 * Airport terminal jetway docking stand
 */
export function GateIcon({
  size = 24,
  strokeWidth = 1.5,
  className = '',
  ...props
}: AviationIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Terminal Concourse Wall */}
      <line x1="3" y1="3" x2="3" y2="21" />
      {/* Jetway Articulated Bridge */}
      <path d="M3 8 L10 8 L10 13 L17 13 L17 16" />
      {/* Aircraft Doorway Hood */}
      <rect x="15" y="16" width="6" height="5" rx="1" />
      {/* Stand Stop Line */}
      <line x1="13" y1="21" x2="22" y2="21" />
    </svg>
  );
}

/**
 * 11. DELAY
 * Schedule delta clock with warning badge
 */
export function DelayIcon({
  size = 24,
  strokeWidth = 1.5,
  className = '',
  ...props
}: AviationIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
      <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" />
      <path d="M19 12 A7 7 0 0 1 12 19" strokeDasharray="2 2" />
    </svg>
  );
}

/**
 * 12. ROUTE ARC
 * Great-circle geodesic arc linking two waypoint nodes
 */
export function RouteArcIcon({
  size = 24,
  strokeWidth = 1.5,
  className = '',
  ...props
}: AviationIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Origin node */}
      <circle cx="4" cy="18" r="2" fill="currentColor" />
      {/* Destination node */}
      <circle cx="20" cy="8" r="2" fill="currentColor" />
      {/* Great circle trajectory curve */}
      <path d="M6 17 Q 12 5, 18 8" />
      {/* Midpoint flight vector tick */}
      <line x1="11.5" y1="8.5" x2="13.5" y2="7" />
    </svg>
  );
}
