import type { Uf } from "./estados";

export type Porte = "capital" | "grande" | "media" | "pequena";

export type Cidade = {
  /** Slug estável `nome-uf`, ex.: "goiania-go". */
  id: string;
  ibge: number;
  nome: string;
  uf: Uf;
  /** Graus — distâncias reais (specs 002/004). */
  lat: number;
  lon: number;
  /** Posição projetada na cena do mapa do Brasil. */
  x: number;
  z: number;
  capital: boolean;
  porte: Porte;
};
