# Research — 001 Mapa do Brasil

Fase 0 do `/speckit-plan`. Cada item: **Decisão**, **Motivo**, **Alternativas**.

## R1. Fonte do contorno dos estados

- **Decisão**: GeoJSON `brazil-states.geojson` do repositório
  `codeforgermany/click_that_hood` (licença MIT, derivado da malha do IBGE,
  27 features com `sigla`). Baixado **uma vez** por script de geração
  (R3); só o resultado processado é versionado. A API de malhas do IBGE
  (`servicodados.ibge.gov.br/api/v3/malhas/paises/BR?intrarregiao=UF`) fica
  documentada como fonte alternativa oficial.
- **Motivo**: domínio público/MIT, já separado por UF, acessível. A API do
  IBGE recusou conexão no ambiente de desenvolvimento (reset) — não dá para
  depender dela no script.
- **Alternativas**: `giuliano-oliveira/geodata-br-states` (5,6 MB, mais
  pesado sem ganho); Natural Earth admin-1 (licença ok, mas contorno de UF
  menos fiel); buscar em tempo de execução (rejeitado: app é mock/offline,
  e não deve depender de serviço externo).

## R2. Fonte das cidades (coordenadas)

- **Decisão**: CSV `kelvins/municipios-brasileiros` (MIT; código IBGE,
  nome, lat/lon, capital, código UF). O script filtra uma **lista curada de
  ~90 códigos IBGE** (27 capitais + polos regionais do interior) e grava
  `src/data/brasil/cidades.ts`. O porte (capital, grande, média, pequena)
  vem da lista curada, não do CSV.
- **Motivo**: coordenadas confiáveis sem digitar à mão; código IBGE vira
  chave estável; lista curada mantém o mock pequeno e plausível (decisão
  transversal 5: ≥ 80 cidades).
- **Alternativas**: digitar coordenadas à mão (erro fácil); API de
  localidades do IBGE (sem coordenadas); todos os 5.570 municípios
  (desnecessário para o mock).

## R3. Pré-processamento geográfico (bake)

- **Decisão**: script Node sem dependências, `scripts/brasil/gerar-geo.mjs`,
  rodado manualmente. Faz: projeção (R4) → rasterização numa grade de
  blocos (R5) → simplificação Douglas–Peucker dos contornos (para bordas e
  para o modo 2D) → pontos de rótulo por UF → grava
  `src/data/brasil/geo.json` (formato em
  [contracts/geo-brasil.md](contracts/geo-brasil.md)). Também gera
  `cidades.ts` (R2), já com coordenadas projetadas.
- **Motivo**: o navegador recebe dado pronto e pequeno (≈ 100 KB); nenhuma
  biblioteca de mapa no bundle; resultado determinístico e revisável em
  diff.
- **Alternativas**: `d3-geo` + `topojson` em tempo de execução (≈ 60 KB de
  JS a mais e CPU no celular); `maplibre`/`deck.gl` (mapa "de verdade", foge
  da estética de jogo e pesa centenas de KB); rasterizar no navegador
  (centenas de ms no celular a cada abertura).

## R4. Projeção

- **Decisão**: equiretangular com correção de cosseno na latitude de
  referência −15° (`x = (lon − lon0)·cos(−15°)`, `z = −(lat − lat0)`), escala
  de forma que **1 unidade da cena = 1 bloco da grade**. Norte = −z (igual à
  cidade atual, onde o minimapa já assume essa orientação).
- **Motivo**: o Brasil cabe entre ~5°N e ~34°S; a distorção da
  equiretangular corrigida é pequena e invisível no estilo de blocos; é
  invertível trivialmente (útil para posicionar cidades e, na spec 004,
  calcular distâncias — que serão feitas por haversine nas coordenadas
  originais, não na projeção).
- **Alternativas**: Mercator (exagera o Sul); Albers cônica (IBGE usa
  policônica/Albers; ganho visual nulo nesta escala, mais código).

## R5. Representação visual "Brasil em blocos" (diferente do Git City)

- **Decisão**: grade de **0,2° de latitude** (≈ 22 km), ~200 × 195 células,
  ~17 mil células de terra. Cada célula é um bloco com altura em degraus
  (terraços) e cor do **bioma predominante do estado** com leve variação
  por ruído. Renderizado como **uma única malha mesclada** (topos + só as
  faces laterais visíveis, cores por vértice, faces laterais escurecidas
  como oclusão falsa), não como instâncias. Mar = plano de água com cor do
  ciclo dia/noite. Bordas de estado: linha fina clara sobre o contorno
  simplificado + leve degrau entre UFs vizinhas.
