# Research — Busca, filtros e lista de vagas (004)

Decisões da Fase 0. Cada item: decisão, motivo, alternativas descartadas.
Nenhum NEEDS CLARIFICATION pendente: a spec não tinha marcadores e as
lacunas abaixo foram resolvidas com o padrão das features 001–003.

## R1 — Fonte de verdade dos filtros: store em memória + URL espelhada

**Decisão**: `useFiltrosStore` (zustand, **sem** `persist`) guarda o
`FiltroBusca`. Um hook `useSincronizarFiltrosUrl()` montado no layout
`(mapa)` e em `NivelCidade`:

1. Na **primeira montagem da sessão** (`store.iniciado === false`), lê
   `useSearchParams()` → `FiltrosUrlSchema` → store, e marca `iniciado`.
2. Daí em diante, a cada mudança do store (ou de rota), escreve os
   parâmetros de filtro na URL atual com `window.history.replaceState`,
   preservando os parâmetros que não são de filtro (`cidade`, `vaga`, `de`,
   `chegada`, `semWebgl`, `aviso`).

**Motivo**: FR-008 pede filtros no endereço (compartilhar) e ao recarregar
— a URL resolve as duas coisas. O store em memória faz os filtros
atravessarem a navegação Brasil › Estado › Cidade sem mexer em todo
`hrefEstado`/`hrefCidade`/`<Link>` existente: a página nova chega sem
query e o hook reescreve a query a partir do store. `replaceState` se
integra ao router do Next (sincroniza `useSearchParams`, sem ida ao
servidor — confirmado na doc do Next.js "Native History API"), então as
páginas continuam pré-renderizadas.

**Alternativas**: (a) URL como única fonte, lida em cada componente —
exige propagar a query em todo link e em `router.push`; fácil esquecer um.
(b) `persist` em `localStorage` — filtro "grudaria" entre sessões e
surpreenderia quem abre o site de novo; a URL já cobre recarregar.
(c) `router.replace` — faz navegação RSC a cada tecla na busca.

## R2 — Agregados reativos ao filtro

**Decisão**: as funções puras `calcularPorUf`, `calcularPorCidade`,
`calcularRemoto` e `calcularLimitesFaixas` (já recebem a lista) passam a
ser chamadas por um hook `useAgregados()` sobre `useVagasFiltradas()`,
memorizado pela identidade da lista filtrada. Os ~12 componentes que hoje
importam `AGREGADO_UF`/`AGREGADO_CIDADE`/`AGREGADO_REMOTO`/
`TOTAL_ABERTAS_BRASIL`/`faixaCalor` passam a usar o hook. As constantes de
módulo saem (sem filtro, o hook devolve o mesmo resultado).

`cidadesDoEstado(uf)` continua sobre **todas** as vagas (o conjunto de
cidades do mapa do estado não muda com filtro — layout estável); a
contagem exibida é a filtrada. Cidade com 0 vagas no filtro: esmaecida no
mapa e omitida da lista de cidades, com a linha "N cidades sem vagas com
esses filtros".

Faixas do modo Calor: recalculadas sobre as contagens filtradas (senão
"Saúde" deixaria o país inteiro na faixa mais clara).

**Motivo**: FR-005 e US2-1 (contagens recalculadas). Com ~700 vagas, filtrar
e agregar custa < 2 ms — longe do limite de 0,5 s do SC-002.

**Alternativas**: pré-calcular índices por critério — complexidade sem
ganho mensurável nessa escala (YAGNI).

## R3 — Campos novos da vaga sem embaralhar o mock existente

**Decisão**: `turno`, `contrato`, `publicadaEm` e `faixaSalarial?`
(opcional) entram em `VagaBase`; `diasPorSemana` entra em `VagaHibrida`.
No gerador (`data/brasil/vagas.ts`) os campos são preenchidos num
**pós-passo** com um segundo fluxo `criarAleatorio(SEMENTE + 1)`,
percorrendo a lista já pronta. As 40 vagas escritas à mão
(`data/vagas.ts`) recebem os campos à mão.

