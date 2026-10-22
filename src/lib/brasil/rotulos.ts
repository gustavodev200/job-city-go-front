// Agrupamento de rótulos de cidade em espaço de tela (research R4): nenhum rótulo
// se sobrepõe; quem colide entra no grupo de quem já tem lugar ("+K cidades").

export type PontoRotulo = {
  id: string;
  /** Centro do rótulo em pixels. */
  sx: number;
  sy: number;
  largura: number;
  altura: number;
  /** Maior lidera (cidade em foco e do perfil recebem a maior). */
  prioridade: number;
};

/** `membros` inclui o líder (primeiro). */
export type GrupoRotulo = { lider: string; membros: string[] };

export const ALTURA_ROTULO = 22;

/** Largura estimada do rótulo, sem medir o DOM a cada quadro. */
export const larguraEstimada = (texto: string) => 7 * texto.length + 16;

function cruzam(a: PontoRotulo, b: PontoRotulo, margem: number) {
  return (
    Math.abs(a.sx - b.sx) * 2 < a.largura + b.largura + 2 * margem &&
    Math.abs(a.sy - b.sy) * 2 < a.altura + b.altura + 2 * margem
  );
}

export function agruparRotulos(pontos: readonly PontoRotulo[], margem = 4): GrupoRotulo[] {
  const ordenados = [...pontos].sort((a, b) => b.prioridade - a.prioridade || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const lideres: PontoRotulo[] = [];
  const grupos: GrupoRotulo[] = [];
  for (const p of ordenados) {
    const i = lideres.findIndex((l) => cruzam(l, p, margem));
    if (i === -1) {
      lideres.push(p);
      grupos.push({ lider: p.id, membros: [p.id] });
    } else {
      grupos[i].membros.push(p.id);
    }
  }
  return grupos;
}
