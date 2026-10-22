---

description: "Task list for 001 Mapa do Brasil (nível país)"
---

# Tasks: Mapa do Brasil (nível país)

**Input**: Design documents from `/specs/001-mapa-brasil/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluídos porque o plano os define (research R13: Vitest para
lógica pura, Playwright para 3 fluxos E2E). Testes unitários ficam junto da
lógica que cobrem (Fase 2); E2E na fase final.

**Organization**: Tasks agrupadas por user story da spec (US1–US5).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: user story da spec (US1…US5)
- Caminhos relativos à raiz do repositório (projeto único Next.js, código em `src/`)

## Regras para quem implementa

- Ler `AGENTS.md`: Next.js 16 difere do conhecido — consultar
  `node_modules/next/dist/docs/` antes de usar API de rotas/layout
  (`params` é Promise; `cacheComponents: true` está ligado).
- Seguir o estilo do código existente: nomes em português no domínio
  (`vagas`, `cidade`, `estado`), comentários curtos, componentes cliente
  com `"use client"`, stores zustand como em `src/stores/game.ts`.
- Formatos de dados: [data-model.md](data-model.md) e
  [contracts/geo-brasil.md](contracts/geo-brasil.md). Rotas, chaves de
  armazenamento e teclado: [contracts/rotas-e-estado.md](contracts/rotas-e-estado.md).
- Decisões técnicas e motivos: [research.md](research.md) (R1–R14).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dependências e runners de teste

- [X] T001 Instalar `zod` (dependência) e `vitest`, `@playwright/test` (devDependencies) com `npm install`; adicionar scripts `"test": "vitest run"` e `"test:e2e": "playwright test"` em package.json
- [X] T002 [P] Criar vitest.config.ts na raiz com alias `@` → `./src` (igual ao `paths` de tsconfig.json), ambiente `node`, `include: ["tests/unit/**/*.test.ts"]`
- [X] T003 [P] Criar playwright.config.ts na raiz: `testDir: "tests/e2e"`, projeto chromium (desktop) e "Pixel 7" (mobile), `webServer` com `npm run build && npm run start` em `http://localhost:3000`, `reuseExistingServer: !process.env.CI`
- [X] T004 [P] Adicionar `test-results/`, `playwright-report/` e `/scripts/brasil/.cache/` ao .gitignore

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: dados geográficos, dados mock nacionais, lógica pura, rotas e refactors que TODAS as stories usam

**⚠️ CRITICAL**: nenhuma user story começa antes desta fase

### Utilitários

- [X] T005 [P] Criar src/lib/aleatorio.ts exportando `criarAleatorio(semente: number)` (mulberry32) que retorna `{ proximo(): number /*0..1*/, inteiro(min, max): number, escolher<T>(lista: T[]): T }`
- [X] T006 [P] Criar src/lib/movimento.ts movendo o hook `useReducedMotion` (e a constante `REDUCED_QUERY`) de src/components/city/DayNight.tsx para cá, exportado; atualizar o import em DayNight.tsx

### Estados e geo

