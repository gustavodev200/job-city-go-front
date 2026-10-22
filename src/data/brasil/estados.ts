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

/** Cor da vegetação de cada bioma: relevo do mapa e chão da cidade. */
export const CORES_BIOMA: Record<Bioma, string> = {
  amazonia: "#3d8a47",
  "mata-atlantica": "#62a85a",
  pantanal: "#6fae95",
  cerrado: "#b7a457",
  caatinga: "#cfa66c",
  pampa: "#a3c46d",
};

/** Fuso horário em relação a UTC (horas). −3 = horário de Brasília. */
export type Fuso = -5 | -4 | -3;

type Estado = { nome: string; regiao: Regiao; bioma: Bioma; fuso: Fuso };

export const estados: Record<Uf, Estado> = {
  AC: { nome: "Acre", regiao: "Norte", bioma: "amazonia", fuso: -5 },
  AL: { nome: "Alagoas", regiao: "Nordeste", bioma: "caatinga", fuso: -3 },
  AM: { nome: "Amazonas", regiao: "Norte", bioma: "amazonia", fuso: -4 },
  AP: { nome: "Amapá", regiao: "Norte", bioma: "amazonia", fuso: -3 },
  BA: { nome: "Bahia", regiao: "Nordeste", bioma: "caatinga", fuso: -3 },
  CE: { nome: "Ceará", regiao: "Nordeste", bioma: "caatinga", fuso: -3 },
  DF: { nome: "Distrito Federal", regiao: "Centro-Oeste", bioma: "cerrado", fuso: -3 },
  ES: { nome: "Espírito Santo", regiao: "Sudeste", bioma: "mata-atlantica", fuso: -3 },
  GO: { nome: "Goiás", regiao: "Centro-Oeste", bioma: "cerrado", fuso: -3 },
  MA: { nome: "Maranhão", regiao: "Nordeste", bioma: "cerrado", fuso: -3 },
  MG: { nome: "Minas Gerais", regiao: "Sudeste", bioma: "cerrado", fuso: -3 },
  // O Pantanal ocupa só parte do MS; escolhido para dar variedade visual ao Centro-Oeste.
  MS: { nome: "Mato Grosso do Sul", regiao: "Centro-Oeste", bioma: "pantanal", fuso: -4 },
  MT: { nome: "Mato Grosso", regiao: "Centro-Oeste", bioma: "amazonia", fuso: -4 },
  PA: { nome: "Pará", regiao: "Norte", bioma: "amazonia", fuso: -3 },
  PB: { nome: "Paraíba", regiao: "Nordeste", bioma: "caatinga", fuso: -3 },
  PE: { nome: "Pernambuco", regiao: "Nordeste", bioma: "caatinga", fuso: -3 },
  PI: { nome: "Piauí", regiao: "Nordeste", bioma: "cerrado", fuso: -3 },
  PR: { nome: "Paraná", regiao: "Sul", bioma: "mata-atlantica", fuso: -3 },
  RJ: { nome: "Rio de Janeiro", regiao: "Sudeste", bioma: "mata-atlantica", fuso: -3 },
  RN: { nome: "Rio Grande do Norte", regiao: "Nordeste", bioma: "caatinga", fuso: -3 },
  RO: { nome: "Rondônia", regiao: "Norte", bioma: "amazonia", fuso: -4 },
  RR: { nome: "Roraima", regiao: "Norte", bioma: "amazonia", fuso: -4 },
  RS: { nome: "Rio Grande do Sul", regiao: "Sul", bioma: "pampa", fuso: -3 },
  SC: { nome: "Santa Catarina", regiao: "Sul", bioma: "mata-atlantica", fuso: -3 },
  SE: { nome: "Sergipe", regiao: "Nordeste", bioma: "caatinga", fuso: -3 },
  SP: { nome: "São Paulo", regiao: "Sudeste", bioma: "mata-atlantica", fuso: -3 },
  TO: { nome: "Tocantins", regiao: "Norte", bioma: "cerrado", fuso: -3 },
};

/** Fronteiras terrestres (estados vizinhos), em ordem alfabética. */
export const VIZINHOS: Record<Uf, readonly Uf[]> = {
  AC: ["AM", "RO"],
  AL: ["BA", "PE", "SE"],
  AM: ["AC", "MT", "PA", "RO", "RR"],
  AP: ["PA"],
  BA: ["AL", "ES", "GO", "MG", "PE", "PI", "SE", "TO"],
  CE: ["PB", "PE", "PI", "RN"],
  DF: ["GO", "MG"],
  ES: ["BA", "MG", "RJ"],
  GO: ["BA", "DF", "MG", "MS", "MT", "TO"],
  MA: ["PA", "PI", "TO"],
  MG: ["BA", "DF", "ES", "GO", "MS", "RJ", "SP"],
  MS: ["GO", "MG", "MT", "PR", "SP"],
  MT: ["AM", "GO", "MS", "PA", "RO", "TO"],
  PA: ["AM", "AP", "MA", "MT", "RR", "TO"],
  PB: ["CE", "PE", "RN"],
  PE: ["AL", "BA", "CE", "PB", "PI"],
  PI: ["BA", "CE", "MA", "PE", "TO"],
  PR: ["MS", "SC", "SP"],
  RJ: ["ES", "MG", "SP"],
  RN: ["CE", "PB"],
  RO: ["AC", "AM", "MT"],
  RR: ["AM", "PA"],
  RS: ["SC"],
  SC: ["PR", "RS"],
  SE: ["AL", "BA"],
  SP: ["MG", "MS", "PR", "RJ"],
  TO: ["BA", "GO", "MA", "MT", "PA", "PI"],
};

/** UFs em ordem alfabética do nome (lista acessível e navegação por teclado). */
export const UFS_POR_NOME = [...UFS].sort((a, b) => estados[a].nome.localeCompare(estados[b].nome, "pt-BR"));
