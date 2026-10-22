import { expect, test } from "@playwright/test";

test("só teclado: lista de estados até o Distrito Federal", async ({ page, isMobile }) => {
  test.skip(isMobile, "fluxo de teclado é do desktop");
  await page.goto("/");
  const estados = page.getByRole("button", { name: "Estados" });
  await expect(estados).toBeVisible();

  // Tab até o botão "Estados" (ordem de foco real da página).
  for (let i = 0; i < 20 && !(await estados.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(estados).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  // Ordem alfabética: Acre, Alagoas, Amapá, Amazonas, Bahia, Ceará, Distrito Federal.
  for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: /^Distrito Federal/ })).toBeFocused();
  await expect(page.locator("[aria-live=polite]:not(aside *)")).toContainText("Distrito Federal");

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/estado\/df$/);
});
