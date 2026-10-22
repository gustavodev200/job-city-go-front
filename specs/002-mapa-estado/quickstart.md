# Quickstart — 002 Mapa do Estado

Guia de validação ponta a ponta. Contratos em
[contracts/rotas-e-navegacao.md](contracts/rotas-e-navegacao.md); dados em
[data-model.md](data-model.md).

## Pré-requisitos

- Node 22+, dependências instaladas (`npm install`), navegadores do
  Playwright (`npx playwright install chromium`).
- Feature 001 implementada (nível Brasil em `/`).
- Se a lista curada mudou (regiões do DF): `node scripts/brasil/gerar-geo.mjs`
  e conferir o diff de `src/data/brasil/cidades.ts` (5 entradas DF com
  `ibge: null`; `geo.json` sem mudança).

## Automatizado

```bash
npm test          # Vitest: agregados por cidade, rótulos, vizinhos, distância, trilha, schemas, prévia
npm run test:e2e  # Playwright: fluxo de níveis, teclado, vizinhos, rótulos 27 UFs × 2 larguras, gaveta
npm run lint
npm run build     # 27 páginas /estado/[uf] + 1 por cidade em /cidade/[slug] pré-renderizadas
```

Esperado: tudo verde; `build` sem aviso de `useSearchParams` fora de
`Suspense`.

## Manual (`npm run dev`)

| # | Passo | Esperado | Requisito |
|---|---|---|---|
| 1 | Abrir `/estado/mg` | MG ampliado, vizinhos esmaecidos; todas as cidades de MG com vaga como aglomerado + "Nome · N vagas" | US1-1, FR-001/002 |
| 2 | Abrir `/estado/go` com câmera afastada | Goiânia, Aparecida, Senador Canedo, Trindade sem rótulos sobrepostos; aparece "+K cidades"; aproximar desfaz o grupo | US1-2, FR-003 |
| 3 | Cidade com todas as vagas encerradas (achar via teste de agregados) | aglomerado apagado, "0 vagas abertas", ainda focável | US1-3 |
| 4 | Focar Uberlândia | cartão: total, barras só das categorias com vaga (nomes de setor), presencial/híbrido | US2-1, FR-004 |
| 5 | Lista "Cidades deste estado" → ordenar Nome / Vagas; definir cidade no perfil e ordenar Distância | ordens corretas; Distância só com perfil | US2-2, FR-007 |
| 6 | Câmera afastada sem foco | nenhum prédio individual | US3-1, FR-005 |
| 7 | Focar Goiânia e aproximar | construções por categoria; acesas = abertas, apagadas = encerradas; ao limpar foco volta o aglomerado | US3-2, FR-006 |
| 8 | Cidade com > 40 vagas (SP capital) | 40 construções + "+N" | edge case |
| 9 | Focar Anápolis → "Entrar na cidade" | abre `/cidade/anapolis-go` (provisória) com trilha "Brasil › Goiás › Anápolis" | US4-1, FR-008 |
| 10 | Clicar "Goiás" na trilha | `/estado/go?cidade=anapolis-go`, Anápolis em foco | US4-2, FR-009 |
| 11 | Botão voltar do navegador (2×) | volta à cidade, depois ao estado/Brasil conforme histórico | FR-009 |
| 12 | "Estados vizinhos" em GO → MG | voa direto para MG sem passar pelo Brasil | US4-3, FR-010 |
| 13 | `/cidade/goiania-go` | cena 3D atual + trilha "Brasil › Goiás › Goiânia" | FR-009 |
| 14 | `/estado/df` | Brasília + regiões administrativas como cidades | edge case DF |
| 15 | UF com uma única cidade com vagas (se houver no mock) | abre já com ela em foco | edge case |
| 16 | Perfil com cidade em GO, abrir `/estado/go` | marcador "Você está aqui" | FR-011 |
| 17 | Só teclado: Tab até a lista, ↑/↓, Enter, Esc | foca/limpa cidades; cartão anunciado (leitor de tela) | FR-012 |
| 18 | DevTools 360×740 retrato, `/estado/sp` | estado inteiro visível; lista em gaveta inferior | edge case celular |
| 19 | `/estado/go?cidade=xx` e `/cidade/nao-existe` | primeiro abre sem foco; segundo volta ao Brasil com aviso | Princípio II |
| 20 | Brasil → GO → Goiânia cronometrado | cada troca < 1,5 s percebido | SC-003 |

## Desempenho (celular intermediário ou CPU 4× no DevTools)

No nível Estado com foco em SP capital: draw calls ≤ orçamento da 001 + 22
(painel "Rendering" / `renderer.info`), animação estável ≥ 30 fps.
