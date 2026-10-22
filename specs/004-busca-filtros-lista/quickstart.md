# Quickstart — validar a 004

Guia de validação ponta a ponta. Regras em [research.md](research.md),
formas em [data-model.md](data-model.md), URL em
[contracts/filtros-url.md](contracts/filtros-url.md), UI em
[contracts/painel-vagas.md](contracts/painel-vagas.md).

## Pré-requisitos

```bash
npm install
npm test            # Vitest — lógica pura e invariantes do mock
npm run test:e2e    # Playwright
npm run dev         # http://localhost:3000
```

## Testes automatizados esperados

| Arquivo | Cobre |
|---|---|
| `tests/unit/vagas.test.ts` (ampliado) | invariantes novas do mock; ids/status/cidades das vagas antigas inalterados |
| `tests/unit/filtro.test.ts` | cada linha da tabela R5; sobreposição salarial 2000–3200 × 2500–4000; "medico" acha "Médico"; interior exclui híbrida 2 dias |
| `tests/unit/perto.test.ts` | Anápolis 25 km sem Goiânia; 100 km com Goiânia depois de Anápolis; remota fora da abrangência excluída; `remotas=0` |
| `tests/unit/ordenar.test.ts` | nunca 3 patrocinadas seguidas; abertas antes de encerradas; "A combinar" no fim em Maior salário |
| `tests/unit/filtros-url.test.ts` | ida e volta; cada valor inválido do contrato ignorado isoladamente |
| `tests/unit/agregados.test.ts` (ampliado) | `calcularPorUf` sobre lista filtrada bate com contagem manual "Saúde + CLT + noite" |
| `tests/e2e/busca.spec.ts` | cenários abaixo marcados (E2E) |
| `tests/e2e/teclado-lista.spec.ts` | SC-003 só com teclado |

## Cenários manuais

1. **Lista no nível Cidade (US1-1)** — `/cidade/goiania-go` → "Vagas".
   Esperado: só vagas de Goiânia; abertas primeiro. (E2E)
2. **Ver no mapa (US1-2)** — no Brasil, abrir "Vagas", buscar "Mestre de
   Obras", abrir o item, "Ver no mapa". Esperado:
   `/cidade/aparecida-de-goiania-go?vaga=vg-003`, personagem diante do
   prédio, pergaminho aberto. (E2E)
3. **Layout (US1-3)** — desktop: painel à direita, mapa visível ao lado.
   Celular (DevTools 390 px): gaveta inferior; arrastar o puxador muda a
   altura; botão alterna.
4. **Patrocinadas (US1-4)** — lista do Brasil: etiqueta "Patrocinado" em
   cada destacada; nunca 3 seguidas.
5. **Filtro reflete no mapa (US2-1)** — marcar Saúde, voltar ao Brasil.
   Esperado: rótulos de estado com contagem só de Saúde; chip "Filtros
   ativos (1) · Limpar". (E2E)
6. **Sem resultado (US2-2)** — `/?q=zzzz`. Esperado: "Nenhuma vaga com
   esses filtros" e sugestão "Tirar …". (E2E)
7. **Link e recarregar (US2-3)** — aplicar Saúde + CLT + noite, copiar a
   URL (`?cat=saude&turno=noite&contrato=clt`), abrir em outra aba e
   recarregar. Esperado: mesmos filtros e contagens. (E2E)
8. **Perto de mim (US3-1/2)** — sem cidade no perfil, ativar "Perto de
   mim" → pede cidade; escolher Anápolis, raio 25 → sem Goiânia; raio 100
   → Goiânia aparece, depois de Anápolis, com "52 km". Raio 50 → Goiânia
   ainda fora (52 > 50); Aparecida de Goiânia também. Em `/estado/go`,
   anel do raio em volta de Anápolis. (E2E)
9. **Combinação (US3-3)** — Perto de mim + Saúde: todos os itens são de
   Saúde e dentro do raio.
10. **Interior (US4-1/2)** — ativar "Posso morar no interior". Esperado:
    nenhuma presencial; nenhuma híbrida com "2 dias" ou "3 dias"; no
    Brasil, ilha do Bairro Remoto realçada; estados contam só híbridas
    ≤ 1 dia. (E2E)
11. **Cidade esmaecida (FR-005)** — `/cidade/goiania-go?cat=saude`:
    prédios que não são de Saúde apagados; placa "N de M vagas no filtro".
12. **Leitor de tela (FR-011, SC-003)** — NVDA/VoiceOver: Tab até
    "Vagas", buscar, ouvir "N vagas" após digitar, abrir uma vaga, ouvir o
    detalhe, voltar. Sem tocar no mapa.
13. **Desempenho (SC-002)** — Performance do DevTools, celular 4× lento:
    alternar filtros no Brasil; interação < 500 ms.
14. **Reduzir movimento** — com `prefers-reduced-motion`, gaveta e "Ver no
    mapa" sem animação.

## Resultado da implementação (2026-10-22)

| Verificação | Resultado |
|---|---|
| `npm test` (Vitest) | 20 arquivos, 113 testes ✅ — inclui filtrar + agregar < 5 ms |
| `npm run test:e2e` (Playwright, desktop + Pixel 7) | 39 passaram, 0 falharam, 21 pulados por projeto ✅ — cenários (E2E) 1, 2, 5, 6, 7, 8, 10 + teclado |
| `npm run lint`, `tsc --noEmit`, `npm run build` | ✅ |
| Cenários 3, 10 e 11 (layout, realce do Bairro Remoto, cidade esmaecida) | conferidos por captura de tela (desktop 1366 px e Pixel 7) |
| Cenários 12–14 (leitor de tela real, perfil de desempenho no DevTools, reduzir movimento) | **não executados** — pendentes de verificação manual |

### Desvios do plano

- **Painel fechado**: em vez de uma gaveta recolhida, uma aba "Vagas (N)" fica na
  borda direita, a meia altura, em todos os níveis (sem colidir com os HUDs dos
  cantos). Aberta: coluna no desktop (≥ 768 px), gaveta no celular.
- **`ResumoUf` não foi movido** (T022): o mapa agora encolhe ao lado do painel, então
  o resumo não fica coberto.
- O botão "Vagas (N)" conta todas as vagas do recorte no filtro (abertas e
  encerradas, como a lista); as contagens do mapa seguem só as abertas.
- E2E da 001/002 que procuravam "a" região viva da página foram restritos a fora
  do painel (`:not(aside *)`): agora há duas regiões vivas legítimas.
- **Limitação conhecida**: o minimapa da cidade e a legenda continuam mostrando todas as
  vagas; só prédios, marcadores e a placa ("N de M vagas no filtro") seguem o filtro.
