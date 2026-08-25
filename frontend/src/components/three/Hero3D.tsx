"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function PrintedCore() {
  const group = useRef<THREE.Group>(null);
  const [t, setT] = useState(0);

  useFrame((state, delta) => {
    setT((v) => Math.min(1, v + delta * 0.85)); // "impresión" de abajo hacia arriba
    if (group.current) {
      group.current.rotation.y += delta * 0.25;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.15;
    }
  });

  const eased = 1 - Math.pow(1 - t, 3);

  return (
    <group ref={group} scale={[1, eased, 1]}>
      <mesh castShadow>
        <icosahedronGeometry args={[1.35, 6]} />
        <MeshDistortMaterial
          color="#ff5c1a"
          emissive="#ff2e88"
          emissiveIntensity={0.35}
          roughness={0.25}
          metalness={0.35}
          distort={0.32}
          speed={1.4}
        />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.42, 2]} />
        <meshBasicMaterial color="#14e0c8" wireframe transparent opacity={0.18} />
      </mesh>

      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.7, i * 0.9, 0]}>
          <torusGeometry args={[2.1 + i * 0.28, 0.012, 12, 120]} />
          <meshBasicMaterial color={i === 1 ? "#ff5c1a" : "#14e0c8"} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

const BITS = Array.from({ length: 9 }, (_, i) => {
  const a = (i / 9) * Math.PI * 2;
  const wobble = Math.sin(i * 12.9898) * 43758.5453;
  return {
    p: [Math.cos(a) * 3.4, ((wobble - Math.floor(wobble)) - 0.5) * 3.2, Math.sin(a) * 3.4] as [number, number, number],
    s: 0.08 + Math.abs(Math.cos(i * 2.4)) * 0.13,
  };
});

function Bits() {
  const items = BITS;
  return (
    <>
      {items.map((it, i) => (
        <Float key={i} speed={2} rotationIntensity={2} floatIntensity={2}>
          <mesh position={it.p}>
            <boxGeometry args={[it.s, it.s, it.s]} />
            <meshStandardMaterial color="#f4f2ee" roughness={0.4} metalness={0.1} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

export default function Hero3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 42 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} color="#ffd9c2" />
      <pointLight position={[-5, -3, -4]} intensity={2} color="#ff2e88" />
      <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.7}>
        <PrintedCore />
      </Float>
      <Bits />
      <Environment preset="city" />
    </Canvas>
  );
}
