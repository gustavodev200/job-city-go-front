# Implementation Plan: Mapa do Estado (nível região)

**Branch**: `002-mapa-estado` | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-mapa-estado/spec.md`

## Summary

Completar o nível **Estado** (`/estado/[uf]`) dentro da mesma cena 3D do
Brasil: cada cidade com vaga vira um **aglomerado** instanciado com rótulo
"Nome · N vagas" (agrupamento em espaço de tela, "+K cidades", sem
sobreposição); focar uma cidade abre o cartão com total, barras por categoria
(nomes de setor) e por modalidade, voa a câmera e troca o aglomerado pela
**prévia** com as fachadas reais da cidade (máx. 40, luz = aberta). Painel com
**trilha Brasil › Estado › Cidade**, lista de cidades ordenável
(vagas/nome/distância) que vira gaveta no celular, e atalho para **estados
vizinhos**. "Entrar na cidade" leva a `/cidade/[slug]` (provisória até a spec
003; Goiânia continua com a cena 3D). Tudo frontend, dados mock. Detalhes em
[research.md](research.md).

**Entregas faseadas** (dependem de specs seguintes, sem violar esta):

- `/cidade/[slug]` nesta feature é página provisória (trilha + resumo +
  aviso); a spec 003 coloca a cena gerada no lugar e remove
  `/cidade/goiania-go`.
- Ordenação por distância usa `perfil.cidadeId` mínimo da 001; o perfil
  completo é a spec 005.

## Technical Context

**Language/Version**: TypeScript 5, React 19.3, Next.js 16.4 (App Router,
`cacheComponents: true`), Node 22+ para o script de geração

**Primary Dependencies**: three 0.186, @react-three/fiber 9, @react-three/drei
10 (`MapControls`, `Html`), zustand 5, zod 4, Tailwind 4 — **nenhuma
dependência nova**

**Storage**: sem servidor; mock em `src/data/`; nenhuma chave nova de
`localStorage` (`cidadeEmFoco` não é persistido)

**Testing**: Vitest (lógica pura, schemas) + Playwright (fluxos e SC-002)

**Target Platform**: navegadores modernos com WebGL 2, desktop e celular;
fallback SVG da 001 continua cobrindo o nível Brasil (nível Estado sem WebGL
mostra o painel e a lista, que já contêm todos os dados — FR-012)

**Project Type**: aplicação web (frontend único deste repositório)

**Performance Goals**: troca de nível < 1,5 s percebido (SC-003); ≥ 30 fps
estáveis no celular com prévia aberta

**Constraints**: +1 draw call (aglomerados) e ≤ +21 (prévia, só com foco)
sobre o orçamento da 001; ≤ 20 `Html` de cidade montados; reagrupamento de
rótulos ≤ 10×/s; sem sombras nem luzes pontuais; respeita reduzir movimento

**Scale/Scope**: 27 UFs, ~127 cidades (122 + 5 do DF), ~660 vagas; 1 rota
nova (`/cidade/[slug]`), 1 rota completada (`/estado/[uf]`), trilha em 5
rotas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Preset lido de `project.config.json`: `prisma-postgres` (sem backend neste
repositório). Skills elegíveis: `frontend/*`, `testing`, `performance`,
`security`. Nada de `prisma`/`nestjs`.

| Princípio | Situação | Observação |
|---|---|---|
| I. Stack declarada | ✅ PASS | Só frontend, stack do `project.config.json` |
| II. Zod na borda | ✅ PASS | `?cidade=` e `[slug]` validados com Zod ([contrato](contracts/rotas-e-navegacao.md)); lista curada validada pelo script antes de gravar ([contrato](contracts/cidades-curadas.md)) |
| III. Autorização no servidor | ✅ N/A | Sem ação sensível, sem conta, sem servidor |
| IV. RLS | ✅ N/A | Sem Supabase, sem banco |
| V. Segurança antes do review | ✅ PASS | Toca entrada de URL → `/security` escopo leve antes do `/review` |
| VI. YAGNI | ✅ PASS | Nenhuma dependência nova (gaveta feita à mão, sem shadcn/vaul); vizinhos escritos à mão em vez de bake; reaproveita `InstancedParts`/`FACADES`, `DayNight`, `CameraMapa`, stores |
| VII. Rastreabilidade | ✅ PASS | spec → plan/research/data-model/contracts/quickstart → tasks → security-review → code-review em `specs/002-mapa-estado/` |

**Re-check pós-design (Fase 1)**: sem violações. Mudanças em código
existente são extensões pequenas (rótulos de categoria, `ibge` anulável,
`AgregadoCidade` com mais campos, `DISTANCIA_MINIMA` por nível, trilha no
`Hud`), não abstrações novas. `Complexity Tracking` vazio.

## Project Structure

### Documentation (this feature)

```text
specs/002-mapa-estado/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/
│   ├── rotas-e-navegacao.md
│   └── cidades-curadas.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks (ainda não criado)
```

### Source Code (repository root)

```text
scripts/brasil/
├── gerar-geo.mjs              # ALTERADO — aceita entradas manuais (sem IBGE), valida
└── cidades-curadas.json       # ALTERADO — + 5 regiões administrativas do DF

src/app/
├── (mapa)/estado/[uf]/page.tsx   # ALTERADO — <Suspense> para ?cidade=, painel completo
├── cidade/[slug]/page.tsx        # NOVO — provisória (Zod, generateStaticParams, trilha, resumo)
├── cidade/goiania-go/page.tsx    # ALTERADO — trilha "Brasil › Goiás › Goiânia"
└── remoto/page.tsx               # ALTERADO — trilha "Brasil › Bairro Remoto"

src/components/brasil/
├── BrasilCena.tsx             # ALTERADO — monta camada do estado quando há UF na rota
├── CameraMapa.tsx             # ALTERADO — voo até cidade em foco, distância mínima por nível
├── TorresVagas.tsx            # ALTERADO — oculta torres da UF da rota
├── ControlesMapa.tsx          # ALTERADO — "Ir para minha cidade" → hrefCidade
├── PainelEstado.tsx           # REESCRITO — trilha, cartão, lista, vizinhos; gaveta no celular
├── Aglomerados.tsx            # NOVO — InstancedMesh das cidades da UF (+ clique/toque)
├── RotulosCidade.tsx          # NOVO — projeção + agruparRotulos + Html, chip "+K"
├── PreviaCidade.tsx           # NOVO — InstancedParts por categoria na cidade em foco
├── CartaoCidade.tsx           # NOVO — total, barras por categoria, modalidade, "Entrar"
├── ListaCidades.tsx           # NOVO — lista acessível ordenável
├── EstadosVizinhos.tsx        # NOVO — nav com links
├── FocoPelaUrl.tsx            # NOVO — lê ?cidade= (useSearchParams) e foca
└── Trilha.tsx                 # NOVO — usada no estado, cidade, remoto

src/components/city/
└── Hud.tsx                    # ALTERADO — placa desce para dar lugar à trilha (Hud é comum à cidade e ao remoto)

src/data/
├── vagas.ts                   # ALTERADO — CATEGORIA_LABEL com nomes de setor
└── brasil/
    ├── tipos.ts               # ALTERADO — ibge: number | null
    ├── estados.ts             # ALTERADO — VIZINHOS
    └── cidades.ts             # REGERADO

src/lib/brasil/
├── agregados.ts               # ALTERADO — AgregadoCidade estendido, cidadesDoEstado
├── rotas.ts                   # ALTERADO — CidadeParamSchema, CidadeFocoSchema, hrefCidade, hrefEstado(uf, cidade?), itensDaTrilha
├── rotulos.ts                 # NOVO — agruparRotulos (puro)
├── previa.ts                  # NOVO — previaDaCidade (puro)
└── distancia.ts               # NOVO — haversine (puro)

src/stores/
└── mapa.ts                    # ALTERADO — cidadeEmFoco, focarCidade (fora do partialize)

tests/
├── unit/                      # + agregados-cidade, rotulos, vizinhos, distancia, trilha, rotas-cidade, previa
└── e2e/                       # + estado.spec.ts, rotulos.spec.ts (SC-002), gaveta.spec.ts
```

**Structure Decision**: projeto único (Next.js na raiz, `src/`). O nível
Estado continua dentro da cena do grupo `(mapa)` (sem canvas novo);
componentes novos ficam em `components/brasil/` ao lado dos da 001; lógica
pura nova em `lib/brasil/` (testável sem DOM/WebGL).

### Fases de implementação (guia para `/speckit-tasks`)

1. **Dados**: entradas manuais no script + 5 cidades do DF → regerar
   `cidades.ts`; `ibge` anulável; `VIZINHOS`; `CATEGORIA_LABEL`; testes de
   dados (DF ≥ 2, vizinhos, gerador de vagas ainda dentro das regras).
2. **Lógica pura**: `AgregadoCidade` estendido + `cidadesDoEstado`,
   `distancia.ts`, `previa.ts`, `rotulos.ts`, schemas e helpers de
   `rotas.ts` — todos com Vitest antes do 3D.
3. **Rotas/trilha (US4 base)**: `Trilha`, `/cidade/[slug]`, trilha nas
   páginas `/cidade/goiania-go` e `/remoto`, `hrefCidade` no `ControlesMapa`.
4. **US1**: `Aglomerados`, `RotulosCidade` (agrupamento + chip), torres
   ocultas na UF da rota, `cidadeEmFoco` no store.
5. **US2**: `CartaoCidade` (+ `aria-live`), `ListaCidades` com ordenação,
   `PainelEstado` reescrito, gaveta no celular.
6. **US4 completa**: "Entrar na cidade", `FocoPelaUrl` (`?cidade=`),
   `EstadosVizinhos`, voo de câmera até cidade, estado com uma cidade abre
   focado.
7. **US3**: `PreviaCidade` (limite 40, "+N", ocultar aglomerados vizinhos),
   gatilho por distância da câmera.
8. **Polimento**: "Você está aqui" no nível Estado (já existe — conferir
   escala/posição), reduzir movimento, orçamento de desempenho, E2E (SC-002
   em 27 UFs × 2 larguras), quickstart.

## Complexity Tracking

Sem violações — nenhuma dependência nova e nenhuma abstração além do que a
spec exige.
