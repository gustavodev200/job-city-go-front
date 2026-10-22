import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PainelEstado } from "@/components/brasil/PainelEstado";
import { estados, UFS } from "@/data/brasil/estados";
import { UfParamSchema } from "@/lib/brasil/rotas";

export function generateStaticParams() {
  return UFS.map((uf) => ({ uf: uf.toLowerCase() }));
}

export async function generateMetadata({ params }: PageProps<"/estado/[uf]">): Promise<Metadata> {
  const r = UfParamSchema.safeParse((await params).uf);
  return { title: r.success ? `Vagas em ${estados[r.data].nome} · Job City Go` : "Job City Go" };
}

export default async function NivelEstado({ params }: PageProps<"/estado/[uf]">) {
  // Parâmetro da URL é entrada externa: UF inválida volta ao Brasil com aviso.
  const r = UfParamSchema.safeParse((await params).uf);
  if (!r.success) redirect("/?aviso=estado");
  return (
    <>
      <h1 className="sr-only">Vagas em {estados[r.data].nome}</h1>
      <PainelEstado uf={r.data} />
    </>
  );
}
