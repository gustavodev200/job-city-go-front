# Quickstart — 003 Cidade dinâmica e Bairro Remoto

Validação ponta a ponta. Rotas e parâmetros:
[contracts/rotas-e-parametros.md](contracts/rotas-e-parametros.md); textos do
HUD e do pergaminho: [contracts/pergaminho-e-hud.md](contracts/pergaminho-e-hud.md);
regras do mundo: [data-model.md](data-model.md).

## Pré-requisitos

- Node 22+, `npm install`, `npx playwright install chromium`.
- Specs 001 e 002 implementadas.

## Automatizado

```bash
npm test          # Vitest: gerarMundo (lotes, estabilidade, tamanhos, colisão), deslocamento, abrangência, schemas
npm run test:e2e  # Playwright: entrar em cidades, portal ida e volta, ?vaga= e vaga encerrada
npm run lint
npm run build     # /cidade/[slug] pré-renderizada para as 127 cidades; sem /cidade/goiania-go estática
```

## Manual (`npm run dev`)

| # | Passo | Esperado | Requisito |
|---|---|---|---|
| 1 | Mapa → GO → Anápolis → "Entrar na cidade" | cena 3D de Anápolis em < 2 s, personagem na praça, placa "Anápolis · GO", legenda soma as vagas abertas de Anápolis | US1-1, FR-010, SC-001 |
| 2 | Sair e entrar de novo em Anápolis | mesmos prédios nos mesmos lugares | US1-2, FR-002 |
| 3 | `/cidade/gurupi-to` (1 vaga) | 3×3 quarteirões, praça, casas e árvores; não parece vazia | US1-3, FR-001 |
| 4 | `/cidade/goiania-go` | maior cidade (6×6), fluida; mesmo comportamento da cidade antiga | US1-4, FR-004, SC-004 |
| 5 | Andar até um prédio de Saúde aberto | prédio com cruz iluminado; balão; E abre o pergaminho | US2-1, FR-003 |
| 6 | Achar vaga encerrada (legenda/teste) e abrir via `?vaga=` | prédio apagado com placa "Encerrada"; botão "Vaga encerrada" desabilitado | US2-2, FR-012 |
| 7 | Perfil em Trindade; vaga híbrida em Goiânia | "~25 km · ~35 min de carro · presença 1 dia por semana" | US3-1, FR-006 |
| 8 | Sem perfil; mesma vaga | "Informe sua cidade para calcular o deslocamento" | US3-2 |
| 9 | Olhar prédio híbrido na rua | selo "Híbrido" visível | US3-3, FR-005 |
| 10 | Mapa do Brasil → Bairro Remoto | só casas remotas (50), cada pergaminho com abrangência e "Empresa de <Estado>" | US4-1, FR-007 |
| 11 | Em Anápolis, atravessar a ponte até o portal | vai para `/remoto?de=anapolis-go`; portal oeste "Voltar para Anápolis" leva de volta à cabeceira da ponte | US4-2, FR-008 |
| 12 | Perfil em SP; vaga "Remoto para GO" | aviso "Esta vaga pede residência em GO" | US4-3, FR-009 |
| 13 | Vaga patrocinada (Goiânia) | marcador maior com brilho e "Patrocinado" | FR-011 |
| 14 | Tentar sair dos limites / atravessar prédio / entrar no rio fora da ponte | bloqueado | edge case |
| 15 | `/cidade/nao-existe`, `/remoto?de=xx`, `/cidade/anapolis-go?vaga=lixo` | Brasil com aviso; "Voltar ao mapa"; parâmetro ignorado | Princípio II |
| 16 | Outdoors em cidades de regiões diferentes | conjuntos de anunciantes diferentes; mesma região, mesmo conjunto | edge case |
| 17 | Celular 390 px em Goiânia | joystick, HUD, pergaminho e botão de portal utilizáveis | FR-004 |
