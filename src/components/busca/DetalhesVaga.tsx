"use client";

import { useState, type ReactNode } from "react";
import { EscolherCidade } from "@/components/brasil/EscolherCidade";
import { CATEGORIA_COLORS, MODELO_COLORS, MODELO_LABEL } from "@/components/city/cores";
import { CategoriaIcon, ModeloIcon } from "@/components/city/icons";
import { estados } from "@/data/brasil/estados";
import type { VagaNacional } from "@/data/brasil/vagas";
import { CATEGORIA_LABEL, CONTRATO_LABEL, TURNO_LABEL } from "@/data/vagas";
import { cidadePorId } from "@/lib/brasil/rotas";
import { textoSalario } from "@/lib/busca/formato";
import { avisoAbrangencia, rotuloAbrangencia } from "@/lib/cidade/abrangencia";
import { estimarDeslocamento, textoDeslocamento } from "@/lib/cidade/deslocamento";
import { destaqueAtivo } from "@/lib/cidade/mundo";
import { usePerfilStore } from "@/stores/perfil";

// Miolo da vaga: usado pelo pergaminho da cidade e pelo painel de vagas (spec 004, research R8).

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

/** Distância e tempo até a vaga a partir da cidade do perfil (FR-006). */
function Deslocamento({ vaga }: { vaga: VagaNacional }) {
  const perfil = usePerfilStore((s) => (s.cidadeId ? cidadePorId.get(s.cidadeId) : undefined));
  const [escolhendo, setEscolhendo] = useState(false);
  const destino = vaga.cidadeId ? cidadePorId.get(vaga.cidadeId) : undefined;
  if (!destino || vaga.modelo === "remoto") return null;
  const frequencia = vaga.modelo === "hibrido" ? vaga.frequencia : undefined;
  if (perfil) {
    return (
      <p className="mt-1">
        Deslocamento desde {perfil.nome}:{" "}
        <strong>{textoDeslocamento(estimarDeslocamento(perfil, destino), frequencia)}</strong>
      </p>
    );
  }
  return escolhendo ? (
    <div className="mt-2 max-w-xs">
      <EscolherCidade aoEscolher={() => setEscolhendo(false)} />
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setEscolhendo(true)}
      className="mt-2 rounded-lg border border-[#b8925c] bg-[#fffaf0]/70 px-3 py-1.5 text-sm font-semibold"
    >
      Informe sua cidade para calcular o deslocamento
    </button>
  );
}

function LocalEModelo({ vaga }: { vaga: VagaNacional }) {
  const perfilUf = usePerfilStore((s) => (s.cidadeId ? (cidadePorId.get(s.cidadeId)?.uf ?? null) : null));
  if (vaga.modelo === "remoto") {
    const aviso = avisoAbrangencia(perfilUf, vaga.abrangencia);
    return (
      <>
        <p>
          <strong>Remoto</strong> — {rotuloAbrangencia(vaga.abrangencia)}
        </p>
        <p className="mt-1">Empresa de {estados[vaga.uf].nome}</p>
        {aviso && (
          <p role="note" className="mt-2 rounded-lg bg-[#b3261e]/12 px-3 py-2 font-semibold text-[#8a1c14]">
            {aviso}
          </p>
        )}
      </>
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
      <Deslocamento vaga={vaga} />
    </>
  );
}

export function Chip({ color, icon, label }: { color: string; icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b8925c] bg-[#fffaf0]/70 py-0.5 pr-2.5 pl-0.5 text-xs font-semibold">
      <span className="grid size-6 place-items-center rounded-full text-white" style={{ background: color }}>
        {icon}
      </span>
      {label}
    </span>
  );
}

/** Categoria, modalidade e "Patrocinado". */
export function ChipsVaga({ vaga }: { vaga: VagaNacional }) {
  return (
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
      {destaqueAtivo(vaga) && (
        <span className="inline-flex items-center rounded-full bg-[#f2c230] px-2.5 py-0.5 text-xs font-bold text-[#3b2a1a]">
          Patrocinado
        </span>
      )}
    </div>
  );
}

/** Seções da vaga: sobre, requisitos, benefícios, local, contrato e salário. */
export function DetalhesVaga({ vaga }: { vaga: VagaNacional }) {
  return (
    <>
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
      <Secao titulo="Contrato e turno">
        <p>
          <strong>{CONTRATO_LABEL[vaga.contrato]}</strong> · turno {TURNO_LABEL[vaga.turno].toLowerCase()}
        </p>
      </Secao>
      <Secao titulo="Faixa salarial">
        <p className="fonte-serifa text-xl font-bold text-[#2e1d0e]">{textoSalario(vaga)}</p>
      </Secao>
    </>
  );
}
