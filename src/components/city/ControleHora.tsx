"use client";

import { useId, useState, type KeyboardEvent, type MouseEvent } from "react";
import { selecionarHora, useTempoStore } from "@/stores/tempo";

const FASES = [
  { ate: 5, nome: "Madrugada" },
  { ate: 7, nome: "Amanhecer" },
  { ate: 17, nome: "Dia" },
  { ate: 19, nome: "Entardecer" },
  { ate: 24, nome: "Noite" },
];

/** Keys the slider handles itself; the player's window listener must not swallow them. */
const SLIDER_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"]);

function formatarHora(hora: number) {
  const minutos = Math.round(hora * 60) % 1440;
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

const faseDa = (hora: number) => FASES.find((f) => hora < f.ate)?.nome ?? "Noite";
const isDia = (hora: number) => hora >= 6 && hora < 18;

function IconeHora({ dia }: { dia: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      {dia ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      ) : (
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      )}
    </svg>
  );
}

/** Small, collapsible time control for testing the day/night cycle (top-right). */
export default function ControleHora() {
  const [aberto, setAberto] = useState(false);
  const hora = useTempoStore(selecionarHora);
  const manual = useTempoStore((s) => s.horaManual !== null);
  const { definirHora, usarHoraReal } = useTempoStore.getState();
  const painelId = useId();
  const sliderId = useId();
  const texto = formatarHora(hora);

  // Blur buttons so SPACE (jump) doesn't click them again.
  const alternar = (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    setAberto((v) => !v);
  };
  const voltarHoraReal = (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    usarHoraReal();
  };
  const onSliderKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (SLIDER_KEYS.has(e.key)) e.stopPropagation();
  };

  return (
    <div className="pointer-events-none absolute top-[4.75rem] right-[3.75rem] z-10 flex flex-col items-end md:top-4 md:right-[17.75rem]">
      <button
        type="button"
        onClick={alternar}
        aria-expanded={aberto}
        aria-controls={painelId}
        title="Hora do dia"
        className="pointer-events-auto flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-[#1d2127]/85 px-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-[#2a2f37] md:h-9 md:min-w-9"
      >
        <IconeHora dia={isDia(hora)} />
        <span className="hidden tabular-nums lg:inline">{texto}</span>
        {manual && <span className="size-1.5 rounded-full bg-[#f0b429]" aria-hidden="true" />}
        <span className="sr-only">
          {aberto ? "Fechar controle de hora" : "Abrir controle de hora"} — {texto}
          {manual ? " (manual)" : " (hora real)"}
        </span>
      </button>

      {aberto && (
        <div
          id={painelId}
          className="pointer-events-auto mt-2 w-56 rounded-xl border border-white/15 bg-[#1d2127]/90 p-3 text-white shadow-lg backdrop-blur"
        >
          <div className="flex items-baseline justify-between">
            <label htmlFor={sliderId} className="text-xs font-semibold text-white/85">
              Hora do dia
            </label>
            <span className="text-xs text-white/85">
              <strong className="text-sm text-white tabular-nums">{texto}</strong> · {faseDa(hora)}
            </span>
          </div>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={24}
            step={0.25}
            value={hora}
            onChange={(e) => definirHora(Number(e.target.value))}
            onKeyDown={onSliderKey}
            aria-valuetext={`${texto}, ${faseDa(hora)}`}
            className="mt-2 w-full cursor-pointer accent-[#f0b429]"
          />
          <div className="flex justify-between text-[10px] text-white/75" aria-hidden="true">
            <span>0h</span>
            <span>6h</span>
            <span>12h</span>
            <span>18h</span>
            <span>24h</span>
          </div>
          <button
            type="button"
            onClick={voltarHoraReal}
            disabled={!manual}
            className="mt-2.5 w-full rounded-lg bg-[#f0b429] py-1.5 text-xs font-bold text-[#1d2127] transition hover:bg-[#f5c451] disabled:cursor-default disabled:bg-white/15 disabled:text-white/75"
          >
            {manual ? "Usar hora real" : "Seguindo a hora real"}
          </button>
        </div>
      )}
    </div>
  );
}
