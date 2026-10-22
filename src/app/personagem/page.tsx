"use client";

import dynamic from "next/dynamic";

const PersonagemCena = dynamic(() => import("@/components/personagem/PersonagemCena"), {
  ssr: false,
});

export default function PersonagemPage() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-white">
      <PersonagemCena />
    </main>
  );
}
