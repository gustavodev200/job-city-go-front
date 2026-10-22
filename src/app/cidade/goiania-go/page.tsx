"use client";

import dynamic from "next/dynamic";
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
    </main>
  );
}
