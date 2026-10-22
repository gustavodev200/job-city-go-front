import { expect, test } from "@playwright/test";

test("entrar em Anápolis pelo mapa: placa e legenda batem com as vagas da cidade", async ({ page, isMobile }) => {
  test.skip(isMobile, "legenda aberta por padrão só no desktop");
  await page.goto("/estado/go");
  const lista = page.getByRole("list", { name: "Cidades deste estado" });
  const item = lista.getByRole("button", { name: /^Anápolis/ });
  const abertasNaLista = Number((await item.locator("span.font-bold").innerText()).trim());
  await item.click();
  await page.getByRole("link", { name: "Entrar na cidade" }).click();

  await expect(page).toHaveURL(/\/cidade\/anapolis-go$/);
  await expect(page.getByRole("heading", { name: "Anápolis · GO" })).toBeVisible();
  await expect(page.getByText(new RegExp(`^${abertasNaLista} vagas? abertas? de`))).toBeVisible();

  const legenda = page.getByRole("list", { name: "Vagas abertas por categoria" });
  const numeros = await legenda.locator("li span.font-bold").allInnerTexts();
  expect(numeros.reduce((s, n) => s + Number(n), 0)).toBe(abertasNaLista);
});

test("Bairro Remoto na mesma cena: botão leva à vila e a placa troca", async ({ page, isMobile }) => {
  test.skip(isMobile, "no celular o botão é compacto (só ícone)");
  await page.goto("/cidade/anapolis-go");
  await expect(page.getByRole("heading", { name: "Anápolis · GO" })).toBeVisible();
  await page.getByRole("button", { name: /Ir para o Bairro Remoto/ }).click();
  await expect(page.getByRole("heading", { name: "Bairro Remoto" })).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/cidade\/anapolis-go$/);
  await page.getByRole("button", { name: /Ir para a cidade/ }).click();
  await expect(page.getByRole("heading", { name: "Anápolis · GO" })).toBeVisible({ timeout: 15_000 });
});

test("Bairro Remoto avulso com origem volta para a cidade", async ({ page }) => {
  await page.goto("/remoto?de=anapolis-go");
  await page.getByRole("button", { name: "Voltar para Anápolis" }).click();
  await expect(page).toHaveURL(/\/cidade\/anapolis-go\?chegada=ponte$/);
});

test("Bairro Remoto direto (ou com origem inválida) volta ao mapa", async ({ page }) => {
  await page.goto("/remoto?de=xx");
  await expect(page.getByRole("button", { name: "Voltar ao mapa" })).toBeVisible();
  await page.goto("/remoto");
  await page.getByRole("button", { name: "Voltar ao mapa" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("?vaga= de vaga encerrada abre o pergaminho com candidatura desabilitada", async ({ page }) => {
  await page.goto("/cidade/goiania-go?vaga=vg-006");
  const pergaminho = page.getByRole("dialog");
  await expect(pergaminho).toBeVisible();
  await expect(pergaminho.getByRole("img", { name: "Selo: vaga encerrada" })).toBeVisible();
  await expect(pergaminho.getByRole("button", { name: "Vaga encerrada" })).toBeDisabled();
});

test("vaga remota mostra abrangência e estado de origem", async ({ page }) => {
  await page.goto("/remoto?vaga=vg-033");
  const pergaminho = page.getByRole("dialog");
  await expect(pergaminho).toContainText("Remoto para GO");
  await expect(pergaminho).toContainText("Empresa de Goiás");
});

test("?vaga= de outra cidade é ignorado", async ({ page }) => {
  await page.goto("/cidade/anapolis-go?vaga=vg-006");
  await expect(page.getByRole("heading", { name: "Anápolis · GO" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
