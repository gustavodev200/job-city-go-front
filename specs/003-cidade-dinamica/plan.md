# Implementation Plan: Cidade dinâmica e Bairro Remoto (nível cidade)

**Branch**: `003-cidade-dinamica` | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-cidade-dinamica/spec.md`

## Summary

Transformar a cidade 3D fixa (constantes de `data/mapa.ts` + `layout.ts`)
num **mundo gerado** por função pura a partir de qualquer cidade do mock
(`gerarMundo`), entregue a cena e HUD por `MundoContext`. A cidade cresce com
o número de vagas (1 vaga por quarteirão, mínimo 2×2), cada vaga tem lote
estável, fachada da categoria, luz por status, placa "Encerrada", selo
híbrido e destaque patrocinado. A vila vira o **Bairro Remoto** nacional
(`/remoto`, todas as 50 vagas remotas), ligado a cada cidade por ponte e
portal com retorno (`?de=`, `?chegada=ponte`). Pergaminho ganha
deslocamento estimado e aviso de abrangência (abrangência estruturada + fuso
por UF). `/cidade/[slug]` substitui `/cidade/goiania-go`. Detalhes em
[research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5, React 19.3, Next.js 16.4 (App Router,
`cacheComponents: true`)

**Primary Dependencies**: three 0.186, @react-three/fiber 9 (repassa
contexto React ao Canvas via `its-fine`), @react-three/drei 10, zustand 5,
zod 4, Tailwind 4 — **nenhuma dependência nova**

**Storage**: sem servidor; mock em `src/data/`; sem chaves novas de
`localStorage`

**Testing**: Vitest (mundo, deslocamento, abrangência, schemas) + Playwright

**Target Platform**: navegadores com WebGL 2, desktop e celular

**Project Type**: aplicação web (frontend único)

**Performance Goals**: cidade pronta para andar < 2 s (SC-001); maior
cidade fluida no celular (SC-004); `gerarMundo` < 5 ms para 150 vagas

**Constraints**: draw calls não crescem com nº de vagas (instâncias por
categoria); sem luzes pontuais novas; `MAX_CONSTRUCOES` 400

**Scale/Scope**: 127 cidades (1–28 vagas; gerador testado até 150), 50
vagas remotas; ~12 componentes da cidade adaptados ao mundo gerado

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Preset `prisma-postgres` (sem backend neste repositório). Skills: `frontend/*`,
`testing`, `performance`, `security`.

| Princípio | Situação | Observação |
|---|---|---|
| I. Stack declarada | ✅ PASS | Só frontend |
| II. Zod na borda | ✅ PASS | `[slug]`, `?chegada`, `?de`, `?vaga` validados ([contrato](contracts/rotas-e-parametros.md)) |
| III. Autorização no servidor | ✅ N/A | Sem ação sensível real (candidatura é mock local) |
| IV. RLS | ✅ N/A | Sem Supabase |
| V. Segurança antes do review | ✅ PASS | Entrada por URL → `/security` escopo leve |
| VI. YAGNI | ✅ PASS | Sem dependência nova; remove código (viagem `travelTo`, rota fixa, `x`/`z` à mão); `?vaga=` justificado (link direto que a 004 usa + teste) |
| VII. Rastreabilidade | ✅ PASS | artefatos em `specs/003-cidade-dinamica/` |

**Re-check pós-design (Fase 1)**: sem violações. `MundoContext` é a única
abstração nova e substitui ~15 imports de constantes; justificada em R1.

## Project Structure

### Documentation (this feature)

```text
specs/003-cidade-dinamica/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── rotas-e-parametros.md
│   └── pergaminho-e-hud.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/lib/cidade/                    # NOVO — lógica pura do nível Cidade
├── mundo.ts                       # gerarMundo, mundoDaCidade, mundoRemoto, constantes de escala
├── deslocamento.ts                # estimarDeslocamento
└── abrangencia.ts                 # rotuloAbrangencia, atendeAbrangencia, avisoAbrangencia

src/lib/brasil/rotas.ts            # ALTERADO — ChegadaSchema, DeSchema, vagaSchema, hrefRemoto, hrefCidade(id, {chegada})

src/data/
├── vagas.ts                       # ALTERADO — sem x/z; abrangencia; destaque; 2 patrocinadas
├── mapa.ts                        # REMOVIDO (conteúdo vai para lib/cidade/mundo.ts)
└── brasil/
    ├── estados.ts                 # ALTERADO — fuso por UF
    └── vagas.ts                   # ALTERADO — gerador grava abrangencia estruturada

src/components/city/
├── mundo.tsx                      # NOVO — MundoContext, useMundo
├── NivelCidade.tsx                # NOVO — página-cliente: provider + cena + HUD + portal + ?vaga/?chegada
├── layout.ts                      # REMOVIDO (vira mundo.ts) ou reduzido a instâncias derivadas do mundo
├── CityScene.tsx                  # ALTERADO — sem areaInicial; usa mundo
├── Buildings.tsx                  # ALTERADO — instâncias do mundo, placa Encerrada, patrocinado
├── Roads.tsx, Terrain.tsx, Trees.tsx  # ALTERADOS — geometria a partir do mundo
├── Portal.tsx                     # NOVO — arco + placa do portal na cabeceira da ponte
├── Player.tsx                     # ALTERADO — nascimento/colisão/portal pelo mundo; sem travel
├── Minimap.tsx                    # ALTERADO — desenha o mundo
├── Hud.tsx                        # ALTERADO — placa, legenda e botão de portal pelo mundo
├── PergaminhoVaga.tsx             # ALTERADO — deslocamento, abrangência, patrocinado
├── Outdoors.tsx                   # ALTERADO — slots pelas ruas do mundo; anunciantes por região
└── facades.ts                     # ALTERADO — placa "Encerrada"

src/stores/game.ts                 # ALTERADO — sem travel/travelTo

src/app/
├── cidade/[slug]/page.tsx         # ALTERADO — monta NivelCidade
├── cidade/goiania-go/             # REMOVIDO
└── remoto/page.tsx                # ALTERADO — monta NivelCidade do mundo remoto

tests/
├── unit/                          # + mundo, deslocamento, abrangencia, rotas-nivel-cidade
└── e2e/                           # + cidade.spec.ts; estado.spec.ts ajustado (cidade 3D)
```

**Structure Decision**: projeto único. Lógica pura do nível Cidade em
`src/lib/cidade/` (paralelo a `lib/brasil/`); componentes 3D continuam em
`components/city/`, trocando constantes de módulo por `useMundo()`.

### Fases de implementação (guia para `/speckit-tasks`)

1. **Dados**: abrangência estruturada + fuso + destaque; remover `x`/`z`.
2. **Lógica pura**: `gerarMundo` (cidade e remoto), deslocamento,
   abrangência, schemas — com Vitest.
3. **Fundação da cena**: `MundoContext`, `NivelCidade`, rotas; adaptar
   Terrain/Roads/Trees/Buildings/Player/Minimap/Hud ao mundo (sem mudar
   comportamento) — Goiânia gerada deve parecer a cidade antiga.
4. **US1** qualquer cidade (tamanho, casas, limites); **US2** placa
   Encerrada, legenda por mundo; **US4** Bairro Remoto + portal + retorno;
   **US3** deslocamento e selo.
5. **Transversais**: patrocinado, outdoors por região, `?vaga=`.
6. **Polimento**: E2E, desempenho, quickstart.

## Complexity Tracking

Sem violações. Única abstração nova (`MundoContext` + `gerarMundo`) é o
próprio requisito (cidade gerada para qualquer cidade).
