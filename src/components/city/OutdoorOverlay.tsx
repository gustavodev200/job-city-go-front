"use client";

import { useEffect, useState } from "react";
import { useOutdoorStore, type OutdoorSelecionado } from "@/stores/outdoors";

function CartaoAnunciante({ selecionado }: { selecionado: OutdoorSelecionado }) {
  const [confirmado, setConfirmado] = useState(false);
  const fechar = () => useOutdoorStore.getState().selecionar(null);
  const vazio = selecionado === "vazio";
  const nome = vazio ? "Espaço para sua marca" : selecionado.nome;
  const slogan = vazio ? "Anuncie aqui e apareça para toda a cidade." : selecionado.slogan;
  const cor = vazio ? "#a59d8f" : selecionado.cor;

  return (
    <div
      role="dialog"
      aria-label={`Outdoor: ${nome}`}
      className="cartao-mapa anim-fade-in absolute bottom-24 left-1/2 w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl p-4"
    >
      <button
        type="button"
        onClick={fechar}
        className="absolute top-1.5 right-2 grid size-8 place-items-center rounded-full text-lg leading-none hover:bg-black/10"
      >
        <span aria-hidden="true">×</span>
        <span className="sr-only">Fechar</span>
      </button>
      <div className="flex items-center gap-3 pr-6">
        <span className="size-9 shrink-0 rounded-lg border-2 border-white shadow" style={{ background: cor }} />
        <div>
          <p className="fonte-serifa text-lg leading-tight font-bold">{nome}</p>
          <p className="text-sm text-[#6b3f1d]">{slogan}</p>
        </div>
      </div>
      {confirmado ? (
        <p role="status" className="mt-3 rounded-lg bg-[#2f9e6e]/15 px-3 py-2 text-sm font-semibold text-[#1f6b4a]">
          Pronto! A oferta foi salva e em breve você recebe os detalhes.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmado(true)}
          className="mt-3 w-full rounded-lg bg-[#f08a24] py-2 text-sm font-bold text-white shadow hover:bg-[#e07a14]"
        >
          Ver oferta
        </button>
      )}
    </div>
  );
}

/** DOM layer for the billboards: brand card on click and the debug toggle. */
export function OutdoorOverlay() {
  const selecionado = useOutdoorStore((s) => s.selecionado);
  const debug = useOutdoorStore((s) => s.debug);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") useOutdoorStore.getState().selecionar(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* Left of the legend: top-right corner without covering it. "D" is already strafe-right. */}
      <button
        type="button"
        onClick={() => useOutdoorStore.getState().alternarDebug()}
        aria-pressed={debug}
        title="Modo de depuração dos outdoors"
        className={`absolute top-[4.75rem] right-[4rem] rounded-md px-2 py-1 font-mono text-[11px] font-bold shadow md:top-4 md:right-[17.75rem] ${
          debug ? "bg-[#ff2b2b] text-white" : "bg-[#1d2127]/80 text-white/80"
        }`}
      >
        debug
      </button>
      {selecionado && (
        <CartaoAnunciante key={selecionado === "vazio" ? "vazio" : selecionado.id} selecionado={selecionado} />
      )}
    </>
  );
}
