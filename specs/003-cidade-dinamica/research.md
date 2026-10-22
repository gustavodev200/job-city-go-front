# Research — 003 Cidade dinâmica e Bairro Remoto

Fase 0 do `/speckit-plan`. Cada item: **Decisão**, **Motivo**, **Alternativas**.

Ponto de partida (código atual): a cidade 3D é um mundo **fixo** — constantes
de módulo em `src/data/mapa.ts` (6×6 quarteirões, rio, ponte, vila 3×3) e
listas calculadas uma vez em `src/components/city/layout.ts` a partir de
`src/data/vagas.ts` (40 vagas escritas à mão com `x`/`z` na cena). Roads,
Terrain, Trees, Buildings, Outdoors, Minimap, Hud, Player e PergaminhoVaga
importam essas constantes diretamente. A spec 001 criou `vagasBrasil`
(~670 vagas, 127 cidades, 50 remotas) sem posição na cena; a 002 criou
`/cidade/[slug]` provisória.

Números do mock hoje: maior cidade Goiânia (28 vagas), várias com 1 vaga;
50 vagas remotas com abrangências em texto livre ("Brasil inteiro",
"Remoto para GO", "Remoto para GO e DF", "Fuso de Brasília").

## R1. Mundo gerado por função pura + contexto React

- **Decisão**: `gerarMundo(entrada)` em `src/lib/cidade/mundo.ts` (pura,
  determinística, sem React/three) devolve um objeto `Mundo` com tudo que hoje
  é constante de módulo: grade de quarteirões, praça, estacionamento, lotes
  das vagas, casas decorativas, carros, limites, rio/ponte/portal, pontos de
  interação (`spots`) e colisores, além das funções `alturaDoChao`,
  `alturaDoPasso`, `bloqueado`, `dentroDePredio`, `vagaProxima`. Duas
  entradas: `{ tipo: "cidade", cidade, vagas }` e `{ tipo: "remoto", vagas }`.
  O mundo chega aos componentes por `MundoContext` (`src/components/city/mundo.tsx`,
  hook `useMundo()`), provido pela página em volta do Canvas **e** do HUD.
  O R3F 9 repassa contexto React para dentro do Canvas (dependência
  `its-fine`), então um só provider serve cena e HUD.
- **Motivo**: FR-001/FR-002 (qualquer cidade, disposição estável) e FR-004
  (todo comportamento atual) exigem trocar constantes por dados; função pura
  dá para testar sem WebGL (lotes, colisão, limites) e memoriza por cidade.
- **Alternativas**: zustand com o mundo atual (estado global para algo que é
  derivado da rota; atrapalha testes e duas abas de cidade); props descendo
  por todos os componentes (Player, Roads, Trees… — 10+ assinaturas);
  manter constantes e só trocar as vagas (não muda tamanho nem limites).

## R2. Tamanho da cidade e lotes estáveis

- **Decisão**: mantém a escala atual — quarteirão de 14, rua de 6, passo
  20, **uma vaga por quarteirão** (as fachadas ocupam o lote inteiro, ±6,2).
  Quarteirões necessários = `vagas + 1 (praça) + 1 (estacionamento) +
  max(2, ⌈15% das vagas⌉) (casas)`; grade `N×N` com
  `N = max(2, ⌈√necessários⌉)` (FR-001: mínimo 2×2). Goiânia (28) → 6×6
  (igual ao mundo atual); cidade com 1–3 vagas → 3×3; 150 vagas → 14×14.
  Centros dos quarteirões: `(i − (N−1)/2) · 20`. Praça = quarteirão mais
  perto da origem (empate: menor x, depois maior z — reproduz `(-10, 10)` de
  hoje). Vagas da cidade **na ordem do conjunto mock** (ordem de criação)
  ocupam os quarteirões livres ordenados por distância à praça (empate por
  ângulo); o primeiro livre que sobra vira estacionamento, o resto casas.
