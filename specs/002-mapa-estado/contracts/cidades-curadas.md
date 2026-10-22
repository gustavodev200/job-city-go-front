# Contrato — `scripts/brasil/cidades-curadas.json` (entrada do script)

Estende [../../001-mapa-brasil/contracts/geo-brasil.md](../../001-mapa-brasil/contracts/geo-brasil.md).
O formato de `geo.json` **não muda** (`versao` continua 1); só a lista curada
e o `cidades.ts` gerado.

## Entradas aceitas

```jsonc
[
  { "ibge": 5208707, "porte": "capital" },                    // município: lat/lon/nome vêm do CSV
  { "nome": "Taguatinga", "uf": "DF",                         // entrada manual (sem IBGE)
    "lat": -15.8339, "lon": -48.0564, "porte": "grande" }
]
```

Validação no script (falha com mensagem e não grava nada):

- exatamente uma das formas acima por item;
- `porte ∈ {capital, grande, media, pequena}`;
- `ibge` existe no CSV e não se repete;
- entrada manual: `uf` é uma das 27 siglas, `nome` não vazio, `lat`/`lon`
  numéricos dentro da caixa do Brasil, e o ponto cai numa célula da própria
  UF (ou é ajustado para a mais próxima, mesma regra das cidades do CSV);
- `id` gerado (`slug(nome)-uf`) único.

## Saída em `cidades.ts`

Entrada manual gera `ibge: null`, `capital: false`. Ordem: `uf`, depois
`nome` (igual à 001).
