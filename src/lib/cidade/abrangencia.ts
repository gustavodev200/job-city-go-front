// Abrangência de vagas remotas x cidade do perfil (FR-007, FR-009).
import { estados, type Uf } from "@/data/brasil/estados";
import type { Abrangencia } from "@/data/vagas";

/** "Brasil inteiro" · "Remoto para GO" · "Remoto para DF e GO" · "Fuso de Brasília". */
export function rotuloAbrangencia(a: Abrangencia): string {
  if (a.tipo === "brasil") return "Brasil inteiro";
  if (a.tipo === "fuso") return "Fuso de Brasília";
  return `Remoto para ${listar(a.ufs, "e")}`;
}

export function atendeAbrangencia(perfilUf: Uf, a: Abrangencia): boolean {
  if (a.tipo === "brasil") return true;
  if (a.tipo === "fuso") return estados[perfilUf].fuso === -3;
  return a.ufs.includes(perfilUf);
}

/** Aviso quando a cidade do perfil não atende; sem perfil, nada a avisar. */
export function avisoAbrangencia(perfilUf: Uf | null, a: Abrangencia): string | null {
  if (!perfilUf || atendeAbrangencia(perfilUf, a)) return null;
  if (a.tipo === "fuso") return "Esta vaga pede o fuso de Brasília";
  return `Esta vaga pede residência em ${listar(a.tipo === "ufs" ? a.ufs : [], "ou")}`;
}

function listar(ufs: readonly Uf[], conjuncao: "e" | "ou") {
  return ufs.length <= 1 ? (ufs[0] ?? "") : `${ufs.slice(0, -1).join(", ")} ${conjuncao} ${ufs.at(-1)}`;
}
