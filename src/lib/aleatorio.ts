/** Gerador pseudoaleatório semeado (mulberry32): mesma semente, mesma sequência. */
export function criarAleatorio(semente: number) {
  let a = semente >>> 0;
  const proximo = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    /** 0 (inclusive) a 1 (exclusive). */
    proximo,
    /** Inteiro de `min` a `max`, ambos inclusive. */
    inteiro: (min: number, max: number) => min + Math.floor(proximo() * (max - min + 1)),
    escolher: <T>(lista: readonly T[]): T => lista[Math.floor(proximo() * lista.length)],
  };
}

export type Aleatorio = ReturnType<typeof criarAleatorio>;
