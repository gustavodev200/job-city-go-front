"use client";

import { Canvas } from "@react-three/fiber";
import { Buildings } from "./Buildings";
import { Player } from "./Player";
import { Roads } from "./Roads";
import { Trees } from "./Trees";

export default function CityScene() {
  return (
    <Canvas shadows camera={{ position: [30, 30, 30], fov: 50 }}>
      <color attach="background" args={["#bfe3ff"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 40, 10]} intensity={1.2} castShadow />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#8fbf73" />
      </mesh>
      <Roads />
      <Buildings />
      <Trees />
      <Player />
    </Canvas>
  );
}
