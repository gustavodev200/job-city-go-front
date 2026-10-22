---

description: "Task list for 004 Busca, filtros e lista de vagas"
---

# Tasks: Busca, filtros e lista de vagas

**Input**: Design documents from `/specs/004-busca-filtros-lista/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluídos (padrão 001–003 e quickstart): Vitest para lógica pura e
invariantes do mock na Fase 2; Playwright na fase final.

**Organization**: por user story (US1–US4). Ordem: dados → lógica pura →
fundação (store, hooks, agregados reativos) → US1 → US2 → US3 → US4 → polish.

## Format: `[ID] [P?] [Story] Description`

## Regras para quem implementa

- Ler `AGENTS.md` (Next 16: `params` é Promise; `useSearchParams` em `<Suspense>`).
- Semântica dos filtros: [research R5](research.md); ordenação R6; recorte R7.
- URL: [contracts/filtros-url.md](contracts/filtros-url.md). UI e textos exatos:
  [contracts/painel-vagas.md](contracts/painel-vagas.md). Formas: [data-model](data-model.md).
- O mock antigo **não muda** (R3): ids, cidades, categorias, status, modelo e
  contagens sem filtro iguais às de hoje. Testes de 001–003 seguem verdes.
- Sem filtro ativo, toda tela de 001–003 mostra os mesmos números de hoje.
- Estilo visual: reutilizar `bloco-notas`, `placa-madeira`, `fonte-serifa` e as
  cores âmbar já usadas nos HUDs.

---

## Phase 1: Setup (dados)

- [X] T001 Em src/data/vagas.ts: tipos `Turno`, `Contrato`, `TURNO_LABEL`, `CONTRATO_LABEL`, `ORDEM_TURNOS`, `ORDEM_CONTRATOS`; em `VagaBase` adicionar `turno`, `contrato`, `publicadaEm` e tornar `faixaSalarial` opcional; em `VagaHibrida` adicionar `diasPorSemana`; exportar `REFERENCIA_MOCK = "2026-10-01"`; preencher à mão os 40 objetos (ex.: vg-012 escala, vg-017 noite, vg-020 estágio, 3–4 vagas sem salário, `diasPorSemana` coerente com `frequencia`)
- [X] T002 Ajustar consumidores de `faixaSalarial` opcional: src/components/city/PergaminhoVaga.tsx mostra "A combinar" quando ausente; conferir src/lib/brasil/previa.ts e demais usos com `npx tsc --noEmit`
- [X] T003 Em src/data/brasil/vagas.ts: pós-passo com `criarAleatorio(SEMENTE + 1)` sobre `lista` pronta (contrato com pesos do data-model, turno por categoria, `publicadaEm` em REFERENCIA_MOCK − 0..59 dias, 15% sem salário, salário de estágio/aprendiz ≤ 0,6 × teto, `diasPorSemana` derivado de `frequencia`); só para vagas `vn-*` (as escritas à mão já vêm preenchidas); garantir ≥ 1 aberta Saúde + CLT + noite
- [X] T004 Ampliar tests/unit/vagas.test.ts com as invariantes do data-model (cobertura de turno/contrato, sem salário ≥ 10%, datas no intervalo, coerência `diasPorSemana`↔`frequencia`, remotas sem `escala`) e um snapshot de ids/status/cidadeId/modelo/categoria para provar que o mock antigo não mudou; `npm test` verde

---

## Phase 2: Foundational (lógica pura + store + agregados reativos)

**⚠️ CRITICAL**: nenhuma user story começa antes desta fase

### Lógica pura (com testes)

- [X] T005 [P] Criar src/lib/texto.ts com `normalizar()` (movido de src/components/brasil/EscolherCidade.tsx, que passa a importar daqui)
- [X] T006 [P] Criar src/lib/busca/filtro.ts: `RaioKm`, `RAIOS`, `Ordem`, `FiltroBusca`, `FILTRO_VAZIO`, `contarAtivos`, `passaNoFiltro(v, f, ref)`, `filtrarVagas(vagas, f)` (R5) e tests/unit/filtro.test.ts (cada linha de R5; 2000–3200 × 2500–4000 passa; "medico" acha "Médico"; sem salário passa salvo `somenteComSalario`; interior exclui presencial e híbrida 2 dias; categoria marcada exclui remotas)
- [X] T007 [P] Criar src/lib/busca/recorte.ts (`Recorte`, `noRecorte`, `rotuloRecorte` → "no Brasil" / "em Goiás" / "em Goiânia" / "no Bairro Remoto")
- [X] T008 [P] Criar src/lib/busca/perto.ts (`distanciaDaVaga`, `anelDoRaio(ref, raioKm, n = 64)` com fórmula de destino + `projetar`) e tests/unit/perto.test.ts (Anápolis 25/50 km sem Goiânia; 100 km com Goiânia; remota fora da abrangência excluída; `incluirRemotas = false`; anel fecha e tem n pontos)
- [X] T009 [P] Criar src/lib/busca/ordenar.ts (`ordenarVagas(vagas, ordem, { ref, hoje })`, R6) e tests/unit/ordenar.test.ts (nunca 3 patrocinadas seguidas; todas as não patrocinadas presentes; abertas antes de encerradas; "A combinar" no fim de Maior salário; remotas no fim de Distância; desempate por id)
- [X] T010 [P] Criar src/lib/busca/afrouxar.ts (`sugerirAfrouxar(vagas, f, recorte)` → grupo cuja remoção traz mais vagas, com rótulo humano ex. `Noite`, `Saúde`, `Perto de mim`) com testes em tests/unit/filtro.test.ts
- [X] T011 [P] Criar src/lib/busca/url.ts (`FiltrosUrlSchema`, `filtroDeParams(URLSearchParams)`, `filtroParaParams(f)`, `CHAVES_FILTRO`) e tests/unit/filtros-url.test.ts (ida e volta; cada inválido do contrato ignorado isoladamente; chaves em ordem fixa; parâmetros não-filtro preservados)

### Store, hooks e agregados reativos

- [X] T012 Criar src/stores/filtros.ts (`useFiltrosStore` sem persist: estado `FiltroBusca` + `iniciado`, `definir`, `alternar`, `limpar`, `iniciarDaUrl`); teste em tests/unit/stores.test.ts
- [X] T013 Em src/lib/brasil/agregados.ts remover as constantes de módulo filtráveis (`AGREGADO_UF`, `AGREGADO_CIDADE`, `AGREGADO_REMOTO`, `LIMITES_FAIXAS`, `TOTAL_ABERTAS_BRASIL`, `faixaCalor`) e expor `calcularAgregados(vagas)` → `{ porUf, porCidade, remoto, limites, totalBrasil }`; `cidadesDoEstado(uf)` continua sobre todas as vagas (lista própria memorizada); ajustar tests/unit/agregados*.test.ts
- [X] T014 Criar src/components/busca/usarBusca.ts: `useFiltro`, `useVagasFiltradas` (memo por filtro), `useAgregados` (memo por lista, com `faixa(uf)`), `useRecorte` (pathname → Recorte), `useSincronizarFiltrosUrl` (R1: 1ª montagem URL→store; depois store→URL via `history.replaceState` preservando parâmetros não-filtro)
- [X] T015 Migrar consumidores para `useAgregados()` sem mudar comportamento: src/components/brasil/{HudBrasil,ResumoUf,ListaEstados,RotulosUf,Relevo,BrasilPlano,IlhaRemota,ControlesMapa,EstadosVizinhos,ListaCidades,CartaoCidade,RotulosCidade,Aglomerados,PainelEstado,FocoPelaUrl,BrasilCena}.tsx; `npx tsc --noEmit`, `npm test` e `npm run test:e2e` verdes
- [X] T016 Montar `useSincronizarFiltrosUrl` em src/app/(mapa)/layout.tsx (via componente cliente em `<Suspense>`) e em src/components/city/NivelCidade.tsx

**Checkpoint**: filtro existe, URL ↔ store funciona, mapa lê contagens filtradas (ainda sem UI de filtro).

---

## Phase 3: User Story 1 — Lista de vagas ao lado do mapa (P1) 🎯 MVP

**Goal**: painel "Vagas" em todos os níveis com lista do recorte, detalhe e "Ver no mapa".

**Independent Test**: só teclado/leitor de tela, achar uma vaga e abrir detalhes sem tocar no mapa.

- [X] T017 [P] [US1] Extrair o miolo de src/components/city/PergaminhoVaga.tsx para src/components/busca/DetalhesVaga.tsx (`DetalhesVaga({ vaga, tituloRef? })`, sem `useMundo`/`useGameStore`); pergaminho passa a envolvê-lo sem mudança visual
- [X] T018 [P] [US1] Criar src/components/busca/ItemVaga.tsx com `SelosVaga` (Patrocinado, Híbrida Nx/semana ou 1x/mês, Encerrada) e linhas do contrato; botão no título; link "Ver no mapa" (`hrefCidade(id)` + `?vaga=` ou `/remoto?vaga=`, com a query de filtro atual)
- [X] T019 [P] [US1] Criar src/components/busca/Gaveta.tsx: gaveta inferior com alturas fechada/meia/cheia, arraste por pointer events no puxador, botão `aria-expanded`, sem animação com `prefers-reduced-motion`
- [X] T020 [US1] Criar src/components/busca/ListaVagas.tsx: `<ul aria-label="Resultados">`, progressiva (30 + 30 por `IntersectionObserver` ou botão "Mostrar mais {k}"), volta a 30 quando a lista muda
- [X] T021 [US1] Criar src/components/busca/PainelVagas.tsx: recorte via `useRecorte`, vagas = `ordenarVagas(filtradas no recorte)`; título "Vagas {rotuloRecorte}"; região viva `role="status"` com "{N} vagas" (debounce 400 ms); vistas lista ⇄ detalhe com gestão de foco e `Esc`; desktop coluna direita `role="complementary"` (aberto por padrão ≥ 1024 px), celular `Gaveta`; botão "Vagas (N)" e atalho `V` (ignora foco em campo de texto)
- [X] T022 [US1] Montar PainelVagas em src/app/(mapa)/layout.tsx com o mapa ocupando a largura restante no desktop (canvas não coberto; câmera/resize OK) e mover `ResumoUf` do HudBrasil para acima da lista quando o painel está aberto (src/components/brasil/HudBrasil.tsx)
- [X] T023 [US1] Nível Estado celular: unificar gaveta de cidades e de vagas com abas "Cidades | Vagas" (`role="tablist"`) em src/components/brasil/PainelEstado.tsx
- [X] T024 [US1] Montar PainelVagas em src/components/city/NivelCidade.tsx e botão "Vagas (N)" no HUD (src/components/city/Hud.tsx); teclas de movimento do personagem não disparam com foco dentro do painel; "Ver no mapa" na mesma cidade usa `router.push` com `?vaga=`

**Checkpoint**: US1 utilizável sem filtros (MVP).

---

## Phase 4: User Story 2 — Filtrar por critérios (P1)

**Goal**: filtros combináveis afetando lista e mapa, persistidos na URL.

**Independent Test**: "Saúde + CLT + noite" → contagens Brasil/Estado/Cidade/lista batem com o mock.

- [X] T025 [US2] Criar src/components/busca/FiltrosBusca.tsx: busca (debounce 200 ms, Zod ≤ 60), `<details>` "Mais filtros" com fieldsets Categoria, Modalidade, Faixa salarial (Mínimo/Máximo validados com Zod + "Somente com salário informado"), Turno, Tipo de contrato; barra "Filtros ativos (N)" + "Limpar"; `<select>` "Ordenar por" (Menor distância só com cidade de referência); montar no PainelVagas
- [X] T026 [US2] Estado vazio em src/components/busca/ListaVagas.tsx: "Nenhuma vaga com esses filtros.", sugestão `sugerirAfrouxar` com botão "Tirar "{rótulo}"" e "Limpar filtros"
- [X] T027 [P] [US2] Criar src/components/busca/ChipFiltros.tsx ("Filtros ativos (N) · Limpar" sobre o mapa quando N > 0) e montar em src/app/(mapa)/layout.tsx e src/components/city/NivelCidade.tsx
- [X] T028 [US2] Nível Estado: cidade com 0 vagas filtradas esmaecida (src/components/brasil/Aglomerados.tsx, RotulosCidade.tsx) e fora da lista com a linha "N cidades sem vagas com esses filtros" (src/components/brasil/ListaCidades.tsx)
- [X] T029 [US2] Nível Cidade: em src/components/city/Buildings.tsx `dim = encerrada || !passa`, `lit = aberta && passa`, sem marcador patrocinado/selo híbrido para quem não passa (R11); placa/legenda "N de M vagas no filtro" em src/components/city/Hud.tsx

**Checkpoint**: US1 + US2 completas.

---

## Phase 5: User Story 3 — Perto de mim (P1)

**Goal**: raio a partir da cidade do perfil ou digitada, ordenação e distância por item, anel no estado.

**Independent Test**: Anápolis/GO raio 50 km → só cidades a ≤ 50 km.

- [X] T030 [US3] Em src/components/busca/FiltrosBusca.tsx: alternância "Perto de mim"; sem cidade (perfil ou `perto`) mostra `EscolherCidade` (src/components/brasil/EscolherCidade.tsx passa a chamar `aoEscolher(cidadeId)`); ativo mostra "A partir de {Cidade – UF}" (trocar), rádios "Raio" 10/25/50/100/200 e "Incluir remotas"; ordem padrão vira Distância
- [X] T031 [US3] Distância "{N} km" em src/components/busca/ItemVaga.tsx quando há cidade de referência
- [X] T032 [US3] Criar src/components/brasil/AnelRaio.tsx (anel `Line` do drei sobre o relevo a partir de `anelDoRaio`) e variante `<polygon>` em src/components/brasil/BrasilPlano.tsx; montar em src/components/brasil/BrasilCena.tsx no nível Estado quando `perto` ativo

**Checkpoint**: US1–US3 completas.

---

## Phase 6: User Story 4 — Posso morar no interior (P2)

**Goal**: atalho em destaque (remotas + híbridas ≤ 1 dia/semana).

**Independent Test**: atalho ativo → nenhuma presencial, nenhuma híbrida > 1 dia/semana.

- [X] T033 [US4] Botão-alternância `aria-pressed` "Posso morar no interior" (subtítulo "Remotas e híbridas até 1 dia/semana") em destaque no topo de src/components/busca/FiltrosBusca.tsx
- [X] T034 [US4] Realce do Bairro Remoto com `interior` ativo em src/components/brasil/IlhaRemota.tsx e no atalho de src/components/brasil/ControlesMapa.tsx (contagem filtrada já vem de T015)

---

## Phase 7: Polish & Cross-Cutting

- [X] T035 [P] Criar tests/e2e/busca.spec.ts com os cenários (E2E) do quickstart (1, 2, 5, 6, 7, 8, 10); usar `?semWebgl=1` onde o 3D não importa
- [X] T036 [P] Criar tests/e2e/teclado-lista.spec.ts: Tab até "Vagas", buscar, ouvir status "N vagas", abrir detalhe, Esc volta, Esc fecha (SC-003)
- [X] T037 Ajustar E2E existentes afetados pelo painel/abas (tests/e2e/gaveta.spec.ts, estado.spec.ts, cidade.spec.ts)
- [X] T038 Conferir desempenho: filtrar + agregar < 5 ms em tests/unit/filtro.test.ts; `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run test:e2e`, `npm run build` verdes
- [X] T039 Marcar quickstart cumprido / registrar desvios em specs/004-busca-filtros-lista/quickstart.md

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → US3 → US4 → Polish.
- US2/US3/US4 dependem do painel da US1 (montam controles nele); US3 e US4 são independentes entre si.
- Dentro da Fase 2: T005–T011 em paralelo; T012 → T014 → T015/T016; T013 antes de T014.

## Parallel Example

```text
Fase 2: T005, T006, T007, T008, T009, T010, T011 juntos (arquivos distintos).
US1:    T017, T018, T019 juntos; depois T020 → T021 → T022/T023/T024.
Polish: T035 e T036 juntos.
```

## Implementation Strategy

MVP = Fases 1–3 (lista acessível em todos os níveis). Depois US2 (filtros
no mapa), US3 (perto de mim), US4 (atalho) — cada uma testável sozinha
pelo seu Independent Test.
