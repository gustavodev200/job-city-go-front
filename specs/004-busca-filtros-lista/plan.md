# Implementation Plan: Busca, filtros e lista de vagas

**Branch**: `004-busca-filtros-lista` | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-busca-filtros-lista/spec.md`

## Summary

Um **filtro de busca único** (`FiltroBusca` em `useFiltrosStore`, espelhado
na URL por `history.replaceState`) passa a governar lista e mapa nos
quatro níveis. Vagas ganham `turno`, `contrato`, `publicadaEm`, salário
opcional e `diasPorSemana` (híbridas), gerados num pós-passo com semente
própria para não alterar o mock de 001–003. Lógica pura nova em
`src/lib/busca/` (filtrar, recorte, perto de mim, ordenar com patrocinadas
limitadas, sugerir afrouxar, URL). Os agregados de 001/002 deixam de ser
constantes de módulo e viram `useAgregados()` sobre a lista filtrada; a
cidade esmaece prédios fora do filtro reaproveitando `dim`/`lit`. UI nova:
`PainelVagas` (coluna direita no desktop, gaveta arrastável no celular)
com filtros, atalho "Posso morar no interior", "Perto de mim" com raio,
lista progressiva e `DetalhesVaga` extraído do pergaminho. Detalhes em
[research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5, React 19.3, Next.js 16.4 (App Router,
`cacheComponents: true`)

**Primary Dependencies**: three 0.186, @react-three/fiber 9,
@react-three/drei 10 (`Line` para o anel do raio), zustand 5, zod 4,
Tailwind 4 — **nenhuma dependência nova**

**Storage**: sem servidor; mock em `src/data/`; filtros na URL (sem chave
nova de `localStorage`); cidade de referência reaproveita `jcg:perfil`

**Testing**: Vitest (filtro, perto, ordenar, URL, agregados, invariantes
do mock) + Playwright (busca, teclado)

**Target Platform**: navegadores com WebGL 2 (e fallback SVG da 001),
desktop e celular

**Project Type**: aplicação web (frontend único)

**Performance Goals**: resultado de filtro < 0,5 s com o mock completo
(SC-002) — orçamento real: filtrar + agregar ~700 vagas < 5 ms; lista
rola fluida com centenas de itens

**Constraints**: filtro não reconstrói o mundo da cidade (só instâncias);
sem nova ida ao servidor ao mudar filtro; páginas continuam
pré-renderizadas; teclado + leitor de tela em tudo (FR-011)

**Scale/Scope**: ~700 vagas (660 geradas + 40 escritas à mão), 127
cidades, 27 UFs; ~14 componentes adaptados a `useAgregados()`; ~8
componentes novos

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Preset `prisma-postgres` (sem backend neste repositório). Skills: `frontend/*`,
`testing`, `performance`, `security`.

| Princípio | Situação | Observação |
|---|---|---|
| I. Stack declarada | ✅ PASS | Só frontend; `project.config.json` lido |
| II. Zod na borda | ✅ PASS | Todos os parâmetros de filtro da URL, campo de busca e campos de salário validados ([contrato](contracts/filtros-url.md)); `.catch` por campo |
| III. Autorização no servidor | ✅ N/A | Sem ação sensível; busca sobre mock público |
| IV. RLS | ✅ N/A | Sem Supabase |
| V. Segurança antes do review | ✅ PASS | Entrada por URL e texto livre → `/security` escopo leve (injeção via query, texto renderizado só como texto React) |
| VI. YAGNI | ✅ PASS | Sem dependência nova; sem virtualização (R10); sem `persist` de filtro (R1); selos sem dado ficam para 006/009/011 (R13); agregados reaproveitam funções puras existentes |
| VII. Rastreabilidade | ✅ PASS | artefatos em `specs/004-busca-filtros-lista/` |

**Re-check pós-design (Fase 1)**: sem violações. Abstrações novas —
`useFiltrosStore`, `useAgregados`, `useSincronizarFiltrosUrl` — são o
próprio requisito (filtro único valendo para lista e mapa, FR-005/FR-008).

## Project Structure

### Documentation (this feature)

```text
specs/004-busca-filtros-lista/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── filtros-url.md
│   └── painel-vagas.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/data/
├── vagas.ts                       # ALTERADO — Turno, Contrato, labels; faixaSalarial?; publicadaEm; diasPorSemana; 40 vagas preenchidas à mão
└── brasil/vagas.ts                # ALTERADO — pós-passo com SEMENTE+1 (R3)

src/lib/texto.ts                   # NOVO — normalizar() (movido de EscolherCidade)
src/lib/busca/                     # NOVO — lógica pura
├── filtro.ts                      # FiltroBusca, FILTRO_VAZIO, passaNoFiltro, filtrarVagas, contarAtivos
├── recorte.ts                     # Recorte, noRecorte
├── perto.ts                       # distanciaDaVaga, anelDoRaio
├── ordenar.ts                     # ordenarVagas (patrocinadas ≤ 2 seguidas)
├── afrouxar.ts                    # sugerirAfrouxar
└── url.ts                         # FiltrosUrlSchema, filtroParaParams

src/lib/brasil/agregados.ts        # ALTERADO — sem constantes de módulo filtráveis; useAgregados() em hook separado
src/stores/filtros.ts              # NOVO — useFiltrosStore (sem persist)
src/components/busca/              # NOVO
├── usarBusca.ts                   # useFiltro, useVagasFiltradas, useAgregados, useRecorte, useSincronizarFiltrosUrl
├── PainelVagas.tsx                # coluna/gaveta, cabeçalho, região viva, vistas lista/detalhe
├── Gaveta.tsx                     # gaveta inferior arrastável (3 alturas) + botão
├── FiltrosBusca.tsx               # busca, interior, perto, "Mais filtros", ordenar, limpar
├── ListaVagas.tsx                 # lista progressiva + vazio com sugestão
├── ItemVaga.tsx                   # item + SelosVaga + "Ver no mapa"
├── ChipFiltros.tsx                # "Filtros ativos (N) · Limpar" sobre o mapa
└── DetalhesVaga.tsx               # miolo extraído de PergaminhoVaga (R8)

src/components/brasil/
├── EscolherCidade.tsx             # ALTERADO — usa lib/texto; prop aoEscolher(cidadeId)
├── HudBrasil.tsx, ResumoUf.tsx, ListaEstados.tsx, RotulosUf.tsx,
│   Relevo.tsx, BrasilPlano.tsx, IlhaRemota.tsx, ControlesMapa.tsx,
│   EstadosVizinhos.tsx            # ALTERADOS — useAgregados(); ilha realçada com interior
├── PainelEstado.tsx               # ALTERADO — abas Cidades | Vagas no celular
├── ListaCidades.tsx, CartaoCidade.tsx, RotulosCidade.tsx,
│   Aglomerados.tsx                # ALTERADOS — contagem filtrada; cidade com 0 esmaecida
└── AnelRaio.tsx                   # NOVO — anel do "Perto de mim" (3D) + variante SVG

src/components/city/
├── Buildings.tsx                  # ALTERADO — dim/lit consideram o filtro (R11)
├── PergaminhoVaga.tsx             # ALTERADO — envolve DetalhesVaga
├── Hud.tsx                        # ALTERADO — botão "Vagas (N)"; "N de M vagas no filtro"
└── NivelCidade.tsx                # ALTERADO — useSincronizarFiltrosUrl + PainelVagas

src/app/(mapa)/layout.tsx          # ALTERADO — PainelVagas + ChipFiltros + sync; mapa ao lado do painel no desktop

tests/
├── unit/                          # + filtro, perto, ordenar, filtros-url; vagas e agregados ampliados
└── e2e/                           # + busca.spec.ts, teclado-lista.spec.ts
```

**Structure Decision**: projeto único. Lógica pura da busca em
`src/lib/busca/` (paralelo a `lib/brasil/` e `lib/cidade/`); UI em
`components/busca/`, montada pelos dois layouts que já existem (`(mapa)`
para Brasil/Estado e `NivelCidade` para Cidade/Remoto).

### Fases de implementação (guia para `/speckit-tasks`)

1. **Dados**: tipos e labels novos; 40 vagas à mão; pós-passo do gerador;
   invariantes do mock (Vitest) — testes de 001–003 seguem verdes.
2. **Lógica pura**: `normalizar`, filtro, recorte, perto, ordenar,
   afrouxar, URL — com Vitest (TDD).
3. **Fundação**: `useFiltrosStore`, hooks de `usarBusca.ts`, sync com URL;
   migrar consumidores de `AGREGADO_*` para `useAgregados()` sem mudar
   comportamento (sem filtro, números idênticos).
4. **US1** painel + lista + item + detalhe + "Ver no mapa" (desktop e
   gaveta); **US2** filtros, chip, vazio com sugestão, efeito no mapa
   (Brasil, Estado, Cidade esmaecida); **US3** perto de mim + anel do
   raio + distância/ordem; **US4** atalho interior + realce do Bairro
   Remoto.
5. **Acessibilidade e desempenho**: região viva com debounce, teclado
   (`V`, `Esc`), lista progressiva, reduzir movimento.
6. **Polimento**: E2E, quickstart.

## Complexity Tracking

Sem violações. Estado global novo (`useFiltrosStore`) é exigido por FR-005
(filtro vale para lista e mapa em todos os níveis) e FR-008 (URL).
