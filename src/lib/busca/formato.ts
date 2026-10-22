import type { Vaga } from "@/data/vagas";

export const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

/** "R$ 2.000 – R$ 3.200" ou "A combinar" (vaga sem salário informado). */
export function textoSalario(v: Pick<Vaga, "faixaSalarial">) {
  return v.faixaSalarial ? `${brl.format(v.faixaSalarial.min)} – ${brl.format(v.faixaSalarial.max)}` : "A combinar";
}

/** "1x/semana", "2x/semana" ou "1x/mês" (selo das híbridas). */
export function textoPresenca(diasPorSemana: number) {
  return diasPorSemana < 1 ? `${Math.round(diasPorSemana * 4)}x/mês` : `${diasPorSemana}x/semana`;
}
