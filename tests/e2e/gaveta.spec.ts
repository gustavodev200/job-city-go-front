import { expect, test } from "@playwright/test";

test("celular: cidades de SP numa gaveta inferior", async ({ page, isMobile }) => {
  test.skip(!isMobile, "gaveta só aparece no celular");
  await page.goto("/estado/sp");
  const gaveta = page.getByRole("region", { name: "Cidades de São Paulo" });
  const alca = gaveta.getByRole("button", { expanded: false });
  await expect(alca).toBeVisible();
  await expect(gaveta.getByRole("list", { name: "Cidades deste estado" })).toBeHidden();

  await alca.tap();
  await expect(gaveta.getByRole("button", { expanded: true })).toBeVisible();
  const lista = gaveta.getByRole("list", { name: "Cidades deste estado" });
  await lista.getByRole("button").first().tap();
  await expect(gaveta.getByRole("link", { name: "Entrar na cidade" })).toBeVisible();

  const rolagem = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(rolagem).toBeLessThanOrEqual(0);
});
