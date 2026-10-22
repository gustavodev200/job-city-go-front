// Parte do país que a lista mostra em cada nível do mapa (research R7).
import { estados, type Uf } from "@/data/brasil/estados";
import type { VagaNacional } from "@/data/brasil/vagas";
import { cidadePorId } from "@/lib/brasil/rotas";

export type Recorte =
  { tipo: "brasil" } | { tipo: "uf"; uf: Uf } | { tipo: "cidade"; cidadeId: string } | { tipo: "remoto" };

/** Estado: só cidades da UF (remotas ficam no Bairro Remoto, como nas contagens). */
export function noRecorte(v: VagaNacional, r: Recorte): boolean {
  if (r.tipo === "brasil") return true;
  if (r.tipo === "remoto") return v.modelo === "remoto";
  if (v.modelo === "remoto") return false;
  return r.tipo === "uf" ? v.uf === r.uf : v.cidadeId === r.cidadeId;
}

const NA = new Set<Uf>(["BA", "PB"]);
const NO = new Set<Uf>([
  "AC",
  "AM",
  "AP",
  "CE",
  "DF",
  "ES",
  "MA",
  "MS",
  "MT",
  "PA",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RS",
  "TO",
]);

/** "no Brasil" · "em Goiás" · "na Bahia" · "em Goiânia" · "no Bairro Remoto". */
export function rotuloRecorte(r: Recorte): string {
  if (r.tipo === "brasil") return "no Brasil";
  if (r.tipo === "remoto") return "no Bairro Remoto";
  if (r.tipo === "uf") return `${NA.has(r.uf) ? "na" : NO.has(r.uf) ? "no" : "em"} ${estados[r.uf].nome}`;
  return `em ${cidadePorId.get(r.cidadeId)?.nome ?? ""}`;
}
