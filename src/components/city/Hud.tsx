"use client";

import { useState, useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import { RIVER, type Area } from "@/data/mapa";
import { CATEGORIA_LABEL, vagas, type Categoria, type Modelo } from "@/data/vagas";
import { useGameStore } from "@/stores/game";
import { CATEGORIA_COLORS, MODELO_COLORS, MODELO_LABEL } from "./cores";
import {
  CategoriaIcon,
  CityIcon,
  CoinIcon,
  DragIcon,
  JoystickIcon,
  ModeloIcon,
  TapIcon,
  VillageIcon,
} from "./icons";
import { CATEGORIAS, vagasCidade, vagasVila } from "./layout";
import { Minimap } from "./Minimap";
import { PergaminhoVaga } from "./PergaminhoVaga";
import { playerRuntime } from "./playerRuntime";
import { usePresence } from "./usePresence";

/** Virtual balance shown on the city sign (fixed for now). */
const SALDO = 1250;

const AREA_INFO: Record<Area, { nome: string; abertas: number; total: number }> = {
  cidade: {
    nome: "Cidade de Oportunidades",
    abertas: vagasCidade.filter((v) => v.status === "aberta").length,
    total: vagasCidade.length,
  },
  vila: {
    nome: "Vila Remota",
    abertas: vagasVila.filter((v) => v.status === "aberta").length,
    total: vagasVila.length,
  },
};

const CATEGORIA_COUNT = Object.fromEntries(
  CATEGORIAS.map((cat) => [cat, vagasCidade.filter((v) => v.categoria === cat).length]),
) as Record<Categoria, number>;

const MODELO_COUNT: Record<Modelo, number> = {
  presencial: vagasCidade.filter((v) => v.modelo === "presencial").length,
  hibrido: vagasCidade.filter((v) => v.modelo === "hibrido").length,
  remoto: vagasVila.length,
};

function useMedia(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Area the character is in, polled from the render loop (no per-frame React updates). */
function useCurrentArea(): Area {
  return useSyncExternalStore(
    (onChange) => {
      const id = window.setInterval(onChange, 400);
      return () => window.clearInterval(id);
    },
    () => (playerRuntime.position.x > RIVER.x ? "vila" : "cidade"),
    () => "cidade",
  );
}

// ── Top-left: wooden sign ───────────────────────────────────────────────
function PlacaArea() {
  const area = useCurrentArea();
  const info = AREA_INFO[area];
  const AreaIcon = area === "cidade" ? CityIcon : VillageIcon;
  return (
    <aside
      aria-label="Área atual"
      className="placa-madeira pointer-events-none absolute top-3 left-3 rounded-xl px-3 py-2 md:top-4 md:left-4 md:px-4 md:py-3"
    >
      <span className="prego absolute top-1.5 left-1.5" aria-hidden="true" />
      <span className="prego absolute top-1.5 right-1.5" aria-hidden="true" />
      <div className="flex items-center gap-2.5 md:gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-black/20 md:size-11">
          <AreaIcon size={22} />
        </span>
        <div>
          <p aria-live="polite" className="fonte-serifa text-sm leading-tight font-bold md:text-lg">
            {info.nome}
          </p>
          <p className="text-[11px] text-[#ffe9c7] md:text-xs">
            <strong className="text-white">{info.abertas}</strong> vagas abertas de {info.total}
          </p>
        </div>
        <div
          className="ml-1 flex items-center gap-1.5 rounded-full border border-[#5a3214] bg-[#3d2410]/70 py-1 pr-3 pl-1 md:ml-3"
          title="Saldo virtual"
        >
          <CoinIcon size={22} />
          <span className="text-sm font-bold tabular-nums">{SALDO.toLocaleString("pt-BR")}</span>
          <span className="sr-only">moedas</span>
        </div>
      </div>
    </aside>
  );
}

// ── Top-right: notepad legend ───────────────────────────────────────────
function LinhaLegenda({ color, icon, label, count }: { color: string; icon: ReactNode; label: string; count: number }) {
  return (
    <li className="flex h-6 items-center gap-2 text-[13px]">
      <span className="grid size-5 shrink-0 place-items-center rounded-full text-white" style={{ background: color }}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      <span className="font-bold tabular-nums">{count}</span>
    </li>
  );
}

function Legenda() {
  const [aberta, setAberta] = useState(false);
  return (
    <aside aria-label="Legenda" className="absolute top-[4.75rem] right-3 flex flex-col items-end md:top-4 md:right-4">
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        aria-expanded={aberta}
        aria-controls="legenda-lista"
        className="cartao-mapa grid size-11 place-items-center rounded-xl md:hidden"
      >
        <span className="sr-only">{aberta ? "Esconder legenda" : "Mostrar legenda"}</span>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path d="M6 3h11l3 3v15H6zM9 9h8M9 13h8M9 17h5" />
        </svg>
      </button>
      <div
        id="legenda-lista"
        className={`bloco-notas mt-2 w-56 rounded-md pt-1 pb-3 md:mt-0 md:block md:w-64 ${aberta ? "block" : "hidden"}`}
      >
        <div className="espiral mx-3 h-2.5" aria-hidden="true" />
        <div className="pr-3 pl-9">
          <p className="fonte-serifa mt-1 mb-1 text-base font-bold">Legenda</p>
          <p className="text-[10px] font-bold tracking-[0.18em] text-[#6b3f1d] uppercase">Categorias</p>
          <ul>
            {CATEGORIAS.map((cat) => (
              <LinhaLegenda
                key={cat}
                color={CATEGORIA_COLORS[cat]}
                icon={<CategoriaIcon categoria={cat} size={12} />}
                label={CATEGORIA_LABEL[cat]}
                count={CATEGORIA_COUNT[cat]}
              />
            ))}
          </ul>
          <p className="mt-1.5 text-[10px] font-bold tracking-[0.18em] text-[#6b3f1d] uppercase">Modelos</p>
          <ul>
            {(Object.keys(MODELO_COUNT) as Modelo[]).map((m) => (
              <LinhaLegenda
                key={m}
                color={MODELO_COLORS[m]}
                icon={<ModeloIcon modelo={m} size={12} />}
                label={MODELO_LABEL[m]}
                count={MODELO_COUNT[m]}
              />
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

// ── Bottom-center: shortcuts ────────────────────────────────────────────
function Atalhos({ touch }: { touch: boolean }) {
  const base =
    "pointer-events-none absolute bottom-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1d2127]/85 px-3 py-2 text-xs text-white/85 shadow-lg backdrop-blur";
  if (touch) {
    return (
      <div className={`${base} left-3 max-w-[calc(100vw-11rem)] flex-wrap md:left-1/2 md:-translate-x-1/2`}>
        <span className="flex items-center gap-1.5">
          <JoystickIcon size={20} /> <DragIcon size={16} /> olhar
        </span>
        <span className="flex items-center gap-1.5">
          <span className="grid size-7 place-items-center rounded-full bg-[#f08a24] text-white">
            <TapIcon size={16} />
          </span>
          abrir vaga
        </span>
      </div>
    );
  }
  return (
    <div className={`${base} left-4 hidden md:flex 2xl:left-1/2 2xl:-translate-x-1/2`}>
      <span className="flex items-center gap-1">
        <span className="tecla">W</span>
        <span className="tecla">A</span>
        <span className="tecla">S</span>
        <span className="tecla">D</span>
        <span className="ml-1">mover</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="tecla px-3">ESPAÇO</span> pular
      </span>
      <span className="flex items-center gap-1.5">
        <span className="tecla">E</span> interagir
      </span>
      <span className="flex items-center gap-1.5">
        <DragIcon size={16} /> arrastar para olhar
      </span>
    </div>
  );
}

// ── Proximity balloon ───────────────────────────────────────────────────
function BalaoProximidade({ touch }: { touch: boolean }) {
  const nearbyId = useGameStore((s) => s.nearbyVagaId);
  const selectedId = useGameStore((s) => s.selectedVagaId);
  const selectVaga = useGameStore((s) => s.selectVaga);
  const atual = selectedId ? null : (vagas.find((v) => v.id === nearbyId) ?? null);
  const { shown: vaga, leaving, onExited } = usePresence(atual);
  if (!vaga) return null;

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 md:top-auto md:bottom-20">
      <button
        type="button"
        onClick={() => selectVaga(vaga.id)}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && leaving) onExited();
        }}
        tabIndex={-1}
        aria-label={`Abrir vaga: ${vaga.titulo}`}
        className={`pointer-events-auto block ${leaving ? "anim-balao-saida" : "anim-balao"}`}
      >
        <span className="anim-flutuar relative block rounded-2xl border-2 border-[#b38a52] bg-[#fffaf0] px-4 py-2.5 text-left text-[#3b2a1a] shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
          <span className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-[#6b3f1d] uppercase">
            <span className="size-2.5 rounded-full" style={{ background: MODELO_COLORS[vaga.modelo] }} />
            {MODELO_LABEL[vaga.modelo]}
            {vaga.status === "encerrada" && <span className="text-[#8a1c14]">· encerrada</span>}
          </span>
          <span className="fonte-serifa block max-w-[16rem] truncate text-base font-bold">{vaga.titulo}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[#5c4630]">
            {touch ? (
              <>Toque para abrir</>
            ) : (
              <>
                Pressione <span className="tecla h-6 min-w-6 text-[10px]">E</span> para abrir
              </>
            )}
          </span>
          {/* Speech-bubble tail */}
          <span
            aria-hidden="true"
            className="absolute -bottom-2 left-1/2 size-3.5 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-[#b38a52] bg-[#fffaf0]"
          />
        </span>
      </button>
    </div>
  );
}

// ── Bottom-right: zoom, map cards and mini-map ──────────────────────────
type CartaoAreaProps = {
  area: Area;
  compact: boolean;
  disabled: boolean;
  onGo: (e: MouseEvent<HTMLButtonElement>) => void;
};

function CartaoArea({ area, compact, disabled, onGo }: CartaoAreaProps) {
  const info = AREA_INFO[area];
  const Icon = area === "cidade" ? CityIcon : VillageIcon;
  const label = area === "cidade" ? "Ir para a cidade" : "Ir para a vila remota";
  const color = area === "cidade" ? MODELO_COLORS.presencial : MODELO_COLORS.remoto;
  return (
    <button
      type="button"
      onClick={onGo}
      disabled={disabled}
      aria-label={compact ? `${label} (${info.abertas} vagas abertas)` : undefined}
      className={`cartao-mapa pointer-events-auto flex items-center gap-2.5 rounded-xl text-left disabled:opacity-60 ${
        compact ? "size-11 justify-center" : "w-52 px-3 py-2"
      }`}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg text-white" style={{ background: color }}>
        <Icon size={18} />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block text-sm leading-tight font-bold">{label}</span>
          <span className="block text-xs text-[#5c4630]">{info.abertas} vagas abertas</span>
        </span>
      )}
    </button>
  );
}

function Navegacao({ narrow }: { narrow: boolean }) {
  const zoom = useGameStore((s) => s.zoom);
  const travelTo = useGameStore((s) => s.travelTo);
  const traveling = useGameStore((s) => s.travel !== null);

  // Blur the button so SPACE (jump) doesn't click it again.
  const go = (area: Area) => (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    travelTo(area);
  };
  const round =
    "pointer-events-auto grid size-10 place-items-center rounded-full border border-white/15 bg-[#1d2127]/85 text-lg font-semibold text-white shadow-lg transition hover:bg-[#2a2f37] active:scale-95";

  return (
    <nav
      aria-label="Navegação"
      className="pointer-events-none absolute right-3 bottom-3 flex items-end gap-2.5 md:right-4 md:bottom-4"
    >
      <div className="flex flex-col items-end gap-2">
        {!narrow && (
          <div className="mb-1 flex gap-2">
            <button type="button" aria-label="Aproximar" className={round} onClick={() => zoom(-1)}>
              +
            </button>
            <button type="button" aria-label="Afastar" className={round} onClick={() => zoom(1)}>
              −
            </button>
          </div>
        )}
        <CartaoArea area="cidade" compact={narrow} onGo={go("cidade")} disabled={traveling} />
        <CartaoArea area="vila" compact={narrow} onGo={go("vila")} disabled={traveling} />
      </div>
      <Minimap size={narrow ? 116 : 176} />
    </nav>
  );
}

export function Hud() {
  const narrow = useMedia("(max-width: 767px)");
  const touch = useMedia("(pointer: coarse)");
  return (
    <>
      <PlacaArea />
      <Legenda />
      <BalaoProximidade touch={touch} />
      <Atalhos touch={touch} />
      <Navegacao narrow={narrow} />
      <PergaminhoVaga />
    </>
  );
}