- [X] T007 [P] Criar src/data/brasil/estados.ts: `export const UFS = [...] as const` (27 siglas em ordem alfabética), `export type Uf = (typeof UFS)[number]`, `type Bioma`, `type Regiao`, `export const estados: Record<Uf, { nome; regiao; bioma }>` conforme a tabela de biomas em specs/001-mapa-brasil/data-model.md
- [X] T008 [P] Criar scripts/brasil/cidades-curadas.json com ~90 entradas `{ "ibge": number, "porte": "capital"|"grande"|"media"|"pequena" }`: as 27 capitais (porte capital) + polos do interior com ≥ 2 cidades por UF (ex.: GO: Anápolis 5201108, Aparecida de Goiânia 5201405, Senador Canedo 5220454, Trindade 5221403, Rio Verde 5218805; SP: Campinas, Ribeirão Preto, Sorocaba, São José dos Campos, Bauru…; MG: Uberlândia, Juiz de Fora, Montes Claros…); DF: Brasília 5300108 + mais 1 código (usar Brasília e, se o CSV só tiver Brasília para o DF, aceitar DF com 1 cidade e registrar no README do script). Códigos IBGE de 7 dígitos conferidos no CSV de kelvins
- [X] T009 Criar scripts/brasil/gerar-geo.mjs (Node ≥ 22, sem dependências, ESM) que: (1) baixa com `fetch` `https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/brazil-states.geojson` e `https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/csv/municipios.csv` para scripts/brasil/.cache/ (reaproveita se já existir); (2) valida que o GeoJSON tem 27 features com `properties.sigla` ∈ UFS; (3) projeta e rasteriza na grade (PASSO_LAT 0.2, LAT_REF −15, regra par-ímpar no centro da célula, empate → UF alfabeticamente primeira); (4) calcula `caixa`, `rotulo` (célula da UF mais distante da borda da UF) e `contorno` simplificado com Douglas–Peucker (TOLERANCIA 0.04°), descartando anéis com < 4 pontos; (5) centraliza coordenadas no centro da caixa do Brasil; (6) grava src/data/brasil/geo.json no formato de specs/001-mapa-brasil/contracts/geo-brasil.md (números com 2 casas decimais); (7) lê cidades-curadas.json + CSV e grava src/data/brasil/cidades.ts (tipo `Cidade` importado de ./tipos, `id` = slug sem acentos `nome-uf`, ordenado por uf e nome, cabeçalho com créditos MIT); (8) imprime resumo (UFs, células, cidades, KB) e falha (exit 1) se alguma regra do contrato for violada (ex.: arquivo > 150 KB, UF sem célula)
- [X] T010 Criar src/data/brasil/tipos.ts com o tipo `Cidade` (data-model.md) e rodar `node scripts/brasil/gerar-geo.mjs` gerando src/data/brasil/geo.json e src/data/brasil/cidades.ts; rodar 2× e confirmar `git diff` vazio na segunda (depende de T007–T009)
- [X] T011 Criar src/lib/brasil/geo.ts: importa geo.json; exporta `GRADE`, `UF_GEO: Record<Uf, { caixa; rotulo; contorno }>`, `projetar(lon, lat): { x, z }`, `celulaEm(x, z): Uf | null` (O(1) pela grade), `ufDaCelula(col, lin)`, `alturaDaCelula(col, lin): number` (inteiro 1–6: base por bioma — amazonia 1, pantanal 1, pampa 2, caatinga 2, cerrado 3, mata-atlantica 3 com +2 numa faixa de ~6 células da costa entre ES e SC — mais ruído de valor determinístico em baixa frequência, quantizado) e `CAIXA_BRASIL`
- [X] T012 [P] Criar tests/unit/geo.test.ts: 27 UFs na grade; cada `rotulo` cai numa célula da própria UF; `celulaEm` no rótulo de GO retorna "GO"; ponto no oceano retorna null; `projetar` de Goiânia (−49.26, −16.69) cai numa célula "GO"; `alturaDaCelula` é determinística e ∈ [1, 6]; geo.json ≤ 150 KB
- [X] T013 [P] Criar src/lib/brasil/rotas.ts com `UfParamSchema` e `AvisoSchema` exatamente como em contracts/rotas-e-estado.md, mais `hrefEstado(uf: Uf)` → `/estado/<uf minúscula>`; e tests/unit/rotas.test.ts cobrindo `go` válido, `GO`/`xx`/`goias`/`""` inválidos e aviso desconhecido → undefined

### Vagas nacionais e agregados

