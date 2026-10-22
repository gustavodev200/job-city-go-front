"use client";

import { vagas } from "@/data/vagas";
import { useGameStore } from "@/stores/game";

export function Hud() {
  const selectedVagaId = useGameStore((state) => state.selectedVagaId);
  const vaga = vagas.find((v) => v.id === selectedVagaId);

  // TODO: vaga mais próxima do jogador e legenda de categorias.
  return (
    <aside className="pointer-events-none absolute left-4 top-4 rounded-lg bg-white/80 p-4 text-sm text-zinc-900 shadow">
      <p className="font-semibold">Job City Go</p>
      <p>{vaga ? `${vaga.titulo} — ${vaga.empresa}` : "Nenhuma vaga selecionada"}</p>
    </aside>
  );
}