- **Altura**: base por bioma (Amazônia e Pantanal baixos; Cerrado e
  Caatinga médios; Mata Atlântica com serra costeira mais alta no Sudeste;
  Pampa baixo-ondulado) + ruído de baixa frequência determinístico,
  quantizado em 4–6 degraus. Relevo é ilustrativo, não topográfico.
- **Motivo**: lembra a ideia de "país em blocos" (pedido do produto), mas
  com leitura própria: luz diurna, relevo, biomas e água — oposto do fundo
  preto com quadrados neon chapados da referência (SC-006). Malha mesclada
  ≈ 40–60 mil triângulos, 1 draw call: leve no celular (SC-003/SC-004).
- **Alternativas**: InstancedMesh de 17 mil cubos (≈ 200 mil triângulos,
  mais pesado, sem ganho); extrusão dos polígonos (visual "mapa de
  plástico", perde o charme de blocos); hexágonos (bonito, mas mais
  próximo de jogos de estratégia e mais caro para rasterizar).

## R6. Indicação de vagas (modo Luzes e modo Calor)

- **Decisão (Luzes, padrão)**: cada cidade com vaga aberta vira uma
  **torre luminosa** (prisma fino) via `InstancedMesh`, altura ∝ √(vagas
  abertas), material emissivo cuja intensidade acompanha
  `cicloRuntime.luzes` (já existe) — discreta de dia, brilhante à noite —
  mais um halo (sprite aditivo) à noite. Rótulo do estado: sigla + número
  de vagas abertas, no ponto de rótulo da UF.
- **Decisão (Calor)**: recolore os vértices de cada estado numa escala
  sequencial de 5 faixas (quantis do total por UF), com legenda. Paleta
  validada com a skill `dataviz` na implementação (contraste nos dois temas
  de luz).
- **Motivo**: luzes atendem "bolhas", calor atende comparação objetiva; as
  duas usam o mesmo agregado.
- **Alternativas**: bolhas 2D sobre o canvas (quebra a imersão); prédios
  por vaga (proibido no nível país, FR-004).

## R7. Ciclo dia/noite no nível Brasil

- **Decisão**: reaproveitar `ciclo.ts` e `stores/tempo.ts` integralmente e
  **parametrizar** `DayNight` com props: `foco` (de onde a sombra/luz é
  centrada; padrão = posição do personagem), `raioCeu`, `neblina`
  (`[perto, longe]`) e `cidade` (liga postes, janelas e vidro — só na
  cidade). No Brasil: sem sombras dinâmicas (país inteiro numa shadow map
  ficaria borrado e caro), sem postes; céu, estrelas, lua, sol e neblina
  iguais aos da cidade. `ControleHora` reaproveitado como está.
- **Motivo**: FR-005 pede o mesmo ciclo; parametrizar evita duplicar ~470
  linhas.
- **Alternativas**: componente novo só para o Brasil (duplicação); manter
  sombras (custo alto, ganho baixo em blocos de 1 unidade).

## R8. Rotas e navegação entre níveis

