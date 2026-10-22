import { Suspense } from "react";
import { AvisoRota } from "@/components/brasil/AvisoRota";
import { HudBrasil } from "@/components/brasil/HudBrasil";

export default function NivelBrasil() {
  return (
    <>
      <HudBrasil />
      <Suspense fallback={null}>
        <AvisoRota />
      </Suspense>
    </>
  );
}
