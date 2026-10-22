"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Trilha } from "@/components/brasil/Trilha";
import { ChipFiltros } from "@/components/busca/ChipFiltros";
import { PainelVagas } from "@/components/busca/PainelVagas";
import { SincronizarFiltros } from "@/components/busca/usarBusca";
import { ChegadaSchema, DeSchema, cidadePorId, hrefCidade, vagaSchema } from "@/lib/brasil/rotas";
import { facadeDaVaga, mundoDaCidade, mundoRemoto, type Saida } from "@/lib/cidade/mundo";
import { useReidratar } from "@/stores/armazenamento";
import { useGameStore } from "@/stores/game";
import { usePerfilStore } from "@/stores/perfil";
import { Hud } from "./Hud";
import { MundoProvider } from "./mundo";
import { OutdoorOverlay } from "./OutdoorOverlay";
import type { Inicio } from "./Player";

const CityScene = dynamic(() => import("./CityScene"), { ssr: false });
// Reads the device clock: client only, so the server HTML never shows a different hour.
const ControleHora = dynamic(() => import("./ControleHora"), { ssr: false });

/** Câmera atrás do personagem: 0 = olhando para o norte; π/2 = para o oeste. */
const OLHANDO_NORTE = 0;
const OLHANDO_OESTE = Math.PI / 2;
const OLHANDO_LESTE = -Math.PI / 2;
const OLHANDO_SUL = Math.PI;
/** Quem chega pela estrada olha para a cidade. */
const OLHAR_DA_ESTRADA = { norte: OLHANDO_SUL, sul: OLHANDO_NORTE, oeste: OLHANDO_LESTE } as const;

/**
 * Nível Cidade (qualquer cidade do mock) ou Bairro Remoto. Lê `?chegada`, `?de` e `?vaga`
 * (contracts/rotas-e-parametros.md) — precisa estar dentro de <Suspense>.
 */
export function NivelCidade({ mundoId }: { mundoId: string }) {
  useReidratar(usePerfilStore);
  const router = useRouter();
  const params = useSearchParams();
  const mundo = mundoId === "remoto" ? mundoRemoto() : mundoDaCidade(mundoId);
  if (!mundo) throw new Error(`Cidade sem mundo: ${mundoId}`);

  const chegada = ChegadaSchema.parse(params.get("chegada") ?? undefined);
  const de = mundo.tipo === "remoto" ? DeSchema.parse(params.get("de") ?? undefined) : undefined;
  // Veio de carro/a pé pela estrada: nasce no fim da estrada que liga as duas cidades.
  const origem = mundo.tipo === "cidade" && chegada === "estrada" ? DeSchema.parse(params.get("de") ?? undefined) : undefined;
  const vagaId = vagaSchema(new Set(mundo.spots.map((s) => s.id))).parse(params.get("vaga") ?? undefined);

  const inicio = useMemo((): Inicio => {
    const lote = vagaId ? mundo.lotes.find((l) => l.vaga.id === vagaId) : undefined;
    if (lote) {
      // Na calçada em frente ao prédio (a fachada olha para +z).
      const fundo = facadeDaVaga(lote.vaga).footprint[1];
      return { x: lote.x, z: lote.z + fundo / 2 + 3.5, yaw: OLHANDO_NORTE };
    }
    if (mundo.tipo === "cidade" && chegada === "ponte") return { ...mundo.nascimento.ponte, yaw: OLHANDO_OESTE };
    const estrada = origem ? mundo.saidas.find((s) => s.destinoId === origem) : undefined;
    if (estrada) return { ...estrada.chegada, yaw: OLHAR_DA_ESTRADA[estrada.lado] };
    if (mundo.tipo === "remoto" && de) return { ...mundo.nascimento.ponte, yaw: OLHANDO_LESTE };
    return { ...mundo.nascimento.praca, yaw: OLHANDO_NORTE };
  }, [mundo, vagaId, chegada, de, origem]);

  // Seleção e vaga próxima são do mundo anterior; `?vaga=` abre o pergaminho.
  useEffect(() => {
    const store = useGameStore.getState();
    store.fimViagem();
    store.setNearbyVaga(vagaId ?? null);
    store.selectVaga(vagaId ?? null);
  }, [mundo, vagaId]);

  // Na cidade o Bairro Remoto fica do outro lado da ponte; o portal só existe no /remoto avulso.
  const destino = de ? hrefCidade(de, { chegada: "ponte" }) : "/";
  const rotuloPortal = de ? `Voltar para ${cidadePorId.get(de)!.nome}` : "Voltar ao mapa";
  const atravessar = () => router.push(destino);
  const portal = mundo.portal ? { rotulo: rotuloPortal, aoUsar: atravessar } : undefined;
  const sair = (saida: Saida) => router.push(hrefCidade(saida.destinoId, { chegada: "estrada", de: mundo.id }));

  return (
    <MundoProvider value={mundo}>
      <main className="flex h-dvh w-full overflow-hidden">
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <CityScene
            key={`${mundo.id}:${inicio.x},${inicio.z}`}
            inicio={inicio}
            rotuloPortal={rotuloPortal}
            aoAtravessar={atravessar}
            aoSair={sair}
          />
          <Hud portal={portal} />
          <OutdoorOverlay />
          <ControleHora />
          <SincronizarFiltros />
          <ChipFiltros />
          <div className="bloco-notas absolute top-3 left-3 z-30 rounded-lg px-3 py-1.5 md:top-4 md:left-4">
            <Trilha {...(mundo.tipo === "cidade" ? { cidadeId: mundo.id } : { remoto: true })} />
          </div>
        </div>
        <PainelVagas />
      </main>
    </MundoProvider>
  );
}
