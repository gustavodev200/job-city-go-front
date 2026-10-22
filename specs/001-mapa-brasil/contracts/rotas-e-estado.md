# Contrato — Rotas, parâmetros e estado persistido

Interfaces que o usuário (e outras features) usam diretamente: URLs,
parâmetros de busca e chaves de armazenamento local. Todas são **entrada
externa** e passam por Zod (Princípio II da constituição).

## Rotas

| URL | Nível | Dono | Comportamento |
|---|---|---|---|
| `/` | Brasil | 001 | Mapa do país inteiro, enquadrado |
| `/estado/[uf]` | Estado | 001 (mínimo) → 002 | Câmera enquadra a UF; painel-resumo da UF; 002 adiciona cidades |
| `/cidade/goiania-go` | Cidade | existente, movido de `/` | Cena 3D atual sem mudança funcional; 003 vira `/cidade/[slug]` |
| `/remoto` | Bairro Remoto | 001 (atalho) → 003 | Mesma cena da cidade, começando na vila |
| `/personagem` | — | existente | Sem mudança |

### `[uf]`

```
UfParamSchema = z.string()
  .regex(/^[a-z]{2}$/)
  .transform(s => s.toUpperCase())
  .pipe(z.enum(UFS))           // as 27 siglas
```

- Válido → renderiza o nível Estado daquela UF.
- Inválido (`/estado/xx`, `/estado/GO`, `/estado/goias`) →
  `redirect("/?aviso=estado")`.
- `generateStaticParams` devolve as 27 siglas em minúsculas.

### `?aviso=` (só em `/`)

```
AvisoSchema = z.enum(["estado", "cidade"]).optional().catch(undefined)
```

Mostra um aviso curto e não bloqueante ("Não encontramos esse estado.
Escolha no mapa.") e remove o parâmetro da URL (`router.replace("/")`).
Qualquer outro valor é ignorado.

### Navegação

- Confirmar UF no nível Brasil → `router.push("/estado/<uf>")`.
- Trilha/botão "Brasil" → `router.push("/")`.
- Botão voltar do navegador → nível anterior; a cena reage a
  `usePathname()` e anima a câmera (ou corta, com reduzir movimento).
- "Ir para minha cidade": se `cidadeId === "goiania-go"` →
  `/cidade/goiania-go`; senão → `/estado/<uf da cidade>` (a spec 003 troca
  para `/cidade/<cidadeId>`).
- Atalho/ilha Bairro Remoto → `/remoto`.

## Armazenamento local (localStorage)

Leitura sempre via `safeParse`; falha ⇒ valor padrão, sem quebrar a
página. Escrita/leitura dentro de `try/catch` (armazenamento pode estar
bloqueado).

| Chave | Schema | Padrão | Dono |
|---|---|---|---|
| `jcg:mapa` | `{ state: { modo: z.enum(["luzes","calor"]) }, version: 1 }` | `modo: "luzes"` | `stores/mapa.ts` |
| `jcg:perfil` | `{ state: { cidadeId: z.string().nullable() }, version: 1 }` + refinamento: `cidadeId` existe em `cidades` | `cidadeId: null` | `stores/perfil.ts` (estendido na 005) |

Prefixo `jcg:` reservado para todas as chaves do app (facilita o
"Restaurar dados de demonstração" da spec 005).

## Eventos de interface (acessibilidade)

| Ação | Mouse | Toque | Teclado |
|---|---|---|---|
| Focar UF (resumo) | hover | 1º toque | Tab/←/→ na lista de estados ou no mapa focado |
| Confirmar UF | clique | 2º toque na mesma UF | Enter |
| Limpar foco | sair do mapa | toque fora | Esc |
| Centralizar | botão | botão | botão (Tab) |
| Alternar modo | botão Luzes/Calor | idem | idem (`aria-pressed`) |

O resumo da UF em foco é anunciado numa região `aria-live="polite"`.
