"use client";

import Link from "next/link";
import { useEffect } from "react";
import { estados, type Uf } from "@/data/brasil/estados";
import { useMapaStore } from "@/stores/mapa";
import { ResumoUf } from "./ResumoUf";

/** Nível Estado mínimo da spec 001; cidades e prédios chegam na spec 002. */
export function PainelEstado({ uf }: { uf: Uf }) {
  const focar = useMapaStore((s) => s.focar);
  // O foco do nível Brasil não vale aqui.
  useEffect(() => focar(null), [focar, uf]);

  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-20 md:inset-x-auto md:top-4 md:left-4 md:w-80">
      <div className="bloco-notas pointer-events-auto space-y-3 rounded-lg p-3">
        <nav aria-label="Trilha">
          <ol className="flex items-center gap-1.5 text-[13px]">
            <li>
              <Link href="/" className="font-semibold underline underline-offset-2">
                Brasil
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="font-semibold">
              {estados[uf].nome}
            </li>
          </ol>
        </nav>
        <ResumoUf uf={uf} />
        <p className="text-[12px] opacity-75">Cidades deste estado chegam em breve.</p>
      </div>
    </div>
  );
}
