"use client";

import { useId, useMemo, useState } from "react";
import { z } from "zod";
import { cidades } from "@/data/brasil/cidades";
import { normalizar } from "@/lib/texto";
import { usePerfilStore } from "@/stores/perfil";

const MAX_SUGESTOES = 8;
const BuscaSchema = z.string().max(60);

const INDICE = cidades.map((c) => ({ cidade: c, chave: normalizar(c.nome) }));

/** Campo "Informe sua cidade": busca nas cidades do mock e salva no perfil. */
export function EscolherCidade({ aoEscolher }: { aoEscolher: (cidadeId: string) => void }) {
  const [texto, setTexto] = useState("");
  const definirCidade = usePerfilStore((s) => s.definirCidade);
  const id = useId();

  const sugestoes = useMemo(() => {
    const busca = normalizar(texto);
    if (busca.length < 2) return [];
    return INDICE.filter((i) => i.chave.includes(busca))
      .sort((a, b) => Number(!a.chave.startsWith(busca)) - Number(!b.chave.startsWith(busca)))
      .slice(0, MAX_SUGESTOES)
      .map((i) => i.cidade);
  }, [texto]);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-semibold">
        Sua cidade
      </label>
      <input
        id={id}
        type="search"
        autoComplete="off"
        maxLength={60}
        value={texto}
        onChange={(e) => {
          const r = BuscaSchema.safeParse(e.target.value);
          if (r.success) setTexto(r.data);
        }}
        placeholder="Ex.: Anápolis"
        className="w-full rounded-md border border-black/20 bg-white/90 px-2 py-1.5 text-sm text-stone-900"
      />
      {sugestoes.length > 0 && (
        <ul aria-label="Cidades encontradas" className="space-y-0.5">
          {sugestoes.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  definirCidade(c.id);
                  aoEscolher(c.id);
                }}
                className="w-full rounded px-2 py-1 text-left text-[13px] hover:bg-black/10 focus-visible:bg-amber-200 focus-visible:outline-none"
              >
                {c.nome} – {c.uf}
              </button>
            </li>
          ))}
        </ul>
      )}
      {texto.length >= 2 && sugestoes.length === 0 && (
        <p className="text-[12px] opacity-75">Nenhuma cidade encontrada nesta demonstração.</p>
      )}
    </div>
  );
}
