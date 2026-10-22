import * as THREE from "three";

/**
 * Valores escritos pela câmera a cada quadro e lidos fora dela (luz do sol,
 * botão "Centralizar"), sem passar pelo React.
 */
export const mapaRuntime = {
  /** Ponto que a câmera olha. */
  alvo: new THREE.Vector3(),
  /** Volta ao enquadramento do nível atual (Brasil ou estado). */
  centralizar: () => {},
};
