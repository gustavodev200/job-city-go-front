"use client";

import dynamic from "next/dynamic";
import { Hud } from "@/components/city/Hud";

const CityScene = dynamic(() => import("@/components/city/CityScene"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <CityScene />
      <Hud />
    </main>
  );
}
