import { expect, test } from "@playwright/test";

test("Brasil → Goiás pela lista, volta pelo navegador", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Job City Go · Brasil" })).toBeVisible();
  await page.getByRole("button", { name: "Estados" }).click();
  await page.getByRole("button", { name: /^Goiás/ }).click();
  await expect(page).toHaveURL(/\/estado\/go$/);
  await expect(page.getByRole("navigation", { name: "Trilha" })).toContainText("Goiás");

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Job City Go · Brasil" })).toBeVisible();
});

test("link direto para estado válido abre o nível Estado", async ({ page }) => {
  await page.goto("/estado/sp");
  await expect(page.getByRole("navigation", { name: "Trilha" })).toContainText("São Paulo");
});

test("estado inexistente volta ao Brasil com aviso", async ({ page }) => {
  await page.goto("/estado/xx");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("status")).toContainText("Não encontramos esse estado");
});
