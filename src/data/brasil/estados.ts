// As 27 unidades da federação, em ordem alfabética de sigla (a ordem importa:
// é o índice usado na grade de geo.json — ver contracts/geo-brasil.md).
export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

export type Uf = (typeof UFS)[number];

export type Regiao = "Norte" | "Nordeste" | "Centro-Oeste" | "Sudeste" | "Sul";

/** Bioma predominante: define a cor do relevo do estado no mapa. */
export type Bioma = "amazonia" | "cerrado" | "caatinga" | "mata-atlantica" | "pampa" | "pantanal";

type Estado = { nome: string; regiao: Regiao; bioma: Bioma };

export const estados: Record<Uf, Estado> = {
  AC: { nome: "Acre", regiao: "Norte", bioma: "amazonia" },
  AL: { nome: "Alagoas", regiao: "Nordeste", bioma: "caatinga" },
  AM: { nome: "Amazonas", regiao: "Norte", bioma: "amazonia" },
  AP: { nome: "Amapá", regiao: "Norte", bioma: "amazonia" },
  BA: { nome: "Bahia", regiao: "Nordeste", bioma: "caatinga" },
  CE: { nome: "Ceará", regiao: "Nordeste", bioma: "caatinga" },
  DF: { nome: "Distrito Federal", regiao: "Centro-Oeste", bioma: "cerrado" },
  ES: { nome: "Espírito Santo", regiao: "Sudeste", bioma: "mata-atlantica" },
  GO: { nome: "Goiás", regiao: "Centro-Oeste", bioma: "cerrado" },
  MA: { nome: "Maranhão", regiao: "Nordeste", bioma: "cerrado" },
  MG: { nome: "Minas Gerais", regiao: "Sudeste", bioma: "cerrado" },
  // O Pantanal ocupa só parte do MS; escolhido para dar variedade visual ao Centro-Oeste.
  MS: { nome: "Mato Grosso do Sul", regiao: "Centro-Oeste", bioma: "pantanal" },
  MT: { nome: "Mato Grosso", regiao: "Centro-Oeste", bioma: "amazonia" },
  PA: { nome: "Pará", regiao: "Norte", bioma: "amazonia" },
  PB: { nome: "Paraíba", regiao: "Nordeste", bioma: "caatinga" },
  PE: { nome: "Pernambuco", regiao: "Nordeste", bioma: "caatinga" },
  PI: { nome: "Piauí", regiao: "Nordeste", bioma: "cerrado" },
  PR: { nome: "Paraná", regiao: "Sul", bioma: "mata-atlantica" },
  RJ: { nome: "Rio de Janeiro", regiao: "Sudeste", bioma: "mata-atlantica" },
  RN: { nome: "Rio Grande do Norte", regiao: "Nordeste", bioma: "caatinga" },
  RO: { nome: "Rondônia", regiao: "Norte", bioma: "amazonia" },
  RR: { nome: "Roraima", regiao: "Norte", bioma: "amazonia" },
  RS: { nome: "Rio Grande do Sul", regiao: "Sul", bioma: "pampa" },
  SC: { nome: "Santa Catarina", regiao: "Sul", bioma: "mata-atlantica" },
  SE: { nome: "Sergipe", regiao: "Nordeste", bioma: "caatinga" },
  SP: { nome: "São Paulo", regiao: "Sudeste", bioma: "mata-atlantica" },
  TO: { nome: "Tocantins", regiao: "Norte", bioma: "cerrado" },
};

/** UFs em ordem alfabética do nome (lista acessível e navegação por teclado). */
export const UFS_POR_NOME = [...UFS].sort((a, b) => estados[a].nome.localeCompare(estados[b].nome, "pt-BR"));
