import Link from "next/link";
import { estados, VIZINHOS, type Uf } from "@/data/brasil/estados";
import { useAgregados } from "@/components/busca/usarBusca";
import { hrefEstado } from "@/lib/brasil/rotas";

/** Atalho para estados que fazem fronteira, sem voltar ao Brasil (FR-010). */
export function EstadosVizinhos({ uf }: { uf: Uf }) {
  const { porUf } = useAgregados();
  return (
    <nav aria-label="Estados vizinhos">
      <h3 aria-hidden className="text-[11px] font-semibold tracking-wide uppercase opacity-70">
        Estados vizinhos
      </h3>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {VIZINHOS[uf].map((v) => (
          <li key={v}>
            <Link
              href={hrefEstado(v)}
              className="block rounded-full border border-black/20 bg-white/60 px-2 py-0.5 text-[12px] hover:bg-amber-100"
            >
              {estados[v].nome} <span className="tabular-nums opacity-70">· {porUf[v].abertas}</span>
              <span className="sr-only"> vagas abertas</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
