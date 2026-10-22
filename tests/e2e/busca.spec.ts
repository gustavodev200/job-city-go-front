import { expect, test, type Page } from "@playwright/test";

// Spec 004 — painel de vagas, filtros, "perto de mim" e "posso morar no interior".
// O painel abre sozinho em tela larga; no celular, pela aba "Vagas (N)".

const painel = (page: Page) => page.getByRole("complementary", { name: "Vagas" });
const resultados = (page: Page) => painel(page).getByRole("list", { name: "Resultados" });

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "painel lateral só no desktop");

  test("nível Cidade: lista só as vagas da cidade, abertas primeiro (US1-1)", async ({ page }) => {
    await page.goto("/cidade/goiania-go");
    await expect(painel(page).getByRole("heading", { name: "Vagas em Goiânia" })).toBeVisible();
    const itens = resultados(page).getByRole("article");
    await expect(itens.first()).toBeVisible();
    const textos = await itens.allInnerTexts();
    for (const t of textos) expect(t).toContain("Goiânia – GO");
    const encerradas = textos.map((t) => t.includes("Encerrada"));
    expect(encerradas.indexOf(true)).toBeGreaterThan(encerradas.lastIndexOf(false));
  });

  test("abrir a vaga e 'Ver no mapa' leva ao prédio com o pergaminho (US1-2)", async ({ page }) => {
    await page.goto("/?semWebgl=1");
    await painel(page).getByLabel("Buscar por cargo ou empresa").fill("Construtora Alicerce");
    const item = resultados(page).getByRole("article").filter({ hasText: "Mestre de Obras" });
    await item.getByRole("button", { name: "Mestre de Obras" }).click();
    await expect(painel(page).getByRole("heading", { name: "Mestre de Obras", level: 2 })).toBeFocused();
    await painel(page).getByRole("link", { name: "Ver no mapa" }).click();
    await expect(page).toHaveURL(/\/cidade\/aparecida-de-goiania-go\?vaga=vg-003&q=Construtora/);
    await expect(page.getByRole("dialog", { name: "Mestre de Obras" })).toBeVisible({ timeout: 20_000 });
  });

  test("filtro reflete no mapa, aparece como chip e 'Limpar' tira da URL (US2-1)", async ({ page }) => {
    await page.goto("/?semWebgl=1");
    const go = page.getByRole("link", { name: /^Goiás, \d+ vagas abertas$/ });
    const total = Number((await go.getAttribute("aria-label"))!.match(/(\d+)/)![1]);
    await painel(page).getByText("Mais filtros").click();
    await painel(page).getByRole("group", { name: "Categoria" }).getByLabel("Saúde").check();
    await expect(page).toHaveURL(/[?&]cat=saude/);
    await expect(page.getByText("Filtros ativos (1)").first()).toBeVisible();
    const filtrado = Number((await go.getAttribute("aria-label"))!.match(/(\d+)/)![1]);
    expect(filtrado).toBeLessThan(total);
    for (const t of await resultados(page).getByRole("article").allInnerTexts()) expect(t).toContain("Saúde");

    await page.getByRole("button", { name: "Limpar" }).first().click();
    await expect(page).not.toHaveURL(/cat=/);
  });

  test("sem resultado: aviso e sugestão de qual filtro tirar (US2-2)", async ({ page }) => {
    await page.goto("/?semWebgl=1&q=zzzz");
    await expect(painel(page).getByText("Nenhuma vaga com esses filtros.")).toBeVisible();
    await painel(page).getByRole("button", { name: /^Tirar .Busca "zzzz".$/ }).click();
    await expect(resultados(page).getByRole("article").first()).toBeVisible();
  });

  test("link com filtros: recarregar e navegar mantêm (US2-3)", async ({ page }) => {
    await page.goto("/?semWebgl=1&cat=saude&turno=noite&contrato=clt");
    await expect(painel(page).getByText("Filtros ativos (3)")).toBeVisible();
    await page.reload();
    await expect(painel(page).getByText("Filtros ativos (3)")).toBeVisible();
    for (const t of await resultados(page).getByRole("article").allInnerTexts()) {
      expect(t).toMatch(/Saúde.*CLT · Noite/);
    }
    await page.getByRole("link", { name: /^Goiás, / }).click();
    await expect(page).toHaveURL(/\/estado\/go\?.*cat=saude/);
  });

  test("perto de mim: pede a cidade, raio 25 sem Goiânia, 100 com (US3)", async ({ page }) => {
    await page.goto("/?semWebgl=1");
    await painel(page).getByRole("button", { name: /Perto de mim/ }).click();
    await painel(page).getByLabel("Sua cidade").fill("Anápolis");
    await painel(page).getByRole("button", { name: "Anápolis – GO" }).click();
    await painel(page).getByLabel("25 km").check();
    await expect(page).toHaveURL(/perto=anapolis-go&raio=25/);
    const lista = resultados(page);
    await expect(lista.getByText("Anápolis – GO").first()).toBeVisible();
    await expect(lista.getByText("Goiânia – GO")).toHaveCount(0);

    await painel(page).getByLabel("100 km").check();
    await expect(lista.getByRole("article").filter({ hasText: "Goiânia – GO" }).first()).toContainText("52 km");
  });

  test("posso morar no interior: só remotas e híbridas até 1 dia (US4)", async ({ page }) => {
    await page.goto("/?semWebgl=1");
    await painel(page).getByRole("button", { name: /Posso morar no interior/ }).click();
    await expect(page).toHaveURL(/interior=1/);
    await expect(page.getByRole("link", { name: /Bairro Remoto/ })).toHaveClass(/outline-amber-400/);
    for (const t of await resultados(page).getByRole("article").allInnerTexts()) {
      expect(t).not.toContain("Presencial");
      expect(t).not.toMatch(/Híbrida [23]x/);
    }
  });
});

test("celular: aba 'Vagas' abre a gaveta sem rolagem lateral", async ({ page, isMobile }) => {
  test.skip(!isMobile, "gaveta só no celular");
  await page.goto("/?semWebgl=1");
  await page.getByRole("button", { name: /^Vagas \(\d+\)/ }).tap();
  const gaveta = page.getByRole("region", { name: "Vagas" });
  await expect(gaveta.getByRole("heading", { name: "Vagas no Brasil" })).toBeVisible();
  await expect(gaveta.getByRole("list", { name: "Resultados" }).getByRole("article").first()).toBeVisible();
  const rolagem = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(rolagem).toBeLessThanOrEqual(0);
  await gaveta.getByRole("button", { name: "Fechar vagas" }).tap();
  await expect(gaveta).toBeHidden();
});
