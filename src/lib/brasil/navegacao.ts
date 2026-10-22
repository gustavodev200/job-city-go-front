"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import type { Uf } from "@/data/brasil/estados";
import { hrefEstado, UfParamSchema } from "./rotas";

/** UF do nível Estado (`/estado/[uf]`) ou null no nível Brasil. */
export function useUfDaRota(): Uf | null {
  const pathname = usePathname();
  const m = /^\/estado\/([^/]+)\/?$/.exec(pathname ?? "");
  if (!m) return null;
  const r = UfParamSchema.safeParse(m[1]);
  return r.success ? r.data : null;
}

/** Desce para o nível Estado da UF. */
export function useConfirmarUf() {
  const router = useRouter();
  return useCallback((uf: Uf) => router.push(hrefEstado(uf)), [router]);
}
