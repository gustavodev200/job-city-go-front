import { expect, test } from "@playwright/test";

test("só teclado: lista de cidades de MG, foco, anúncio, Esc e entrar", async ({ page, isMobile }) => {
  test.skip(isMobile, "fluxo de teclado é do desktop");
  await page.goto("/estado/mg");
  const lista = page.getByRole("list", { name: "Cidades deste estado" });
  const primeira = lista.getByRole("button").first();
  await expect(primeira).toBeVisible();

  // Tab até o primeiro item da lista (ordem de foco real da página).
  for (let i = 0; i < 40 && !(await primeira.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(primeira).toBeFocused();

  await page.keyboard.press("ArrowDown");
  const segunda = lista.getByRole("button").nth(1);
  await expect(segunda).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(segunda).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("p[aria-live=polite]:not(aside *)")).toContainText("vagas abertas");

  await page.keyboard.press("Escape");
  await expect(segunda).toHaveAttribute("aria-pressed", "false");

  await page.keyboard.press("Enter");
  // O cartão aparece antes da lista: Shift+Tab volta até "Entrar na cidade".
  const entrar = page.getByRole("link", { name: "Entrar na cidade" });
  for (let i = 0; i < 20 && !(await entrar.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Shift+Tab");
  }
  await expect(entrar).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/cidade\/[a-z0-9-]+-mg$/);
});
