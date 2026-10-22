---

description: "Task list for 002 Mapa do Estado (nível região)"
---

# Tasks: Mapa do Estado (nível região)

**Input**: Design documents from `/specs/002-mapa-estado/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluídos porque o plano os define (research R15: Vitest para
lógica pura, Playwright para fluxos e SC-002). Testes unitários ficam junto
da lógica que cobrem (Fase 2); E2E na fase final.

**Organization**: Tasks agrupadas por user story da spec (US1–US4). Ordem de
execução: US1 → US2 → US4 → US3 (US3 é P2; US4 é P1).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: user story da spec (US1…US4)
- Caminhos relativos à raiz do repositório (projeto único Next.js, código em `src/`)

## Regras para quem implementa

- Ler `AGENTS.md`: Next.js 16 difere do conhecido — consultar
  `node_modules/next/dist/docs/` antes de usar API de rotas
  (`params` é Promise; `cacheComponents: true` ligado; `useSearchParams`
  precisa de `<Suspense>` em rota pré-renderizada).
- Seguir o estilo do código da 001 (`src/components/brasil/`,
  `src/lib/brasil/`): nomes em português, comentários curtos, `"use client"`
  nos componentes cliente, classes `bloco-notas`/`cartao-mapa` já existentes
  em `src/app/globals.css`.
- Formatos: [data-model.md](data-model.md); rotas, trilha e teclado:
  [contracts/rotas-e-navegacao.md](contracts/rotas-e-navegacao.md); lista
  curada: [contracts/cidades-curadas.md](contracts/cidades-curadas.md).
  Decisões e motivos: [research.md](research.md) (R1–R15).
- Toda URL é entrada externa: validar com Zod (Princípio II).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dados de entrada que mudam (DF, rótulos, vizinhos)

- [X] T001 Estender scripts/brasil/gerar-geo.mjs para aceitar entradas manuais `{ nome, uf, lat, lon, porte }` (sem `ibge`) além de `{ ibge, porte }`, com as validações de [contracts/cidades-curadas.md](contracts/cidades-curadas.md) (forma única, `porte` válido, `uf` entre as 27, lat/lon na caixa do Brasil, ajuste para célula da própria UF, `id` único); gravar `ibge: null` e `capital: false` para manuais; atualizar scripts/brasil/README.md
- [X] T002 Adicionar em scripts/brasil/cidades-curadas.json as 5 regiões administrativas do DF como entradas manuais: Taguatinga (-15.8339, -48.0564, grande), Ceilândia (-15.8192, -48.1083, grande), Águas Claras (-15.8394, -48.0275, media), Gama (-16.0194, -48.0669, media), Sobradinho (-15.6517, -47.7900, media); rodar `node scripts/brasil/gerar-geo.mjs` e conferir que só src/data/brasil/cidades.ts mudou (geo.json idêntico)
- [X] T003 [P] Em src/data/brasil/tipos.ts mudar `ibge: number` para `ibge: number | null` com comentário (`null` = região administrativa do DF); corrigir usos que assumem número (`grep -rn "\.ibge" src tests`)
- [X] T004 [P] Em src/data/vagas.ts trocar os valores de `CATEGORIA_LABEL`: galpao → "Logística e indústria", obra → "Construção", escola → "Educação", bairro → "Serviços gerais" (chaves e ordem inalteradas); exportar `ORDEM_CATEGORIAS: readonly Categoria[]` na ordem comercio, escritorio, saude, galpao, obra, escola, bairro
- [X] T005 [P] Em src/data/brasil/estados.ts exportar `VIZINHOS: Record<Uf, readonly Uf[]>` com as fronteiras terrestres oficiais das 27 UFs (ordem alfabética em cada lista)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: lógica pura, schemas, store e trilha que TODAS as stories usam

**⚠️ CRITICAL**: nenhuma user story começa antes desta fase

### Dados e agregados

- [X] T006 Atualizar testes existentes afetados por T002–T004: tests/unit/vagas.test.ts (regras do gerador continuam válidas com as cidades novas; cidades DF com vaga) e tests/unit/agregados.test.ts (desempate alfabético de `topCategorias` com os rótulos novos); `npm test` verde
- [X] T007 [P] Criar tests/unit/vizinhos.test.ts: `VIZINHOS` simétrico, sem auto-referência, toda UF com ≥ 1 vizinho, e todo par vizinho tem ≥ 1 par de células adjacentes (4-vizinhança) na grade, usando `ufDaCelula` de src/lib/brasil/geo.ts; também "toda UF tem ≥ 2 cidades" em `cidades`
- [X] T008 Em src/lib/brasil/agregados.ts estender `AgregadoCidade` para `{ cidadeId, uf, abertas, encerradas, porCategoria, porModelo: { presencial, hibrido } }` conforme [data-model.md](data-model.md): `calcularPorCidade` passa a incluir cidades com só vagas encerradas (contagem `encerradas`), `porCategoria`/`porModelo` só de abertas; exportar `cidadesDoEstado(uf: Uf): Cidade[]` (cidades da UF com `abertas + encerradas ≥ 1`, ordem abertas desc, depois nome pt-BR); conferir que TorresVagas.tsx e ListaEstados.tsx continuam usando só `abertas` (filtrar `abertas > 0` onde preciso)
- [X] T009 Criar tests/unit/agregados-cidade.test.ts (SC-004): para cada cidade, `abertas`/`encerradas`/`porCategoria`/`porModelo` batem com filtro direto de `vagasBrasil`; `Σ porCategoria = abertas`; `presencial + hibrido = abertas`; para cada UF `Σ abertas das cidades = AGREGADO_UF[uf].abertas`; `cidadesDoEstado` ordenado e sem cidade sem vaga

### Lógica pura nova

- [X] T010 [P] Criar src/lib/brasil/distancia.ts com `distanciaKm(a: {lat, lon}, b: {lat, lon}): number` (haversine, raio 6371 km, arredondado para inteiro) e tests/unit/distancia.test.ts (Goiânia–Anápolis ≈ 53 km ±5; simetria; zero para a mesma cidade)
- [X] T011 [P] Criar src/lib/brasil/rotulos.ts com tipos `PontoRotulo`, `GrupoRotulo` e `agruparRotulos(pontos, margem = 4)` (guloso: ordena por prioridade desc, depois id; aceita retângulo se não cruza nenhum líder aceito, senão entra no grupo do primeiro líder com que colide) e `larguraEstimada(texto: string): number` (7 px × caracteres + 16); tests/unit/rotulos.test.ts: todo id em exatamente um grupo, líderes nunca se cruzam, maior prioridade lidera, resultado independe da ordem de entrada
- [X] T012 [P] Criar src/lib/brasil/previa.ts com `ConstrucaoPrevia`, `Previa` e `previaDaCidade(cidade, vagas, max = 40)` conforme [data-model.md](data-model.md) (abertas antes de encerradas; ordem `ORDEM_CATEGORIAS` e id; espiral de ângulo de ouro com passo radial 0,11 a partir de `cidade.x/z`; `excedente`); tests/unit/previa.test.ts: limite 40, excedente correto em cidade com > 40 vagas, abertas primeiro, posições determinísticas e sem duplicatas
- [X] T013 Em src/lib/brasil/rotas.ts adicionar `cidadePorId` (Map de `cidades`), `CidadeParamSchema`, `cidadeFocoSchema(uf)` (`.optional().catch(undefined)`), `hrefCidade(id)`, mudar `hrefEstado(uf, cidadeId?)` para anexar `?cidade=` e criar `itensDaTrilha({ uf?, cidadeId?, remoto? })` exatamente como a tabela de [contracts/rotas-e-navegacao.md](contracts/rotas-e-navegacao.md)
- [X] T014 Criar tests/unit/rotas-cidade.test.ts: `CidadeParamSchema` aceita `anapolis-go`, recusa `nao-existe`, `Anapolis-GO`, `../x`; `cidadeFocoSchema("GO")` aceita `anapolis-go`, devolve `undefined` para `campinas-sp` e lixo; `hrefEstado` com e sem cidade; `itensDaTrilha` nos 4 casos da tabela do contrato

### Store e trilha

- [X] T015 Em src/stores/mapa.ts adicionar `cidadeEmFoco: string | null` e `focarCidade(id)` (fora do `partialize`, `jcg:mapa` continua só com `modo`); estender tests/unit/stores.test.ts para garantir que `cidadeEmFoco` não é persistido
- [X] T016 [P] Criar src/components/brasil/Trilha.tsx: recebe `{ uf?, cidadeId?, remoto?, className? }`, usa `itensDaTrilha`, renderiza `<nav aria-label="Trilha"><ol>` com `next/link` e `›` `aria-hidden` entre itens, último item com `aria-current="page"` (mesmo visual da trilha atual de PainelEstado.tsx)

**Checkpoint**: `npm test` verde; nenhuma mudança visual ainda (exceto rótulos de categoria)

---

## Phase 3: User Story 1 - Ver as cidades de um estado (Priority: P1) 🎯 MVP

**Goal**: no nível Estado, toda cidade da UF com vaga aparece como aglomerado com rótulo "Nome · N vagas", sem sobreposição, agrupando em "+K cidades"

**Independent Test**: abrir `/estado/mg` por link direto e conferir que todas as cidades com vaga aparecem com contagens corretas; `/estado/go` afastado sem rótulos sobrepostos (quickstart passos 1–3)

- [X] T017 [P] [US1] Criar src/components/brasil/Aglomerados.tsx: um `InstancedMesh` de caixas para as cidades de `cidadesDoEstado(useUfDaRota())` (R3: nº de caixas `clamp(round(2 + 1.5·√total), 3, 12)`, alturas e posições por `criarAleatorio` semeado por hash do id, raio ≤ 0,8 ∝ √total, base em `topoDaCelula` da célula da cidade); material claro com emissivo seguindo `cicloRuntime.luzes` como TorresVagas.tsx; cidade com `abertas === 0` usa cor apagada; `onPointerOver/onClick` focam a cidade (`focarCidade`) seguindo a regra mouse/toque de Relevo.tsx (1º toque foca); recebe prop `ocultar?: ReadonlySet<string>` (usada pela US3)
- [X] T018 [P] [US1] Criar src/components/brasil/RotulosCidade.tsx: projeta (camera + `Vector3.project`) a posição de cada cidade da UF para pixels, no máx. a cada 100 ms e ao fim do voo (`useFrame` + relógio), monta `PontoRotulo` (prioridade máxima para `cidadeEmFoco` e `perfil.cidadeId`, depois abertas), chama `agruparRotulos` e renderiza um `Html` do drei por grupo: texto "Nome · N vagas" (ou "Nome · 0 vagas abertas" apagado), chip "+K cidades" quando o grupo tem membros extras; rótulo e chip são `aria-hidden` mas clicáveis (rótulo foca a cidade; chip chama `mapaRuntime.enquadrar(caixa dos membros)`); estilo igual a RotulosUf.tsx (foco = âmbar)
- [X] T019 [US1] Em src/components/brasil/runtime.ts adicionar `enquadrar(caixa: {minX,minZ,maxX,maxZ}) => void` e `irPara(x, z, distancia) => void`; implementar ambos em src/components/brasil/CameraMapa.tsx reutilizando o voo existente (`voo.current`); `DISTANCIA_MINIMA` dos `MapControls` = 6 quando `useUfDaRota()` ≠ null, 18 no Brasil
- [X] T020 [US1] Em src/components/brasil/TorresVagas.tsx não desenhar torres de cidades da UF da rota (`useUfDaRota()`); demais UFs continuam
- [X] T021 [US1] Em src/components/brasil/BrasilCena.tsx montar `<Aglomerados/>` e `<RotulosCidade/>` só quando `useUfDaRota()` ≠ null; ao sair do nível Estado (`uf` vira null ou muda) limpar `cidadeEmFoco` em efeito de src/components/brasil/PainelEstado.tsx (junto do `focar(null)` existente)

**Checkpoint**: US1 demonstrável — quickstart 1, 2, 3, 14 e 16 ("Você está aqui" já existe; conferir escala no zoom do estado)

---

## Phase 4: User Story 2 - Comparar cidades por categoria (Priority: P1)

**Goal**: focar uma cidade mostra cartão com total, barras por categoria e modalidade; lista lateral ordenável

**Independent Test**: focar 3 cidades e conferir cada contagem contra o mock; ordenar lista por vagas/nome/distância (quickstart 4–5)

- [X] T022 [P] [US2] Criar src/components/brasil/CartaoCidade.tsx: recebe `cidadeId`, mostra nome, "N vagas abertas" (+ "M encerradas" se houver), barras horizontais só das categorias com vaga (ordem `ORDEM_CATEGORIAS`, `CategoriaIcon` de src/components/city/icons.tsx, largura ∝ total/máx.), presencial/híbrido com `ModeloIcon`, botões "Entrar na cidade" (link `hrefCidade`, ligado na US4) e "Fechar" (`focarCidade(null)`); conteúdo dentro de região `aria-live="polite"` com frase do contrato ("Anápolis: 12 vagas abertas. Comércio 4, …"); visual coerente com ResumoUf.tsx
- [X] T023 [P] [US2] Criar src/components/brasil/ListaCidades.tsx: `<select>` Ordenar por Vagas | Nome | Distância (Distância só se `perfil.cidadeId` existe; usa `distanciaKm` e mostra "≈ N km"); lista de `<button aria-pressed>` com texto completo ("Anápolis, 12 vagas abertas, 3 encerradas"), ↑/↓ movem foco entre itens, Enter/Espaço focam a cidade, Esc limpa; padrão de teclado de ListaEstados.tsx
- [X] T024 [US2] Reescrever src/components/brasil/PainelEstado.tsx: `<Trilha uf>` + `ResumoUf` compacto da UF + `CartaoCidade` (quando há `cidadeEmFoco`) + `ListaCidades` + slot para `EstadosVizinhos` (US4); desktop (`md:`) painel lateral esquerdo `bloco-notas` com rolagem interna (máx. altura da tela); celular: trilha no topo e gaveta inferior (`<section>` com botão-alça `aria-expanded`, recolhida ≤ 96 px mostrando cidade em foco ou "N cidades", aberta ≤ 60dvh) — sem dependência nova
- [X] T025 [US2] Focar cidade (mapa, rótulo ou lista) faz a câmera voar até ela com `mapaRuntime.irPara(cidade.x, cidade.z, 14)` (efeito em PainelEstado.tsx observando `cidadeEmFoco`; reduzir movimento já é tratado em CameraMapa)

**Checkpoint**: US1 + US2 — escolher cidade comparando categorias funciona por mapa e por lista

---

## Phase 5: User Story 4 - Entrar na cidade e navegar entre níveis (Priority: P1)

**Goal**: caminho Brasil → Estado → Cidade completo, trilha em todos os níveis, voltar com cidade em foco, pular para estado vizinho

**Independent Test**: Brasil → GO → Anápolis → trilha "Goiás" → voltar do navegador (quickstart 9–13, 15, 19)

- [X] T026 [P] [US4] Criar src/app/cidade/[slug]/page.tsx: `generateStaticParams` com todos os `id` de `cidades`; `generateMetadata` ("Vagas em Anápolis · Job City Go"); valida `params.slug` com `CidadeParamSchema` (inválido → `redirect("/?aviso=cidade")`); renderiza `<main>` com fundo do app, `<Trilha cidadeId>`, `<h1>`, `CartaoCidade` (sem botão "Entrar" nem "Fechar" — tornar opcionais via props) e aviso "A cidade 3D de <nome> chega em breve." com link para `hrefEstado(uf, id)`; conferir que `/cidade/goiania-go` (rota estática) continua com a cena 3D
- [X] T027 [P] [US4] Adicionar `<Trilha cidadeId="goiania-go">` em src/app/cidade/goiania-go/page.tsx e `<Trilha remoto>` em src/app/remoto/page.tsx (posição topo-esquerda, `z-30`); em src/components/city/Hud.tsx descer a placa de madeira (`top-3` → abaixo da trilha) para não sobrepor
- [X] T028 [P] [US4] Criar src/components/brasil/FocoPelaUrl.tsx: `useSearchParams()` lê `cidade`, valida com `cidadeFocoSchema(uf)` e chama `focarCidade` uma vez por (uf, valor); se não há parâmetro válido e `cidadesDoEstado(uf).length === 1`, foca essa cidade (edge case); montar em src/app/(mapa)/estado/[uf]/page.tsx dentro de `<Suspense fallback={null}>`
- [X] T029 [P] [US4] Criar src/components/brasil/EstadosVizinhos.tsx: `<nav aria-label="Estados vizinhos">` com `<Link href={hrefEstado(v)}>` para cada `VIZINHOS[uf]` (nome + "· N vagas" de `AGREGADO_UF`); encaixar em PainelEstado.tsx
- [X] T030 [US4] Ligar "Entrar na cidade" do CartaoCidade.tsx a `hrefCidade(id)`; 2º clique/toque no rótulo da cidade já em foco (RotulosCidade.tsx) também entra; em src/components/brasil/ControlesMapa.tsx remover `COM_CENA` e usar `hrefCidade(cidade.id)` em "Ir para minha cidade"
- [X] T031 [US4] Mostrar `<Trilha>` só "Brasil" no nível Brasil (src/app/(mapa)/page.tsx ou HudBrasil.tsx), mantendo o layout atual do HUD

**Checkpoint**: P1 completo (US1 + US2 + US4) — spec cumpre o objetivo "escolher a cidade"

---

## Phase 6: User Story 3 - Prévia de prédios na cidade em foco (Priority: P2)

**Goal**: cidade em foco e câmera próxima mostram as construções reais das vagas (máx. 40, luz = aberta); demais cidades só aglomerado

**Independent Test**: focar Goiânia, aproximar e contar construções contra as vagas da cidade; sem foco nenhum prédio individual (quickstart 6–8)

- [X] T032 [US3] Criar src/components/brasil/PreviaCidade.tsx: para `cidadeEmFoco`, `previaDaCidade` → agrupa por categoria → um `<InstancedParts parts={FACADES[cat].parts} instances={…} shadows={false}/>` (de src/components/city/Instanced.tsx e src/components/city/facades.ts) por categoria, `scale` 0,045, `y` = `topoDaCelula` da cidade, `lit` = aberta, `dim` = encerrada, `rotY` voltado para o centro da espiral; visível só quando a distância câmera→cidade < 30 (checada em `useFrame`, alterna estado com histerese de 2 unidades)
- [X] T033 [US3] Quando a prévia está visível: passar para `Aglomerados` o conjunto `ocultar` com a cidade em foco e as cidades a < 1,2 unidade dela; RotulosCidade.tsx mostra "+N" no rótulo da cidade em foco quando `excedente > 0`; montar `<PreviaCidade/>` em BrasilCena.tsx no nível Estado

**Checkpoint**: todas as stories funcionando

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T034 [P] Criar tests/e2e/estado.spec.ts: `/` → GO → focar Anápolis pela lista → cartão com contagens (comparar com valores calculados em `agregados`) → "Entrar na cidade" → `/cidade/anapolis-go` com trilha → clicar "Goiás" → URL `/estado/go?cidade=anapolis-go` e Anápolis `aria-pressed=true` → `page.goBack()` duas vezes; vizinho GO → MG; `/cidade/nao-existe` → `/?aviso=cidade`; `/estado/go?cidade=campinas-sp` abre sem foco
- [X] T035 [P] Criar tests/e2e/teclado-estado.spec.ts: só teclado em `/estado/mg` — Tab até a lista, ↓/↑, Enter foca, região `aria-live` contém a frase do cartão, Esc limpa, Tab até "Entrar na cidade" e Enter navega
- [X] T036 [P] Criar tests/e2e/rotulos.spec.ts (SC-002): para as 27 UFs, em viewport 360×740 e 1920×1080, abrir `/estado/<uf>`, esperar fim do voo (estabilidade dos `boundingBox` dos rótulos em 2 leituras seguidas) e afirmar que nenhum par de rótulos visíveis se cruza
- [X] T037 [P] Criar tests/e2e/gaveta.spec.ts (projeto mobile "Pixel 7"): `/estado/sp` mostra gaveta recolhida; abrir pela alça (`aria-expanded`), tocar uma cidade, cartão aparece; nenhum rolar horizontal da página
- [X] T038 Orçamento de desempenho (R14): em `/estado/sp` com foco em São Paulo medir `renderer.info.render.calls` e triângulos (log temporário ou DevTools) — ≤ orçamento da 001 + 22 chamadas; anotar números em "Notas da implementação" abaixo
- [ ] T039 Conferir reduzir movimento (voo até cidade e enquadrar "+K" saltam direto) e `/estado/df` com Brasília + 5 regiões administrativas; percorrer [quickstart.md](quickstart.md) passos 1–20, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run build` (sem aviso de `useSearchParams` fora de Suspense)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sem dependências
- **Foundational (Fase 2)**: depende da Fase 1; bloqueia todas as stories
- **US1 (Fase 3)**: depende da Fase 2 — é o MVP
- **US2 (Fase 4)**: depende de US1 (foco vem dos aglomerados/rótulos; voo usa T019)
- **US4 (Fase 5)**: depende de US2 (CartaoCidade, PainelEstado); T026–T029 podem começar logo após a Fase 2 + T022
- **US3 (Fase 6)**: depende de US1 (Aglomerados, RotulosCidade) e T025 (voo até a cidade)
- **Polish (Fase 7)**: depois de todas