**Motivo**: o fluxo aleatório original fica intacto → ids, cidades,
categorias, status e contagens das features 001–003 (e seus testes) não
mudam. Determinismo preservado (mesma semente, mesmos dados).

**Alternativas**: sortear no `sortearVaga` — desloca toda a sequência e
quebra testes de contagem de 001–003.

## R4 — "Presença mínima" estruturada

**Decisão**: `VagaHibrida.diasPorSemana: number` (1 vez por mês = 0,25),
ao lado do texto `frequencia` que o pergaminho já mostra. Gerador deriva
os dois da mesma tabela; teste garante coerência texto ↔ número nas 40
escritas à mão.

**Motivo**: US4 precisa comparar "≤ 1 dia/semana"; interpretar texto livre
é frágil. Manter `frequencia` evita mexer em Hud/Pergaminho/deslocamento.

**Alternativas**: trocar `frequencia` por objeto estruturado e derivar o
texto — mais limpo, mas toca 4 consumidores da 003 sem ganho para esta
feature.

## R5 — Semântica dos filtros

| Critério | Regra |
|---|---|
| Texto | `normalizar()` (sem acento, minúsculas) de `titulo` ou `empresa` contém o termo normalizado |
| Categoria (multi) | `categoria ∈ lista`; **remotas não têm categoria** → saem quando há categoria marcada |
| Modalidade (multi) | `modelo ∈ lista` |
| Salário | sobreposição: `v.max ≥ f.min && v.min ≤ f.max`; vaga sem salário passa, salvo `somenteComSalario` |
| Turno / contrato (multi) | `∈ lista` |
| Posso morar no interior | `remoto` **ou** (`hibrido` e `diasPorSemana ≤ 1`); combina por E com modalidade |
| Perto de mim | presencial/híbrida: `distanciaKm(ref, cidade) ≤ raio`; remota: entra se `incluirRemotas` (padrão sim) **e** `atendeAbrangencia(ref.uf, abrangencia)` |

Grupos combinam por E; valores dentro de um grupo por OU. Status não é
filtro: a lista mostra abertas primeiro e encerradas depois; contagens do
mapa seguem só abertas (FR-015 da 001).

Remota em "Perto de mim" respeita a abrangência (003) — mostrar uma remota
"só para SP" a quem está em Anápolis contrariaria o aviso do pergaminho.

**Distância**: `distanciaKm` (haversine, 001/002). Anápolis–Goiânia = 52 km
com as coordenadas do mock: fora nos raios 25 e 50, dentro no 100 (US3-1).

## R6 — Ordenação e patrocinadas

**Decisão** (`ordenarVagas`):

- Sempre: abertas antes de encerradas.
- **Relevância** (padrão; com "Perto de mim" o padrão vira **Distância**):
  patrocinadas ativas (`destaqueAtivo`, 003) intercaladas — até 2, depois
  1 não patrocinada, repete enquanto houver patrocinadas; resto por
  `publicadaEm` desc. Nunca mais de 2 patrocinadas seguidas (US1-4).
- **Mais recentes**: `publicadaEm` desc.
- **Maior salário**: `faixaSalarial.max` desc; "A combinar" no fim.
- **Menor distância**: só oferecida com cidade de referência; remotas no
  fim.
- Desempate final: `id` (estável).

Só a ordem muda: nenhuma vaga que passa no filtro é removida (FR-010).

## R7 — Recorte da lista por nível

| Rota | Recorte |
|---|---|
| `/` | todas (cidades + remotas) |
| `/estado/[uf]` | presenciais/híbridas das cidades da UF (remotas ficam no Bairro Remoto, como nas contagens) |
| `/cidade/[slug]` | vagas da cidade |
| `/remoto` | remotas |

Recorte vem da rota (`usePathname` + `useUfDaRota`/`mundo`), não do store.

## R8 — Detalhes da vaga fora da cidade

