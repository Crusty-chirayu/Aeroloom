'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FocalAircraftProps {
  isDiving?: boolean;
}

/**
 * Procedural Faceted Reconnaissance Aircraft (Focal 3D Object)
 * Built with pure Three.js BufferGeometry for 60fps performance and $0 asset overhead.
 */
export default function FocalAircraft({ isDiving = false }: FocalAircraftProps) {
  const groupRef = useRef<THREE.Group>(null);
  const engineLightRef = useRef<THREE.PointLight>(null);
  const targetRot = useRef(new THREE.Euler(0, 0, 0));
  const currentRot = useRef(new THREE.Euler(0, 0, 0));
  const diveZ = useRef(0);
  const diveSpeed = useRef(0);

  // Procedural Supersonic Delta Aircraft Geometry
  const aircraftGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    // Vertices for a modern faceted delta-wing stealth jet
    // Nose, fuselage, delta wings, twin tailfins, twin engines
    const vertices = new Float32Array([
      // Top Fuselage / Spine (Nose to Tail)
      0.0, 0.4, 2.8,    // 0: Nose tip
      -0.6, 0.2, 0.5,   // 1: Left mid fuselage
      0.6, 0.2, 0.5,    // 2: Right mid fuselage
      
      0.0, 0.4, 2.8,    // 0
      0.6, 0.2, 0.5,    // 2
      0.0, 0.5, -1.8,   // 3: Spine aft

      0.0, 0.4, 2.8,    // 0
      0.0, 0.5, -1.8,   // 3
      -0.6, 0.2, 0.5,   // 1

      // Delta Wings (Span)
      -0.6, 0.2, 0.5,   // 1
      -4.2, 0.1, -1.5,  // 4: Left wingtip
      -1.2, 0.15, -2.2, // 5: Left wing root aft

      -0.6, 0.2, 0.5,   // 1
      -1.2, 0.15, -2.2, // 5
      0.0, 0.4, -2.2,   // 6: Engine center aft

      0.6, 0.2, 0.5,    // 2
      1.2, 0.15, -2.2,  // 7: Right wing root aft
      4.2, 0.1, -1.5,   // 8: Right wingtip

      0.6, 0.2, 0.5,    // 2
      0.0, 0.4, -2.2,   // 6
      1.2, 0.15, -2.2,  // 7

      // Ventral / Bottom Fuselage
      0.0, -0.3, 2.4,   // 9: Nose bottom
      -0.5, -0.15, 0.2, // 10
      0.5, -0.15, 0.2,  // 11

      0.0, -0.3, 2.4,   // 9
      0.5, -0.15, 0.2,  // 11
      0.0, -0.25, -2.0, // 12: Aft belly

      0.0, -0.3, 2.4,   // 9
      0.0, -0.25, -2.0, // 12
      -0.5, -0.15, 0.2, // 10

      // Left Vertical Stabilizer (Canted Twin Tail)
      -0.7, 0.3, -1.4,  // 13: Fin root
      -1.1, 1.4, -2.3,  // 14: Fin tip
      -0.8, 0.3, -2.3,  // 15: Fin root aft

      // Right Vertical Stabilizer
      0.7, 0.3, -1.4,   // 16
      0.8, 0.3, -2.3,   // 17
      1.1, 1.4, -2.3,   // 18
    ]);

    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
  }, []);

  // Canopy wireframe / glass facet
  const canopyGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0.0, 0.65, 1.5,   // Canopy apex
      -0.35, 0.35, 0.8, // Left canopy base
      0.35, 0.35, 0.8,  // Right canopy base
      
      0.0, 0.65, 1.5,
      0.35, 0.35, 0.8,
      0.0, 0.52, 0.2,   // Aft canopy apex

      0.0, 0.65, 1.5,
      0.0, 0.52, 0.2,
      -0.35, 0.35, 0.8,
    ]);
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const dt = Math.min(delta, 0.1);
    const time = state.clock.getElapsedTime();

    if (!isDiving) {
      // Gentle breathing hovering motion
      const hoverY = 3.6 + Math.sin(time * 1.4) * 0.22;
      groupRef.current.position.y = hoverY;
      groupRef.current.position.z = 0;
      diveZ.current = 0;
      diveSpeed.current = 0;

      // Parallax bank and pitch responding to cursor pointer (-1 to +1)
      const targetRoll = -state.pointer.x * 0.45;  // Bank with cursor
      const targetPitch = state.pointer.y * 0.25;  // Slight pitch with cursor
      const targetYaw = state.pointer.x * 0.2;

      targetRot.current.set(targetPitch, targetYaw, targetRoll);

      currentRot.current.x = THREE.MathUtils.lerp(currentRot.current.x, targetRot.current.x, 1 - Math.exp(-6 * dt));
      currentRot.current.y = THREE.MathUtils.lerp(currentRot.current.y, targetRot.current.y, 1 - Math.exp(-6 * dt));
      currentRot.current.z = THREE.MathUtils.lerp(currentRot.current.z, targetRot.current.z, 1 - Math.exp(-6 * dt));

      groupRef.current.rotation.copy(currentRot.current);

      if (engineLightRef.current) {
        engineLightRef.current.intensity = 2.0 + Math.sin(time * 8.0) * 0.6;
      }
    } else {
      // Cinematic dive acceleration
      diveSpeed.current += dt * 45.0;
      diveZ.current += diveSpeed.current * dt;
      groupRef.current.position.z = -diveZ.current;
      groupRef.current.position.y -= dt * 8.0;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.45, dt * 4);

      if (engineLightRef.current) {
        engineLightRef.current.intensity = 8.0;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 3.6, 0]}>
      {/* Matte Dark Carbon Fuselage */}
      <mesh geometry={aircraftGeometry}>
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.4}
          metalness={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe Outline for Precision Tech Edge */}
      <lineSegments>
        <wireframeGeometry args={[aircraftGeometry]} />
        <lineBasicMaterial color="#38bdf8" opacity={0.35} transparent />
      </lineSegments>

      {/* Luminous Cockpit Canopy */}
      <mesh geometry={canopyGeometry}>
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Navigation Lights: Port Red, Starboard Green, Tail Strobe */}
      <mesh position={[-4.2, 0.1, -1.5]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[4.2, 0.1, -1.5]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>

      {/* Twin Engine Glowing Afterburner Nozzles */}
      <mesh position={[-0.4, 0.25, -2.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.3, 12]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
      <mesh position={[0.4, 0.25, -2.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.3, 12]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Afterburner Glow Light */}
      <pointLight
        ref={engineLightRef}
        position={[0, 0.25, -2.6]}
        color="#38bdf8"
        intensity={2.5}
        distance={8}
      />
    </group>
  );
}
