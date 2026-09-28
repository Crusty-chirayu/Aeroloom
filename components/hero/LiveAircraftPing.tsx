'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { AircraftPosition, ProviderResponse } from '@/lib/providers/positions/types';
import { projectGeoToTerrain } from '@/lib/projection';

interface LiveAircraftPingProps {
  onAircraftSelect?: (aircraft: AircraftPosition | null) => void;
  selectedCallsign?: string;
}

export default function LiveAircraftPing({
  onAircraftSelect,
  selectedCallsign,
}: LiveAircraftPingProps) {
  const [aircraftList, setAircraftList] = useState<AircraftPosition[]>([]);
  const [providerStatus, setProviderStatus] = useState<'live' | 'delayed' | 'error' | 'syncing'>('syncing');
  const [activeAircraftIndex, setActiveAircraftIndex] = useState<number>(0);

  // Position interpolation refs
  const currentPos = useRef(new THREE.Vector3(0, 3, 0));
  const targetPos = useRef(new THREE.Vector3(0, 3, 0));
  const pingLightRef = useRef<THREE.PointLight>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    let isMounted = true;

    const poll = async () => {
      try {
        const res = await fetch('/api/aircraft/live');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data: ProviderResponse = await res.json();
        if (!isMounted) return;

        if (data.success && data.aircraft.length > 0) {
          setAircraftList(data.aircraft);
          setProviderStatus('live');
        } else if (data.success && data.aircraft.length === 0) {
          setAircraftList([]);
          setProviderStatus('delayed');
        } else {
          setProviderStatus('delayed');
        }
      } catch {
        if (isMounted) {
          setProviderStatus('error');
        }
      }
    };

    void poll();
    // Poll every 8 seconds (complies with upstream rate limits & server cache TTL)
    const timer = setInterval(() => {
      void poll();
    }, 8000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // Determine currently tracked primary aircraft
  const primaryAircraft = useMemo(() => {
    if (aircraftList.length === 0) return null;
    if (selectedCallsign) {
      const found = aircraftList.find(
        (a) => a.callsign.toLowerCase() === selectedCallsign.toLowerCase() || a.id === selectedCallsign.toLowerCase()
      );
      if (found) return found;
    }
    // Default to active indexed aircraft or first airborne aircraft with valid callsign
    const airborne = aircraftList.find((a) => !a.isGround && a.altitude > 1000);
    return airborne || aircraftList[activeAircraftIndex % aircraftList.length];
  }, [aircraftList, selectedCallsign, activeAircraftIndex]);

  // Update target 3D position when primary aircraft updates
  useEffect(() => {
    if (primaryAircraft) {
      const projected = projectGeoToTerrain(
        primaryAircraft.latitude,
        primaryAircraft.longitude,
        primaryAircraft.altitude
      );
      targetPos.current.copy(projected);
      onAircraftSelect?.(primaryAircraft);
    }
  }, [primaryAircraft, onAircraftSelect]);

  // Cycle to next aircraft on click
  const handleCycleNext = () => {
    if (aircraftList.length > 1) {
      setActiveAircraftIndex((prev) => (prev + 1) % aircraftList.length);
    }
  };

  const aircraftGroupRef = useRef<THREE.Group>(null);
  const groundTargetRef = useRef<THREE.Group>(null);
  const linePosRef = useRef<THREE.BufferAttribute>(null);

  // Initial line positions buffer
  const initialLinePositions = useMemo(() => new Float32Array([0, 0, 0, 0, -3.0, 0]), []);

  // 3D animation loop for ping pulse, light pulsation, and smooth coordinate glide
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);

    // Smooth gliding towards updated GPS telemetry coordinate
    currentPos.current.lerp(targetPos.current, 1 - Math.exp(-4.0 * dt));

    // Update root group position
    if (aircraftGroupRef.current) {
      aircraftGroupRef.current.position.copy(currentPos.current);
    }

    // Update laser line end point to reach the terrain
    if (linePosRef.current) {
      linePosRef.current.setY(1, -currentPos.current.y);
      linePosRef.current.needsUpdate = true;
    }

    // Update ground target ring position
    if (groundTargetRef.current) {
      groundTargetRef.current.position.set(0, -currentPos.current.y + 0.1, 0);
    }

    // Radar pulse wave animation on the ground drop ring
    if (pulseRingRef.current) {
      const t = (state.clock.getElapsedTime() * 1.5) % 1.0;
      pulseRingRef.current.scale.set(1.0 + t * 2.5, 1.0 + t * 2.5, 1.0);
      const mat = pulseRingRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = (1.0 - t) * 0.7;
      }
    }

    // Ping light breathing
    if (pingLightRef.current) {
      pingLightRef.current.intensity = 2.0 + Math.sin(state.clock.getElapsedTime() * 6.0) * 1.0;
    }
  });

  if (!primaryAircraft) {
    return (
      <group position={[0, 2.5, 0]}>
        <Html distanceFactor={28} center>
          <div className="font-mono text-xs px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-300 shadow-xl backdrop-blur-md flex items-center gap-2 pointer-events-none whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Scanning sector for live ADS-B transponders...</span>
          </div>
        </Html>
      </group>
    );
  }

  // Calculate heading rotation in radians
  const headingRad = (-(primaryAircraft.heading || 0) * Math.PI) / 180;

  return (
    <group ref={aircraftGroupRef}>
      {/* Dynamic point light for glowing beacon */}
      <pointLight ref={pingLightRef} color="#38bdf8" distance={8} decay={2} intensity={2.5} />

      {/* Primary Aircraft Core Mesh (Glowing Diamond / Vector Pin) */}
      <mesh onClick={handleCycleNext}>
        <octahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={1.8}
          roughness={0.2}
          wireframe={false}
        />
      </mesh>

      {/* Directional heading vector cone pointing in flight direction */}
      <group rotation={[0, headingRad, 0]}>
        <mesh position={[0, 0, -0.65]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.16, 0.45, 4]} />
          <meshBasicMaterial color="#7dd3fc" wireframe={false} />
        </mesh>
      </group>

      {/* Laser Drop-Line projecting vertically from aircraft down to terrain surface */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            ref={linePosRef}
            attach="attributes-position"
            args={[initialLinePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#0284c7" opacity={0.4} transparent linewidth={1} />
      </line>

      {/* Ground Projection Target Ring with expanding pulse */}
      <group ref={groundTargetRef} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Fixed target ring */}
        <mesh>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial color="#38bdf8" opacity={0.6} transparent side={THREE.DoubleSide} />
        </mesh>
        {/* Pulsing radiating radar wave ring */}
        <mesh ref={pulseRingRef}>
          <ringGeometry args={[0.35, 0.45, 32]} />
          <meshBasicMaterial color="#0ea5e9" opacity={0.6} transparent side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 3D Floating HUD Telemetry Label */}
      <Html
        position={[0, 0.75, 0]}
        distanceFactor={22}
        center
        zIndexRange={[100, 0]}
      >
        <div
          onClick={handleCycleNext}
          className="font-mono text-xs p-2.5 rounded-xl bg-slate-950/90 border border-sky-500/40 text-slate-100 shadow-2xl backdrop-blur-md select-none pointer-events-auto cursor-pointer transition-all hover:border-sky-400 hover:scale-105 min-w-[210px]"
          title="Click to cycle to next tracked aircraft in sector"
        >
          {/* Header Row: Callsign & Live Badge */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-sm text-white tracking-wide">
                {primaryAircraft.callsign}
              </span>
              {primaryAircraft.aircraftType && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                  {primaryAircraft.aircraftType}
                </span>
              )}
            </div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                providerStatus === 'live'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : providerStatus === 'delayed'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}
            >
              {providerStatus}
            </span>
          </div>

          {/* Telemetry Detail Grid */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-300">
            <span className="text-slate-400">Altitude:</span>
            <span className="font-semibold text-sky-300">
              {primaryAircraft.isGround ? 'GROUND' : `${primaryAircraft.altitude.toLocaleString()} FT`}
            </span>

            <span className="text-slate-400">Speed:</span>
            <span className="font-semibold text-slate-200">
              {primaryAircraft.speed.toFixed(0)} KTS
            </span>

            <span className="text-slate-400">Heading:</span>
            <span className="font-semibold text-slate-200">
              {primaryAircraft.heading.toFixed(0)}&deg;
            </span>

            <span className="text-slate-400">Transponder:</span>
            <span className="font-semibold text-slate-400">
              {primaryAircraft.squawk || primaryAircraft.id.toUpperCase()}
            </span>
          </div>

          {/* Footer status / click hint */}
          <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
            <span>Airplanes.live ADS-B</span>
            <span className="text-sky-400 hover:underline">
              {aircraftList.length > 1 ? `1 of ${aircraftList.length} (click to cycle)` : 'Tracking 1 flight'}
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}
