# Quickstart — validar 001 Mapa do Brasil

Guia de validação ponta a ponta. Detalhes de formato estão em
[contracts/](contracts/) e [data-model.md](data-model.md).

## Pré-requisitos

- Node 22+ e dependências instaladas: `npm install`
- Navegadores do Playwright (uma vez): `npx playwright install chromium`

## 1. Gerar dados geográficos (só quando o script ou a lista curada mudar)

```bash
node scripts/brasil/gerar-geo.mjs
```

Esperado: imprime 27 UFs, nº de células de terra (~17 mil), nº de cidades
(≥ 80) e tamanho do `geo.json` (≤ 150 KB). `git diff` mostra só
`src/data/brasil/geo.json` e `src/data/brasil/cidades.ts`. Rodar duas
vezes não gera diff (determinístico).

## 2. Testes automáticos

```bash
npm run test          # Vitest: agregados, geo, gerador de vagas, schemas
npm run test:e2e      # Playwright: navegação, teclado, fallback 2D
npm run lint
npm run build
```

Todos verdes.

## 3. Roteiro manual (desktop)

`npm run dev` → abrir `http://localhost:3000/`.

| # | Ação | Esperado | Spec |
|---|---|---|---|
| 1 | Abrir `/` | Brasil inteiro enquadrado, 27 estados com cor de bioma e rótulo "UF · N" | US1, FR-001/002/003 |
| 2 | Olhar o mapa | Nenhum prédio individual; torres de luz nas cidades com vaga | FR-004 |
| 3 | Controle de hora → 21h | Céu noturno, torres e halos brilham | FR-005 |
| 4 | Hover em Goiás | Cartão: "Goiás (GO)", total, por modalidade, top 3 categorias; números batem com `npm run test` (fixture de agregados) | US2, FR-006 |
| 5 | Clicar em Goiás | Câmera voa até GO; URL `/estado/go`; painel do estado | US3, FR-007/008 |
| 6 | Botão voltar do navegador | Volta ao Brasil com câmera animada | FR-008 |
| 7 | Abrir `/estado/xx` | Volta a `/` com aviso "Não encontramos esse estado" | edge case |
| 8 | Lista "Estados" → Tab até DF → Enter | Abre `/estado/df` | FR-012 |
| 9 | Botão "Calor" | Estados em 5 faixas de cor + legenda; recarregar mantém "Calor" | US5, FR-011 |
| 10 | Ilha/atalho "Bairro Remoto" | Vai para `/remoto`, personagem na vila | US4, FR-009 |
| 11 | "Informe sua cidade" → Anápolis | GO ganha "Você está aqui"; "Ir para minha cidade" leva a `/estado/go` | US4, FR-010 |
| 12 | "Centralizar Brasil" após zoom/giro | Volta ao enquadramento inicial | FR-013 |
| 13 | Abrir `/cidade/goiania-go` | Cidade 3D atual funcionando igual a antes | regressão |

## 4. Roteiro manual (celular / emulação)

DevTools → dispositivo de 360 × 800, toque, rede "4G rápida", CPU 4× lenta.

- Brasil cabe na tela sem rolagem horizontal; utilizável em ≤ 3 s (SC-003).
- 1º toque num estado mostra resumo; 2º toque entra; toque fora fecha.
- SE/AL/DF selecionáveis pela lista.
- Painel de desempenho: sem quedas longas ao girar/aproximar (SC-004).

## 5. Acessibilidade e movimento

- Ativar "reduzir movimento" no SO → confirmar estado troca sem voo.
- Leitor de tela (NVDA/VoiceOver): lista de estados anuncia "Goiás, 37
  vagas abertas"; foco no mapa anuncia o resumo (região `aria-live`).

## 6. Fallback 2D

Abrir `/?semWebgl=1` (força o mapa plano em qualquer ambiente) ou desativar
aceleração de hardware → mapa plano em SVG com os mesmos estados,
contagens e links.

## 7. Diferenciação visual (SC-006)

Captura do nível Brasil de dia e de noite lado a lado com
`thegitcity.com/town/brasil-town`; mostrar a 5 pessoas e registrar se
descrevem como "diferente".
