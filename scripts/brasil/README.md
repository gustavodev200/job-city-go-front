# Dados geográficos do mapa do Brasil

`gerar-geo.mjs` gera os dois arquivos que o mapa usa — **nunca edite à mão**:

- `src/data/brasil/geo.json` — grade de blocos (0,2° ≈ 22 km), contornos
  simplificados, caixa e ponto de rótulo de cada UF.
- `src/data/brasil/cidades.ts` — cidades da lista curada com coordenadas
  reais e posição projetada na cena.

Formato: `specs/001-mapa-brasil/contracts/geo-brasil.md`.

```bash
node scripts/brasil/gerar-geo.mjs
```

Precisa de rede só na primeira vez: as fontes ficam em `.cache/` (ignorada
pelo git). O resultado é determinístico — rodar de novo não gera diff. O
script falha (exit 1) se alguma regra do contrato for violada.

## Fontes

| Fonte | Uso | Licença |
|---|---|---|
| [click_that_hood](https://github.com/codeforgermany/click_that_hood) `brazil-states.geojson` | contornos das 27 UFs (base IBGE) | MIT |
| [kelvins/municipios-brasileiros](https://github.com/kelvins/municipios-brasileiros) | código IBGE, nome, lat/lon e capital | MIT |

A API de malhas do IBGE (`servicodados.ibge.gov.br/api/v3/malhas`) é a
fonte oficial alternativa, mas recusou conexão no ambiente em que o script
foi escrito.

## Lista curada

`cidades-curadas.json`: `{ ibge, porte }` de 122 cidades — as 27 capitais e
polos do interior. O porte pesa na distribuição das vagas fictícias. O DF
tem só Brasília (o CSV não separa as regiões administrativas; a spec 002
trata isso).

Cidades costeiras ou na divisa que caem numa célula de mar ou da UF vizinha
são deslocadas, **só na cena**, para a célula mais próxima da própria UF;
`lat`/`lon` continuam reais.