**Decisão**: extrair o miolo de `PergaminhoVaga` para
`DetalhesVaga({ vaga })` (presentacional; sem `useMundo`/`useGameStore`).
O pergaminho da cidade passa a envolvê-lo. O painel de vagas mostra
`DetalhesVaga` dentro do próprio painel (vista "detalhe" com "Voltar à
lista"), em qualquer nível. "Ver no mapa" → `hrefCidade(id) + ?vaga=` (ou
`/remoto?vaga=`), que a 003 já trata (personagem em frente ao prédio,
pergaminho aberto). Na mesma cidade, `router.push` com `?vaga=`.

**Alternativas**: navegar direto para a cidade ao tocar o item — contraria
US1 ("abre a vaga e, **se quiser**, Ver no mapa").

## R9 — Painel: desktop lateral, celular gaveta arrastável

**Decisão**: `PainelVagas` à **direita** no desktop (`md:` largura 22 rem,
altura total, ao lado do mapa — o canvas fica com a largura restante, não
coberto). No Brasil, o `ResumoUf` (hoje canto inferior direito) passa a
ficar acima da lista no painel quando ele está aberto. No celular, gaveta
inferior com 3 alturas (fechada = só cabeçalho "N vagas", meia, cheia),
arrastada por pointer events no puxador e alternada por botão
(`aria-expanded`) para teclado/leitor. Sem biblioteca.

No nível Estado, a gaveta de cidades (002) e a de vagas compartilham a
mesma gaveta com abas "Cidades | Vagas" para não empilhar duas gavetas.

## R10 — Lista longa

**Decisão**: renderização progressiva — 30 itens, mais 30 quando um
sentinela entra na tela (`IntersectionObserver`) **ou** ao ativar o botão
"Mostrar mais N" (teclado/leitor). Sem virtualização.

**Motivo**: ≤ 700 itens; virtualizar atrapalha leitor de tela e busca do
navegador. Mudança de filtro volta para 30.

## R11 — Esmaecimento na cidade

**Decisão**: `Instance.dim` / `lit` (já existentes para encerrada) passam
a ser `dim = encerrada || !passaNoFiltro`, `lit = aberta && passaNoFiltro`.
O mundo continua gerado com **todas** as vagas (lotes estáveis; filtro não
reconstrói a cidade). Marcador patrocinado e selo híbrido somem quando a
vaga não passa.

## R12 — Círculo do raio no mapa do estado

**Decisão**: polígono de 64 pontos a `raio` km da cidade de referência
(fórmula de destino na esfera), cada ponto passado por `projetar()` — anel
fino (`Line` do drei) sobre o relevo no 3D e `<polygon>` no `BrasilPlano`.
Visível no nível Estado quando "Perto de mim" está ativo e a referência é
da UF ou o anel cruza a UF.

**Motivo**: `projetar` é equiretangular por grade; projetar a borda real
evita errar a escala em latitudes diferentes.

## R13 — Selos

Selos com dado existente: **Híbrida N×/semana**, **Patrocinado**,
**Encerrada**. "Responde rápido" depende de respostas da empresa (006/009)
e "Não verificada" do selo de verificação (011): o componente `SelosVaga`
já reserva o lugar, e cada feature dona do dado adiciona o selo. Mock não
inventa esses campos agora (YAGNI; o dado ficaria sem significado).

## R14 — Acessibilidade

- Lista = `<ul>` de `<article>`s com título em botão; filtros em
  `<fieldset>`/`<legend>`; multi = checkboxes; raio = radio group.
- Região `aria-live="polite"` anuncia "N vagas" ~400 ms após a última
  mudança (debounce para não falar a cada tecla).
- "Filtros ativos (N)" + "Limpar" sempre visíveis no topo do painel e como
  chip sobre o mapa quando o painel está fechado.
- Sem resultado: "Nenhuma vaga com esses filtros" + `sugerirAfrouxar()` —
  o critério cuja remoção traz mais vagas ("Tirar 'Noite' mostra 12
  vagas", com botão).
- Busca de texto com debounce de 200 ms.
