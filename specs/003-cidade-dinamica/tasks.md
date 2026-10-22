---

description: "Task list for 003 Cidade dinâmica e Bairro Remoto"
---

# Tasks: Cidade dinâmica e Bairro Remoto (nível cidade)

**Input**: Design documents from `/specs/003-cidade-dinamica/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluídos (research R13): Vitest para mundo/deslocamento/abrangência/
schemas na Fase 2; Playwright na fase final.

**Organization**: por user story (US1–US4). Ordem: Fundação (cena lendo o mundo)
→ US1 → US2 → US4 → US3 → transversais → polish.

## Format: `[ID] [P?] [Story] Description`

## Regras para quem implementa

- Ler `AGENTS.md` (Next 16: `params` é Promise; `useSearchParams` em `<Suspense>`).
- **Geometria de referência** (mantém a cidade atual quando N = 6): quarteirão 14,
  passo 20, rua 6, `LOT_TOP` 0,18; centros `(i − ⌊N/2⌋ + 0,5) · 20` (garante rua em
  z = 0 para a avenida da ponte); rio em `maxXcidade + 23` (= 86 quando N = 6),
  meia-largura 8; ponte `rio.x ± 13`; colina (só no remoto) de `rio.x + 12` a
  `rio.x + 22`, altura 3; vila começa em `rio.x + 22`, quarteirões 14 com rua 4,
  4 casas por quarteirão em (±3,4, ±3,4) — como `data/vagas.ts` faz hoje.
- Portal: cidade → margem leste além da ponte (`x > ponte.x1 + 3`, |z| < 4);
  remoto → margem oeste (`x < ponte.x0 − 3`, |z| < 4). Nascimento "ponte": cidade
  `(ponte.x0 − 2, 0)`; remoto `(ponte.x1 + 2, 0)` — nunca dentro do portal.
- Componentes da cena param de ler constantes de módulo: tudo vem de
  `useMundo()`; cálculos derivados (árvores, postes, outdoors, instâncias) em
  `useMemo` ou cache `WeakMap<Mundo, …>`.
- Contratos: [rotas-e-parametros](contracts/rotas-e-parametros.md),
  [pergaminho-e-hud](contracts/pergaminho-e-hud.md); dados: [data-model](data-model.md).

---

## Phase 1: Setup (dados)

- [ ] T001 [P] Em src/data/brasil/estados.ts adicionar `fuso: -5 | -4 | -3` a cada estado (AC −5; AM, MT, MS, RO, RR −4; demais −3)
- [ ] T002 Em src/data/vagas.ts: tipo `Abrangencia` (data-model), `VagaRemota.estado` → `abrangencia`, `destaque?: { ate: string }` em `VagaBase`, remover `x`/`z` de `VagaBase` e dos 40 objetos; converter abrangências das vagas remotas escritas à mão; marcar 1 vaga de Goiânia com `destaque: { ate: "2099-12-31" }`
- [ ] T003 Em src/data/brasil/vagas.ts gerar `abrangencia` estruturada no lugar do texto (mesmos casos sorteados hoje: Brasil inteiro, UF de origem, UF + vizinha, fuso de Brasília), ajustar `SemPosicao` (não há mais `x`/`z`), marcar 1 vaga remota gerada com destaque; atualizar tests/unit/vagas.test.ts se necessário (`npm test` verde)

---

## Phase 2: Foundational (lógica pura + fundação da cena)

**⚠️ CRITICAL**: nenhuma user story começa antes desta fase

### Lógica pura (com testes)

- [ ] T004 [P] Criar src/lib/cidade/abrangencia.ts (`rotuloAbrangencia`, `atendeAbrangencia`, `avisoAbrangencia`) e tests/unit/abrangencia.test.ts (textos do contrato; fuso usa `estados[uf].fuso`)
- [ ] T005 [P] Criar src/lib/cidade/deslocamento.ts (`estimarDeslocamento`, `textoDeslocamento(est, frequencia?)`) e tests/unit/deslocamento.test.ts (Trindade→Goiânia ≈ 25 km / 35 min; mesma cidade; mínimo 10 min)
- [ ] T006 Criar src/lib/cidade/mundo.ts: constantes de escala, tipos `Mundo`/`Lote`/`VagaSpot`/`Rect`, `gerarMundo(entrada)` para `cidade` e `remoto` conforme data-model + regras desta lista (grade, praça, lotes por ordem do mock, estacionamento, casas, carros, rio/ponte/colina/portal, nascimentos, limites, spots, colisores, `alturaDoChao`, `alturaDoPasso`, `bloqueado`, `dentroDePredio`, `vagaProxima`, `noPortal`), `mundoDaCidade(id)` e `mundoRemoto()` memorizados
- [ ] T007 Criar tests/unit/mundo.test.ts: toda vaga da cidade em exatamente um lote e nenhuma de outra cidade (todas as 127 cidades, SC-002); remoto só remotas (50); praça livre; N mínimo 2 e tamanhos para 1, 3, 28 e 150 vagas sintéticas; Goiânia N = 6 com praça em (−10, 10) e rio em 86; estabilidade (gerar 2× igual; acrescentar vaga no fim não move as outras); nenhum lote sobreposto a outro, à praça ou ao estacionamento; `bloqueado` fora dos limites, na água fora da ponte, dentro de prédio; nascimentos não bloqueados e fora do portal; `gerarMundo` de 150 vagas < 5 ms
- [ ] T008 Em src/lib/brasil/rotas.ts adicionar `ChegadaSchema`, `DeSchema`, `vagaSchema(ids)`, `hrefRemoto(de?)`, `hrefCidade(id, { chegada? })`; tests/unit/rotas-nivel-cidade.test.ts

### Fundação da cena (comportamento igual ao de hoje, agora pelo mundo)

- [ ] T009 Criar src/components/city/mundo.tsx: `MundoContext`, `MundoProvider`, `useMundo()` (erro claro fora do provider)
- [ ] T010 Remover `travel`/`travelTo`/`finishTravel`/`Travel` de src/stores/game.ts
- [ ] T011 [P] Adaptar src/components/city/Terrain.tsx: chão dimensionado por `mundo.limites` + 120 de margem, cores por `mundo.alturaDoChao`, rio/ponte do mundo (colina só no remoto)
- [ ] T012 [P] Adaptar src/components/city/Roads.tsx: quarteirões, calçadas, lotes, estacionamento, faixas, postes, bancos e praça a partir do mundo (cidade); no remoto: ruas de terra da vila, rampa da ponte e avenida curta da margem oeste; postes exportados por função `postesDoMundo(mundo)` (substitui `LAMP_HEADS`) e src/components/city/DayNight.tsx passa a usá-la via `useMundo()`
- [ ] T013 [P] Adaptar src/components/city/Trees.tsx: plantio por função `arvoresDoMundo(mundo)` (cache por mundo, semente fixa + id do mundo), mesma regra por quarteirão/praça/estacionamento/vila/campo/margens; `isInsideCanopy` vira `dentroDeCopa(arvores, x, y, z)`
- [ ] T014 Adaptar src/components/city/Buildings.tsx: instâncias por categoria, selo híbrido, casas decorativas, carros, casas remotas, sombras de contato, marcadores e anel a partir de `mundo.lotes`/`spots`/`colisores` (layout.ts deixa de existir; mover o que restar para src/lib/cidade/mundo.ts)
- [ ] T015 Adaptar src/components/city/Player.tsx: nascimento por prop (`"praca" | "ponte"` → `mundo.nascimento`), colisão/altura/vaga próxima pelo mundo, câmera evita prédios e copas do mundo; prop `aoAtravessar()` chamada uma vez ao entrar em `mundo.noPortal`; remover lógica de viagem
- [ ] T016 [P] Adaptar src/components/city/Minimap.tsx para desenhar quarteirões/ruas/rio/ponte/vila e spots do mundo
- [ ] T017 [P] Adaptar src/components/city/Outdoors.tsx: candidatos derivados do mundo (avenida principal x = rua central, avenida da ponte z = 0, ruas em volta da praça, estrada da vila no remoto), encaixe com `mundo.colisores` e copas; anunciantes por embaralhamento semeado pela região da cidade (`estados[uf].regiao`; remoto: semente fixa)
- [ ] T018 Adaptar src/components/city/CityScene.tsx (sem `areaInicial`; recebe `nascimento` e `aoAtravessar` para o Player) e criar src/components/city/NivelCidade.tsx: cliente, recebe `mundo` (por id), monta `MundoProvider` + `CityScene` (dynamic, ssr false) + `Hud` + `OutdoorOverlay` + `ControleHora` + trilha; lê `?chegada`/`?de`/`?vaga` (Suspense, Zod) e navega ao atravessar
- [ ] T019 Adaptar src/components/city/Hud.tsx e src/components/city/PergaminhoVaga.tsx para buscar vagas e contagens em `useMundo()` (sem `data/vagas.ts` e sem `data/mapa.ts`); trocar cartões "Ir para cidade/vila" por botão de portal (texto do contrato)
- [ ] T020 Rotas: src/app/cidade/[slug]/page.tsx monta `NivelCidade` com o mundo da cidade (mantém Zod/redirect/generateStaticParams); remover src/app/cidade/goiania-go/; src/app/remoto/page.tsx monta `NivelCidade` com o mundo remoto; apagar src/data/mapa.ts e src/components/city/layout.ts (sem imports restantes)

**Checkpoint**: `/cidade/goiania-go` (agora dinâmica) parece e se comporta como a cidade antiga; `npm test`, lint e build verdes

---

## Phase 3: User Story 1 - Explorar qualquer cidade (P1) 🎯 MVP

**Goal**: qualquer cidade do mock abre com as suas vagas, tamanho proporcional, não vazia

**Independent Test**: quickstart 1–4

- [ ] T021 [US1] Conferir e ajustar cidades pequenas (1–3 vagas, 3×3): casas decorativas e árvores preenchem quarteirões livres; estacionamento só se sobrar quarteirão; ajustar regra em src/lib/cidade/mundo.ts se a cidade parecer vazia
- [ ] T022 [US1] Placa do HUD com "Nome · UF" e "N vagas abertas de M" do mundo (src/components/city/Hud.tsx); remoto: "Bairro Remoto" / "vagas remotas"
- [ ] T023 [US1] Limites variam com o tamanho: conferir câmera e personagem nas bordas de uma cidade 3×3 e de uma 14×14 sintética (sem escapar, sem câmera dentro de prédio)

**Checkpoint**: entrar em São Paulo, Anápolis e Gurupi funciona

---

## Phase 4: User Story 2 - Categoria e status (P1)

**Goal**: leitura da construção — fachada por categoria, luz por status, placa "Encerrada"

**Independent Test**: quickstart 5–6

- [ ] T024 [P] [US2] Em src/components/city/facades.ts criar `PLACA_ENCERRADA` (placa de madeira com `label: { text: "Encerrada" }`) e em src/components/city/Buildings.tsx desenhá-la na frente de toda vaga encerrada (cidade e remoto)
- [ ] T025 [US2] Legenda do HUD: 7 categorias em `ORDEM_CATEGORIAS`, ícone, rótulo de setor e contagem de abertas do mundo (0 esmaecido); remoto: linha "Casa remota" (src/components/city/Hud.tsx)
- [ ] T026 [US2] Pergaminho: vaga encerrada com selo "Encerrada" e botão "Vaga encerrada" desabilitado (conferir o existente com dados do mundo)

---

## Phase 5: User Story 4 - Bairro Remoto nacional (P1)

**Goal**: todas as remotas num bairro único, acessível pelo mapa e por qualquer cidade, com volta

**Independent Test**: quickstart 10–12

- [ ] T027 [P] [US4] Criar src/components/city/Portal.tsx: arco com placa ("Bairro Remoto" na cidade; "Voltar para <cidade>"/"Voltar ao mapa" no remoto) na posição `mundo.portal`; montar em CityScene
- [ ] T028 [US4] Navegação da travessia em NivelCidade: cidade → `hrefRemoto(id)`; remoto → `hrefCidade(de, { chegada: "ponte" })` ou `/`; botão do HUD faz o mesmo (teclado); nascer na ponte com `?chegada=ponte` (cidade) e com `?de` (remoto)
- [ ] T029 [US4] Pergaminho de vaga remota: "Remoto — <abrangência>", "Empresa de <Estado>" e aviso `avisoAbrangencia` (perfil de src/stores/perfil.ts), `role="note"` (src/components/city/PergaminhoVaga.tsx)
- [ ] T030 [US4] Ilha/atalho do mapa do Brasil continuam levando a `/remoto` (conferir src/components/brasil/ControlesMapa.tsx e IlhaRemota.tsx; usar `hrefRemoto()`)

---

## Phase 6: User Story 3 - Híbridas com deslocamento (P2)

**Goal**: selo de frequência e deslocamento estimado a partir da cidade do perfil

**Independent Test**: quickstart 7–9

- [ ] T031 [US3] Pergaminho presencial/híbrida: linha de deslocamento (`textoDeslocamento`) com perfil; sem perfil, botão "Informe sua cidade para calcular o deslocamento" que abre `EscolherCidade` (src/components/brasil/EscolherCidade.tsx) num cartão
- [ ] T032 [US3] Conferir selo "Híbrido" nas fachadas híbridas (Buildings) e frequência no pergaminho e no balão

---

## Phase 7: Transversais

- [ ] T033 [P] Patrocinado (FR-011): em Buildings, marcador 1,5× com brilho para lotes com destaque ativo (`ate ≥ hoje`) e etiqueta `Html` "Patrocinado" acima; no pergaminho, selo "Patrocinado"
- [ ] T034 `?vaga=<id>` em NivelCidade: valida com `vagaSchema` (ids do mundo), põe o personagem em frente ao prédio e abre o pergaminho (`selectVaga`)

---

## Phase 8: Polish

- [ ] T035 [P] Criar tests/e2e/cidade.spec.ts: entrar em Anápolis pelo mapa (placa "Anápolis · GO", legenda soma = abertas do mock calculadas no teste a partir do texto da lista do estado), botão "Bairro Remoto" → `/remoto?de=anapolis-go` → "Voltar para Anápolis" → `/cidade/anapolis-go?chegada=ponte`; `/remoto` direto → "Voltar ao mapa" → `/`; `?vaga=` de vaga encerrada abre pergaminho com botão desabilitado; `/remoto?de=xx` mostra "Voltar ao mapa"
- [ ] T036 Ajustar tests/e2e/estado.spec.ts (cidade agora é cena 3D: trilha continua; sem texto "chega em breve")
- [ ] T037 Desempenho: medir chamadas de desenho em Goiânia e numa cidade sintética grande (log temporário) e tempo até andar; anotar em Notas
- [ ] T038 Percorrer [quickstart.md](quickstart.md), `npm run lint`, `npm test`, `npm run test:e2e`, `npm run build`

---

## Dependencies & Execution Order

- Fase 1 → Fase 2 (T004–T008 livres entre si depois de T002/T003; T009–T020 em sequência aproximada: T009, T010 → T011–T017 → T018 → T019 → T020)
- US1, US2, US4, US3 dependem da Fase 2; US4 depende de T018/T019; US3 de T019
- Transversais depois de US2; Polish por último

### Parallel Opportunities

- T001 com T002; T004 + T005 (+ T008); T011, T012, T013, T016, T017 (arquivos diferentes, todos dependem de T006/T009); T024 com T025; T027 com T029; T035 com T037

## Implementation Strategy

MVP = Fases 1–3 (qualquer cidade com o personagem). Depois US2, US4, US3,
transversais, polish → `/test`, `/security` (escopo: `?de`, `?chegada`, `?vaga`, `[slug]`), `/review`.

## Notes

- Commit ao fim de cada fase (mensagem em inglês)
- `src/data/mapa.ts` e `src/components/city/layout.ts` somem nesta feature

## Notas da implementação

(preencher durante `/speckit-implement`)
