'use client';

import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { vertexShader, fragmentShader } from './terrainShaders';
import { DeviceTier, TierConfig, resolveDeviceTier, setTierOverride, TIER_CONFIGS } from '@/lib/deviceTier';

interface DottedMeshProps {
  gridX: number;
  gridZ: number;
  onFpsUpdate?: (fps: number) => void;
  onUniformsUpdate?: (intensity: number, cursor: THREE.Vector3) => void;
}

function DottedMesh({ gridX, gridZ, onFpsUpdate, onUniformsUpdate }: DottedMeshProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { raycaster, pointer } = useThree();

  // Internal cursor damping state
  const targetCursor = useRef(new THREE.Vector3(0, 0, 0));
  const currentCursor = useRef(new THREE.Vector3(0, 0, 0));
  const targetIntensity = useRef(0.0);
  const currentIntensity = useRef(0.0);
  const lastMoveTime = useRef(0);

  // Ground plane for cursor raycast intersection (Y = 0)
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const intersectionPoint = useMemo(() => new THREE.Vector3(), []);

  // Performance tracking
  const frameCount = useRef(0);
  const lastFpsTime = useRef(0);

  // Generate buffer geometry positions (GPU points)
  const positions = useMemo(() => {
    const totalPoints = gridX * gridZ;
    const pos = new Float32Array(totalPoints * 3);
    const spanX = 38.0;
    const spanZ = 26.0;
    let ptr = 0;

    for (let i = 0; i < gridX; i++) {
      const u = (i / (gridX - 1) - 0.5) * spanX;
      for (let j = 0; j < gridZ; j++) {
        const v = (j / (gridZ - 1) - 0.5) * spanZ;
        pos[ptr++] = u;
        pos[ptr++] = 0.0;
        pos[ptr++] = v;
      }
    }
    return pos;
  }, [gridX, gridZ]);

  // Shader uniforms
  const uniforms = useMemo(
    () => ({
      u_cursor: { value: new THREE.Vector3(0, 0, 0) },
      u_time: { value: 0.0 },
      u_intensity: { value: 0.0 },
      u_pointSize: { value: 42.0 },
      u_baseColor: { value: new THREE.Color(0x0ea5e9) }, // Cyan / Sky Blue
      u_highlightColor: { value: new THREE.Color(0x38bdf8) }, // Electric glowing cyan
    }),
    []
  );

  // Pointer move handler on window - only process mouse/pen, ignore touch
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      // Do not map touch movements to synthetic cursor movements (Blueprint v2 requirement)
      if (e.pointerType === 'touch') return;

      lastMoveTime.current = performance.now();
      targetIntensity.current = 1.0;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  useFrame((state, delta) => {
    // 1. Raycast cursor against ground plane
    raycaster.setFromCamera(pointer, state.camera);
    const hit = raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
    if (hit) {
      targetCursor.current.copy(intersectionPoint);
    }

    // 2. Damped cursor movement and intensity settling (settling over ~300-600ms)
    const clampedDt = Math.min(delta, 0.1);
    
    // Smooth cursor interpolation (damping)
    currentCursor.current.lerp(targetCursor.current, 1 - Math.exp(-12 * clampedDt));

    // Settle intensity decay over ~400ms after movement ceases
    const elapsedSinceMove = performance.now() - lastMoveTime.current;
    if (elapsedSinceMove > 120) {
      targetIntensity.current = Math.max(0, targetIntensity.current - clampedDt * 2.2);
    }
    currentIntensity.current += (targetIntensity.current - currentIntensity.current) * (1 - Math.exp(-8 * clampedDt));

    // 3. Update GPU uniforms directly (zero React state overhead)
    if (materialRef.current) {
      const u = materialRef.current.uniforms;
      u.u_time.value = state.clock.getElapsedTime();
      u.u_cursor.value.copy(currentCursor.current);
      u.u_intensity.value = currentIntensity.current;
    }

    // 4. Subtle camera sway for parallax depth
    state.camera.position.x = Math.sin(state.clock.getElapsedTime() * 0.15) * 0.8;
    state.camera.lookAt(0, 0, 0);

    // 5. FPS calculation
    frameCount.current++;
    const now = performance.now();
    if (lastFpsTime.current === 0) {
      lastFpsTime.current = now;
    } else if (now - lastFpsTime.current >= 500) {
      const calculatedFps = Math.round((frameCount.current * 1000) / (now - lastFpsTime.current));
      onFpsUpdate?.(calculatedFps);
      onUniformsUpdate?.(currentIntensity.current, currentCursor.current);
      frameCount.current = 0;
      lastFpsTime.current = now;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

interface TerrainProps {
  children?: React.ReactNode;
}

export default function Terrain({ children }: TerrainProps) {
  const [tierConfig, setTierConfig] = useState<TierConfig | null>(null);
  const [currentFps, setCurrentFps] = useState<number>(60);
  const [intensity, setIntensity] = useState<number>(0);
  const [cursorPos, setCursorPos] = useState<string>('0.0, 0.0');
  const [showDebugHud, setShowDebugHud] = useState<boolean>(true);
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [overrideState, setOverrideState] = useState<DeviceTier | null>(null);

  // Initialize and probe tier
  const initTier = useCallback(async () => {
    try {
      const config = await resolveDeviceTier();
      setTierConfig(config);
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('aeroloom_tier_override') as DeviceTier | null;
        setOverrideState(stored);
      }
    } catch {
      setTierConfig(TIER_CONFIGS.reduced);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const config = await resolveDeviceTier();
        if (mounted) {
          setTierConfig(config);
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('aeroloom_tier_override') as DeviceTier | null;
            setOverrideState(stored);
          }
        }
      } catch {
        if (mounted) {
          setTierConfig(TIER_CONFIGS.reduced);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleFpsUpdate = useCallback((fps: number) => {
    setCurrentFps(fps);
  }, []);

  const handleUniformsUpdate = useCallback((intVal: number, cur: THREE.Vector3) => {
    setIntensity(intVal);
    setCursorPos(`${cur.x.toFixed(1)}, ${cur.z.toFixed(1)}`);
  }, []);

  const handleTierChange = (tier: DeviceTier | 'auto') => {
    if (tier === 'auto') {
      setTierOverride(null);
      setOverrideState(null);
      initTier();
    } else {
      setTierOverride(tier);
      setOverrideState(tier);
      setTierConfig({
        ...TIER_CONFIGS[tier],
        reason: `Manual switch to '${tier}'`,
      });
    }
  };

  const isStatic = !tierConfig || tierConfig.tier === 'static' || contextLost;

  return (
    <div className="relative w-full h-[620px] md:h-[720px] bg-[#030712] overflow-hidden rounded-2xl border border-slate-800/80 shadow-2xl">
      {/* 3D WebGL Canvas */}
      {!isStatic ? (
        <Canvas
          camera={{ position: [0, 14, 18], fov: 48, near: 0.1, far: 100 }}
          dpr={tierConfig.dpr}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            alpha: true,
          }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              setContextLost(true);
            });
            gl.domElement.addEventListener('webglcontextrestored', () => {
              setContextLost(false);
              initTier();
            });
          }}
          className="w-full h-full"
        >
          <color attach="background" args={['#030712']} />
          <ambientLight intensity={0.4} />

          {/* Dotted Terrain Mesh */}
          <DottedMesh
            gridX={tierConfig.gridX}
            gridZ={tierConfig.gridZ}
            onFpsUpdate={handleFpsUpdate}
            onUniformsUpdate={handleUniformsUpdate}
          />

          {/* Additional scene elements (such as LiveAircraftPing) */}
          {children}

          {/* Postprocessing Bloom enabled only on Full Tier */}
          {tierConfig.bloom && (
            <EffectComposer multisampling={0}>
              <Bloom
                intensity={1.2}
                luminanceThreshold={0.2}
                luminanceSmoothing={0.9}
                mipmapBlur
              />
            </EffectComposer>
          )}
        </Canvas>
      ) : (
        /* Static CSS Fallback when WebGL is unavailable or Static tier is selected */
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950/40 via-slate-950 to-black text-center relative overflow-hidden">
          {/* Decorative radar grid lines */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(56, 189, 248, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.2) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative z-10 max-w-md p-6 rounded-xl bg-slate-900/80 border border-sky-500/30 backdrop-blur-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Static Radar Telemetry Mode
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Planetary Radar Surface Active</h3>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              {contextLost
                ? 'WebGL context was lost. Graceful static radar fallback is engaged. Aircraft telemetry remains operational.'
                : 'Hardware acceleration disabled or static fallback tier active. All live flight telemetry streams remain fully operational.'}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => handleTierChange('reduced')}
                className="px-4 py-2 text-xs font-mono font-medium rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 transition-colors"
              >
                Try Reduced WebGL
              </button>
              <button
                onClick={() => handleTierChange('full')}
                className="px-4 py-2 text-xs font-mono font-medium rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition-colors"
              >
                Try Full WebGL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Development Debug HUD & Screenshot Toggle */}
      {showDebugHud && (
        <div className="absolute top-4 left-4 z-20 font-mono text-xs p-3.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/60 shadow-lg text-slate-300 space-y-2 pointer-events-auto select-none min-w-[240px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-semibold text-sky-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AEROLOOM R3F HUD
            </span>
            <button
              onClick={() => setShowDebugHud(false)}
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-[10px]"
              title="Hide HUD for clean screenshots (Toggle button stays in top-right)"
            >
              Hide
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
            <span className="text-slate-400">FPS:</span>
            <span
              className={`font-bold ${
                currentFps >= 50
                  ? 'text-emerald-400'
                  : currentFps >= 30
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {isStatic ? 'N/A' : `${currentFps} FPS`}
            </span>

            <span className="text-slate-400">Tier:</span>
            <span className="uppercase font-semibold text-sky-300">
              {tierConfig?.tier ?? 'detecting...'}
            </span>

            <span className="text-slate-400">Points:</span>
            <span className="text-slate-200">
              {tierConfig ? tierConfig.pointCount.toLocaleString() : '...'}
            </span>

            <span className="text-slate-400">Bloom:</span>
            <span className={tierConfig?.bloom ? 'text-emerald-400' : 'text-slate-500'}>
              {tierConfig?.bloom ? 'Enabled' : 'Disabled'}
            </span>

            <span className="text-slate-400">Ripple:</span>
            <span className="text-sky-300">{(intensity * 100).toFixed(0)}%</span>

            <span className="text-slate-400">Cursor XZ:</span>
            <span className="text-slate-300 truncate">{cursorPos}</span>
          </div>

          {/* Tier Manual Override Controls */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-[10px] text-slate-400 mb-1.5 font-sans font-medium">
              Device Tier Override:
            </div>
            <div className="flex gap-1.5">
              {(['full', 'reduced', 'static', 'auto'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTierChange(t)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                    (t === 'auto' && !overrideState) ||
                    (overrideState ? overrideState === t : tierConfig?.tier === t)
                      ? 'bg-sky-500 text-white font-bold shadow-sm shadow-sky-500/30'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Button to restore HUD if hidden */}
      {!showDebugHud && (
        <button
          onClick={() => setShowDebugHud(true)}
          className="absolute top-4 left-4 z-20 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-mono backdrop-blur-md transition-colors shadow-md"
        >
          Show HUD
        </button>
      )}

      {/* Subtle overlay radar branding in bottom right */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none text-right font-mono text-[11px] text-slate-500/80">
        <div>GLSL Dotted Terrain Matrix</div>
        <div className="text-[10px] text-slate-600">Phase 0: Signature Slice</div>
      </div>
    </div>
  );
}
