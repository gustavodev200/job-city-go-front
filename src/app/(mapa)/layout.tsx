import { Suspense } from "react";
import { ControlesMapa } from "@/components/brasil/ControlesMapa";
import { MapaBrasil } from "@/components/brasil/MapaBrasil";
import { ChipFiltros } from "@/components/busca/ChipFiltros";
import { PainelVagas } from "@/components/busca/PainelVagas";
import { SincronizarFiltros } from "@/components/busca/usarBusca";

// O canvas fica no layout: navegar entre Brasil e Estado não remonta a cena
// (a câmera voa em vez de recarregar). O painel "Vagas" fica ao lado do mapa, não por cima (spec 004).
export default function MapaLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-dvh w-full overflow-hidden">
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <Suspense fallback={<div className="absolute inset-0 bg-sky-100" />}>
          <MapaBrasil />
        </Suspense>
        <ControlesMapa />
        <ChipFiltros />
        {/* Filtros na URL (spec 004): lê useSearchParams, então fica em <Suspense>. */}
        <Suspense fallback={null}>
          <SincronizarFiltros />
        </Suspense>
        {children}
      </div>
      <PainelVagas />
    </main>
  );
}
