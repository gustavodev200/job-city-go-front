// Árvores ilustrativas do mapa do Brasil: densidade por bioma, longe das cidades e das
// estradas. Puro e determinístico.
import { cidades } from "@/data/brasil/cidades";
import { estados, type Bioma } from "@/data/brasil/estados";
import { cidadePorId } from "./rotas";
import { distanciaAoSegmento, estradasBrasil } from "./estradas";
import { GRADE, centroDaCelula, ruido, topoDaCelula, ufDaCelula } from "./geo";

export type FormaArvore = "copa" | "pinheiro";
export type Arvore = { x: number; y: number; z: number; escala: number; forma: FormaArvore; bioma: Bioma };

/** Tentativas por célula de terra, por bioma (cada uma vira árvore se passar no sorteio). */
const DENSIDADE: Record<Bioma, number> = {
  amazonia: 1.6,
  "mata-atlantica": 1.1,
  pantanal: 0.5,
  cerrado: 0.45,
  caatinga: 0.2,
  pampa: 0.15,
};
const ALTURA: Record<Bioma, number> = {
  amazonia: 1.2,
  "mata-atlantica": 1,
  pantanal: 0.8,
  cerrado: 0.75,
  caatinga: 0.6,
  pampa: 0.7,
};
/** Mata Atlântica do sul tem araucárias (pinheiros); o resto, copas redondas. */
const PINHEIROS: Record<Bioma, number> = {
  amazonia: 0,
  "mata-atlantica": 0.3,
  pantanal: 0,
  cerrado: 0.1,
  caatinga: 0,
  pampa: 0.4,
};
const LONGE_CIDADE = 1.4;
const LONGE_ESTRADA = 0.3;
const MAX_ARVORES = 9000;

/** Hash inteiro → 0..1. */
function sorteio(a: number, b: number, c: number) {
  let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function gerarArvores(): Arvore[] {
  const segmentos = estradasBrasil.map((e) => {
    const a = cidadePorId.get(e.a)!;
    const b = cidadePorId.get(e.b)!;
    return [a.x, a.z, b.x, b.z] as const;
  });
  const saida: Arvore[] = [];
  for (let lin = 0; lin < GRADE.altura; lin++) {
    for (let col = 0; col < GRADE.largura; col++) {
      const uf = ufDaCelula(col, lin);
      if (!uf) continue;
      const bioma = estados[uf].bioma;
      // Manchas de mata: o ruído engrossa ou rareia a densidade do bioma.
      const tentativas = DENSIDADE[bioma] * (0.4 + ruido(col, lin, 6) * 1.2);
      const { x: cx, z: cz } = centroDaCelula(col, lin);
      const y = topoDaCelula(col, lin);
      for (let k = 0; k < Math.ceil(tentativas); k++) {
        if (sorteio(col, lin, k * 4) > tentativas - k) continue;
        const x = cx + sorteio(col, lin, k * 4 + 1) - 0.5;
        const z = cz + sorteio(col, lin, k * 4 + 2) - 0.5;
        if (cidades.some((c) => Math.abs(c.x - x) < LONGE_CIDADE && Math.abs(c.z - z) < LONGE_CIDADE)) continue;
        if (segmentos.some(([ax, az, bx, bz]) => distanciaAoSegmento(x, z, ax, az, bx, bz) < LONGE_ESTRADA)) continue;
        const r = sorteio(col, lin, k * 4 + 3);
        saida.push({
          x,
          y,
          z,
          escala: ALTURA[bioma] * (0.7 + r * 0.6),
          forma: r < PINHEIROS[bioma] ? "pinheiro" : "copa",
          bioma,
        });
      }
    }
  }
  return saida.slice(0, MAX_ARVORES);
}
