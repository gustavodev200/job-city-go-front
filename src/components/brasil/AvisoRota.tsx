"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AvisoSchema, type Aviso } from "@/lib/brasil/rotas";

const MENSAGENS: Record<NonNullable<Aviso>, string> = {
  estado: "Não encontramos esse estado. Escolha no mapa.",
  cidade: "Não encontramos essa cidade. Escolha no mapa.",
};
const DURACAO_MS = 5000;

/** Aviso curto vindo de `?aviso=` (link inválido); limpa a URL em seguida. */
export function AvisoRota() {
  const params = useSearchParams();
  const router = useRouter();
  const aviso = AvisoSchema.parse(params.get("aviso") ?? undefined);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    if (!aviso) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- guarda a mensagem antes de limpar a URL
    setMensagem(MENSAGENS[aviso]);
    router.replace("/");
    const id = window.setTimeout(() => setMensagem(null), DURACAO_MS);
    return () => window.clearTimeout(id);
  }, [aviso, router]);

  if (!mensagem) return null;
  return (
    <div role="status" className="pointer-events-none absolute inset-x-0 top-20 z-30 flex justify-center px-3">
      <p className="cartao-mapa rounded-lg px-4 py-2 text-sm font-semibold shadow-lg">{mensagem}</p>
    </div>
  );
}
