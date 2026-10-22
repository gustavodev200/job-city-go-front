"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { z } from "zod";
import { EscolherCidade } from "@/components/brasil/EscolherCidade";
import {
  CATEGORIA_LABEL,
  CONTRATO_LABEL,
  MODELO_LABEL,
  ORDEM_CATEGORIAS,
  ORDEM_CONTRATOS,
  ORDEM_MODELOS,
  ORDEM_TURNOS,
  TURNO_LABEL,
} from "@/data/vagas";
import { cidadePorId } from "@/lib/brasil/rotas";
import { contarAtivos, MAX_TEXTO, RAIO_PADRAO, RAIOS, type FiltroBusca, type Ordem } from "@/lib/busca/filtro";
import { useFiltrosStore } from "@/stores/filtros";
import { usePerfilStore } from "@/stores/perfil";
import { useCidadeReferencia, useFiltro } from "./usarBusca";

const ESPERA_BUSCA_MS = 200;
const TextoSchema = z.string().max(MAX_TEXTO);
// Campo vazio = sem limite; qualquer outra coisa precisa ser um valor em reais plausível.
const ValorSchema = z.union([z.literal(""), z.coerce.number().int().min(0).max(100_000)]);

const ROTULO_ORDEM: Record<Ordem, string> = {
  relevancia: "Relevância",
  recentes: "Mais recentes",
  salario: "Maior salário",
  distancia: "Menor distância",
};

const alternancia = (ativo: boolean) =>
  `w-full rounded-lg border-2 px-3 py-2 text-left transition ${
    ativo ? "border-amber-600 bg-amber-200 text-stone-900" : "border-black/15 bg-white/60 hover:bg-white/80"
  }`;

function Busca() {
  const texto = useFiltrosStore((s) => s.texto);
  const definir = useFiltrosStore((s) => s.definir);
  const [rascunho, setRascunho] = useState(texto);
  const [visto, setVisto] = useState(texto);
  const id = useId();

  // "Limpar" e links compartilhados mudam o filtro por fora: o campo acompanha.
  if (texto !== visto) {
    setVisto(texto);
    setRascunho(texto);
  }
  useEffect(() => {
    if (rascunho === texto) return;
    const t = window.setTimeout(() => definir({ texto: rascunho }), ESPERA_BUSCA_MS);
    return () => window.clearTimeout(t);
  }, [rascunho, texto, definir]);

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-[13px] font-semibold">
        Buscar por cargo ou empresa
      </label>
      <input
        id={id}
        type="search"
        autoComplete="off"
        maxLength={MAX_TEXTO}
        value={rascunho}
        onChange={(e) => {
          const r = TextoSchema.safeParse(e.target.value);
          if (r.success) setRascunho(r.data);
        }}
        placeholder="Ex.: enfermagem, Pixel Norte"
        className="w-full rounded-md border border-black/20 bg-white/90 px-2 py-1.5 text-sm text-stone-900"
      />
    </div>
  );
}

function Interior() {
  const interior = useFiltrosStore((s) => s.interior);
  const definir = useFiltrosStore((s) => s.definir);
  return (
    <button
      type="button"
      aria-pressed={interior}
      onClick={() => definir({ interior: !interior })}
      className={alternancia(interior)}
    >
      <span className="block text-sm font-bold">Posso morar no interior</span>
      <span className="block text-[12px] opacity-80">Remotas e híbridas até 1 dia/semana</span>
    </button>
  );
}