- **Motivo**: FR-002 — a ordem de criação só cresce no fim (vagas novas da
  spec 009 vão para a borda), então visitas seguidas dão o mesmo lote;
  reaproveita fachadas, ruas e colisão sem redesenhar nada; vagas
  importantes (mais antigas) ficam perto da praça.
- **Alternativas**: várias vagas por quarteirão (exige fachadas menores ou
  nova escala — reescreve `facades.ts`); posição por hash do id (estável
  mesmo com remoção, mas gera buracos e colisões a resolver); manter `x`/`z`
  escritos à mão (só serve para Goiânia).

## R3. Cidade e Bairro Remoto como mundos separados, ligados por ponte e portal

- **Decisão**: cada cidade (`/cidade/[slug]`) tem a cidade gerada + rio,
  ponte e um **portal "Bairro Remoto"** na margem leste (onde hoje começa a
  subida da vila). Atravessar o portal navega para `/remoto?de=<slug>`. O
  Bairro Remoto (`/remoto`) é o planalto atual da vila, com a ponte e um
  portal de volta na margem oeste ("Voltar para Anápolis", ou "Voltar ao
  mapa" sem `de`), que navega para `/cidade/<de>?chegada=ponte` (o
  personagem nasce na cabeceira da ponte) ou `/`. Botão do HUD faz o mesmo
  que o portal (acessível por teclado). O mapa do Brasil continua levando a
  `/remoto` (ilha da 001).
- **Bairro Remoto**: grade de quarteirões 14 com rua 4 (escala da vila
  atual) e **4 casas por quarteirão** (`REMOTE_HOUSE` é pequena), mesma regra
  de ordem/estabilidade da R2; 50 vagas → 13 quarteirões → 4×4. Toda vaga
  remota do mock, nenhuma outra (FR-007).
- **Motivo**: FR-008 (acesso pelo mapa e por qualquer cidade, com retorno)
  sem pôr 50 casas remotas em cada cidade (custo dobrado na maior cidade e
  no celular, SC-004); mantém a ponte e a travessia do jogo atual; o mundo
  remoto é o mesmo para todo o país (nacional).
- **Alternativas**: vila anexada a toda cidade (mundo único como hoje: mais
  pesado, e `/remoto` direto teria que escolher uma cidade arbitrária a
  oeste); teletransporte por botão só (perde a ponte, que é parte do charme).

## R4. Rotas, parâmetros e o fim de `/cidade/goiania-go`

- **Decisão**: `/cidade/[slug]` (criada provisória na 002) passa a montar a
  cena gerada para **toda** cidade; a rota estática `/cidade/goiania-go` é
  removida (Goiânia vira uma cidade como as outras). Parâmetros novos,
  validados com Zod: `?chegada=ponte` (só esse valor) em `/cidade/[slug]`,
  `?de=<id de cidade existente>` em `/remoto` e `?vaga=<id>` nos dois (abre o
  pergaminho daquela vaga e põe o personagem na frente do prédio; só vale se
  a vaga for deste mundo). `?vaga=` é o link direto para uma vaga que a lista
  acessível da spec 004 vai usar, e permite testar o pergaminho no E2E sem
  andar. Lidos no cliente
  (`useSearchParams` dentro de `<Suspense>`), páginas continuam
  pré-renderizadas. Slug inexistente continua em `redirect("/?aviso=cidade")`
  (edge case "volta ao estado ou ao Brasil com aviso": não há estado para
  inferir de um slug inválido, então Brasil).
- **Motivo**: FR-001/FR-008; Princípio II (URL é entrada externa).
- **Alternativas**: manter a rota fixa de Goiânia (duas implementações da
  mesma cidade).

## R5. Fonte única de vagas e fim das coordenadas escritas à mão

- **Decisão**: a cena passa a ler `vagasBrasil` (filtrado por `cidadeId` ou
  `modelo === "remoto"`), nunca `src/data/vagas.ts` direto. `x`/`z` saem de
  `VagaBase` (posição agora é do mundo gerado); `src/data/vagas.ts` fica com
  tipos, rótulos e as 40 vagas escritas à mão (que já entram em
  `vagasBrasil` com o mesmo id). Hud, Pergaminho e Minimap buscam a vaga pelo
  id no mundo atual.
