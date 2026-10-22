# Data Model — 001 Mapa do Brasil

Tudo é dado local (mock) ou derivado. Nenhuma entidade é persistida em
servidor. Nomes de tipos em português, como no código existente
(`src/data/vagas.ts`).

## Uf

União literal das 27 siglas em maiúsculas (`"AC" | "AL" | … | "TO"`).
Na URL aparece em minúsculas (`/estado/go`); conversão e validação em
[contracts/rotas-e-estado.md](contracts/rotas-e-estado.md).

## Estado — `src/data/brasil/estados.ts` (escrito à mão)

| Campo | Tipo | Regra |
|---|---|---|
| `uf` | `Uf` | único |
| `nome` | string | "Goiás" |
| `regiao` | `"Norte" \| "Nordeste" \| "Centro-Oeste" \| "Sudeste" \| "Sul"` | |
| `bioma` | `Bioma` | bioma predominante (cor do relevo) |

`Bioma = "amazonia" | "cerrado" | "caatinga" | "mata-atlantica" | "pampa" | "pantanal"`.
Atribuição:

| Bioma | UFs |
|---|---|
| amazonia | AC, AM, AP, PA, RO, RR, MT |
| cerrado | TO, GO, DF, MA, PI, MG |
| pantanal | MS (licença artística: o Pantanal ocupa parte do MS, mas dá variedade visual ao Centro-Oeste) |
| caatinga | CE, RN, PB, PE, AL, SE, BA |
| mata-atlantica | ES, RJ, SP, PR, SC |
| pampa | RS |

Geometria do estado (contorno, células, ponto de rótulo, caixa) **não** fica
aqui — vem de `geo.json` (abaixo), indexada por `uf`.

## GeoBrasil — `src/data/brasil/geo.json` (gerado pelo script)

Formato completo em [contracts/geo-brasil.md](contracts/geo-brasil.md).
Resumo:

| Campo | Conteúdo |
|---|---|
| `versao` | inteiro do formato |
| `grade` | origem (lon/lat do canto NO), passo em graus, largura, altura, `linhas`: string por linha, 1 caractere por célula (`.` = mar; `A`–`Z`,`a` = índice da UF) |
| `ufs` | por UF: `caixa` (minX, minZ, maxX, maxZ na cena), `rotulo` (x, z), `contorno` (anéis simplificados em coordenadas da cena) |

Derivados em tempo de execução (puros, testáveis):

- `celulaEm(x, z) → Uf | null` — lookup O(1) para seleção.
- `alturaDaCelula(col, lin) → número de degraus` — determinístico (bioma +
  ruído semeado).

## Cidade — `src/data/brasil/cidades.ts` (gerado a partir da lista curada)

| Campo | Tipo | Regra |
|---|---|---|
| `id` | string | slug `nome-uf`, ex.: `goiania-go`; único |
| `ibge` | number | código IBGE (7 dígitos); único |
| `nome` | string | |
| `uf` | `Uf` | |
| `lat`, `lon` | number | graus (para distância real nas specs 002/004) |
| `x`, `z` | number | posição projetada na cena |
| `capital` | boolean | |
| `porte` | `"capital" \| "grande" \| "media" \| "pequena"` | peso no gerador de vagas |

Restrições: ≥ 80 cidades; toda UF tem ≥ 2 cidades (DF: Brasília +
regiões administrativas tratadas como cidades na spec 002); as 5 cidades
das vagas escritas à mão (Goiânia, Anápolis, Aparecida de Goiânia, Senador
Canedo, Trindade) obrigatórias.

## VagaNacional — `src/data/brasil/vagas.ts`

Reaproveita os tipos existentes de `src/data/vagas.ts`
(`Categoria`, `Modelo`, `Status`, `VagaPresencial`, `VagaHibrida`,
`VagaRemota`) **sem as coordenadas da cena da cidade** (`x`, `z`) e com:

| Campo novo | Tipo | Regra |
|---|---|---|
| `uf` | `Uf` | presencial/híbrida: UF da cidade; remota: UF de origem da empresa |
| `cidadeId` | `string \| null` | presencial/híbrida: id de `Cidade`; remota: `null` |

Validações (asseridas em teste do gerador):

- presencial/híbrida ⇒ `cidadeId` existe em `cidades` e `uf` = uf da
  cidade; remota ⇒ `cidadeId === null`.
- toda UF tem ≥ 5 vagas abertas; total ≥ 600; ≥ 80 cidades com vaga.
- mesma semente ⇒ mesma lista (igualdade profunda).
- as 40 vagas de `src/data/vagas.ts` aparecem com mesmo `id`.

## AgregadoVagas — `src/lib/brasil/agregados.ts` (derivado)

Contam **somente** `status === "aberta"` (FR-015).

```
AgregadoUf = {
  uf: Uf
  abertas: number
  porModelo: Record<Modelo, number>      // presencial | hibrido | remoto (remoto pela UF de origem)
  topCategorias: { categoria: Categoria, total: number }[]  // até 3, desc, empate por ordem alfabética do rótulo
}
AgregadoCidade = { cidadeId: string, uf: Uf, abertas: number }
AgregadoRemoto = { abertas: number }
FaixaCalor = 0 | 1 | 2 | 3 | 4           // quantis dos totais por UF
```

Decisão: vagas remotas **não** somam no total do estado no mapa (elas
vivem no Bairro Remoto); aparecem só em `porModelo.remoto` como
"empresas deste estado com vagas remotas". Assim nenhum número conta a
mesma vaga em dois lugares do mapa.

## Estado de interface — `src/stores/mapa.ts`

| Campo | Tipo | Persistido | Regra |
|---|---|---|---|
| `ufEmFoco` | `Uf \| null` | não | hover/1º toque/foco de teclado |
| `modo` | `"luzes" \| "calor"` | sim | padrão `luzes` |

Transições de `ufEmFoco`: `null → uf` (hover, toque, teclado) ·
`uf → outra` · `uf → null` (sair do mapa, toque fora, Esc). Confirmar
navega para `/estado/[uf]` (a URL é a fonte da verdade do nível; o store
não guarda nível).

## Perfil mínimo — `src/stores/perfil.ts`

| Campo | Tipo | Persistido | Regra |
|---|---|---|---|
| `cidadeId` | `string \| null` | sim | deve existir em `cidades`; senão vira `null` na reidratação |

A spec 005 estende este store (mesma chave de armazenamento, campo
`versao` para migração).
