# Contrato — Filtros na URL (004)

Estende [../../003-cidade-dinamica/contracts/rotas-e-parametros.md](../../003-cidade-dinamica/contracts/rotas-e-parametros.md).
Query string é entrada externa: tudo passa por Zod (Princípio II). Vale em
`/`, `/estado/[uf]`, `/cidade/[slug]` e `/remoto`.

## Parâmetros

| Parâmetro | Exemplo | Campo de `FiltroBusca` | Inválido |
|---|---|---|---|
| `q` | `q=medico` | `texto` (≤ 60, trim) | > 60 → ignorado |
| `cat` | `cat=saude,obra` | `categorias` | valor desconhecido descartado; resto vale |
| `mod` | `mod=remoto,hibrido` | `modelos` | idem |
| `turno` | `turno=noite,escala` | `turnos` | idem |
| `contrato` | `contrato=clt,pj` | `contratos` | idem |
| `sal` | `sal=2500-4000`, `sal=2500-`, `sal=-4000` | `salario` | não numérico, fora de 0–100000 ou min > max → ignorado |
| `comsal` | `comsal=1` | `somenteComSalario` | ≠ `1` → false |
| `interior` | `interior=1` | `interior` | ≠ `1` → false |
| `perto` | `perto=anapolis-go` | `perto.cidadeId` | cidade inexistente → `perto = null` |
| `raio` | `raio=50` | `perto.raioKm` | ∉ {10,25,50,100,200} → 50 |
| `remotas` | `remotas=0` | `incluirRemotas` | ≠ `0` → true |
| `ordem` | `ordem=recentes` | `ordem` | desconhecido → null; `distancia` sem `perto` e sem cidade no perfil → null |

Cada parâmetro tem seu próprio `.catch()`: um valor ruim nunca derruba os
outros. Listas aceitam no máximo 10 itens e são deduplicadas.

```
ListaSchema(enum) = z.string().max(120)
                      .transform(s => s.split(","))
                      .pipe(z.array(z.string()))
                      .transform(xs => ORDEM.filter(o => xs.includes(o)))   // canônico + descarta desconhecidos
                      .catch([])
SalarioSchema     = z.string().regex(/^\d{0,6}-\d{0,6}$/) → { min?, max? } com refine(min ≤ max) .catch({})
PertoSchema       = IdCidadeSchema.refine(id => cidadePorId.has(id)).optional().catch(undefined)
RaioSchema        = z.coerce.number().pipe(z.union([10,25,50,100,200].map(z.literal))).catch(50)
FiltrosUrlSchema  = z.object({...}) → FiltroBusca
```

## Serialização (`filtroParaParams(f)`)

- Só escreve o que difere de `FILTRO_VAZIO` (links limpos).
- Ordem fixa das chaves: `q, cat, mod, sal, comsal, turno, contrato,
  interior, perto, raio, remotas, ordem` — mesma URL para o mesmo filtro.
- `raio` só com `perto`; `remotas=0` só com `perto`.
- Ida e volta: `FiltrosUrlSchema.parse(filtroParaParams(f)) ≡ f` (teste).

## Convivência com parâmetros existentes

`cidade` (002), `vaga`, `de`, `chegada` (003), `aviso` (001), `semWebgl`
são preservados intactos por `useSincronizarFiltrosUrl`. Nenhum nome
novo colide com eles.

## Sincronização (R1)

| Momento | Efeito |
|---|---|
| 1ª montagem da sessão | URL → store (`iniciarDaUrl`), `iniciado = true` |
| Mudança no store | store → URL via `history.replaceState` (sem nova entrada de histórico, sem ida ao servidor) |
| Navegar para outro nível (link sem query) | página nova monta → hook escreve a query do store na nova URL |
| Recarregar / abrir link compartilhado | volta ao passo 1 → filtros reaplicados |
| "Limpar" | store vazio → parâmetros de filtro removidos da URL |

## Links gerados pela lista

| Ação | URL |
|---|---|
| Ver no mapa (presencial/híbrida) | `/cidade/<cidadeId>?vaga=<id>` + query de filtro |
| Ver no mapa (remota) | `/remoto?vaga=<id>` + query de filtro |
