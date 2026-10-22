import { expect, test } from "@playwright/test";

test.describe("nível Estado", () => {
  test.skip(({ isMobile }) => isMobile, "painel lateral é do desktop; celular em gaveta.spec.ts");

  test("Brasil → Goiás → Anápolis → trilha volta com Anápolis em foco → voltar do navegador", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Estados" }).click();
    await page.getByRole("button", { name: /^Goiás/ }).click();
    await expect(page).toHaveURL(/\/estado\/go$/);

    const lista = page.getByRole("list", { name: "Cidades deste estado" });
    await lista.getByRole("button", { name: /^Anápolis/ }).click();
    const cartao = page.getByRole("region", { name: "Vagas em Anápolis" });
    await expect(cartao).toContainText("vagas abertas");
    await expect(cartao.getByRole("list", { name: "Por categoria" })).toBeVisible();
    await expect(page.locator("p[aria-live=polite]")).toContainText("Anápolis:");

    await cartao.getByRole("link", { name: "Entrar na cidade" }).click();
    await expect(page).toHaveURL(/\/cidade\/anapolis-go$/);
    const trilha = page.getByRole("navigation", { name: "Trilha" });
    await expect(trilha).toContainText("Brasil");
    await expect(trilha).toContainText("Goiás");
    await expect(trilha).toContainText("Anápolis");

    await trilha.getByRole("link", { name: "Goiás" }).click();
    await expect(page).toHaveURL(/\/estado\/go\?cidade=anapolis-go$/);
    await expect(
      page.getByRole("list", { name: "Cidades deste estado" }).getByRole("button", { name: /^Anápolis/ }),
    ).toHaveAttribute("aria-pressed", "true");

    await page.goBack();
    await expect(page).toHaveURL(/\/cidade\/anapolis-go$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/estado\/go$/);
  });

  test("estados vizinhos: GO → Minas Gerais sem voltar ao Brasil", async ({ page }) => {
    await page.goto("/estado/go");
    await page.getByRole("navigation", { name: "Estados vizinhos" }).getByRole("link", { name: /^Minas Gerais/ }).click();
    await expect(page).toHaveURL(/\/estado\/mg$/);
    await expect(page.getByRole("navigation", { name: "Trilha" })).toContainText("Minas Gerais");
  });

  test("Distrito Federal mostra Brasília e regiões administrativas", async ({ page }) => {
    await page.goto("/estado/df");
    const lista = page.getByRole("list", { name: "Cidades deste estado" });
    await expect(lista.getByRole("button", { name: /^Brasília/ })).toBeVisible();
    expect(await lista.getByRole("button").count()).toBeGreaterThanOrEqual(2);
  });

  test("links inválidos: cidade de outra UF é ignorada; cidade inexistente volta ao Brasil", async ({ page }) => {
    await page.goto("/estado/go?cidade=campinas-sp");
    const lista = page.getByRole("list", { name: "Cidades deste estado" });
    await expect(lista).toBeVisible();
    await expect(lista.locator("[aria-pressed=true]")).toHaveCount(0);

    await page.goto("/cidade/nao-existe");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("status")).toContainText("Não encontramos essa cidade");
  });

  test("cidade 3D existente ganha a trilha", async ({ page }) => {
    await page.goto("/cidade/goiania-go");
    await expect(page.getByRole("navigation", { name: "Trilha" })).toContainText("Goiânia");
  });
});
