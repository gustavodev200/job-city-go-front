# Contrato — Rotas, parâmetros e trilha (002)

Estende [../../001-mapa-brasil/contracts/rotas-e-estado.md](../../001-mapa-brasil/contracts/rotas-e-estado.md).
Toda URL é entrada externa e passa por Zod (Princípio II).

## Rotas

| URL | Nível | Dono | Mudança nesta feature |
|---|---|---|---|
| `/` | Brasil | 001 | trilha "Brasil" (sem link) |
| `/estado/[uf]` | Estado | 002 | painel completo, cidades, prévia, vizinhos; aceita `?cidade=` |
| `/cidade/goiania-go` | Cidade (3D) | existente | `Hud` ganha a trilha "Brasil › Goiás › Goiânia" |
| `/cidade/[slug]` | Cidade (provisório) | **002 → 003** | NOVA: trilha + resumo + "cidade 3D chega em breve"; 003 troca pela cena |
| `/remoto` | Bairro Remoto | 001 | trilha "Brasil › Bairro Remoto" |

Precedência: `/cidade/goiania-go` (segmento estático) vence `/cidade/[slug]`.

### `?cidade=` (só em `/estado/[uf]`)

```
CidadeFocoSchema(uf) = z.string()
  .regex(/^[a-z0-9-]{3,60}$/)
  .refine(id => cidadePorId.get(id)?.uf === uf)
  .optional()
  .catch(undefined)
```

- Válido → abre o nível com essa cidade em foco (câmera voa até ela).
- Inválido, de outra UF ou ausente → ignorado (sem aviso; o nível abre normal).
- Lido no cliente (`useSearchParams` dentro de `<Suspense>`); a página segue
  estática (`generateStaticParams` das 27 UFs).
- Focar outra cidade depois **não** altera a URL.

### `[slug]` (em `/cidade/[slug]`)

```
CidadeParamSchema = z.string()
  .regex(/^[a-z0-9-]{3,60}$/)
  .refine(id => cidadePorId.has(id))
```

- Válido → página provisória da cidade.
- Inválido → `redirect("/?aviso=cidade")` (o valor `cidade` de `AvisoSchema`
  já existe desde a 001).
- `generateStaticParams` devolve todos os `id` de `cidades`.

## Helpers de href (`src/lib/brasil/rotas.ts`)

```
hrefEstado(uf, cidadeId?)  → "/estado/go" | "/estado/go?cidade=anapolis-go"
hrefCidade(cidadeId)       → "/cidade/anapolis-go"
itensDaTrilha({ uf?, cidadeId?, remoto? }) → { rotulo: string; href: string | null }[]
```

`itensDaTrilha` (pura):

| Entrada | Saída |
|---|---|
| `{}` | `[Brasil·null]` |
| `{ uf: "GO" }` | `[Brasil·/, Goiás·null]` |
| `{ cidadeId: "anapolis-go" }` | `[Brasil·/, Goiás·/estado/go?cidade=anapolis-go, Anápolis·null]` |
| `{ remoto: true }` | `[Brasil·/, Bairro Remoto·null]` |

O último item é sempre `href: null` e é renderizado com `aria-current="page"`.

## Navegação

| Ação | Resultado |
|---|---|
| Confirmar UF (nível Brasil) | `router.push(hrefEstado(uf))` (001) |
| Focar cidade (mapa, rótulo, lista) | `focarCidade(id)` + voo de câmera; URL não muda |
| "Entrar na cidade" | `router.push(hrefCidade(id))` |
| Item da trilha | `<Link>` (push) |
| Estado vizinho | `<Link href={hrefEstado(vizinho)}>` |
| Chip "+K cidades" | aproxima a câmera na caixa dos membros; não navega |
| Botão voltar do navegador | nível anterior (histórico do Next) |
| "Ir para minha cidade" (ControlesMapa) | `hrefCidade(perfil.cidadeId)` para qualquer cidade |

## Interação no nível Estado

| Ação | Mouse | Toque | Teclado |
|---|---|---|---|
| Focar cidade | clique no aglomerado/rótulo | 1º toque | Tab/↑/↓ na lista + Enter/Espaço |
| Entrar na cidade | botão do cartão / 2º clique no mesmo rótulo | botão do cartão / 2º toque | botão do cartão (Enter) |
| Limpar foco | botão "Fechar" | idem | Esc |
| Ordenar lista | `<select>` Vagas/Nome/Distância | idem | idem |
| Abrir/fechar gaveta (celular) | — | alça | botão da alça (`aria-expanded`) |

O cartão da cidade em foco é anunciado em `aria-live="polite"`:
"Anápolis: 12 vagas abertas. Comércio 4, Saúde 3, …".

## Armazenamento local

Sem chaves novas. `jcg:mapa` continua persistindo só `modo` (`cidadeEmFoco`
fica fora do `partialize`).
