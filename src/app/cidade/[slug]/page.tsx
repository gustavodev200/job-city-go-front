import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CartaoCidade } from "@/components/brasil/CartaoCidade";
import { Trilha } from "@/components/brasil/Trilha";
import { cidades } from "@/data/brasil/cidades";
import { CidadeParamSchema, cidadePorId, hrefEstado } from "@/lib/brasil/rotas";

// Nível Cidade provisório (spec 002): a spec 003 coloca aqui a cena 3D gerada para
// qualquer cidade. `/cidade/goiania-go` é rota estática e continua com a cena atual.

export function generateStaticParams() {
  return cidades.map((c) => ({ slug: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/cidade/[slug]">): Promise<Metadata> {
  const r = CidadeParamSchema.safeParse((await params).slug);
  return { title: r.success ? `Vagas em ${cidadePorId.get(r.data)!.nome} · Job City Go` : "Job City Go" };
}

export default function NivelCidade({ params }: PageProps<"/cidade/[slug]">) {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-sky-200 to-amber-50 px-4 py-4 md:py-8">
      <Suspense fallback={null}>
        <ConteudoCidade params={params} />
      </Suspense>
    </main>
  );
}

async function ConteudoCidade({ params }: { params: PageProps<"/cidade/[slug]">["params"] }) {
  // Parâmetro da URL é entrada externa: cidade inexistente volta ao Brasil com aviso.
  const r = CidadeParamSchema.safeParse((await params).slug);
  if (!r.success) redirect("/?aviso=cidade");
  const cidade = cidadePorId.get(r.data)!;
  return (
    <div className="bloco-notas mx-auto max-w-md space-y-4 rounded-lg p-4">
      <Trilha cidadeId={cidade.id} />
      <h1 className="sr-only">Vagas em {cidade.nome}</h1>
      <CartaoCidade cidadeId={cidade.id} entrar={false} />
      <p className="text-sm">
        A cidade 3D de {cidade.nome} chega em breve.{" "}
        <Link href={hrefEstado(cidade.uf, cidade.id)} className="font-semibold underline underline-offset-2">
          Voltar ao mapa do estado
        </Link>
      </p>
    </div>
  );
}
