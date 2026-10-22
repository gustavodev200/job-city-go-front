"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Desenvolvedor } from "./Desenvolvedor";

/** White studio scene: hexagonal plinth, soft shadows and orbit camera. */
export default function PersonagemCena() {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      camera={{ position: [2.4, 2.3, 5.6], fov: 35 }}
      gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping }}
    >
      <color attach="background" args={["#ffffff"]} />
      <ambientLight intensity={1.1} />
      <hemisphereLight args={["#ffffff", "#dfe4ea", 0.6]} />
      {/* Soft back/left fill so the shadow side doesn't go black */}
      <directionalLight position={[-4, 3, -3]} intensity={0.6} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={6}
        shadow-bias={-0.0004}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />

      {/* Hexagonal plinth */}
      <mesh position={[0, -0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.95, 1, 0.24, 6]} />
        <meshStandardMaterial color="#f6f6f6" flatShading roughness={0.9} />
      </mesh>
      {/* Invisible floor that only shows the shadow */}
      <mesh position={[0, -0.24, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial opacity={0.12} />
      </mesh>

      <Desenvolvedor idle />

      <OrbitControls
        target={[0, 1.3, 0]}
        enableDamping
        minDistance={2.5}
        maxDistance={9}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </Canvas>
  );
}
