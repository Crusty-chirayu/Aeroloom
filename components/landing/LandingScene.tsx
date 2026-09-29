'use client';

import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { vertexShader, fragmentShader } from '@/components/hero/terrainShaders';
import FocalAircraft from './FocalAircraft';
import { DeviceTier, TierConfig, resolveDeviceTier, TIER_CONFIGS } from '@/lib/deviceTier';

interface DottedGridMeshProps {
  gridX: number;
  gridZ: number;
  isDiving: boolean;
}

function DottedGridMesh({ gridX, gridZ, isDiving }: DottedGridMeshProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { raycaster, pointer } = useThree();

  const targetCursor = useRef(new THREE.Vector3(0, 0, 0));
  const currentCursor = useRef(new THREE.Vector3(0, 0, 0));
  const targetIntensity = useRef(0.0);
  const currentIntensity = useRef(0.0);
  const lastMoveTime = useRef(0);

  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const intersectionPoint = useMemo(() => new THREE.Vector3(), []);

  // Buffer geometry positions
  const positions = useMemo(() => {
    const totalPoints = gridX * gridZ;
    const pos = new Float32Array(totalPoints * 3);
    const spanX = 42.0;
    const spanZ = 30.0;
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

  const uniforms = useMemo(
    () => ({
      u_cursor: { value: new THREE.Vector3(0, 0, 0) },
      u_time: { value: 0.0 },
      u_intensity: { value: 0.0 },
      u_pointSize: { value: 38.0 },
      u_baseColor: { value: new THREE.Color(0x0284c7) }, // Atmospheric deep sky
      u_highlightColor: { value: new THREE.Color(0x38bdf8) }, // Glowing electric cyan
    }),
    []
  );

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      lastMoveTime.current = performance.now();
      targetIntensity.current = 1.0;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  useFrame((state, delta) => {
    const clampedDt = Math.min(delta, 0.1);

    // 1. Raycast cursor against ground plane
    raycaster.setFromCamera(pointer, state.camera);
    const hit = raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
    if (hit) {
      targetCursor.current.copy(intersectionPoint);
    }

    // 2. Damped cursor interpolation
    currentCursor.current.lerp(targetCursor.current, 1 - Math.exp(-12 * clampedDt));

    // Settle intensity
    const elapsedSinceMove = performance.now() - lastMoveTime.current;
    if (elapsedSinceMove > 120) {
      targetIntensity.current = Math.max(0, targetIntensity.current - clampedDt * 2.2);
    }
    currentIntensity.current += (targetIntensity.current - currentIntensity.current) * (1 - Math.exp(-8 * clampedDt));

    // 3. Update GPU uniforms
    if (materialRef.current) {
      const u = materialRef.current.uniforms;
      u.u_time.value = state.clock.getElapsedTime();
      u.u_cursor.value.copy(currentCursor.current);
      u.u_intensity.value = isDiving ? 2.5 : currentIntensity.current;
    }

    // 4. Subtle camera sway unless diving
    if (!isDiving) {
      state.camera.position.x = Math.sin(state.clock.getElapsedTime() * 0.18) * 0.7;
      state.camera.lookAt(0, 2.5, 0);
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

function DiveCameraRig({ isDiving, onComplete }: { isDiving: boolean; onComplete?: () => void }) {
  const { camera } = useThree();
  const progress = useRef(0);
  const completedRef = useRef(false);

  useFrame((_, delta) => {
    if (!isDiving || completedRef.current) return;

    const dt = Math.min(delta, 0.1);
    progress.current += dt * 1.25;

    // Camera accelerates forward through the 3D grid
    // Initial camera position: [0, 14, 18], target: [0, 1.5, -4]
    const t = Math.min(1, progress.current);
    const ease = t * t * t; // Cubic in

    camera.position.z = THREE.MathUtils.lerp(18, -4, ease);
    camera.position.y = THREE.MathUtils.lerp(14, 1.5, ease);
    camera.lookAt(0, 1.0, -12);

    if (progress.current >= 1.0) {
      completedRef.current = true;
      onComplete?.();
    }
  });

  return null;
}

interface LandingSceneProps {
  isDiving: boolean;
  onDiveComplete: () => void;
}

export default function LandingScene({ isDiving, onDiveComplete }: LandingSceneProps) {
  const [tierConfig, setTierConfig] = useState<TierConfig | null>(null);
  const [contextLost, setContextLost] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const config = await resolveDeviceTier();
        if (mounted) setTierConfig(config);
      } catch {
        if (mounted) setTierConfig(TIER_CONFIGS.reduced);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const isStatic = !tierConfig || tierConfig.tier === 'static' || contextLost;

  // Reliable transition trigger: ensures onDiveComplete always executes
  useEffect(() => {
    if (!isDiving) return;

    if (isStatic) {
      const timer = setTimeout(onDiveComplete, 350);
      return () => clearTimeout(timer);
    }

    // Safety fallback timer if WebGL frame or camera rig stalls
    const safetyTimer = setTimeout(onDiveComplete, 1300);
    return () => clearTimeout(safetyTimer);
  }, [isDiving, isStatic, onDiveComplete]);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#030712] overflow-hidden select-none">
      {!isStatic ? (
        <Canvas
          camera={{ position: [0, 14, 18], fov: 46, near: 0.1, far: 120 }}
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
            });
          }}
          className="w-full h-full"
        >
          <color attach="background" args={['#030712']} />
          <ambientLight intensity={0.45} />
          <directionalLight position={[10, 20, 15]} intensity={0.8} color="#e0f2fe" />

          {/* Dotted 3D Grid Terrain */}
          <DottedGridMesh
            gridX={tierConfig.gridX}
            gridZ={tierConfig.gridZ}
            isDiving={isDiving}
          />

          {/* Floating Focal Aircraft */}
          <FocalAircraft isDiving={isDiving} />

          {/* Camera Dive Controller */}
          <DiveCameraRig isDiving={isDiving} onComplete={onDiveComplete} />
        </Canvas>
      ) : (
        /* Clean Static Radar Atmosphere (Zero text collision with overlay) */
        <div className="w-full h-full relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-950/30 via-[#030712] to-black">
          {/* Topographic coordinate lines */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(56, 189, 248, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.25) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          {/* Concentric radar range rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-sky-500/10 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-sky-500/15 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-sky-500/20 pointer-events-none" />
        </div>
      )}

      {/* Atmospheric Horizon Gradient Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#030712_95%)]" />
      <div className="absolute bottom-0 inset-x-0 h-48 pointer-events-none bg-gradient-to-t from-[#030712] via-[#030712]/60 to-transparent" />
    </div>
  );
}
