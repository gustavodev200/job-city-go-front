"use client";

import type { MouseEvent, ReactNode } from "react";
import type { Area } from "@/data/mapa";
import { CATEGORIA_LABEL, vagas, type Vaga } from "@/data/vagas";
import { useGameStore } from "@/stores/game";
import { vagasCidade, vagasVila } from "./layout";

const PANEL = "rounded-2xl border border-white/10 bg-[#1d2127]/90 text-white shadow-lg backdrop-blur";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function Dot({ className }: { className: string }) {
  return <span className={`inline-block size-2 shrink-0 rounded-full ${className}`} />;
}

function Legend() {
  return (
    <aside className={`${PANEL} pointer-events-none absolute left-4 top-4 px-4 py-3 text-sm`}>
      <p className="text-[10px] font-semibold tracking-[0.25em] text-white/50">JOB CITY GO</p>
      <ul className="mt-2 space-y-1">
        <li className="flex items-center gap-2">
          <Dot className="bg-[#f08a24]" />
          Cidade: <strong>{vagasCidade.length} vagas</strong>
        </li>
        <li className="flex items-center gap-2">
          <Dot className="bg-[#1d9f95]" />
          Vila remota: <strong>{vagasVila.length} vagas</strong>
        </li>
      </ul>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
        <span className="flex items-center gap-1.5"><Dot className="bg-[#f08a24]" /> presencial</span>
        <span className="flex items-center gap-1.5"><Dot className="bg-[#7b5cff]" /> híbrido</span>
        <span className="flex items-center gap-1.5"><Dot className="bg-[#1d9f95]" /> remoto</span>
      </p>
    </aside>
  );
}

const MODELO_CHIP: Record<Vaga["modelo"], { label: string; className: string }> = {
  presencial: { label: "Presencial", className: "bg-[#f08a24]" },
  hibrido: { label: "Híbrido", className: "bg-[#7b5cff]" },
  remoto: { label: "Remoto", className: "bg-[#1d9f95]" },
};

/** Informação de local conforme o modelo da vaga. */
function VagaLocal({ vaga }: { vaga: Vaga }) {
  if (vaga.modelo === "remoto") {
    return <p className="text-white/80">Remoto · {vaga.estado}</p>;
  }
  return (
    <>
      <p className="text-white/80">
        {vaga.cidade} · {CATEGORIA_LABEL[vaga.categoria]}
      </p>
      {vaga.modelo === "hibrido" && <p className="text-white/80">Presença: {vaga.frequencia}</p>}
    </>
  );
}

function VagaCard() {
  const nearbyVagaId = useGameStore((s) => s.nearbyVagaId);
  const selectedVagaId = useGameStore((s) => s.selectedVagaId);
  const vaga = vagas.find((v) => v.id === (selectedVagaId ?? nearbyVagaId));
  if (!vaga) return null;

  const chip = MODELO_CHIP[vaga.modelo];
  const expanded = vaga.id === selectedVagaId;

  return (
    <section
      aria-live="polite"
      className={`${PANEL} pointer-events-none absolute left-4 top-36 w-[min(22rem,calc(100vw-2rem))] md:bottom-20 md:top-auto p-4 text-sm`}
    >
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${chip.className}`}>{chip.label}</span>
        {vaga.status === "encerrada" && (
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">Encerrada</span>
        )}
      </div>
      <p className="mt-2 text-base font-semibold leading-tight">{vaga.titulo}</p>
      <p className="mb-1 text-white/60">{vaga.empresa}</p>
      <VagaLocal vaga={vaga} />
      {expanded ? (
        <p className="mt-2 border-t border-white/10 pt-2">
          Faixa salarial: {brl.format(vaga.faixaSalarial.min)} – {brl.format(vaga.faixaSalarial.max)}
        </p>
      ) : (
        <p className="mt-2 text-xs text-white/50">
          Pressione <Kbd>E</Kbd> para ver detalhes
        </p>
      )}
    </section>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold">
      {children}
    </kbd>
  );
}

function Controls() {
  return (
    <div
      className={`${PANEL} pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-3 px-4 py-2 text-xs text-white/70 md:flex`}
    >
      <span><Kbd>WASD</Kbd> mover</span>
      <span><Kbd>ESPAÇO</Kbd> pular</span>
      <span><Kbd>SHIFT</Kbd> correr</span>
      <span><Kbd>E</Kbd> ver vaga</span>
      <span>arraste para olhar</span>
    </div>
  );
}

const ROUND_BUTTON = `${PANEL} pointer-events-auto grid size-10 place-items-center text-lg font-semibold transition hover:bg-[#2a2f37] active:scale-95`;
const AREA_BUTTON = `${PANEL} pointer-events-auto flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition hover:bg-[#2a2f37] active:scale-95 disabled:opacity-50`;

function Navigation() {
  const zoom = useGameStore((s) => s.zoom);
  const travelTo = useGameStore((s) => s.travelTo);
  const traveling = useGameStore((s) => s.travel !== null);

  // Tira o foco do botão para o ESPAÇO (pular) não clicá-lo de novo.
  const go = (area: Area) => (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    travelTo(area);
  };

  return (
    <nav className="pointer-events-none absolute bottom-4 right-4 flex flex-col items-end gap-2">
      <button type="button" aria-label="Aproximar" className={ROUND_BUTTON} onClick={() => zoom(-1)}>
        +
      </button>
      <button type="button" aria-label="Afastar" className={ROUND_BUTTON} onClick={() => zoom(1)}>
        −
      </button>
      <button type="button" className={`${AREA_BUTTON} mt-2`} disabled={traveling} onClick={go("cidade")}>
        <Dot className="bg-[#f08a24]" /> Ir para a cidade
      </button>
      <button type="button" className={AREA_BUTTON} disabled={traveling} onClick={go("vila")}>
        <Dot className="bg-[#1d9f95]" /> Ir para a vila remota
      </button>
    </nav>
  );
}

export function Hud() {
  return (
    <>
      <Legend />
      <VagaCard />
      <Controls />
      <Navigation />
    </>
  );
}
