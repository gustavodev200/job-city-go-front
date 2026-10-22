"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { vagasBrasil, type VagaNacional } from "@/data/brasil/vagas";
import { calcularAgregados, faixaCalorDe, type Agregados } from "@/lib/brasil/agregados";
import { cidadePorId, UfParamSchema } from "@/lib/brasil/rotas";
import { filtrarVagas, type FiltroBusca } from "@/lib/busca/filtro";
import type { Recorte } from "@/lib/busca/recorte";
import { filtroDeParams, mesclarQuery } from "@/lib/busca/url";
import { filtroDoEstado, useFiltrosStore } from "@/stores/filtros";
import { usePerfilStore } from "@/stores/perfil";

/** Filtro atual (mesma referência enquanto nada muda). */
export function useFiltro(): FiltroBusca {
  return useFiltrosStore(useShallow(filtroDoEstado));
}

// Vários componentes leem a mesma lista: guarda só o último filtro calculado.
let cache: {
  filtro: FiltroBusca;
  vagas: VagaNacional[];
  agregados?: Agregados;
} | null = null;

function resultado(filtro: FiltroBusca) {
  if (cache?.filtro !== filtro) cache = { filtro, vagas: filtrarVagas(vagasBrasil, filtro) };
  return cache;
}

/** Vagas do país que passam no filtro (sem recorte). */
export function useVagasFiltradas(): VagaNacional[] {
  const filtro = useFiltro();
  return useMemo(() => resultado(filtro).vagas, [filtro]);
}

export type AgregadosFiltrados = Agregados & {
  faixa: (uf: keyof Agregados["porUf"]) => ReturnType<typeof faixaCalorDe>;
};

/** Contagens do mapa sobre as vagas filtradas (research R2). Sem filtro = números de sempre. */
export function useAgregados(): AgregadosFiltrados {
  const filtro = useFiltro();
  return useMemo(() => {
    const r = resultado(filtro);
    r.agregados ??= calcularAgregados(r.vagas);
    const ag = r.agregados;
    return { ...ag, faixa: (uf) => faixaCalorDe(ag, uf) };
  }, [filtro]);
}

/** Ids das vagas que passam no filtro (prédios da cidade esmaecem fora dele — research R11). */
export function useIdsNoFiltro(): ReadonlySet<string> {
  const vagas = useVagasFiltradas();
  return useMemo(() => new Set(vagas.map((v) => v.id)), [vagas]);
}

/** Recorte da lista pela rota (research R7). */
export function useRecorte(): Recorte {
  const pathname = usePathname() ?? "/";
  return useMemo((): Recorte => {
    if (/^\/remoto\/?$/.test(pathname)) return { tipo: "remoto" };
    const cidade = /^\/cidade\/([^/]+)\/?$/.exec(pathname);
    if (cidade && cidadePorId.has(cidade[1])) return { tipo: "cidade", cidadeId: cidade[1] };
    const estado = /^\/estado\/([^/]+)\/?$/.exec(pathname);
    const uf = estado ? UfParamSchema.safeParse(estado[1]) : null;
    if (uf?.success) return { tipo: "uf", uf: uf.data };
    return { tipo: "brasil" };
  }, [pathname]);
}

/** Cidade a partir da qual medir distância: a do "Perto de mim" ou a do perfil. */
export function useCidadeReferencia() {
  const perto = useFiltrosStore((s) => s.perto?.cidadeId ?? null);
  const perfil = usePerfilStore((s) => s.cidadeId);
  const id = perto ?? perfil;
  return id ? cidadePorId.get(id) : undefined;
}

/**
 * URL ↔ filtro (research R1): na 1ª montagem da sessão a URL vira filtro; depois
 * o filtro é escrito na URL de cada página (sem nova entrada de histórico).
 * Usa `useSearchParams`: precisa estar dentro de <Suspense>.
 */
export function useSincronizarFiltrosUrl() {
  const params = useSearchParams();
  const pathname = usePathname();
  const filtro = useFiltro();
  const iniciado = useFiltrosStore((s) => s.iniciado);

  useEffect(() => {
    const store = useFiltrosStore.getState();
    if (!store.iniciado) store.iniciarDaUrl(filtroDeParams(params));
  }, [params]);

  useEffect(() => {
    if (!iniciado) return;
    const query = mesclarQuery(window.location.search, filtro);
    if (query === window.location.search) return;
    // Integra com o router do Next: atualiza useSearchParams sem ida ao servidor.
    window.history.replaceState(null, "", `${window.location.pathname}${query}${window.location.hash}`);
  }, [iniciado, filtro, pathname, params]);
}

/** Componente que só sincroniza (para montar dentro de <Suspense>). */
export function SincronizarFiltros() {
  useSincronizarFiltrosUrl();
  return null;
}
