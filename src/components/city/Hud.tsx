"use client";

import { useMemo, useState, useSyncExternalStore, type MouseEvent, type ReactNode } from "react";
import { useFiltro, useIdsNoFiltro } from "@/components/busca/usarBusca";
import { CATEGORIA_LABEL, ORDEM_CATEGORIAS, type Categoria, type Modelo } from "@/data/vagas";
import { contarAtivos } from "@/lib/busca/filtro";
import type { Mundo } from "@/lib/cidade/mundo";
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
import { Minimap } from "./Minimap";
import { useMundo } from "./mundo";
import { PergaminhoVaga } from "./PergaminhoVaga";
import { playerRuntime } from "./playerRuntime";
import { usePresence } from "./usePresence";

/** Virtual balance shown on the city sign (fixed for now). */
const SALDO = 1250;

type Area = "cidade" | "remoto";

/** Contagens de uma área do mundo (só vagas abertas na legenda — US2-3). */
function contagens(mundo: Mundo, area?: Area) {
  const daArea = area ? mundo.vagas.filter((v) => (v.modelo === "remoto") === (area === "remoto")) : mundo.vagas;
  const abertas = daArea.filter((v) => v.status === "aberta");
  const porCategoria = Object.fromEntries(
    ORDEM_CATEGORIAS.map((cat) => [cat, abertas.filter((v) => v.modelo !== "remoto" && v.categoria === cat).length]),
  ) as Record<Categoria, number>;
  const porModelo: Record<Modelo, number> = {
    presencial: abertas.filter((v) => v.modelo === "presencial").length,
    hibrido: abertas.filter((v) => v.modelo === "hibrido").length,
    remoto: abertas.filter((v) => v.modelo === "remoto").length,
  };
  return { abertas: abertas.length, total: daArea.length, porCategoria, porModelo };
}

/** Lado do rio onde o personagem está, lido do loop de render (sem atualizar o React a cada quadro). */
function useAreaAtual(mundo: Mundo): Area {
  return useSyncExternalStore(
    (onChange) => {
      const id = window.setInterval(onChange, 400);
      return () => window.clearInterval(id);
    },
    () => (mundo.tipo === "remoto" || mundo.naVila(playerRuntime.position.x) ? "remoto" : "cidade"),
    () => (mundo.tipo === "remoto" ? "remoto" : "cidade"),
  );
}

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

