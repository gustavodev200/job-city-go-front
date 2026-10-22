import Link from "next/link";
import type { Uf } from "@/data/brasil/estados";
import { itensDaTrilha } from "@/lib/brasil/rotas";

/** Trilha Brasil › Estado › Cidade, em todos os níveis (FR-009). */
export function Trilha({
  uf,
  cidadeId,
  remoto,
  className = "",
}: {
  uf?: Uf;
  cidadeId?: string;
  remoto?: boolean;
  className?: string;
}) {
  const itens = itensDaTrilha({ uf, cidadeId, remoto });
  return (
    <nav aria-label="Trilha" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px]">
        {itens.map((item, i) => (
          <li key={item.rotulo} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>›</span>}
            {item.href ? (
              <Link href={item.href} className="font-semibold underline underline-offset-2">
                {item.rotulo}
              </Link>
            ) : (
              <span aria-current="page" className="font-semibold">
                {item.rotulo}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
