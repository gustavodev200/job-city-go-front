import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { NivelCidade } from "@/components/city/NivelCidade";
import { cidades } from "@/data/brasil/cidades";
import { CidadeParamSchema, cidadePorId } from "@/lib/brasil/rotas";

// Nível Cidade: a cena 3D é gerada a partir das vagas de qualquer cidade do mock.

export function generateStaticParams() {
  return cidades.map((c) => ({ slug: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/cidade/[slug]">): Promise<Metadata> {
  const r = CidadeParamSchema.safeParse((await params).slug);
  return { title: r.success ? `Vagas em ${cidadePorId.get(r.data)!.nome} · Job City Go` : "Job City Go" };
}

export default function PaginaCidade({ params }: PageProps<"/cidade/[slug]">) {
  return (
    <Suspense fallback={<div className="h-dvh bg-sky-100" />}>
      <ConteudoCidade params={params} />
    </Suspense>
  );
}

async function ConteudoCidade({ params }: { params: PageProps<"/cidade/[slug]">["params"] }) {
  // Parâmetro da URL é entrada externa: cidade inexistente volta ao Brasil com aviso.
  const r = CidadeParamSchema.safeParse((await params).slug);
  if (!r.success) redirect("/?aviso=cidade");
  return <NivelCidade mundoId={r.data} />;
}
