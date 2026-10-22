"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { CATEGORIA_LABEL, vagas, type Vaga } from "@/data/vagas";
import { useGameStore } from "@/stores/game";
import { CATEGORIA_COLORS, MODELO_COLORS, MODELO_LABEL } from "./cores";
import { CategoriaIcon, ModeloIcon } from "./icons";
import { usePresence } from "./usePresence";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const FOCUSABLE = 'button:not([disabled]), [tabindex="0"]';

/** Gives keyboard focus back to the 3D scene so the character responds again. */
function focusScene() {
  const canvas = document.querySelector("canvas");
  if (!canvas) return;
  canvas.setAttribute("tabindex", "-1");
  canvas.focus({ preventScroll: true });
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="py-1">
      <div className="pergaminho-divisor my-3" aria-hidden="true" />
      <h3 className="fonte-serifa mb-2 text-sm font-bold tracking-[0.18em] text-[#6b3f1d] uppercase">{titulo}</h3>
      {children}
    </section>
  );
}

function Lista({ itens }: { itens: string[] }) {
  return (
    <ul className="space-y-1.5">
      {itens.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span aria-hidden="true" className="mt-[0.45rem] size-2 shrink-0 rotate-45 bg-[#9c6b35]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Selo({ aberta }: { aberta: boolean }) {
  return (
    <div
      role="img"
      aria-label={aberta ? "Selo: vaga aberta" : "Selo: vaga encerrada"}
      className="selo-cera anim-selo grid size-20 shrink-0 place-items-center text-center sm:size-24"
      style={{
        background: aberta
          ? "radial-gradient(circle at 38% 32%, #4fae78, #2e7d4f 55%, #1b5233)"
          : "radial-gradient(circle at 38% 32%, #d9534a, #b3261e 55%, #6e130e)",
      }}
    >
      <div className="grid size-[78%] place-items-center rounded-full border-2 border-dashed border-white/45">
        <div>
          <svg viewBox="0 0 24 24" className="mx-auto size-6" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
            {aberta ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M6 6l12 12M18 6L6 18" />}
          </svg>
          <span className="block text-[9px] font-black tracking-widest sm:text-[10px]">
            {aberta ? "ABERTA" : "ENCERRADA"}
          </span>
        </div>
      </div>
    </div>
  );
}

function LocalEModelo({ vaga }: { vaga: Vaga }) {
  if (vaga.modelo === "remoto") {
    return (
      <p>
        <strong>Remoto</strong> — {vaga.estado}
      </p>
    );
  }
  return (
    <>
      <p>
        <strong>{MODELO_LABEL[vaga.modelo]}</strong> em {vaga.cidade} · {CATEGORIA_LABEL[vaga.categoria]}
      </p>
      {vaga.modelo === "hibrido" && (
        <p className="mt-1">
          Frequência de presença: <strong>{vaga.frequencia}</strong>
        </p>
      )}
    </>
  );
}

function Chip({ color, icon, label }: { color: string; icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b8925c] bg-[#fffaf0]/70 py-0.5 pr-2.5 pl-0.5 text-xs font-semibold">
      <span className="grid size-6 place-items-center rounded-full text-white" style={{ background: color }}>
        {icon}
      </span>
      {label}
    </span>
  );
}

/** Job details shown as an old parchment that unrolls in the middle of the screen. */
export function PergaminhoVaga() {
  const selectedId = useGameStore((s) => s.selectedVagaId);
  const selectVaga = useGameStore((s) => s.selectVaga);
  const { shown: vaga, leaving, onExited } = usePresence(vagas.find((v) => v.id === selectedId) ?? null);
  const [candidaturas, setCandidaturas] = useState<string[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus into the dialog when a job opens.
  useEffect(() => {
    if (!selectedId) return;
    const primary = primaryRef.current;
    (primary && !primary.disabled ? primary : closeRef.current)?.focus({ preventScroll: true });
  }, [selectedId]);

  if (!vaga) return null;

  const aberta = vaga.status === "aberta";
  const candidatou = candidaturas.includes(vaga.id);
  const close = () => selectVaga(null);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Keep game shortcuts (WASD, space, E) from reaching the character while reading.
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const candidatar = () => {
    setCandidaturas((ids) => [...ids, vaga.id]);
    requestAnimationFrame(() => closeRef.current?.focus());
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#1a120a]/45 p-4 backdrop-blur-[3px] ${
        leaving ? "anim-fade-out" : "anim-fade-in"
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pergaminho-titulo"
        aria-describedby="pergaminho-empresa"
        onKeyDown={onKeyDown}
        onAnimationEnd={(e) => {
          if (e.target !== e.currentTarget || !leaving) return;
          onExited();
          focusScene();
        }}
        className={`flex h-full max-h-full w-full flex-col md:h-auto md:max-h-[90dvh] md:w-[70vw] md:max-w-[70vw] ${
          leaving ? "anim-enrolar" : "anim-desenrolar"
        }`}
      >
        <div className="rolo z-10 mx-2 shrink-0" aria-hidden="true" />

        <div className="pergaminho-papel relative mx-4 -my-2 flex min-h-0 flex-1 flex-col px-5 pt-6 pb-4 sm:px-9">
          <header className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap gap-2">
                {vaga.modelo !== "remoto" && (
                  <Chip
                    color={CATEGORIA_COLORS[vaga.categoria]}
                    icon={<CategoriaIcon categoria={vaga.categoria} size={14} />}
                    label={CATEGORIA_LABEL[vaga.categoria]}
                  />
                )}
                <Chip
                  color={MODELO_COLORS[vaga.modelo]}
                  icon={<ModeloIcon modelo={vaga.modelo} size={14} />}
                  label={MODELO_LABEL[vaga.modelo]}
                />
              </div>
              <h2 id="pergaminho-titulo" className="fonte-serifa text-2xl leading-tight font-bold text-[#2e1d0e] sm:text-4xl">
                {vaga.titulo}
              </h2>
              <p id="pergaminho-empresa" className="fonte-serifa mt-1 text-base text-[#5c4630] italic sm:text-lg">
                {vaga.empresa}
              </p>
            </div>
            <Selo aberta={aberta} />
          </header>

          <div
            tabIndex={0}
            aria-label="Descrição da vaga"
            className="pergaminho-rolagem -mx-2 mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-6 text-[15px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-[#9c6b35]/60"
          >
            <Secao titulo="Sobre a vaga">
              <p>{vaga.descricao}</p>
            </Secao>
            <Secao titulo="Requisitos">
              <Lista itens={vaga.requisitos} />
            </Secao>
            <Secao titulo="Benefícios">
              <Lista itens={vaga.beneficios} />
            </Secao>
            <Secao titulo="Local e modelo">
              <LocalEModelo vaga={vaga} />
            </Secao>
            <Secao titulo="Faixa salarial">
              <p className="fonte-serifa text-xl font-bold text-[#2e1d0e]">
                {brl.format(vaga.faixaSalarial.min)} – {brl.format(vaga.faixaSalarial.max)}
              </p>
            </Secao>
          </div>

          <footer className="mt-3 border-t border-[#b8925c]/60 pt-3">
            <p role="status" aria-live="polite" className="empty:hidden mb-3 rounded-lg bg-[#2e7d4f]/12 px-3 py-2 text-sm font-semibold text-[#1b5233]">
              {candidatou ? "Candidatura enviada! A empresa vai receber seu perfil. (simulação)" : ""}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="rounded-xl border-2 border-[#8e6a3b] bg-[#fffaf0] px-5 py-2.5 font-semibold text-[#3b2a1a] transition hover:bg-white focus-visible:ring-2 focus-visible:ring-[#6b3f1d] focus-visible:outline-none"
              >
                Fechar <span className="ml-1 text-xs font-normal text-[#5c4630]">(Esc)</span>
              </button>
              <button
                ref={primaryRef}
                type="button"
                onClick={candidatar}
                disabled={!aberta || candidatou}
                className="rounded-xl border-2 border-[#6e3a14] bg-gradient-to-b from-[#b5642a] to-[#8a4518] px-6 py-2.5 font-bold text-[#fff6e6] shadow-[0_3px_0_#5a2c0e] transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#6b3f1d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3e6c8] focus-visible:outline-none disabled:cursor-not-allowed disabled:border-[#8a7d6a] disabled:from-[#bdb2a0] disabled:to-[#a89c88] disabled:text-[#3b2f22] disabled:shadow-none"
              >
                {!aberta ? "Vaga encerrada" : candidatou ? "Candidatura enviada" : "Candidatar-se"}
              </button>
            </div>
          </footer>
        </div>

        <div className="rolo z-10 mx-2 shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
}