- [X] T014 Criar src/data/brasil/vagas.ts: tipo `VagaNacional` (Omit distributivo de `x`,`z` sobre `Vaga` de src/data/vagas.ts + `uf: Uf`, `cidadeId: string | null`); converte as 40 vagas de src/data/vagas.ts (cidade por nome → `cidadeId` de cidades.ts em GO; remotas → `uf: "GO"`, `cidadeId: null`); gera com `criarAleatorio(2026)` ~620 vagas presenciais/híbridas (peso por porte: capital 12, grande 7, media 4, pequena 2; multiplicador regional SP/MG/RJ/PR/SC/RS e capitais do NE ×1.5; mínimo 5 abertas por UF) + ~40 remotas com UF de origem variada; ~15% encerradas; híbridas com `frequencia` entre "1 dia por semana", "2 dias por semana", "1 vez por mês"; títulos/empresas/requisitos/benefícios fictícios de listas por categoria no próprio arquivo (nunca nomes de empresas reais); ids `vn-0001…`; exporta `vagasBrasil: VagaNacional[]` (depende de T005, T007, T010)
- [X] T015 Criar src/lib/brasil/agregados.ts com funções puras sobre `vagasBrasil` (só `status === "aberta"`): `agregadoPorUf(): Record<Uf, AgregadoUf>` (remotas NÃO somam em `abertas`, só em `porModelo.remoto` pela UF de origem), `agregadoPorCidade(): Map<string, AgregadoCidade>`, `agregadoRemoto()`, `faixaCalor(uf): 0..4` (quantis dos `abertas` por UF), `LIMITES_FAIXAS` para a legenda; resultados memorizados em nível de módulo (depende de T014)
- [X] T016 [P] Criar tests/unit/vagas.test.ts: determinismo (duas gerações iguais), ≥ 600 vagas, ≥ 80 cidades com vaga, toda UF ≥ 5 abertas, as 40 ids de src/data/vagas.ts presentes, presencial/híbrida ⇒ `cidadeId` existe e uf confere, remota ⇒ `cidadeId === null`, nenhuma vaga sem categoria válida
- [X] T017 [P] Criar tests/unit/agregados.test.ts: soma de `abertas` por UF = presenciais+híbridas abertas; encerradas não contam; `topCategorias` ≤ 3 em ordem desc; `faixaCalor` ∈ 0..4 e UF com mais vagas está na faixa 4; `agregadoRemoto().abertas` = remotas abertas

### Stores (Zod na reidratação)

- [X] T018 [P] Criar src/stores/mapa.ts (zustand + `persist`, chave `jcg:mapa`, version 1): `ufEmFoco: Uf | null`, `modo: "luzes" | "calor"`, ações `focar(uf | null)`, `alternarModo()`; só `modo` persiste (`partialize`); `merge`/`onRehydrateStorage` valida com Zod e cai no padrão se inválido; storage via `createJSONStorage(() => localStorage)` dentro de try/catch
- [X] T019 [P] Criar src/stores/perfil.ts (zustand + `persist`, chave `jcg:perfil`, version 1): `cidadeId: string | null`, ação `definirCidade(id | null)`; reidratação valida com Zod + existência em `cidades` (inválido → null)
- [X] T020 [P] Criar tests/unit/stores.test.ts: reidratação com JSON inválido / modo desconhecido / cidadeId inexistente volta ao padrão (simular storage com objeto em memória)

### Rotas e refactors existentes

- [X] T021 Parametrizar src/components/city/DayNight.tsx: props novas `foco?: () => THREE.Vector3` (padrão: `playerRuntime.position`), `raioCeu?: number` (padrão 400, escala a esfera do céu e das estrelas), `neblina?: [number, number]` (padrão `[85, 250]`), `cidade?: boolean` (padrão true; quando false não renderiza `StreetLights` e não altera `LIT_MATERIAL`/`GLASS_MATERIAL`); `shadows` e `pointLights` continuam; cidade atual deve renderizar idêntica (sem passar props novas)
- [X] T022 Mover src/app/page.tsx para src/app/cidade/goiania-go/page.tsx (mesmo conteúdo) e criar src/app/remoto/page.tsx igual, passando `areaInicial="vila"` ao `CityScene`; em src/components/city/CityScene.tsx aceitar prop `areaInicial?: Area` (padrão "cidade") e repassar a src/components/city/Player.tsx, que usa `AREAS[areaInicial]` no estado inicial (linhas ~46–48) em vez de `AREAS.cidade`
- [X] T023 Criar src/app/(mapa)/layout.tsx (Server Component) que renderiza `<main className="relative h-dvh w-full overflow-hidden">` com `<MapaBrasil />` e `{children}` por cima; `MapaBrasil` importado de src/components/brasil/MapaBrasil.tsx (criar agora como componente cliente que carrega `BrasilCena` via `dynamic(..., { ssr: false })` e por enquanto só isso)
- [X] T024 Criar src/app/(mapa)/page.tsx (nível Brasil; por enquanto vazio além de um `<h1 className="sr-only">Mapa de vagas do Brasil</h1>`) e src/app/(mapa)/estado/[uf]/page.tsx: `generateStaticParams` → 27 UFs minúsculas; lê `params` (Promise) e valida com `UfParamSchema`; inválido → `redirect("/?aviso=estado")`; válido → `<h1 className="sr-only">` com o nome do estado (conteúdo visual vem nas stories). Verificar `npm run build` sem erro de `cacheComponents`