### Dentro das fases

- Fase 1: T001 → T002 → T003 · T004, T005 livres
- Fase 2: T006 depois de T002–T004 · T007 depois de T002/T005 · T008 → T009 · T010, T011, T012 livres (T012 precisa de T004) · T013 → T014 · T015, T016 (T016 precisa de T013)
- US1: T017, T018 em paralelo → T019 → T020 → T021
- US2: T022, T023 em paralelo → T024 → T025
- US4: T026, T027, T028, T029 em paralelo → T030 → T031
- US3: T032 → T033

### Parallel Opportunities

- Setup: T003, T004, T005 juntos
- Fase 2: T007, T010, T011, T012 juntos; depois T009, T014, T015, T016
- US1: T017 + T018
- US2: T022 + T023
- US4: T026 + T027 + T028 + T029
- Polish: T034–T037 juntos

## Parallel Example: User Story 4

```bash
# Depois de US2, em paralelo:
Task: "T026 página provisória em src/app/cidade/[slug]/page.tsx"
Task: "T027 trilha em src/app/cidade/goiania-go/page.tsx e src/app/remoto/page.tsx"
Task: "T028 FocoPelaUrl em src/components/brasil/FocoPelaUrl.tsx"
Task: "T029 EstadosVizinhos em src/components/brasil/EstadosVizinhos.tsx"
# Depois: T030 ligar "Entrar na cidade", T031 trilha no Brasil
```

