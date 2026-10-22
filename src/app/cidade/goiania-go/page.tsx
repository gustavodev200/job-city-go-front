"use client";

import dynamic from "next/dynamic";
import { Trilha } from "@/components/brasil/Trilha";
import { Hud } from "@/components/city/Hud";
import { OutdoorOverlay } from "@/components/city/OutdoorOverlay";

const CityScene = dynamic(() => import("@/components/city/CityScene"), {
  ssr: false,
});
// Reads the device clock: client only, so the server HTML never shows a different hour.
const ControleHora = dynamic(() => import("@/components/city/ControleHora"), {
  ssr: false,
});

export default function CidadeGoiania() {
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <CityScene />
      <Hud />
      <OutdoorOverlay />
      <ControleHora />
      <div className="bloco-notas absolute top-3 left-3 z-30 rounded-lg px-3 py-1.5 md:top-4 md:left-4">
        <Trilha cidadeId="goiania-go" />
      </div>
    </main>
  );
}