**Checkpoint**: `npm run test` verde; `/cidade/goiania-go` e `/remoto` funcionam como antes; `/` e `/estado/go` abrem (cena ainda vazia).

---

## Phase 3: User Story 1 - Ver o Brasil e onde há vagas (Priority: P1) 🎯 MVP

**Goal**: o país em blocos, por bioma, com mar, ciclo dia/noite, torres de luz e rótulos "UF · N".

**Independent Test**: abrir `/` sem dados salvos → 27 estados reconhecíveis, rótulos com contagens iguais a `agregadoPorUf()`, nenhum prédio individual, de noite (controle de hora 21h) as torres brilham (quickstart passos 1–3).

- [X] T025 [P] [US1] Criar em src/lib/brasil/geo.ts a função `construirMalhaRelevo(): { posicoes: Float32Array; cores: Float32Array; indices: Uint32Array; faixasPorUf: Record<Uf, { inicioVertice; fimVertice }> }`: percorre células agrupadas por UF (ordem de UFS) para que os vértices de cada UF fiquem contíguos; emite topo (quad) de cada célula na altura `alturaDaCelula × 0.35` e faces laterais só onde a vizinha é mar ou mais baixa; cor do topo = cor do bioma (paleta em `CORES_BIOMA` exportada) variada ±6% por ruído; laterais 25% mais escuras
- [X] T026 [US1] Criar src/components/brasil/Relevo.tsx: `BufferGeometry` a partir de `construirMalhaRelevo()` (memo de módulo), `MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9 })`; expõe ref para recolorir (usado na US2/US5)
- [X] T027 [P] [US1] Criar src/components/brasil/Mar.tsx: plano grande (2× a caixa do Brasil) logo abaixo do nível 0, cor de água; de noite escurece seguindo `cicloRuntime.noite` em `useFrame`
- [X] T028 [P] [US1] Criar src/components/brasil/Bordas.tsx: `LineSegments` com os anéis de `UF_GEO[uf].contorno`, cor clara semitransparente, levemente acima do topo mais alto da célula
- [X] T029 [P] [US1] Criar src/components/brasil/TorresVagas.tsx: `InstancedMesh` (prisma de 6 lados, raio 0.35) para cada cidade com `agregadoPorCidade().abertas > 0`, posição (x, z) da cidade sobre o relevo, altura `0.6 + 0.9 × √abertas`; material emissivo (cor quente) com `emissiveIntensity` = lerp(0.2, 2.2, `cicloRuntime.luzes`) em `useFrame`; mais `Points` aditivos (halo) com opacidade = `cicloRuntime.luzes`
- [X] T030 [P] [US1] Criar src/components/brasil/RotulosUf.tsx: um `Html` do drei por UF em `UF_GEO[uf].rotulo`, texto "UF · N" (N de `agregadoPorUf`), `pointerEvents: none`, `aria-hidden` (a versão acessível é a lista da US2), fonte pequena com fundo translúcido; escalar com distância (`distanceFactor`)
- [X] T031 [US1] Criar src/components/brasil/CameraMapa.tsx: `MapControls` do drei com `minPolarAngle` 25°, `maxPolarAngle` 65°, `minAzimuthAngle`/`maxAzimuthAngle` ±30°, `minDistance`/`maxDistance` derivadas de `CAIXA_BRASIL`, alvo preso à caixa no evento `change`; enquadramento inicial que mostra o país inteiro tanto em retrato quanto em paisagem (calcular distância pelo `fov` e pelo aspecto)
- [X] T032 [US1] Criar src/components/brasil/BrasilCena.tsx: `Canvas` (sem `shadows`, `dpr={[1, narrow ? 1.5 : 2]}`, mesma `useIsNarrow` de CityScene — extrair para src/lib/movimento.ts se precisar compartilhar), `DayNight` com `cidade={false}`, `shadows={false}`, `pointLights={false}`, `raioCeu` e `neblina` proporcionais a `CAIXA_BRASIL`, `foco` = alvo dos controles; compõe Relevo, Mar, Bordas, TorresVagas, RotulosUf, CameraMapa (depende de T021, T026–T031)
- [X] T033 [US1] Em src/app/(mapa)/page.tsx renderizar `ControleHora` (dynamic, `ssr: false`, como em src/app/cidade/goiania-go/page.tsx) e um cabeçalho mínimo "Job City Go · N vagas abertas no Brasil" (N = soma de `agregadoPorUf` + `agregadoRemoto`)

