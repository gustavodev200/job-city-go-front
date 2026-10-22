# Data Model — 002 Mapa do Estado

Continua o modelo da 001 ([../001-mapa-brasil/data-model.md](../001-mapa-brasil/data-model.md)).
Só o que muda ou é novo aparece aqui. Tudo é mock local ou derivado; nada vai
para servidor.

## Cidade — `src/data/brasil/tipos.ts` (ALTERADO)

| Campo | Antes | Agora | Regra |
|---|---|---|---|
| `ibge` | `number` | `number \| null` | `null` só para região administrativa do DF (entrada manual, research R8); números continuam únicos |

Novas cidades (entradas manuais em `scripts/brasil/cidades-curadas.json`):
Taguatinga, Ceilândia, Águas Claras, Gama, Sobradinho — `uf: "DF"`,
`capital: false`, `id` no padrão `nome-df` (ex.: `aguas-claras-df`).
Restrição da 001 "toda UF tem ≥ 2 cidades" passa a valer de fato (teste).

## Vizinhança — `src/data/brasil/estados.ts` (NOVO export)

```
VIZINHOS: Record<Uf, readonly Uf[]>   // fronteiras terrestres, ordem alfabética
```

Regras (testadas): simétrica (`B ∈ VIZINHOS[A] ⇔ A ∈ VIZINHOS[B]`); sem
auto-referência; todo par tem ≥ 1 par de células adjacentes (4-vizinhança) na
grade de `geo.json`. Toda UF tem ≥ 1 vizinho (o Brasil não tem UF-ilha).

## Categoria — `src/data/vagas.ts` (ALTERADO só o rótulo)

| Chave | Rótulo antigo | Rótulo novo |
|---|---|---|
| `comercio` | Comércio | Comércio |
| `escritorio` | Escritório | Escritório |
| `saude` | Saúde | Saúde |
| `galpao` | Galpão | Logística e indústria |
| `obra` | Obra | Construção |
| `escola` | Escola | Educação |
| `bairro` | Estabelecimento de bairro | Serviços gerais |

Ordem de exibição fixa (barras do cartão): a ordem da tabela.

## AgregadoCidade — `src/lib/brasil/agregados.ts` (ESTENDIDO)

Antes: `{ cidadeId, uf, abertas }`. Agora:

```
AgregadoCidade = {
  cidadeId: string
  uf: Uf
  abertas: number                                   // status "aberta"
  encerradas: number                                // status "encerrada"
  porCategoria: Partial<Record<Categoria, number>>  // só abertas; ausente = 0 (cartão mostra só > 0)
  porModelo: { presencial: number; hibrido: number } // só abertas; remotas não têm cidade
}
```

- Entram **todas** as vagas presenciais/híbridas da cidade (aberta ou
  encerrada) → a cidade existe no mapa se `abertas + encerradas ≥ 1` (FR-002).
- `calcularPorCidade` passa a contar encerradas também; quem já usava
  `abertas` (torres da 001, `ListaEstados`) não muda de comportamento.
- Invariantes (testadas, SC-004): `Σ porCategoria = abertas`;
  `porModelo.presencial + porModelo.hibrido = abertas`; para cada UF,
  `Σ abertas das cidades da UF = AGREGADO_UF[uf].abertas`.

Derivado auxiliar:

```
cidadesDoEstado(uf): Cidade[]   // cidades da UF com ≥ 1 vaga, ordem por abertas desc, nome
```

## Construção da prévia — `src/lib/brasil/previa.ts` (NOVO, derivado)

```
ConstrucaoPrevia = { vagaId: string; categoria: Categoria; aberta: boolean; x: number; z: number }
Previa = { construcoes: ConstrucaoPrevia[]; excedente: number }
previaDaCidade(cidade, vagas, max = 40): Previa
```

Regras: abertas antes de encerradas; dentro de cada grupo, ordem por
categoria (ordem da tabela acima) e `id`; no máximo `max`; `excedente =
total − construcoes.length`. Posições em espiral (ângulo de ouro) a partir de
`(cidade.x, cidade.z)`, determinísticas.

## Grupo de rótulos — `src/lib/brasil/rotulos.ts` (NOVO, derivado por quadro)

```
PontoRotulo = { id: string; sx: number; sy: number; largura: number; altura: number; prioridade: number }
GrupoRotulo = { lider: string; membros: string[] }   // membros inclui o líder
agruparRotulos(pontos: PontoRotulo[], margem = 4): GrupoRotulo[]
```

Regras (testadas): todo id aparece em exatamente um grupo; retângulos dos
líderes nunca se cruzam; maior `prioridade` vira líder (cidade em foco e
cidade do perfil recebem prioridade máxima); resultado independe da ordem de
entrada (desempate por `id`).

## Estado de interface — `src/stores/mapa.ts` (ESTENDIDO)

| Campo | Tipo | Persistido | Regra |
|---|---|---|---|
| `ufEmFoco` | `Uf \| null` | não | (001) |
| `modo` | `"luzes" \| "calor"` | sim | (001) |
| `cidadeEmFoco` | `string \| null` | **não** | id de `Cidade` da UF da rota |
| `focarCidade` | `(id: string \| null) => void` | — | |

Transições de `cidadeEmFoco`:

- `null → id`: clique/1º toque no aglomerado ou rótulo; botão na lista;
  `?cidade=` válido ao abrir; estado com uma única cidade com vagas (abre já
  focado).
- `id → outro id`: mesmas ações em outra cidade.
- `id → null`: Esc; botão "Fechar" do cartão; mudança de UF da rota (efeito
  no `PainelEstado`, como a 001 já faz com `ufEmFoco`); voltar ao Brasil.
- Confirmar ("Entrar na cidade") navega para `/cidade/<id>`; o store não
  guarda nível.

Ordenação da lista (`"vagas" | "nome" | "distancia"`) é estado local do
componente, não do store.
