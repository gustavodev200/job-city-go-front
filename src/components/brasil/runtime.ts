import * as THREE from "three";

/**
 * Valores escritos pela câmera a cada quadro e lidos fora dela (luz do sol,
 * botão "Centralizar"), sem passar pelo React.
 */
type Caixa = { minX: number; minZ: number; maxX: number; maxZ: number };

export const mapaRuntime: {
  alvo: THREE.Vector3;
  centralizar: () => void;
  enquadrar: (caixa: Caixa) => void;
} = {
  /** Ponto que a câmera olha. */
  alvo: new THREE.Vector3(),
  /** Volta ao enquadramento do nível atual (Brasil ou estado). */
  centralizar: () => {},
  /** Voa até enquadrar a caixa (ex.: cidades de um grupo "+K"). */
  enquadrar: () => {},
};
