"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Bioma } from "@/data/brasil/estados";
import { gerarArvores, type Arvore, type FormaArvore } from "@/lib/brasil/arvores";

const COR_COPA: Record<Bioma, string> = {
  amazonia: "#2f7a3a",
  "mata-atlantica": "#3f8f45",
  pantanal: "#4d9a6a",
  cerrado: "#6f8f3a",
  caatinga: "#8a8a4a",
  pampa: "#5f9a48",
};

// Base de cada geometria em y = 0 (o tronco começa no chão).
const COPA = new THREE.IcosahedronGeometry(0.16, 0).translate(0, 0.26, 0);
const PINHEIRO = new THREE.ConeGeometry(0.13, 0.36, 6).translate(0, 0.3, 0);
const TRONCO = new THREE.CylinderGeometry(0.025, 0.035, 0.14, 5).translate(0, 0.07, 0);

const MAT_FOLHA = new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true });
const MAT_TRONCO = new THREE.MeshStandardMaterial({ color: "#6f4a30", roughness: 1 });

function Camada({ arvores, geometria, material, cor }: {
  arvores: Arvore[];
  geometria: THREE.BufferGeometry;
  material: THREE.Material;
  cor?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    arvores.forEach((a, i) => {
      m.makeScale(a.escala, a.escala, a.escala).setPosition(a.x, a.y, a.z);
      mesh.setMatrixAt(i, m);
      // Pequena variação por árvore para a mata não parecer clonada.
      if (cor) mesh.setColorAt(i, c.set(COR_COPA[a.bioma]).multiplyScalar(0.85 + ((i * 7919) % 100) / 400));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [arvores, cor]);
  if (arvores.length === 0) return null;
  return <instancedMesh ref={ref} args={[geometria, material, arvores.length]} />;
}

/** Matas do país inteiro: densas na Amazônia, ralas na Caatinga e no Pampa. */
export function ArvoresMapa() {
  const { todas, porForma } = useMemo(() => {
    const todas = gerarArvores();
    const porForma = (f: FormaArvore) => todas.filter((a) => a.forma === f);
    return { todas, porForma: { copa: porForma("copa"), pinheiro: porForma("pinheiro") } };
  }, []);
  return (
    <>
      <Camada arvores={todas} geometria={TRONCO} material={MAT_TRONCO} />
      <Camada arvores={porForma.copa} geometria={COPA} material={MAT_FOLHA} cor />
      <Camada arvores={porForma.pinheiro} geometria={PINHEIRO} material={MAT_FOLHA} cor />
    </>
  );
}