function PertoDeMim() {
  const perto = useFiltrosStore((s) => s.perto);
  const incluirRemotas = useFiltrosStore((s) => s.incluirRemotas);
  const definir = useFiltrosStore((s) => s.definir);
  const cidadePerfil = usePerfilStore((s) => s.cidadeId);
  const [escolhendo, setEscolhendo] = useState(false);
  const nomeRaio = useId();
  const cidade = perto ? cidadePorId.get(perto.cidadeId) : undefined;

  const ativar = (cidadeId: string) => {
    definir({ perto: { cidadeId, raioKm: perto?.raioKm ?? RAIO_PADRAO } });
    setEscolhendo(false);
  };
  const alternar = () => {
    if (perto) return definir({ perto: null });
    if (cidadePerfil) return ativar(cidadePerfil);
    setEscolhendo(true);
  };

  return (
    <div className="space-y-2">
      <button type="button" aria-pressed={!!perto} onClick={alternar} className={alternancia(!!perto)}>
        <span className="block text-sm font-bold">Perto de mim</span>
        <span className="block text-[12px] opacity-80">Vagas a poucos km da sua cidade</span>
      </button>
      {escolhendo && (
        <div className="rounded-lg bg-white/55 p-2">
          <EscolherCidade aoEscolher={ativar} />
        </div>
      )}
      {perto && cidade && !escolhendo && (
        <div className="space-y-2 rounded-lg bg-white/55 p-2 text-[13px]">
          <p>
            A partir de{" "}
            <strong>
              {cidade.nome} – {cidade.uf}
            </strong>{" "}
            <button type="button" onClick={() => setEscolhendo(true)} className="ml-1 underline underline-offset-2">
              Trocar
            </button>
          </p>
          <fieldset>
            <legend className="mb-1 font-semibold">Raio</legend>
            <div className="flex flex-wrap gap-1">
              {RAIOS.map((r) => (
                <label
                  key={r}
                  className="flex items-center gap-1 rounded-md border border-black/15 bg-white/70 px-2 py-0.5 has-checked:border-amber-600 has-checked:bg-amber-200"
                >
                  <input
                    type="radio"
                    name={nomeRaio}
                    checked={perto.raioKm === r}
                    onChange={() => definir({ perto: { ...perto, raioKm: r } })}
                  />
                  {r} km
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={incluirRemotas}
              onChange={(e) => definir({ incluirRemotas: e.target.checked })}
            />
            Incluir remotas
          </label>
        </div>
      )}
    </div>
  );
}

function Grupo<T extends string>({
  legenda,
  grupo,
  ordem,
  rotulos,
}: {
  legenda: string;
  grupo: "categorias" | "modelos" | "turnos" | "contratos";
  ordem: readonly T[];
  rotulos: Record<T, string>;
}) {
  const marcados = useFiltrosStore((s) => s[grupo]) as readonly string[];
  const alternar = useFiltrosStore((s) => s.alternar);
  return (
    <fieldset>
      <legend className="mb-1 text-[13px] font-semibold">{legenda}</legend>
      <div className="flex flex-wrap gap-1">
        {ordem.map((v) => (
          <label
            key={v}
            className="flex items-center gap-1 rounded-md border border-black/15 bg-white/70 px-2 py-0.5 text-[13px] has-checked:border-amber-600 has-checked:bg-amber-200"
          >
            <input type="checkbox" checked={marcados.includes(v)} onChange={() => alternar(grupo, v as never)} />
            {rotulos[v]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CampoValor({
  rotulo,
  valor,
  aoMudar,
}: {
  rotulo: string;
  valor: number | undefined;
  aoMudar: (n: number | undefined) => void;
}) {
  const [texto, setTexto] = useState(valor === undefined ? "" : String(valor));
  const [visto, setVisto] = useState(valor);
  const id = useId();
  if (valor !== visto) {
    setVisto(valor);
    setTexto(valor === undefined ? "" : String(valor));
  }
  const aplicar = () => {
    const r = ValorSchema.safeParse(texto.trim());
    if (!r.success) return setTexto(valor === undefined ? "" : String(valor));
    aoMudar(r.data === "" ? undefined : r.data);
  };
  return (
    <div className="flex-1">
      <label htmlFor={id} className="block text-[12px]">
        {rotulo} (R$)
      </label>
      <input
        id={id}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        value={texto}
        onChange={(e) => setTexto(e.target.value.replace(/\D/g, ""))}
        onBlur={aplicar}
        onKeyDown={(e) => e.key === "Enter" && aplicar()}
        className="w-full rounded-md border border-black/20 bg-white/90 px-2 py-1 text-sm text-stone-900"
      />
    </div>
  );
}

function FaixaSalarial() {
  const salario = useFiltrosStore((s) => s.salario);
  const somenteComSalario = useFiltrosStore((s) => s.somenteComSalario);
  const definir = useFiltrosStore((s) => s.definir);
  const mudar = (lado: "min" | "max", n: number | undefined) => {
    const novo = { ...salario, [lado]: n };
    // Mínimo maior que o máximo: os dois trocam de lugar em vez de esvaziar a lista.
    if (novo.min !== undefined && novo.max !== undefined && novo.min > novo.max)
      [novo.min, novo.max] = [novo.max, novo.min];
    definir({
      salario: Object.fromEntries(Object.entries(novo).filter(([, v]) => v !== undefined)),
    });
  };
  return (
    <fieldset className="space-y-1">
      <legend className="text-[13px] font-semibold">Faixa salarial</legend>
      <div className="flex gap-2">
        <CampoValor rotulo="Mínimo" valor={salario.min} aoMudar={(n) => mudar("min", n)} />
        <CampoValor rotulo="Máximo" valor={salario.max} aoMudar={(n) => mudar("max", n)} />
      </div>
      <label className="flex items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          checked={somenteComSalario}
          onChange={(e) => definir({ somenteComSalario: e.target.checked })}
        />
        Somente com salário informado
      </label>
    </fieldset>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <details className="group rounded-lg border border-black/10 bg-white/40 open:bg-white/55">
      <summary className="cursor-pointer px-3 py-1.5 text-sm font-semibold">{titulo}</summary>
      <div className="space-y-3 px-3 pb-3">{children}</div>
    </details>
  );
}

function BarraFiltros({ filtro }: { filtro: FiltroBusca }) {
  const limpar = useFiltrosStore((s) => s.limpar);
  const definir = useFiltrosStore((s) => s.definir);
  const referencia = useCidadeReferencia();
  const ativos = contarAtivos(filtro);
  const padrao: Ordem = filtro.perto ? "distancia" : "relevancia";
  const ordem = filtro.ordem === "distancia" && !referencia ? "relevancia" : (filtro.ordem ?? padrao);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
      <span className="flex items-center gap-2">
        <span className="font-semibold">Filtros ativos ({ativos})</span>
        {ativos > 0 && (
          <button
            type="button"
            onClick={limpar}
            className="rounded-md border border-black/20 px-2 py-0.5 hover:bg-black/5"
          >
            Limpar
          </button>
        )}
      </span>
      <label className="flex items-center gap-1">
        <span className="opacity-70">Ordenar por</span>
        <select
          value={ordem}
          onChange={(e) => {
            const nova = e.target.value as Ordem;
            definir({ ordem: nova === padrao ? null : nova });
          }}
          className="rounded border border-black/20 bg-white/70 px-1 py-0.5"
        >
          {(Object.keys(ROTULO_ORDEM) as Ordem[])
            .filter((o) => o !== "distancia" || referencia)
            .map((o) => (
              <option key={o} value={o}>
                {ROTULO_ORDEM[o]}
              </option>
            ))}
        </select>
      </label>
    </div>
  );
}

/** Busca, atalhos em destaque, "Mais filtros" e barra de filtros ativos/ordenação. */
export function FiltrosBusca() {
  const filtro = useFiltro();
  return (
    <div className="space-y-2">
      <Busca />
      <Interior />
      <PertoDeMim />
      <Secao titulo="Mais filtros">
        <Grupo legenda="Categoria" grupo="categorias" ordem={ORDEM_CATEGORIAS} rotulos={CATEGORIA_LABEL} />
        <Grupo legenda="Modalidade" grupo="modelos" ordem={ORDEM_MODELOS} rotulos={MODELO_LABEL} />
        <FaixaSalarial />
        <Grupo legenda="Turno" grupo="turnos" ordem={ORDEM_TURNOS} rotulos={TURNO_LABEL} />
        <Grupo legenda="Tipo de contrato" grupo="contratos" ordem={ORDEM_CONTRATOS} rotulos={CONTRATO_LABEL} />
      </Secao>
      <BarraFiltros filtro={filtro} />
    </div>
  );
}
