import type { Metadata } from "next";
import { Suspense } from "react";
import { NivelCidade } from "@/components/city/NivelCidade";

export const metadata: Metadata = { title: "Bairro Remoto · Job City Go" };

/** Bairro Remoto nacional: todas as vagas remotas do país (`?de=` diz para onde voltar). */
export default function BairroRemoto() {
  return (
    <Suspense fallback={<div className="h-dvh bg-sky-100" />}>
      <NivelCidade mundoId="remoto" />
    </Suspense>
  );
}
