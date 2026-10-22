# Implementation Plan: Mapa do Brasil (nível país)

**Branch**: `001-mapa-brasil` | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-mapa-brasil/spec.md`

## Summary

Criar o nível **Brasil** como nova página inicial: o país desenhado como
relevo em blocos (grade de 0,2°, uma malha mesclada com cores de bioma por
estado), mar, ciclo de dia e noite reaproveitado da cidade, torres de luz
nas cidades com vagas abertas, rótulo "UF · N" por estado, resumo ao
focar, voo de câmera até o estado (`/estado/[uf]`), modo Calor, atalho e
ilha do Bairro Remoto, marcador da cidade do usuário e fallback 2D em SVG.
Dados geográficos são pré-processados por um script a partir de fontes
públicas MIT e versionados; vagas nacionais vêm de um gerador
determinístico. Tudo no frontend, sem servidor. Detalhes em
[research.md](research.md).

**Entregas faseadas** (dependem de specs seguintes, sem violar esta):

- "Ir para minha cidade" (US4) abre a cena da cidade só para Goiânia;
  para outras cidades abre `/estado/<uf>` até a spec 003 criar
  `/cidade/[slug]`.
- `/estado/[uf]` mostra câmera enquadrada + painel-resumo da UF; cidades e
  prévia de prédios chegam na spec 002.
- O campo de cidade do usuário é o mínimo de `stores/perfil.ts`; o perfil
  completo é a spec 005.

## Technical Context

**Language/Version**: TypeScript 5, React 19.3, Next.js 16.4 (App Router,
`cacheComponents: true`), Node 22+ para o script de geração

**Primary Dependencies**: three 0.186, @react-three/fiber 9, @react-three/drei 10
(`MapControls`, `Html`), zustand 5 (+ `persist`), Tailwind 4; **novas**:
`zod` (validação de URL e armazenamento), `vitest` e `@playwright/test`
(dev)

**Storage**: sem servidor. Dados mock em `src/data/` (TS/JSON versionados);
preferências do usuário em `localStorage` (chaves `jcg:*`, ver
[contracts/rotas-e-estado.md](contracts/rotas-e-estado.md))

**Testing**: Vitest (lógica pura e schemas) + Playwright (3 fluxos E2E)

**Target Platform**: navegadores modernos com WebGL 2 (desktop e celular);
fallback SVG sem WebGL

**Project Type**: aplicação web (frontend único deste repositório)

**Performance Goals**: utilizável em ≤ 3 s em celular intermediário 4G;
animação fluida (alvo 60 fps desktop, ≥ 30 fps estável celular); voo de
câmera ≤ 1,5 s

**Constraints**: `geo.json` ≤ 150 KB; malha do país ≤ 80 mil triângulos;
≤ 10 draw calls no nível Brasil; sem sombras dinâmicas nem luzes pontuais
no nível Brasil; `dpr` ≤ 1,5 no celular; respeita `prefers-reduced-motion`

**Scale/Scope**: 27 UFs, ~90 cidades, ~660 vagas mock; 2 rotas novas
(`/`, `/estado/[uf]`) + 2 movidas (`/cidade/goiania-go`, `/remoto`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Preset lido de `project.config.json`: `prisma-postgres`. Skills elegíveis
usadas: `frontend/*` (nextjs, zustand, zod, tailwind, design-system),
`testing`, `performance`, `security`. Nada de `backend/nestjs` ou `prisma`
nesta feature (sem backend).

| Princípio | Situação | Observação |
|---|---|---|
| I. Stack declarada | ✅ PASS | Stack vem do `project.config.json`; feature só toca frontend |
| II. Zod na borda | ✅ PASS | `[uf]`, `?aviso`, `?semWebgl` e reidratação do `localStorage` validados com Zod ([contrato](contracts/rotas-e-estado.md)); dados baixados pelo script são parseados e validados antes de gravar |
| III. Autorização no servidor | ✅ N/A | Sem ação sensível, sem conta, sem servidor |
| IV. RLS | ✅ N/A | Preset não é Supabase; sem banco |
| V. Segurança antes do review | ✅ PASS | Toca entrada de usuário (URL/armazenamento) e baixa dados externos no script → rodar `/security` (escopo leve) antes do `/review` |
| VI. YAGNI | ✅ PASS com justificativas | Sem biblioteca de mapa; 3 dependências novas justificadas em Complexity Tracking |
| VII. Rastreabilidade | ✅ PASS | spec → plan/research/data-model/contracts/quickstart → tasks → security-review → code-review em `specs/001-mapa-brasil/` |

**Re-check pós-design (Fase 1)**: sem violações novas. O refactor de
`DayNight` (props) e a mudança de `/` para `/cidade/goiania-go` são
alterações de código existente, não abstrações novas.

## Project Structure

### Documentation (this feature)

```text
specs/001-mapa-brasil/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/
│   ├── rotas-e-estado.md
│   └── geo-brasil.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks (ainda não criado)
```

### Source Code (repository root)

```text
scripts/brasil/
├── gerar-geo.mjs              # NOVO — baixa fontes, projeta, rasteriza, simplifica, grava
└── cidades-curadas.json       # NOVO — [{ ibge, porte }] ~90 cidades

src/app/
├── layout.tsx                 # existente (sem mudança)
├── page.tsx                   # REMOVIDO (vai para (mapa)/page.tsx)
├── (mapa)/
│   ├── layout.tsx             # NOVO — monta <MapaBrasil/> (client, ssr:false) uma vez + children
│   ├── page.tsx               # NOVO — HUD do nível Brasil
│   └── estado/[uf]/page.tsx   # NOVO — valida UF (Zod), generateStaticParams, painel do estado
├── cidade/goiania-go/page.tsx # MOVIDO — conteúdo atual de app/page.tsx
├── remoto/page.tsx            # NOVO — mesma cena, área inicial "vila"
└── personagem/page.tsx        # existente

src/components/brasil/         # NOVO
├── MapaBrasil.tsx             # escolhe Canvas 3D ou BrasilPlano (detecção WebGL)
├── BrasilCena.tsx             # Canvas, DayNight parametrizado, câmera, composição
├── Relevo.tsx                 # malha mesclada da grade (cores por vértice, destaque, modo calor)
├── Mar.tsx                    # plano de água + ilha do Bairro Remoto
├── Bordas.tsx                 # linhas de contorno das UFs
├── TorresVagas.tsx            # InstancedMesh das cidades com vaga + halos noturnos
├── RotulosUf.tsx              # Html "UF · N" (pointer-events: none)
├── CameraMapa.tsx             # MapControls com limites, voo até UF, centralizar
├── BrasilPlano.tsx            # fallback SVG acessível
├── HudBrasil.tsx              # resumo da UF, modo Luzes/Calor, legenda, atalhos, aviso
├── ListaEstados.tsx           # lista textual/teclado de UFs com contagem
└── EscolherCidade.tsx         # campo "Informe sua cidade" (busca nas cidades mock)

src/components/city/
├── DayNight.tsx               # ALTERADO — props foco/raioCeu/neblina/cidade
└── (demais)                   # sem mudança

src/data/brasil/               # NOVO
├── estados.ts                 # 27 UFs: nome, região, bioma (à mão)
├── geo.json                   # GERADO
├── cidades.ts                 # GERADO
└── vagas.ts                   # gerador determinístico + vagas escritas à mão

src/lib/
├── brasil/geo.ts              # NOVO — projetar, celulaEm, alturaDaCelula, construção da malha
├── brasil/agregados.ts        # NOVO — por UF, por cidade, remoto, faixas de calor
├── brasil/rotas.ts            # NOVO — schemas Zod de [uf] e ?aviso
├── aleatorio.ts               # NOVO — mulberry32 semeado
└── movimento.ts               # NOVO — useReducedMotion (extraído de DayNight)

src/stores/
├── mapa.ts                    # NOVO — ufEmFoco, modo (persist + Zod)
└── perfil.ts                  # NOVO — cidadeId (persist + Zod); estendido na 005

tests/
├── unit/                      # Vitest: geo, agregados, vagas, rotas, stores
└── e2e/                       # Playwright: navegacao, teclado, fallback
```

**Structure Decision**: projeto único (Next.js na raiz, código em `src/`).
Feature isolada em `components/brasil`, `data/brasil`, `lib/brasil`; o
único código existente alterado é `DayNight.tsx` (parametrização) e a
mudança da página inicial para `/cidade/goiania-go`. O canvas do Brasil
fica no layout do grupo `(mapa)` para sobreviver à navegação
Brasil ↔ Estado (voo de câmera sem remontar).

### Fases de implementação (guia para `/speckit-tasks`)

1. **Base**: dependências (zod, vitest, playwright), scripts npm `test`
   e `test:e2e`; `lib/aleatorio.ts`, `lib/movimento.ts`.
2. **Dados**: `cidades-curadas.json` + `gerar-geo.mjs` → `geo.json`,
   `cidades.ts`; `estados.ts`; gerador de `vagas.ts`; `lib/brasil/*` com
   testes (podem rodar antes de qualquer 3D).
3. **Rotas**: mover cidade para `/cidade/goiania-go`, criar `/remoto`,
   grupo `(mapa)` com `/` e `/estado/[uf]` (validação + redirect).
4. **US1**: `BrasilCena`, `Relevo`, `Mar`, `Bordas`, `TorresVagas`,
   `RotulosUf`, `DayNight` parametrizado, `CameraMapa` (enquadrar).
5. **US2**: foco/hover/1º toque, `HudBrasil` (resumo), `ListaEstados`,
   `aria-live`.
6. **US3**: voo até UF, painel mínimo de `/estado/[uf]`, voltar,
   reduzir movimento.
7. **US4**: ilha e atalho Bairro Remoto, `stores/perfil.ts`,
   `EscolherCidade`, "Você está aqui", "Ir para minha cidade".
8. **US5**: modo Calor (recolorir vértices), legenda, persistência.
9. **Fallback**: detecção WebGL + `BrasilPlano`.
10. **Polimento**: orçamento de desempenho (R14), E2E, quickstart.

## Complexity Tracking

| Adição | Por que é necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| Dependência `zod` | Princípio II exige validar URL e `localStorage` | Validação manual: a constituição pede Zod explicitamente |
| `vitest` + `@playwright/test` (dev) | Repositório não tem nenhum runner; skill `testing` define exatamente esses dois | Só testes manuais: geo e agregados têm regras numéricas fáceis de quebrar sem perceber |
| Script de geração + arquivos gerados versionados | Rasterizar 27 polígonos no celular custaria centenas de ms a cada abertura | `d3-geo`/`topojson` no navegador: +60 KB de JS e CPU no cliente |
| Props novas em `DayNight` | Reaproveitar o ciclo no Brasil (FR-005) | Copiar o componente: ~470 linhas duplicadas |
