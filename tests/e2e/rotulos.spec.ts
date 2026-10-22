import { expect, test, type Page } from "@playwright/test";

// SC-002: nenhum rótulo de cidade sobreposto em nenhum estado, de 360 px a 1920 px.
const UFS = [
  "ac", "al", "am", "ap", "ba", "ce", "df", "es", "go", "ma", "mg", "ms", "mt", "pa",
  "pb", "pe", "pi", "pr", "rj", "rn", "ro", "rr", "rs", "sc", "se", "sp", "to",
];

type Caixa = { x: number; y: number; width: number; height: number };

async function caixasDosRotulos(page: Page): Promise<Caixa[]> {
  return page.locator("[data-rotulo-cidade]").evaluateAll((els) =>
    els
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({ x: r.x, y: r.y, width: r.width, height: r.height })),
  );
}

/** Espera a câmera parar: duas leituras seguidas iguais. */
async function caixasEstaveis(page: Page) {
  let anterior = "";
  for (let i = 0; i < 20; i++) {
    const caixas = await caixasDosRotulos(page);
    const atual = JSON.stringify(caixas.map((c) => [Math.round(c.x), Math.round(c.y)]));
    if (caixas.length > 0 && atual === anterior) return caixas;
    anterior = atual;
    await page.waitForTimeout(400);
  }
  return caixasDosRotulos(page);
}

const cruzam = (a: Caixa, b: Caixa) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

for (const [largura, altura] of [
  [360, 740],
  [1920, 1080],
] as const) {
  test(`rótulos de cidade não se sobrepõem em ${largura}px`, async ({ page, isMobile }) => {
    test.skip(isMobile, "a largura é fixada aqui; um projeto basta");
    test.setTimeout(27 * 20_000);
    await page.setViewportSize({ width: largura, height: altura });
    for (const uf of UFS) {
      await page.goto(`/estado/${uf}`);
      const caixas = await caixasEstaveis(page);
      expect(caixas.length, uf).toBeGreaterThan(0);
      for (let i = 0; i < caixas.length; i++) {
        for (let j = i + 1; j < caixas.length; j++) {
          expect(cruzam(caixas[i], caixas[j]), `${uf}: rótulos ${i} e ${j}`).toBe(false);
        }
      }
    }
  });
}