**Checkpoint**: MVP visual — `/` mostra o Brasil vivo com contagens corretas.

---

## Phase 4: User Story 2 - Inspecionar um estado (Priority: P1)

**Goal**: resumo da UF por hover, 1º toque ou teclado.

**Independent Test**: focar GO (mouse, toque e teclado) e conferir nome, total, por modalidade e top 3 contra `agregadoPorUf().GO` (quickstart passo 4, 8).

- [X] T034 [US2] Em src/components/brasil/Relevo.tsx tratar `onPointerMove` / `onPointerOut` / `onClick` do mesh: `celulaEm(point.x, point.z)` → `useMapaStore.focar(uf)`; em toque (`pointerType === "touch"`) o 1º toque só foca; destaque visual da UF em foco clareando as cores dos vértices em `faixasPorUf[uf]` (restaurar ao trocar)
- [X] T035 [P] [US2] Criar src/components/brasil/ResumoUf.tsx: cartão com "Nome (UF)", total aberto, linhas Presencial/Híbrida/Remota (rótulos de `MODELO_LABEL` em src/components/city/cores.ts), top 3 categorias com ícone de src/components/city/icons.tsx e rótulo de `CATEGORIA_LABEL`; botão "Ver vagas de <Nome>"; posicionado no canto (desktop) ou gaveta inferior (celular); conteúdo também numa região `aria-live="polite"`
- [X] T036 [P] [US2] Criar src/components/brasil/ListaEstados.tsx: botão "Estados" que abre painel com lista de 27 itens (ordem alfabética, "Goiás · 37 vagas abertas"), cada item `<button>` que foca no focus/hover e confirma no clique/Enter; ←/→ e ↑/↓ movem o foco entre itens; Esc fecha e limpa foco
- [X] T037 [US2] Criar src/components/brasil/HudBrasil.tsx compondo ResumoUf e ListaEstados e renderizá-lo em src/app/(mapa)/page.tsx; tocar fora do mapa/cartão ou Esc chama `focar(null)`

**Checkpoint**: US1 + US2 funcionam; estados pequenos selecionáveis pela lista.

---

## Phase 5: User Story 3 - Escolher uma região e descer de nível (Priority: P1)

**Goal**: confirmar UF → voo de câmera → `/estado/[uf]`; voltar funciona; link direto funciona.

**Independent Test**: Brasil → GO → URL `/estado/go`; recarregar mantém GO; voltar do navegador volta ao Brasil animado; `/estado/xx` → `/` com aviso (quickstart passos 5–7).