- **Motivo**: SC-002 (0 vagas de outra cidade) fica garantido pela
  construção do mundo; acaba a duplicação de posição.
- **Alternativas**: manter `x`/`z` opcionais (campo morto que confunde).

## R6. Abrangência estruturada, fuso e alerta de residência (FR-007, FR-009)

- **Decisão**: `VagaRemota.estado: string` vira
  `abrangencia: { tipo: "brasil" } | { tipo: "ufs"; ufs: Uf[] } | { tipo: "fuso"; fuso: "brasilia" }`
  e `rotuloAbrangencia()` gera o texto ("Brasil inteiro", "Remoto para GO e
  DF", "Fuso de Brasília"). `estados.ts` ganha `fuso: -5 | -4 | -3` por UF
  (AC −5; AM, MT, MS, RO, RR −4; demais −3). `atendeAbrangencia(perfilUf,
  abrangencia)` decide o aviso: "Esta vaga pede residência em GO" /
  "Esta vaga pede o fuso de Brasília". Sem perfil: sem aviso, convite para
  informar a cidade. Estado de origem da empresa = `uf` da vaga (já existe).
- **Motivo**: texto livre não dá para comparar com o perfil; o gerador já
  sabe a abrangência que sorteia.
- **Alternativas**: parse do texto (frágil); campo `ufsPermitidas` só (não
  cobre fuso).

## R7. Deslocamento estimado (FR-006, US3)

- **Decisão**: `estimarDeslocamento(origem, destino)` em
  `src/lib/cidade/deslocamento.ts`: `km = round(haversine × 1,25)` (fator de
  rota), `minutos = arredondar para 5(km / 45 km/h × 60)`, mínimo 10 min;
  mesma cidade → "Na sua cidade". Texto: "~25 km · ~35 min de carro ·
  presença 1 dia por semana" (híbrida) ou sem a parte de presença
  (presencial). Reaproveita `distanciaKm` da 002.
- **Motivo**: Assumption "estimativa simples, sem trânsito"; com os números
  reais Trindade→Goiânia dá ~25 km e ~35 min, igual ao exemplo da spec.
- **Alternativas**: API de rotas (fora do escopo mock).

## R8. Leitura da construção: categoria, status, híbrida, patrocinada

- **Decisão**:
  - Categoria → `FACADES[categoria]` (já existe, 7 fachadas).
  - Aberta → instância `lit`; encerrada → `dim` **e** placa "Encerrada"
    (um `InstancedParts` com uma placa de madeira + `label`, só nas
    encerradas; vale para cidade e Bairro Remoto). (FR-003, US2-2.)
  - Híbrida → selo de frequência já existe (`BADGE_PARTS`); passa a ler a
    frequência da vaga.
  - Patrocinada (FR-011) → campo opcional `destaque?: { ate: string }` (data
    ISO) em `VagaBase`; ativa se `ate ≥ hoje`. Marcador flutuante 1,5× maior,
    com brilho, e etiqueta "Patrocinado" (`Html`). Mock: 2 vagas com
    destaque até `2099-12-31` só para demonstrar; a spec 009 cria as reais.
- **Motivo**: SC-003 (aberta × encerrada só olhando); patrocínio sempre
  rotulado (regra do produto).
- **Alternativas**: trocar a cor do prédio encerrado (confunde com
  categoria).

## R9. HUD, legenda, mini-mapa e pergaminho

- **Decisão**: `Hud` mostra placa com "Anápolis · GO" (ou "Bairro Remoto"),
  vagas abertas do mundo e trilha (já posta na página pela 002); legenda com
  as 7 categorias e contagem **do mundo atual**; os cartões "Ir para cidade /
  vila" viram um botão de portal ("Bairro Remoto" na cidade; "Voltar para
  <cidade>" no remoto). `Minimap` desenha quarteirões, ruas, rio e ponte a
  partir do mundo. `PergaminhoVaga` lê a vaga do mundo e ganha linha de
  deslocamento (R7) e aviso de abrangência (R6); remota mostra abrangência
  e "Empresa de <Estado>".
- **Motivo**: FR-004, FR-006, FR-009, FR-010.
- **Alternativas**: HUD novo (perde o visual existente).

## R10. Player, câmera, travessia

- **Decisão**: `Player` recebe ponto de nascimento do mundo (praça, ou
  cabeceira da ponte com `?chegada=ponte`), usa `mundo.bloqueado` /
  `mundo.alturaDoPasso` e detecta a entrada na zona do portal (retângulo do
  mundo) → chama `aoAtravessar()` uma vez (navegação). A "viagem" animada do
  `useGameStore` (`travelTo`/`AREAS`) sai: não há mais duas áreas na mesma
  cena. Limites do mundo variam com o tamanho (edge case).
- **Motivo**: FR-004, FR-008, edge case de limites.
- **Alternativas**: manter `travelTo` para "ir à praça" (YAGNI).

## R11. Árvores, terreno, outdoors

- **Decisão**: `Trees` gera árvores por quarteirão/rua a partir do mundo
  (mesma regra de hoje, semente pelo id do mundo) e o campo em volta dentro
  de `limites + 60`; `isInsideCanopy` passa a ser método do conjunto gerado
  (`mundo.arvores`). `Terrain` dimensiona o chão pelos limites e usa
  `mundo.alturaDoChao`. `Outdoors`: candidatos de posição derivados das ruas
  em volta da praça e da avenida até a ponte (mesmo algoritmo de encaixe);
  anunciantes escolhidos por embaralhamento semeado pela **região** da
  cidade (cidades da mesma região mostram o mesmo conjunto — base para a
  spec 010).
- **Motivo**: FR-004 e edge case "outdoors da região".
- **Alternativas**: tabela de anunciantes por região (dado que a 010 vai
  definir; antecipar seria YAGNI).

## R12. Desempenho (SC-001, SC-004)

- **Decisão**: `gerarMundo` memorizado por id (`Map`), < 5 ms para 150 vagas
  (medido em teste). Instâncias continuam por categoria (draw calls não
  crescem com o número de vagas). Árvores limitadas a 1 por canto de
  quarteirão livre + ≤ 400 no campo. `MAX_CONSTRUCOES` sobe de 300 para 400
  (14×14 = 196 quarteirões × casas). Sem novas luzes pontuais (as da cena
  são só no desktop, como hoje).
- **Motivo**: SC-001 (< 2 s até andar) e SC-004.
- **Alternativas**: LOD/streaming de quarteirões (desnecessário nessa escala).

## R13. Testes

- **Decisão**: Vitest — `gerarMundo`: toda vaga da cidade exatamente uma
  vez, nenhuma de outra cidade (SC-002), lotes únicos, praça livre, mínimo
  2×2, tamanhos (1, 3, 28, 150 vagas sintéticas), estabilidade (duas
  gerações iguais; adicionar vaga no fim não move as outras), colisão e
  limites, mundo remoto só com remotas; `estimarDeslocamento`
  (Trindade→Goiânia ≈ 25 km / 35 min); `atendeAbrangencia`;
  `rotuloAbrangencia`; schemas de `?chegada` e `?de`. Playwright — entrar em
  Anápolis pelo mapa e conferir placa/legenda (contagens batem com o mock);
  `/cidade/goiania-go` agora pela rota dinâmica; botão "Bairro Remoto" →
  `/remoto?de=…` → "Voltar para …" volta à cidade; `/remoto` direto volta ao
  mapa; pergaminho de vaga encerrada com botão desabilitado (aberto pelo
  teclado/legenda, sem andar).
- **Motivo**: skill `testing` (mesmos runners).
- **Alternativas**: testar andando com o teclado no E2E (lento e frágil no
  WebGL por software).