- **Decisão**: grupo de rotas `src/app/(mapa)/` com **um layout** que
  monta o canvas do Brasil uma única vez; páginas filhas são só a camada
  de interface:
  - `/` → nível Brasil;
  - `/estado/[uf]` (sigla minúscula, ex.: `/estado/go`) → nível Estado.
    Nesta feature a câmera enquadra o estado e mostra o painel-resumo; a
    spec 002 preenche o conteúdo (cidades, prévia de prédios).
  - Fora do grupo: `/cidade/goiania-go` (a cidade 3D atual, movida de `/`)
    e `/remoto` (mesma cena, começando na vila = Bairro Remoto). A spec 003
    generaliza para `/cidade/[slug]`.
  Como layouts não remontam na navegação (docs do Next 16 em
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md`),
  a câmera voa do Brasil ao estado sem recarregar a cena; a cena lê o nível
  via `usePathname()`. `generateStaticParams` gera as 27 UFs (compatível com
  `cacheComponents: true`); UF inválida → `redirect('/?aviso=estado')`
  (edge case da spec).
- **Motivo**: FR-008 (links diretos e botão voltar) + FR-007 (transição
  suave) ao mesmo tempo.
- **Alternativas**: estado só em memória/hash (perde link direto limpo);
  uma rota por nível com canvas próprio (remonta a cena, sem voo de
  câmera); query string `?uf=go` (menos legível, `searchParams` torna a
  página dinâmica).

## R9. Câmera e interação

- **Decisão**: `MapControls` do drei com limites: inclinação 25°–65°, giro
  ±30° em torno do norte, distância mínima/máxima, alvo preso à caixa do
  Brasil; botão "Centralizar Brasil". Voo para estado = interpolação
  amortecida de alvo e distância até a caixa da UF; com
  `prefers-reduced-motion` o salto é imediato (hook `useReducedMotion` do
  `DayNight` vira utilitário compartilhado). Seleção: ponto do raio na
  malha → célula da grade → UF (lookup O(1), sem raycast por estado).
  Toque: 1º toque mostra resumo, 2º confirma; mouse: hover resume, clique
  confirma.
- **Motivo**: FR-013, FR-006, FR-007; estados pequenos (DF, SE, AL) têm
  apoio da lista textual (FR-012).
- **Alternativas**: `OrbitControls` livre (pode perder o país de vista);
  raycast em 27 malhas separadas (27 draw calls).

## R10. Fallback sem 3D

- **Decisão**: detectar WebGL antes de montar o canvas; sem suporte (ou
  erro de contexto) mostra `BrasilPlano`: SVG com os contornos
  simplificados do mesmo `geo.json`, cada estado um `<a>` focável com
  cor do modo Calor e rótulo de contagem. Mesmas rotas e mesmos dados.
- **Motivo**: FR-014 sem segunda fonte de dados.
- **Alternativas**: imagem estática (não interativa); mensagem de erro
  (viola a spec).

## R11. Dados mock de vagas em escala nacional

- **Decisão**: `src/data/brasil/vagas.ts` gera, com PRNG semeado
  (mulberry32, semente fixa), ~620 vagas distribuídas pelas ~90 cidades
  curadas (peso por porte; todo estado ≥ 5 vagas; SP, MG, RJ, Sul e
  capitais do NE mais densos), mais ~40 remotas. As 40 vagas escritas à mão
  em `src/data/vagas.ts` (Goiânia e vila) entram no conjunto nacional com
  sua cidade mapeada para o id da cidade — a cena da cidade atual continua
  lendo só `vagas` (sem mudança) até a spec 003. ~15% das vagas com status
  encerrada. Títulos/empresas fictícios vêm de listas por categoria.
- **Motivo**: decisão transversal 5 (escala) e FR-015 (números derivados,
  nunca fixos); determinismo garante testes estáveis.
- **Alternativas**: JSON gigante versionado (diff ilegível); gerar só
  contagens (as specs 002–004 precisam de vagas reais).

## R12. Estado de interface e persistência

- **Decisão**: `zustand` (já usado). `stores/mapa.ts`: `ufEmFoco`,
  `modo` (`luzes` | `calor`, persistido). `stores/perfil.ts` mínimo:
  `cidadeId` (persistido) — a spec 005 estende o mesmo store. Persistência
  via middleware `persist` em `localStorage`, com **validação Zod na
  reidratação** (valor inválido → descarta e usa padrão), tolerante a
  armazenamento indisponível.
- **Motivo**: Princípio II (Zod na borda: URL e storage são entrada
  externa); FR-010/FR-011.
- **Alternativas**: Context do React (re-render da árvore toda); guardar
  em cookie (desnecessário sem servidor).

## R13. Testes

- **Decisão**: **Vitest** para lógica pura (agregados, projeção,
  lookup célula→UF, gerador determinístico, schemas Zod de rota e
  persistência) e **Playwright** para 3 fluxos E2E (abrir Brasil → focar
  GO → entrar → voltar; navegação só por teclado pela lista de estados;
  fallback sem WebGL via flag de teste). Sem testes de pixel.
- **Motivo**: skill `testing` do workspace (um runner unitário + um E2E);
  o projeto ainda não tem nenhum.
- **Alternativas**: Jest (mais configuração com ESM/TS); testes de
  snapshot visual (frágeis com ciclo dia/noite).

## R14. Desempenho

- **Decisão**: orçamento — `geo.json` ≤ 150 KB (≈ 40 KB gzip), malha do
  país ≤ 80 mil triângulos, ≤ 10 draw calls no nível Brasil, `dpr` máx. 1,5
  no celular, nenhuma luz pontual. Medir com o painel de desempenho do
  navegador em celular intermediário (SC-003/SC-004).
- **Motivo**: metas da spec em celular 4G.
- **Alternativas**: LOD/tiles (desnecessário com uma malha só).