- [X] T038 [US3] Criar src/lib/brasil/navegacao.ts com hook `useConfirmarUf()` que chama `router.push(hrefEstado(uf))`; ligar em Relevo (clique do mouse ou 2º toque na mesma UF), ResumoUf (botão) e ListaEstados (Enter/clique)
- [X] T039 [US3] Em src/components/brasil/CameraMapa.tsx ler `usePathname()`: em `/estado/<uf>` voar até `UF_GEO[uf].caixa` (alvo e distância interpolados com amortecimento exponencial em `useFrame`, ~1 s); em `/` voltar ao enquadramento do Brasil; com `useReducedMotion()` aplicar o destino no mesmo quadro; desabilitar entrada do usuário durante o voo
- [X] T040 [US3] Criar src/components/brasil/PainelEstado.tsx (nível Estado mínimo): trilha "Brasil › <Nome>" (Brasil = link para `/`), o mesmo conteúdo de ResumoUf para a UF da rota e o texto "Cidades deste estado chegam em breve"; renderizar em src/app/(mapa)/estado/[uf]/page.tsx; em `/estado/*` o Relevo atenua (multiplica por 0.55) as cores das outras UFs
- [X] T041 [US3] Criar src/components/brasil/AvisoRota.tsx: lê `?aviso` com `useSearchParams` + `AvisoSchema`, mostra toast "Não encontramos esse estado. Escolha no mapa." por 5 s e faz `router.replace("/")`; renderizar em src/app/(mapa)/page.tsx dentro de `<Suspense>` (exigência de `cacheComponents`)

**Checkpoint**: caminho Brasil ↔ Estado completo com URL e histórico.

---

## Phase 6: User Story 4 - Começar perto de casa e atalho para remoto (Priority: P2)

**Goal**: ilha + atalho Bairro Remoto; cidade do usuário com "Você está aqui" e "Ir para minha cidade".

**Independent Test**: sem cidade salva → convite aparece, atalho Bairro Remoto leva a `/remoto`; salvar Anápolis → marcador em GO e "Ir para minha cidade" abre `/estado/go`; salvar Goiânia → abre `/cidade/goiania-go` (quickstart passos 10–11).

- [X] T042 [P] [US4] Em src/components/brasil/Mar.tsx adicionar a ilha do Bairro Remoto: pequeno conjunto de blocos (~6×4 células, altura 2) no Atlântico a leste de PB/PE (fora de qualquer UF), com 3–4 torres de luz e rótulo "Bairro Remoto · N" (N = `agregadoRemoto().abertas`); clique/toque/Enter navega para `/remoto`
- [X] T043 [P] [US4] Criar src/components/brasil/EscolherCidade.tsx: campo com busca por nome (sem acento, sem maiúscula) em `cidades`, lista de até 8 sugestões "Nome – UF", seleção chama `usePerfilStore.definirCidade(id)`; entrada validada (texto ≤ 60 caracteres)
- [X] T044 [US4] Em src/components/brasil/HudBrasil.tsx adicionar: botão fixo "Bairro Remoto (N vagas)" → `/remoto`; se `cidadeId` nulo, convite "Informe sua cidade para ver vagas perto de você" que abre EscolherCidade; se definido, "Ir para minha cidade" (`goiania-go` → `/cidade/goiania-go`; outras → `hrefEstado(uf)`) e "Trocar cidade"
- [X] T045 [US4] Criar src/components/brasil/MarcadorVoceAqui.tsx (pino 3D + `Html` "Você está aqui") na posição da cidade do perfil; incluir em BrasilCena

**Checkpoint**: US1–US4 completas.

---

## Phase 7: User Story 5 - Alternar visual: luzes ou calor (Priority: P3)

**Goal**: modo Calor com 5 faixas, legenda e persistência.

**Independent Test**: alternar para Calor → cores por faixa + legenda; recarregar mantém (quickstart passo 9).

- [X] T046 [US5] Definir `CORES_CALOR` (5 cores sequenciais) em src/lib/brasil/agregados.ts validando contraste com a skill `dataviz` (legível de dia e de noite); em src/components/brasil/Relevo.tsx, quando `modo === "calor"`, pintar os vértices de cada UF com `CORES_CALOR[faixaCalor(uf)]` (laterais 25% mais escuras) e esconder TorresVagas
- [X] T047 [US5] Criar src/components/brasil/LegendaCalor.tsx (faixas com `LIMITES_FAIXAS`, ex.: "0–9", "10–19"…) e o botão segmentado Luzes/Calor (`aria-pressed`) em src/components/brasil/HudBrasil.tsx ligado a `alternarModo()`

