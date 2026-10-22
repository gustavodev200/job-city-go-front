# Data Model — Busca, filtros e lista de vagas (004)

Tudo no cliente; mock em `src/data/`. Tipos em TypeScript (forma, não
implementação).

## Vaga (alterada — `src/data/vagas.ts`)

```ts
type Turno = "manha" | "tarde" | "noite" | "integral" | "escala";
type Contrato = "clt" | "estagio" | "aprendiz" | "pj" | "temporario";

type VagaBase = {
  // … campos existentes (id, titulo, empresa, descricao, requisitos, beneficios, status, destaque?)
  faixaSalarial?: { min: number; max: number }; // AGORA OPCIONAL — ausente = "A combinar"
  turno: Turno;                                  // NOVO
  contrato: Contrato;                            // NOVO
  publicadaEm: string;                           // NOVO — "AAAA-MM-DD"
};

type VagaHibrida = VagaBase & {
  modelo: "hibrido"; categoria: Categoria; cidade: string;
  frequencia: string;      // texto existente, ex. "1 dia por semana na escola"
  diasPorSemana: number;   // NOVO — 1 vez por mês = 0.25
};
```

Rótulos: `TURNO_LABEL`, `CONTRATO_LABEL`, `ORDEM_TURNOS`, `ORDEM_CONTRATOS`
(mesmo padrão de `CATEGORIA_LABEL`/`ORDEM_CATEGORIAS`).

### Regras de validação / invariantes do mock (Vitest)

- `faixaSalarial`, quando presente: `0 < min ≤ max ≤ 100_000`.
- `publicadaEm` entre `REFERENCIA_MOCK − 59 dias` e `REFERENCIA_MOCK`
  (`2026-10-01`), nunca `Date.now()` (determinismo).
- `diasPorSemana ∈ {0.25, 1, 2, 3}` e coerente com `frequencia` (contém
  "1 vez por mês" ↔ 0,25; "N dia(s)" ↔ N).
- Estágio/aprendiz: salário ≤ teto da categoria × 0,6.
- Remotas: `turno` ∈ {integral, manha, tarde}; nunca `escala`.
- Cobertura: cada `Turno` e `Contrato` aparece em ≥ 10 vagas abertas;
  ≥ 10% das vagas sem salário; ≥ 1 vaga aberta "Saúde + CLT + noite";
  ≥ 1 híbrida com `diasPorSemana ≤ 1` e ≥ 1 com `> 1`.
- Ids, cidades, categorias, status e modelo de todas as vagas existentes
  **não mudam** (R3) — testes de 001–003 seguem válidos.

### Geração (pós-passo, R3)

Fluxo `criarAleatorio(SEMENTE + 1)` sobre `lista` pronta, na ordem:
`contrato` (pesos: CLT 0,60 · temporário 0,13 · estágio 0,10 · PJ 0,10 ·
aprendiz 0,07; PJ concentrado em escritório/remotas) → `turno` (tabela por
categoria; saúde puxa escala/noite) → `publicadaEm` → `semSalario` (15%)
→ ajuste de salário para estágio/aprendiz → `diasPorSemana` derivado de
`frequencia`.

## FiltroBusca (novo — `src/lib/busca/filtro.ts`)

```ts
type RaioKm = 10 | 25 | 50 | 100 | 200;
type Ordem = "relevancia" | "recentes" | "salario" | "distancia";

type FiltroBusca = {
  texto: string;                          // ≤ 60 caracteres; "" = sem filtro
  categorias: Categoria[];                // [] = todas
  modelos: Modelo[];                      // [] = todos
  salario: { min?: number; max?: number };
  somenteComSalario: boolean;             // padrão false
  turnos: Turno[];
  contratos: Contrato[];
  interior: boolean;                      // "Posso morar no interior"
  perto: { cidadeId: string; raioKm: RaioKm } | null;
  incluirRemotas: boolean;                // padrão true; só tem efeito com `perto`
  ordem: Ordem | null;                    // null = padrão (relevancia, ou distancia com `perto`)
};

const FILTRO_VAZIO: FiltroBusca;
```

- `contarAtivos(f)`: grupos ativos entre texto, categorias, modelos,
  salário, somenteComSalario, turnos, contratos, interior, perto. `ordem` e
  `incluirRemotas` não contam.
- Listas: sem repetição, ordem canônica (`ORDEM_*`).
- `salario.min > salario.max` não é estado válido (o schema descarta o par).

## Recorte (novo)

```ts
type Recorte =
  | { tipo: "brasil" }
  | { tipo: "uf"; uf: Uf }
  | { tipo: "cidade"; cidadeId: string }
  | { tipo: "remoto" };
```

Derivado da rota (R7), nunca persistido.

## Funções puras (`src/lib/busca/`)

| Função | Entrada → saída |
|---|---|
| `normalizar(texto)` | movida de `EscolherCidade` para `src/lib/texto.ts` |
| `passaNoFiltro(v, f, ref?)` | `VagaNacional × FiltroBusca × Cidade?` → boolean (R5) |
| `filtrarVagas(vagas, f)` | → `VagaNacional[]` (resolve `ref` de `f.perto`) |
| `noRecorte(v, r)` | → boolean (R7) |
| `distanciaDaVaga(v, ref)` | → km \| null (remota = null) |
| `ordenarVagas(vagas, ordem, { ref, hoje })` | → nova lista (R6) |
| `sugerirAfrouxar(vagas, f, r)` | → `{ grupo, rotulo, total } \| null` |
| `anelDoRaio(ref, raioKm, n = 64)` | → pontos `{x, z}` na cena (R12) |

## Store (novo — `src/stores/filtros.ts`)

```ts
type FiltrosState = FiltroBusca & {
  iniciado: boolean;                    // URL já foi lida nesta sessão (R1)
  definir: (parcial: Partial<FiltroBusca>) => void;
  alternar: <K extends "categorias" | "modelos" | "turnos" | "contratos">(grupo: K, valor: FiltroBusca[K][number]) => void;
  limpar: () => void;                   // volta a FILTRO_VAZIO (mantém `iniciado`)
  iniciarDaUrl: (f: FiltroBusca) => void;
};
```

Sem `persist` (a URL é a persistência). Ao ativar "Perto de mim" sem
`perto.cidadeId`, usa `usePerfilStore.cidadeId`; sem ela, pede a cidade
(`EscolherCidade`, que também grava no perfil).

## Hooks (novos)

| Hook | Retorna |
|---|---|
| `useFiltro()` | `FiltroBusca` atual (seletor raso) |
| `useVagasFiltradas()` | `filtrarVagas(vagasBrasil, filtro)`, memorizado |
| `useAgregados()` | `{ porUf, porCidade, remoto, limites, totalBrasil, faixa(uf) }` sobre a lista filtrada (R2) |
| `useRecorte()` | `Recorte` da rota atual |
| `useSincronizarFiltrosUrl()` | efeito URL ↔ store (R1) |

## Transições de estado da UI do painel

```
fechado ──abrir──▶ lista ──item──▶ detalhe ──Voltar──▶ lista
   ▲                 │                │
   └────fechar───────┘                └──Ver no mapa──▶ navega (/cidade/x?vaga=id)
celular: fechado ⇄ meia ⇄ cheia (arraste ou botão)
```

Painel aberto/fechado é estado de UI local (não vai para a URL).
