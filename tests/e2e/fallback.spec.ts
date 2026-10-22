import { expect, test } from "@playwright/test";

test("sem WebGL: mapa plano com 27 estados navegáveis", async ({ page, isMobile }) => {
  await page.goto("/?semWebgl=1");
  const mapa = page.getByRole("group", { name: "Mapa do Brasil" });
  await expect(mapa.getByRole("link")).toHaveCount(27);
  const sp = mapa.getByRole("link", { name: /^São Paulo,/ });
  // No celular é toque de verdade (o hover do mouse abriria o resumo por cima).
  if (isMobile) await sp.tap();
  else await sp.click();
  await expect(page).toHaveURL(/\/estado\/sp/);
});
