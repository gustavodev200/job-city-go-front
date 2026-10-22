# Data Model — 003 Cidade dinâmica e Bairro Remoto

Continua [../002-mapa-estado/data-model.md](../002-mapa-estado/data-model.md).
Tudo é mock local ou derivado; nada vai para servidor.

## Vaga — `src/data/vagas.ts` (ALTERADO)

| Campo | Antes | Agora | Regra |
|---|---|---|---|
| `x`, `z` | posição na cena (só Goiânia/vila) | **removidos** | posição vem do `Mundo` gerado |
| `destaque` | — | `{ ate: string }` opcional (data ISO `AAAA-MM-DD`) | ativo se `ate ≥ hoje`; sempre rotulado "Patrocinado" (FR-011) |
| `VagaRemota.estado` | `string` livre | **substituído** por `abrangencia: Abrangencia` | |

```
Abrangencia =
  | { tipo: "brasil" }
  | { tipo: "ufs"; ufs: Uf[] }        // 1+ UFs, ordem alfabética
  | { tipo: "fuso"; fuso: "brasilia" }
```

`rotuloAbrangencia(a)`: "Brasil inteiro" · "Remoto para GO" · "Remoto para
GO e DF" · "Fuso de Brasília". As 40 vagas escritas à mão e o gerador de
`src/data/brasil/vagas.ts` passam a gravar `abrangencia` (o gerador já
sorteia esses casos). Mock: 2 vagas com `destaque: { ate: "2099-12-31" }`
(1 em Goiânia, 1 remota) só para demonstração.

## Estado — `src/data/brasil/estados.ts` (ALTERADO)

| Campo novo | Tipo | Regra |
|---|---|---|
| `fuso` | `-5 \| -4 \| -3` | AC −5; AM, MT, MS, RO, RR −4; demais −3 (horário de Brasília) |

## Mundo — `src/lib/cidade/mundo.ts` (NOVO, derivado)

```
EntradaMundo =
  | { tipo: "cidade"; cidade: Cidade; vagas: VagaNacional[] }   // vagas presenciais/híbridas da cidade
  | { tipo: "remoto"; vagas: VagaNacional[] }                   // todas as remotas

Mundo = {
  id: string                         // id da cidade ou "remoto"
  tipo: "cidade" | "remoto"
  nome: string                       // "Anápolis" | "Bairro Remoto"
  uf: Uf | null
  grade: { n: number; passo: number; quarteirao: number; rua: number; centros: number[] }
  praca: { x: number; z: number } | null          // remoto: null
  estacionamento: { x: number; z: number } | null
  lotes: Lote[]                                    // um por vaga
  casas: { x: number; z: number; variante: number }[]   // decorativas, sem luz, sem clique
  carros: { x: number; z: number; rotY: number; cor: number }[]
  rio: { x: number; meiaLargura: number }          // cidade: leste; remoto: oeste
  ponte: { x0: number; x1: number; meiaLargura: number; topo: number }
  portal: { x0: number; x1: number; meiaLargura: number; destino: "remoto" | "cidade" }
  nascimento: { praca: Ponto; ponte: Ponto }       // pontos de chegada
  limites: { minX: number; maxX: number; minZ: number; maxZ: number }
  spots: VagaSpot[]                                 // como hoje (layout.ts), para marcador/balão
  colisores: Rect[]
  // funções puras sobre os dados acima
  alturaDoChao(x, z): number
  alturaDoPasso(x, z): number
  bloqueado(x, z, raio): boolean
  dentroDePredio(x, y, z, folga): boolean
  vagaProxima(x, z): string | null
  noPortal(x, z): boolean
}

Lote = { vagaId: string; x: number; z: number; categoria: Categoria | null /* remota: null */; aberta: boolean; hibrida: boolean; destaque: boolean }
```

Regras (testadas):

- Cidade: grade `N×N`, `N = max(2, ⌈√(vagas + 2 + max(2, ⌈0,15·vagas⌉))⌉)`,
  passo 20, quarteirão 14, rua 6; **1 lote por quarteirão**; praça =
  quarteirão mais perto da origem (desempate: menor x, maior z).
- Remoto: quarteirão 14, rua 4, **4 lotes por quarteirão** (±3,4), grade
  `N×N` com `N = max(2, ⌈√⌈vagas/4⌉⌉)`.
- Lotes atribuídos às vagas **na ordem do conjunto mock**, quarteirões livres
  ordenados por distância à praça (ou ao centro, no remoto) e depois por
  ângulo — mesma entrada ⇒ mesmo mundo; acrescentar vaga no fim não move as
  anteriores (FR-002).
- Toda vaga da entrada tem exatamente um lote; nenhuma outra (SC-002).
- Remoto contém só `modelo === "remoto"`; cidade nunca contém remota.
- `limites` cobre quarteirões + rua externa + margem; `bloqueado` é verdade
  fora dos limites, na água fora da ponte, na fonte da praça e dentro de
  colisor (FR-004, edge case).
- Memorizado: `mundoDaCidade(id)` e `mundoRemoto()` guardam o resultado.

## Deslocamento — `src/lib/cidade/deslocamento.ts` (NOVO, derivado)

```
estimarDeslocamento(origem: Cidade, destino: Cidade):
  | { mesmaCidade: true }
  | { mesmaCidade: false; km: number; minutos: number }
```

`km = round(distanciaKm × 1,25)`; `minutos = max(10, arredondado para 5(km / 45 × 60))`.

## Abrangência x perfil — `src/lib/cidade/abrangencia.ts` (NOVO, derivado)

```
rotuloAbrangencia(a: Abrangencia): string
atendeAbrangencia(perfilUf: Uf, a: Abrangencia): boolean
avisoAbrangencia(perfilUf: Uf | null, a): string | null
  // "Esta vaga pede residência em GO" | "… em GO ou DF" | "Esta vaga pede o fuso de Brasília" | null
```

## Estado de interface — `src/stores/game.ts` (ALTERADO)

| Campo | Situação |
|---|---|
| `selectedVagaId`, `nearbyVagaId`, `cameraDistance`, `zoom`, `selectVaga`, `setNearbyVaga` | mantidos |
| `travel`, `travelTo`, `finishTravel`, tipo `Travel` | **removidos** (não há duas áreas na mesma cena) |

`src/data/mapa.ts`: constantes de cidade/vila e funções de terreno saem
(viram parte do `Mundo`); `LOT_TOP`, tamanhos e alturas fixas que não
dependem da cidade continuam como constantes exportadas de
`src/lib/cidade/mundo.ts`.
