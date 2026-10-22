"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { estradasBrasil } from "@/lib/brasil/estradas";
import { tracado, type PontoEstrada } from "@/lib/brasil/tracado";
import { cidadePorId } from "@/lib/brasil/rotas";

const LARGURA = { rodovia: 0.34, estrada: 0.18 } as const;
const FAIXA = 0.045;
/** Faixa central acima do asfalto. */
const ELEVAR_FAIXA = 0.006;

const ASFALTO = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.95,
  side: THREE.DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2,
});
const AMARELO = new THREE.MeshBasicMaterial({
  color: "#f2c230",
  toneMapped: false,
  side: THREE.DoubleSide,
  polygonOffset: true,
  polygonOffsetFactor: -3,
  polygonOffsetUnits: -3,
});

/** Fita plana ao longo dos pontos, com `largura` e cor por vértice. */
function fita(pontos: PontoEstrada[], largura: number, cor: THREE.Color, dy = 0) {
  const pos: number[] = [];
  const cores: number[] = [];
  const idx: number[] = [];
  const dx = pontos.at(-1)!.x - pontos[0].x;
  const dz = pontos.at(-1)!.z - pontos[0].z;
  const l = Math.hypot(dx, dz) || 1;
  // Trecho reto: a perpendicular é a mesma em todos os pontos.
  const nx = (-dz / l) * (largura / 2);
  const nz = (dx / l) * (largura / 2);
  pontos.forEach((p, i) => {
    pos.push(p.x + nx, p.y + dy, p.z + nz, p.x - nx, p.y + dy, p.z - nz);
    cores.push(cor.r, cor.g, cor.b, cor.r, cor.g, cor.b);
    if (i > 0) {
      const b = (i - 1) * 2;
      idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(cores, 3));
  g.setIndex(idx);
  return g;
}

function juntar(partes: THREE.BufferGeometry[]) {
  const pos: number[] = [];
  const cores: number[] = [];
  const idx: number[] = [];
  for (const g of partes) {
    const base = pos.length / 3;
    pos.push(...(g.getAttribute("position").array as Float32Array));
    cores.push(...(g.getAttribute("color").array as Float32Array));
    for (const i of g.getIndex()!.array) idx.push(base + i);
    g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(cores, 3));
  // Estrada é chão: normal sempre para cima (degraus do relevo não escurecem a pista).
  g.setAttribute("normal", new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/**
 * Rodovias (entre capitais, largas, com faixa amarela) e estradas (ligam as demais
 * cidades): todo o país é alcançável por terra.
 */
export function Estradas() {
  const [asfalto, faixa] = useMemo(() => {
    const rodovia = new THREE.Color("#55585e");
    const estrada = new THREE.Color("#9a9184");
    const pistas: THREE.BufferGeometry[] = [];
    const faixas: THREE.BufferGeometry[] = [];
    for (const e of estradasBrasil) {
      const pts = tracado(cidadePorId.get(e.a)!, cidadePorId.get(e.b)!);
      pistas.push(fita(pts, LARGURA[e.tipo], e.tipo === "rodovia" ? rodovia : estrada));
      if (e.tipo === "rodovia") faixas.push(fita(pts, FAIXA, rodovia, ELEVAR_FAIXA));
    }
    return [juntar(pistas), juntar(faixas)];
  }, []);
  useEffect(
    () => () => {
      asfalto.dispose();
      faixa.dispose();
    },
    [asfalto, faixa],
  );

  return (
    <>
      <mesh geometry={asfalto} material={ASFALTO} renderOrder={1} />
      <mesh geometry={faixa} material={AMARELO} renderOrder={2} />
    </>
  );
}
