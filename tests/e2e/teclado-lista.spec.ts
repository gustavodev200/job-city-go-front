import { expect, test } from "@playwright/test";

// SC-003: achar e abrir uma vaga só com teclado, sem usar o mapa; contagem anunciada.
test("lista de vagas operável por teclado", async ({ page, isMobile }) => {
  test.skip(isMobile, "teclado físico");
  await page.goto("/?semWebgl=1");
  const painel = page.getByRole("complementary", { name: "Vagas" });

  const busca = painel.getByLabel("Buscar por cargo ou empresa");
  await busca.focus();
  await page.keyboard.type("enfermagem");
  await expect(painel.getByRole("status")).toHaveText(/^\d+ vagas?$/);

  const primeiro = painel.getByRole("list", { name: "Resultados" }).getByRole("article").first().getByRole("button").first();
  await primeiro.focus();
  const titulo = await primeiro.innerText();
  await page.keyboard.press("Enter");
  await expect(painel.getByRole("heading", { name: titulo, level: 2 })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(primeiro).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(painel).toBeHidden();
  await expect(page.getByRole("button", { name: /^Vagas \(\d+\)/ })).toBeFocused();

  await page.keyboard.press("v");
  await expect(painel).toBeVisible();
});