**Checkpoint**: todas as stories funcionais.

---

## Phase 8: Fallback 2D (FR-014, transversal)

- [X] T048 Criar src/components/brasil/BrasilPlano.tsx: `<svg viewBox>` a partir de `CAIXA_BRASIL` com um `<a href={hrefEstado(uf)}>` por UF contendo `<path>` dos anéis de `UF_GEO[uf].contorno` (cor de bioma, ou de `CORES_CALOR` no modo calor) e `<text>` "UF · N" no rótulo; foco visível; mesmos ResumoUf/ListaEstados funcionam por cima
- [X] T049 Em src/components/brasil/MapaBrasil.tsx detectar WebGL (`canvas.getContext("webgl2") ?? getContext("webgl")`) num efeito cliente; sem suporte, erro de contexto (`onCreated`/`webglcontextlost`) ou `?semWebgl=1` (só fora de produção) → renderizar BrasilPlano

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T050 [P] Criar tests/e2e/navegacao.spec.ts: abre `/`, espera o canvas, usa a lista de estados para confirmar GO, espera URL `/estado/go` e o texto "Brasil › Goiás", volta (`page.goBack()`) e espera `/`; abre `/estado/xx` e espera `/` com o aviso
- [X] T051 [P] Criar tests/e2e/teclado.spec.ts: só teclado (Tab até "Estados", setas até "Distrito Federal", Enter) → `/estado/df`; verifica região `aria-live` com "Distrito Federal"
- [X] T052 [P] Criar tests/e2e/fallback.spec.ts: abre `/?semWebgl=1`, verifica SVG com 27 links de estado e que clicar em "SP" leva a `/estado/sp`
- [X] T053 Verificar orçamento de desempenho (research R14): contar triângulos e draw calls via `gl.info` num log temporário em src/components/brasil/BrasilCena.tsx, medir carregamento em emulação de celular 4G/CPU 4×; ajustar passo de altura/variação se exceder; remover o log
- [X] T054 [P] Créditos das fontes geográficas (click_that_hood MIT, kelvins/municipios-brasileiros MIT) num README curto em scripts/brasil/README.md (como rodar o script e de onde vêm os dados)
- [ ] T055 Rodar `npm run lint`, `npm run test`, `npm run test:e2e`, `npm run build` e o roteiro manual de specs/001-mapa-brasil/quickstart.md (desktop, celular, reduzir movimento, leitor de tela); corrigir o que falhar
- [X] T056 Atualizar o README.md da raiz: a página inicial agora é o mapa do Brasil; cidade 3D em `/cidade/goiania-go`; Bairro Remoto em `/remoto`; comando de geração de dados

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sem dependências
- **Foundational (Fase 2)**: depende da Fase 1; bloqueia todas as stories
- **US1 (Fase 3)**: depende da Fase 2 — é o MVP
- **US2 (Fase 4)**: depende de US1 (precisa do Relevo e da cena)
- **US3 (Fase 5)**: depende de US2 (confirmar parte do foco) — pode começar T040/T041 em paralelo a US2
- **US4 (Fase 6)**: depende de US1; independente de US2/US3 exceto pelo HudBrasil (T037)
- **US5 (Fase 7)**: depende de US1 (Relevo) e T037 (HudBrasil)
- **Fallback (Fase 8)**: depende de US2 (ResumoUf/ListaEstados) e T046 (cores do calor)
- **Polish (Fase 9)**: depois de todas

### Dentro da Fase 2

T007, T008 → T009 → T010 → T011 → T012 · T005 + T010 → T014 → T015 → T016/T017 · T013, T018–T020 livres · T021 → T032 · T022, T023 → T024

### Parallel Opportunities

- Setup: T002, T003, T004 juntos depois de T001
- Fase 2: T005, T006, T007, T008, T013, T018, T019 juntos; depois T012, T016, T017, T020 juntos
- US1: T025, T027, T028, T029, T030 juntos (arquivos diferentes); T026 depois de T025; T031 → T032
- US2: T035 e T036 juntos
- US4: T042 e T043 juntos
- Polish: T050, T051, T052, T054 juntos

