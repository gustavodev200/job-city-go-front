# Contrato — Rotas e parâmetros do nível Cidade (003)

Estende [../../002-mapa-estado/contracts/rotas-e-navegacao.md](../../002-mapa-estado/contracts/rotas-e-navegacao.md).
Toda URL é entrada externa e passa por Zod (Princípio II).

## Rotas

| URL | Nível | Mudança nesta feature |
|---|---|---|
| `/cidade/[slug]` | Cidade | cena 3D gerada para qualquer cidade (era provisória na 002) |
| `/cidade/goiania-go` (rota estática) | — | **removida**; Goiânia usa `/cidade/[slug]` |
| `/remoto` | Bairro Remoto | todas as vagas remotas; aceita `?de=` |

`[slug]` inválido continua indo para `/?aviso=cidade` (002).

## Parâmetros

```
ChegadaSchema = z.enum(["ponte"]).optional().catch(undefined)        // /cidade/[slug]?chegada=
DeSchema      = z.string().regex(/^[a-z0-9-]{3,60}$/)
                 .refine(id => cidadePorId.has(id))
                 .optional().catch(undefined)                          // /remoto?de=
vagaSchema(mundo) = z.string().regex(/^[a-z0-9-]{1,80}$/)
                 .refine(id => mundo.spots.some(s => s.id === id))
                 .optional().catch(undefined)                          // ?vaga= nos dois
```

| Parâmetro | Válido | Inválido |
|---|---|---|
| `?chegada=ponte` | personagem nasce na cabeceira da ponte | nasce na praça |
| `?de=anapolis-go` | portal/HUD do remoto: "Voltar para Anápolis" → `/cidade/anapolis-go?chegada=ponte` | "Voltar ao mapa" → `/` |
| `?vaga=<id>` | pergaminho da vaga aberto; personagem em frente ao prédio | ignorado |

Todos lidos no cliente (`useSearchParams` em `<Suspense>`); as páginas
continuam pré-renderizadas.

## Helpers (`src/lib/brasil/rotas.ts`)

```
hrefRemoto(deCidadeId?)        → "/remoto" | "/remoto?de=anapolis-go"
hrefCidade(id, { chegada? })   → "/cidade/anapolis-go" | "/cidade/anapolis-go?chegada=ponte"
```

`itensDaTrilha({ remoto: true })` não muda ("Brasil › Bairro Remoto").

## Travessia

| Onde | Ação | Resultado |
|---|---|---|
| Cidade X | atravessar a ponte a pé ou botão "Ir para o Bairro Remoto" | mesma página; personagem no Bairro Remoto (placa troca) |
| Cidade X (no Bairro Remoto) | botão "Ir para a cidade" | volta à praça |
| `/remoto` com `?de=X` | portal oeste ou botão "Voltar para X" | `/cidade/X?chegada=ponte` (push) |
| `/remoto` sem `de` | idem | `/` (push) |
| Mapa do Brasil | ilha/atalho Bairro Remoto (001) | `/remoto` |
