# Contrato — `src/data/brasil/geo.json` e `cidades.ts` (gerados)

Saída de `scripts/brasil/gerar-geo.mjs`. Versionados no repositório;
**nunca editar à mão** — rodar o script de novo. Consumidos por
`src/lib/brasil/geo.ts` (leitura + funções derivadas).

## Entrada do script

| Fonte | Uso | Licença |
|---|---|---|
| `codeforgermany/click_that_hood` `public/data/brazil-states.geojson` | contornos das 27 UFs (propriedade `sigla`) | MIT |
| `kelvins/municipios-brasileiros` `csv/municipios.csv` | lat/lon e capital das cidades da lista curada | MIT |
| `scripts/brasil/cidades-curadas.json` (no repo) | `[{ ibge, porte }]` — ~90 cidades | — |

Downloads vão para uma pasta temporária e são lidos só como dados (JSON/CSV),
nunca executados. Créditos das duas fontes ficam no cabeçalho dos arquivos
gerados e na página "Sobre/Créditos" futura.

## Parâmetros fixos (constantes no script)

```
PASSO_LAT   = 0.2          // graus por célula (norte–sul)
LAT_REF     = -15          // correção de cosseno
PASSO_LON   = 0.2 / cos(LAT_REF)
TOLERANCIA  = 0.04         // Douglas–Peucker, em graus
```

## `geo.json`

```jsonc
{
  "versao": 1,
  "creditos": "Contornos: click_that_hood (MIT, base IBGE). Cidades: kelvins/municipios-brasileiros (MIT).",
  "grade": {
    "lon0": -74.0,          // canto noroeste (centro da célula 0,0)
    "lat0": 5.3,
    "passoLon": 0.207,
    "passoLat": 0.2,
    "largura": 200,         // colunas
    "altura": 195,          // linhas
    "ufs": "ACALAMAP…TO",   // 27 siglas concatenadas (ordem alfabética); índice i ↔ i-ésimo caractere de "ABCDEFGHIJKLMNOPQRSTUVWXYZa"
    "linhas": ["....AAAB...", "..."]  // 'altura' strings de 'largura' chars; '.' = mar
  },
  "ufs": {
    "GO": {
      "caixa": [minX, minZ, maxX, maxZ],   // coordenadas da cena
      "rotulo": [x, z],                     // ponto interno (polo de inacessibilidade aproximado)
      "contorno": [[[x, z], …], …]          // anéis externos simplificados, coordenadas da cena
    }
  }
}
```

Regras (testadas):

- `linhas.length === altura` e toda linha tem `largura` caracteres.
- Toda UF tem ≥ 1 célula (DF ≥ 2), `rotulo` dentro de uma célula da
  própria UF, `caixa` contém todas as células dela.
- Célula = centro do quadrado dentro do polígono da UF (regra
  par-ímpar); quando o centro cai em 2 UFs (borda), vence a primeira em
  ordem alfabética — determinístico.
- Tamanho do arquivo ≤ 150 KB.

## Coordenadas da cena

```
x = (lon - lon0) / passoLon           // 1 unidade = 1 célula
z = (lat0 - lat) / passoLat           // norte = z menor
```

Depois o conjunto é centralizado (subtrai-se o centro da caixa do Brasil)
para que a origem da cena fique no meio do país. `lib/brasil/geo.ts`
exporta `projetar(lon, lat)` e `celulaEm(x, z)` usando os mesmos números.

## `cidades.ts`

```ts
export const cidades: Cidade[] = [
  { id: "goiania-go", ibge: 5208707, nome: "Goiânia", uf: "GO",
    lat: -16.6864, lon: -49.2643, x: 12.3, z: 8.9,
    capital: true, porte: "capital" },
  // …
];
```

Tipo `Cidade` em [data-model.md](../data-model.md). Ordenado por `uf`,
depois `nome`.