## Parallel Example: User Story 1

```bash
# Depois da Fase 2, em paralelo:
Task: "T025 construirMalhaRelevo em src/lib/brasil/geo.ts"
Task: "T027 Mar em src/components/brasil/Mar.tsx"
Task: "T028 Bordas em src/components/brasil/Bordas.tsx"
Task: "T029 TorresVagas em src/components/brasil/TorresVagas.tsx"
Task: "T030 RotulosUf em src/components/brasil/RotulosUf.tsx"
# Depois: T026 Relevo, T031 CameraMapa, T032 BrasilCena, T033 página
```

## Implementation Strategy

### MVP First (User Story 1)

1. Fase 1 + Fase 2 (dados e lógica testados antes de qualquer 3D)
2. Fase 3 (US1) → validar quickstart passos 1–3 → **parar e demonstrar**

### Incremental Delivery

1. Somar US2 (inspecionar) → demo
2. Somar US3 (descer de nível, URLs) → demo — aqui o nível Brasil cumpre o objetivo da spec
3. Somar US4 (perto de casa, Bairro Remoto) → demo
4. Somar US5 (calor) e Fallback → demo
5. Polish → `/test`, `/security`, `/review`

## Notes

- [P] = arquivos diferentes, sem dependência pendente
- Commit ao fim de cada fase (mensagem em inglês, como o histórico)
- `geo.json` e `cidades.ts` são gerados: nunca editar à mão
- Não mudar o comportamento da cidade 3D além de T021/T022

## Notas da implementação (2026-10-22)

Desvios do plano, todos pequenos:

- **T002**: `vitest.config.mts` (não `.ts`) — o Vite avisava de ESM em arquivo CommonJS.
- **T008**: 122 cidades (plano: ~90); DF só com Brasília (o CSV não tem regiões administrativas).
- **T018/T019**: stores com `skipHydration` + `useReidratar` (`src/stores/armazenamento.ts`) para o HTML do servidor não divergir do cliente; armazenamento com fallback em memória.
- **T021**: `foco` tipado como `{ x, z }` (não `Vector3`) para aceitar `playerRuntime.position`.
- **T042**: ilha do Bairro Remoto em `src/components/brasil/IlhaRemota.tsx` (não dentro de `Mar.tsx`).
- **T044**: controles comuns (Luzes/Calor, Centralizar, Bairro Remoto, cidade, `ControleHora`) em `src/components/brasil/ControlesMapa.tsx`, montado no layout `(mapa)` — valem nos níveis Brasil e Estado.
- **T046**: paleta do Calor trocada para um só matiz (laranja, `#fff0dd → #a8501a`): a primeira proposta (creme→vinho) falhou no validador da skill `dataviz` (faixas 0 e 1 indistinguíveis). Validada com `--ordinal` contra o mar de dia e de noite.
- **T049**: `?semWebgl=1` vale em qualquer ambiente (o E2E roda em build de produção; a flag só mostra o mapa plano).
- **T050–T052**: Playwright com `workers: 1` e WebGL por SwiftShader — em paralelo os testes estouravam o tempo.
- **Toque**: no mapa plano e na lista de estados, o resumo abre só com mouse ou foco de teclado; com toque ele aparecia por cima do item tocado e engolia o clique (achado pelo E2E mobile).
- **T053**: medido 48.988 triângulos e 11 draw calls; as 3 torres da ilha viraram uma `InstancedMesh` → 9 chamadas (por cálculo, não remedido).

**T055 em aberto**: lint, testes unitários (34), E2E (9 + 1 pulado) e build passam; roteiro visual
conferido por screenshots (dia, noite, calor, hover, `/estado/go`, `/estado/df`, celular 390 px,
fallback, regressão de `/cidade/goiania-go` e `/remoto`). Falta a parte manual: leitor de tela real
(NVDA/VoiceOver), "reduzir movimento" ligado no sistema, celular físico em 4G e o teste de
diferenciação com 5 pessoas (SC-006).