// ── Top-left: wooden sign ───────────────────────────────────────────────
function PlacaArea() {
  const mundo = useMundo();
  const area = useAreaAtual(mundo);
  const info = useMemo(() => contagens(mundo, area), [mundo, area]);
  const filtrando = contarAtivos(useFiltro()) > 0;
  const noFiltro = useIdsNoFiltro();
  const naArea = mundo.vagas.filter((v) => (v.modelo === "remoto") === (area === "remoto") || mundo.tipo === "remoto");
  const passam = naArea.filter((v) => noFiltro.has(v.id)).length;
  const AreaIcon = area === "cidade" ? CityIcon : VillageIcon;
  const nome = area === "remoto" ? "Bairro Remoto" : `${mundo.nome} · ${mundo.uf}`;
  return (
    <aside
      aria-label="Área atual"
      className="placa-madeira pointer-events-none absolute top-14 left-3 rounded-xl px-3 py-2 md:top-16 md:left-4 md:px-4 md:py-3"
    >
      <span className="prego absolute top-1.5 left-1.5" aria-hidden="true" />
      <span className="prego absolute top-1.5 right-1.5" aria-hidden="true" />
      <div className="flex items-center gap-2.5 md:gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-black/20 md:size-11">
          <AreaIcon size={22} />
        </span>
        <div>
          <h1 aria-live="polite" className="fonte-serifa text-sm leading-tight font-bold md:text-lg">{nome}</h1>
          {filtrando && (
            <p className="text-[11px] text-[#ffe9c7] md:text-xs">
              <strong className="text-white">{passam}</strong> de {naArea.length} vagas no filtro
            </p>
          )}
          <p className="text-[11px] text-[#ffe9c7] md:text-xs">
            <strong className="text-white">{info.abertas}</strong>{" "}
            {info.abertas === 1 ? "vaga" : "vagas"} {area === "remoto" ? "remotas " : ""}
            {info.abertas === 1 ? "aberta" : "abertas"} de {info.total}
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
    <li className={`flex h-6 items-center gap-2 text-[13px] ${count === 0 ? "opacity-45" : ""}`}>
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
  const mundo = useMundo();
  const { porCategoria, porModelo } = useMemo(() => contagens(mundo), [mundo]);
  const modelos = (mundo.tipo === "remoto" ? ["remoto"] : ["presencial", "hibrido", "remoto"]) as Modelo[];
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
          {mundo.tipo === "cidade" && (
            <>
              <p className="text-[10px] font-bold tracking-[0.18em] text-[#6b3f1d] uppercase">Vagas abertas por categoria</p>
              <ul aria-label="Vagas abertas por categoria">
                {ORDEM_CATEGORIAS.map((cat) => (
                  <LinhaLegenda
                    key={cat}
                    color={CATEGORIA_COLORS[cat]}
                    icon={<CategoriaIcon categoria={cat} size={12} />}
                    label={CATEGORIA_LABEL[cat]}
                    count={porCategoria[cat]}
                  />
                ))}
              </ul>
            </>
          )}
          <p className="mt-1.5 text-[10px] font-bold tracking-[0.18em] text-[#6b3f1d] uppercase">Modelos</p>
          <ul>
            {modelos.map((m) => (
              <LinhaLegenda
                key={m}
                color={MODELO_COLORS[m]}
                icon={<ModeloIcon modelo={m} size={12} />}
                label={m === "remoto" ? "Casa remota" : MODELO_LABEL[m]}
                count={porModelo[m]}
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
  const mundo = useMundo();
  const atual = selectedId ? null : (mundo.vagas.find((v) => v.id === nearbyId) ?? null);
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
            {vaga.modelo === "hibrido" && <span className="normal-case">· {vaga.frequencia}</span>}
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

// ── Bottom-right: zoom, portal and mini-map ─────────────────────────────
/** Botão que faz o mesmo que atravessar o portal da ponte (acessível por teclado). */
export type AcaoPortal = { rotulo: string; aoUsar: () => void };

function BotaoPortal({ portal, compact }: { portal: AcaoPortal; compact: boolean }) {
  const Icon = CityIcon;
  const color = MODELO_COLORS.presencial;
  // Blur the button so SPACE (jump) doesn't click it again.
  const usar = (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    portal.aoUsar();
  };
  return (
    <button
      type="button"
      onClick={usar}
      aria-label={compact ? portal.rotulo : undefined}
      className={`cartao-mapa pointer-events-auto flex items-center gap-2.5 rounded-xl text-left ${
        compact ? "size-11 justify-center" : "w-52 px-3 py-2"
      }`}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg text-white" style={{ background: color }}>
        <Icon size={18} />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block text-sm leading-tight font-bold">{portal.rotulo}</span>
          <span className="block text-xs text-[#5c4630]">ou atravesse a ponte</span>
        </span>
      )}
    </button>
  );
}

type CartaoAreaProps = { area: Area; compact: boolean; disabled: boolean; abertas: number; onGo: (e: MouseEvent<HTMLButtonElement>) => void };

function CartaoArea({ area, compact, disabled, abertas, onGo }: CartaoAreaProps) {
  const Icon = area === "cidade" ? CityIcon : VillageIcon;
  const label = area === "cidade" ? "Ir para a cidade" : "Ir para o Bairro Remoto";
  const color = area === "cidade" ? MODELO_COLORS.presencial : MODELO_COLORS.remoto;
  return (
    <button
      type="button"
      onClick={onGo}
      disabled={disabled}
      aria-label={compact ? `${label} (${abertas} vagas abertas)` : undefined}
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
          <span className="block text-xs text-[#5c4630]">{abertas} vagas abertas</span>
        </span>
      )}
    </button>
  );
}

/** Na cidade, a vila fica do outro lado da ponte: os botões levam o personagem até cada lado. */
function Viagens({ compact }: { compact: boolean }) {
  const mundo = useMundo();
  const viajar = useGameStore((s) => s.viajar);
  const viajando = useGameStore((s) => s.viagem !== null);
  const cidade = useMemo(() => contagens(mundo, "cidade"), [mundo]);
  const remoto = useMemo(() => contagens(mundo, "remoto"), [mundo]);
  // Blur the button so SPACE (jump) doesn't click it again.
  const ir = (destino: { x: number; z: number }) => (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    viajar(destino);
  };
  return (
    <>
      <CartaoArea area="cidade" compact={compact} disabled={viajando} abertas={cidade.abertas} onGo={ir(mundo.nascimento.praca)} />
      {mundo.nascimento.vila && (
        <CartaoArea area="remoto" compact={compact} disabled={viajando} abertas={remoto.abertas} onGo={ir(mundo.nascimento.vila)} />
      )}
    </>
  );
}

function Navegacao({ narrow, portal }: { narrow: boolean; portal?: AcaoPortal }) {
  const zoom = useGameStore((s) => s.zoom);
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
        {portal ? <BotaoPortal portal={portal} compact={narrow} /> : <Viagens compact={narrow} />}
      </div>
      <Minimap size={narrow ? 116 : 176} />
    </nav>
  );
}

/** `portal`: só no Bairro Remoto avulso (`/remoto`), para voltar. */
export function Hud({ portal }: { portal?: AcaoPortal }) {
  const narrow = useMedia("(max-width: 767px)");
  const touch = useMedia("(pointer: coarse)");
  return (
    <>
      <PlacaArea />
      <Legenda />
      <BalaoProximidade touch={touch} />
      <Atalhos touch={touch} />
      <Navegacao narrow={narrow} portal={portal} />
      <PergaminhoVaga />
    </>
  );
}
