import { Suspense } from "react";
import { ControlesMapa } from "@/components/brasil/ControlesMapa";
import { MapaBrasil } from "@/components/brasil/MapaBrasil";

// O canvas fica no layout: navegar entre Brasil e Estado não remonta a cena
// (a câmera voa em vez de recarregar).
export default function MapaLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <Suspense fallback={<div className="absolute inset-0 bg-sky-100" />}>
        <MapaBrasil />
      </Suspense>
      <ControlesMapa />
      {children}
    </main>
  );
}