## Implementation Strategy

### MVP First (User Story 1)

1. Fase 1 + Fase 2 (dados e lógica testados antes de qualquer 3D)
2. Fase 3 (US1) → validar quickstart 1–3 → **parar e demonstrar**

### Incremental Delivery

1. Somar US2 (cartão + lista) → demo: dá para comparar cidades
2. Somar US4 (entrar, trilha, vizinhos) → demo: objetivo da spec cumprido
3. Somar US3 (prévia de prédios) → demo
4. Polish → `/test`, `/security` (escopo leve: `?cidade=` e `[slug]`), `/review`

## Notes

- [P] = arquivos diferentes, sem dependência pendente
- Commit ao fim de cada fase (mensagem em inglês, como o histórico)
- `cidades.ts` e `geo.json` são gerados: nunca editar à mão (T002 regenera)
- `/cidade/[slug]` é provisória: a spec 003 substitui o conteúdo e remove `/cidade/goiania-go`
- Não mudar o comportamento da cidade 3D além da trilha e da posição da placa (T027)

## Notas da implementação (2026-10-22)

Desvios do plano, todos pequenos:

- **T001/T002**: as 5 regiões administrativas do DF ficaram com as coordenadas da tarefa; o script valida forma, porte, UF, caixa do Brasil e IBGE repetido. `geo.json` não mudou.
- **T007**: AC–RO não encosta na grade de 0,2° (fronteira curta); o teste de adjacência aceita até 2 células de distância — o motivo de `VIZINHOS` ser escrito à mão (R7).
- **T012**: espiral de Vogel com passo 0,32 (≈ largura de uma fachada na escala 0,045), não 0,11; `Previa` ganhou `raio`, usado para ocultar aglomerados vizinhos (no lugar do raio fixo de 1,2).
- **T017**: aglomerados em **2** `InstancedMesh` (acesos e apagados), não 1 — material emissivo não deixa "apagar" por cor de instância. Clique foca a cidade (sem foco por hover).
- **T018**: um `Html` fixo por cidade, escondido quando não lidera grupo — montar/desmontar `Html` a cada reagrupamento gerava avisos do React. Clicar no rótulo da cidade já em foco entra nela.
- **T019/T025**: o voo até a cidade em foco ficou dentro de `CameraMapa` (observa `cidadeEmFoco`), não em `mapaRuntime.irPara`: no link direto (`?cidade=`) o canvas monta depois do painel e o voo se perdia. `irPara` foi removido.
- **T021**: no nível Estado, o rótulo "UF · N" da própria UF some (colidia com os das cidades) e clicar no relevo do próprio estado limpa o foco.
- **T024**: página `/estado/[uf]` lê `params` dentro de `<Suspense>` — o Next 16.4 (validação de navegação instantânea) acusava "URL data outside Suspense" já na versão da 001. Barra inferior do `ControlesMapa` sobe no celular para não ficar sob a gaveta.
- **T027**: trilha nas páginas `/cidade/goiania-go` e `/remoto` (o `Hud` é comum às duas); a placa do `Hud` desceu.
- **T031**: trilha "Brasil" no `HudBrasil`, acima da placa.
- **T034–T037**: E2E rodados contra `next start -p 3200` (a 3000 estava com o dev server). 15 + 3 passam, 11 pulados por projeto (desktop/mobile); SC-002 verificado nas 27 UFs em 360 px e 1920 px (5,3 min).
- **T038**: medido por contagem de chamadas WebGL (média de 30 quadros, 1440×900): Brasil ≈ 7, `/estado/sp` ≈ 6, `/estado/sp?cidade=sao-paulo-sp` com prévia ≈ 19 — dentro do orçamento (001 + 22).

**T039 em aberto**: lint, testes unitários (59), E2E e build passam; conferido por screenshot o nível Estado (GO, SP celular 360 px), foco pela URL, prévia de Goiânia e a página provisória de Anápolis. "Reduzir movimento" reaproveita o corte da 001 (`k = 1` em `CameraMapa`), não testado com a opção do sistema ligada. Falta a parte manual: leitor de tela real (NVDA/VoiceOver), celular físico e cronometrar SC-001/SC-003 com pessoas.

Aviso conhecido (só em desenvolvimento, também em `/` desde a 001): "Attempted to synchronously unmount a root while React was already rendering", vindo do `Html` do drei ao desmontar.
