# Research — 002 Mapa do Estado

Fase 0 do `/speckit-plan`. Cada item: **Decisão**, **Motivo**, **Alternativas**.
Parte do que a spec 001 já entregou (ver
[../001-mapa-brasil/research.md](../001-mapa-brasil/research.md)): canvas no
layout do grupo `(mapa)`, voo de câmera por `usePathname()`, UFs vizinhas já
atenuadas no `Relevo` quando há UF na rota, `stores/mapa.ts`, `stores/perfil.ts`,
`MarcadorVoceAqui`, agregados em `lib/brasil/agregados.ts`.

## R1. Onde o nível Estado vive

- **Decisão**: continua em `/estado/[uf]`, dentro do grupo `(mapa)`, na mesma
  cena 3D do Brasil (não é um canvas novo). A página troca o `PainelEstado`
  mínimo da 001 pelo painel completo (trilha, resumo da cidade em foco, lista
  de cidades, estados vizinhos). Elementos 3D novos (aglomerados, rótulos de
  cidade, prévia de prédios) entram em `BrasilCena` e só renderizam quando
  `useUfDaRota()` ≠ `null`.
- **Motivo**: FR-001 ("mesmo estilo visual do nível Brasil") e SC-003 (troca
  Brasil ↔ Estado sem remontar a cena: voo de câmera já existe).
- **Alternativas**: cena separada só do estado (recarrega relevo, perde o voo,
  duplica `DayNight`); recortar a malha do estado (o relevo inteiro já é 1 draw
  call — recortar não economiza nada).

## R2. Cidade em foco: estado de interface + `?cidade=`

- **Decisão**: `cidadeEmFoco: string | null` em `stores/mapa.ts` (não
  persistido). A URL do nível Estado aceita `?cidade=<id>` para **abrir** com
  uma cidade em foco (usado pela trilha do nível Cidade: "Goiás" →
  `/estado/go?cidade=anapolis-go`). O parâmetro é lido no cliente com
  `useSearchParams()` dentro de `<Suspense>` (exigência do Next 16 para rota
  pré-renderizada — `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`)
  e validado com Zod: precisa existir em `cidades` **e** pertencer à UF da rota;
  inválido é ignorado. Focar outra cidade depois **não** reescreve a URL.
- **Motivo**: US4 cenário 2 pede voltar "com Anápolis em foco"; manter a página
  estática (`generateStaticParams` das 27 UFs, `cacheComponents: true`) exige
  ler o parâmetro no cliente, não via `searchParams` do servidor.
- **Alternativas**: segmento `/estado/go/anapolis-go` (vira uma terceira rota
  quase igual à da cidade, confunde com o nível Cidade); só memória (perde o
  foco ao recarregar ou abrir link); `router.replace` a cada foco (polui o
  histórico e o botão voltar deixa de significar "nível anterior").

## R3. Aglomerado (cidade vista de longe)

- **Decisão**: cada cidade do estado com ≥ 1 vaga (aberta ou encerrada) vira um
  pequeno conjunto de caixas (silhuetas de prédios) num **único
  `InstancedMesh`** para todas as cidades da UF. Número de caixas =
  `clamp(round(2 + 1,5·√total), 3, 12)`, alturas variadas por PRNG semeado pelo
  id da cidade (determinístico), espalhadas num círculo de raio ∝ √total
  (≤ 0,8 unidade). Cor clara com janelas emissivas que seguem
  `cicloRuntime.luzes`; cidade sem vaga aberta usa cor apagada (FR-002 /
  US1 cenário 3). Base sobre `topoDaCelula` da célula da cidade.
- **Motivo**: "tamanho proporcional ao número de vagas" (entidade Aglomerado);
  1 draw call para o estado inteiro; reaproveita o padrão de `TorresVagas`.
- **Alternativas**: reaproveitar as torres da 001 (não lê como "cidade");
  `InstancedParts` com fachadas reais (é a prévia de foco — FR-005 proíbe
  prédios individuais fora do foco).
- **Detalhe**: no nível Estado as `TorresVagas` continuam para as **outras**
  UFs (contexto esmaecido) e somem na UF da rota, onde os aglomerados as
  substituem.

## R4. Rótulos de cidade sem sobreposição (FR-003, SC-002)

- **Decisão**: agrupamento **guloso em espaço de tela**. A cada mudança de
  câmera (no máximo a cada 100 ms, e uma vez ao fim do voo) projeta-se a
  posição 3D de cada cidade para pixels; ordena-se por vagas abertas desc
  (empate: nome); cada cidade tenta ocupar um retângulo estimado
  (`largura ≈ 7 px × caracteres + 16`, altura 22 px, margem 4 px). Se colide com
  um rótulo já aceito, entra no grupo dele. Grupo com membros extras mostra
  "Nome · N vagas" + chip "+K cidades"; clicar/tocar no chip aproxima a câmera
  na caixa dos membros (o grupo se desfaz com o zoom). Cidade em foco e cidade
  do perfil sempre ganham rótulo próprio (entram primeiro na ordem).
  A função de agrupamento é pura (`lib/brasil/rotulos.ts`), testada em Vitest;
  o componente só faz projeção e renderização com `Html` do drei
  (`pointer-events` só no chip e no rótulo, para focar).
- **Motivo**: a lista de cidades por UF é pequena (≤ ~20), então O(n²) por
  atualização é desprezível; espaço de tela é o único jeito de garantir "sem
  sobreposição" em 360 px e 1920 px com zoom livre. Estimar a largura evita
  medir DOM a cada quadro.
- **Alternativas**: agrupamento fixo por distância no mundo (quebra em telas
  estreitas); `Html occlude` do drei (esconde, não agrupa: viola "+3 cidades");
  medir `getBoundingClientRect` (layout thrash a cada movimento).
- **Verificação de SC-002**: E2E percorre as 27 UFs em 360 px e 1920 px e
  confere que nenhum par de rótulos visíveis tem retângulos que se cruzam
  (`boundingBox()` do Playwright).

## R5. Prévia de prédios na cidade em foco (US3, FR-005/006)

- **Decisão**: quando há `cidadeEmFoco` **e** a câmera está a menos de
  `DISTANCIA_PREVIA` (≈ 30 unidades) da cidade, o aglomerado dela é trocado por
  `InstancedParts` (de `components/city/Instanced.tsx`) com as fachadas reais
  de `FACADES[categoria]`, uma chamada por categoria presente. Escala ≈ 0,045
  (lote da cidade ±6,2 → ~0,55 unidade), dispostas em espiral (ângulo de ouro)
  em volta do ponto da cidade, ordenadas por categoria para agrupar visualmente,
  `shadows={false}`. Instância `lit` = vaga aberta, `dim` = encerrada (mesmo
  significado da cidade). Máx. 40 construções: abertas primeiro, depois
  encerradas; excedente vira "+N" no rótulo da cidade em foco. Aglomerados de
  outras cidades a menos de 1,2 unidade do centro da prévia ficam ocultos
  enquanto ela aparece (região metropolitana: Goiânia × Aparecida ≈ 0,7 unidade).
- **Focar uma cidade** voa a câmera até ela (alvo = cidade, distância ≈ 14,
  respeitando reduzir movimento); por isso `DISTANCIA_MINIMA` dos controles
  passa a ser 6 no nível Estado (18 continua no Brasil).
- **Motivo**: "Reaproveita as construções por categoria já existentes"
  (Assumptions); 7 categorias ⇒ ≤ ~7 × 3 draw calls só para a cidade em foco.
- **Alternativas**: modelos simplificados novos por categoria (duplicaria
  `facades.ts`); prévia em 2D no cartão (não é "ponte visual para o nível
  Cidade").

## R6. Rótulos de categoria (texto do produto)

- **Decisão**: atualizar `CATEGORIA_LABEL` em `src/data/vagas.ts` para os nomes
  de setor da spec: Comércio, Escritório, Saúde, **Logística e indústria**
  (galpao), **Construção** (obra), **Educação** (escola), **Serviços gerais**
  (bairro). As chaves (`Categoria`) não mudam; ícones (`CategoriaIcon`) e
  fachadas continuam iguais. O desempate alfabético de `topCategorias` passa a
  usar os novos rótulos (ajustar teste se algum empate mudar de ordem).
- **Motivo**: US2 lista esses nomes; um único mapa de rótulos evita a cidade
  e o mapa falarem línguas diferentes.
- **Alternativas**: segundo mapa só para o nível Estado (duas verdades para a
  mesma categoria).

## R7. Estados vizinhos (FR-010)

- **Decisão**: lista escrita à mão `VIZINHOS: Record<Uf, Uf[]>` em
  `src/data/brasil/estados.ts` (fronteiras terrestres oficiais). Teste garante
  que a relação é simétrica e que todo par vizinho tem ao menos uma célula
  adjacente na grade de `geo.json` (pega erro de digitação).
- **Motivo**: dado estável e pequeno (27 entradas); escrito à mão é mais fiel
  que derivar da grade de 0,2°, onde fronteiras curtas podem sumir ou surgir
  falsas adjacências pela diagonal.
- **Alternativas**: derivar da grade em tempo de execução (frágil nas bordas);
  bake no `geo.json` (exige subir `versao` e regerar dados só para isso).

## R8. Distrito Federal e "cidades" sem código IBGE

- **Decisão**: o DF hoje só tem Brasília. A lista curada passa a aceitar
  entradas manuais `{ "nome", "uf", "lat", "lon", "porte" }` (sem `ibge`) para
  regiões administrativas; adicionar Taguatinga, Ceilândia, Águas Claras,
  Gama e Sobradinho (coordenadas públicas). `Cidade.ibge` vira
  `number | null` (`null` = região administrativa). O script valida que entrada
  manual está dentro da própria UF e regrava `cidades.ts`. O gerador de vagas
  passa a distribuir também para elas (dados mudam, regras do gerador não).
- **Motivo**: edge case da spec ("DF mostra Brasília e regiões administrativas
  como cidades") e restrição já escrita no data-model da 001 (DF ≥ 2 cidades,
  hoje não cumprida).
- **Alternativas**: inventar códigos IBGE (dado falso com cara de oficial);
  tratar DF como estado sem cidades (viola o edge case).

## R9. Distância para ordenar a lista (FR-007)

- **Decisão**: haversine sobre `lat`/`lon` reais da `Cidade`
  (`lib/brasil/distancia.ts`, pura), em km arredondado. Opção "Distância" só
  aparece quando `perfil.cidadeId` existe; sem perfil a lista oferece Vagas e
  Nome. A ordenação escolhida não é persistida (padrão: Vagas).
- **Motivo**: Assumption da spec (linha reta); haversine já foi a escolha
  anunciada na 001 (R4) e será reaproveitada pela spec 004 ("perto de mim").
- **Alternativas**: distância na projeção (distorce com latitude).

## R10. Trilha de navegação em todos os níveis (FR-009)

- **Decisão**: componente único `Trilha` (`components/brasil/Trilha.tsx`) que
  recebe `{ uf?, cidadeId? }` e monta itens via função pura
  `itensDaTrilha()` (`lib/brasil/rotas.ts`): Brasil → `/`; Estado →
  `/estado/<uf>` (com `?cidade=<id>` quando se está numa cidade); Cidade →
  página atual (`aria-current="page"`). Usado no painel do Estado, na página
  da cidade (`/cidade/goiania-go`; o `Hud` é comum à cidade e ao remoto, então
  a trilha entra na página, não nele) e na página do nível Cidade provisório
  (R11). `/remoto` mostra "Brasil › Bairro Remoto". Links são `next/link`
  (empilham histórico; botão voltar funciona de graça). No Brasil a trilha é
  só "Brasil" (sem link).
- **Motivo**: um só ponto de verdade para hrefs; testável sem DOM.
- **Alternativas**: trilha específica por página (três cópias divergindo).

## R11. "Entrar na cidade" antes da spec 003 (FR-008)

- **Decisão (entrega faseada)**: criar `src/app/cidade/[slug]/page.tsx` mínimo
  — valida `slug` com Zod (deve existir em `cidades`; senão
  `redirect("/?aviso=cidade")`), `generateStaticParams` com todas as cidades,
  mostra trilha + resumo da cidade (mesmo cartão do foco) + aviso "A cidade 3D
  de <nome> chega em breve". `/cidade/goiania-go` continua sendo a rota
  estática existente com a cena 3D (segmento estático vence o dinâmico). A spec
  003 substitui o conteúdo de `[slug]` pela cena gerada e remove a rota fixa.
  "Ir para minha cidade" (ControlesMapa) passa a usar `/cidade/<id>` para
  qualquer cidade.
- **Motivo**: FR-008 e US4 exigem um destino real para toda cidade; trilha
  precisa funcionar em todos os níveis já agora.
- **Alternativas**: botão desabilitado fora de Goiânia (pessoa fica presa;
  viola US4); mandar todo mundo para Goiânia (dado errado).

## R12. Painel e lista no celular

- **Decisão**: desktop (≥ `md`): painel lateral esquerdo (`bloco-notas`, como
  na 001) com trilha, cartão da cidade em foco e lista. Celular em retrato:
  trilha no topo; cartão da cidade em foco + lista numa **gaveta inferior**
  (`<section>` com alça; estados recolhida/aberta; altura máx. 60 dvh) sem
  biblioteca nova. Enquadramento do estado usa a área livre (a câmera já
  reserva folga `FOLGA_UF`; no retrato a gaveta recolhida ocupa ≤ 96 px).
- **Motivo**: edge case "painel vira gaveta inferior"; YAGNI (sem
  `vaul`/shadcn drawer — o repositório não tem shadcn instalado).
- **Alternativas**: instalar shadcn/ui + Drawer (dependência e setup novos só
  para uma gaveta).

## R13. Acessibilidade (FR-012)

- **Decisão**: a lista de cidades é a interface acessível principal: cada item
  é um `<button>` (foca a cidade, `aria-pressed`) com texto completo ("Anápolis,
  12 vagas abertas, 3 encerradas"); botão "Entrar na cidade" no cartão; Esc
  limpa o foco; resumo da cidade em foco em `aria-live="polite"`. Rótulos 3D
  são `aria-hidden` (como os de UF). Estados vizinhos são `<a>` numa `<nav>`.
  Toque/mouse no mapa seguem a regra da 001: hover/1º toque foca, clique/2º
  toque abre o cartão (não entra direto — entrar é sempre ação explícita).
- **Motivo**: decisão transversal 7; reaproveita o padrão de `ListaEstados`.
- **Alternativas**: tornar os `Html` 3D focáveis (ordem de Tab caótica e muda
  com a câmera).

## R14. Desempenho

- **Decisão**: orçamento no nível Estado = orçamento da 001 + 1 draw call
  (aglomerados) + ≤ 21 (prévia, só com foco) ; ≤ 20 `Html` de cidade montados
  (só os grupos visíveis); reagrupamento ≤ 10×/s. Sem sombras, sem luzes
  pontuais (mesmo `DayNight` do Brasil).
- **Motivo**: SC-003 (< 1,5 s percebido) e metas de celular da 001.
- **Alternativas**: LOD por distância (desnecessário com essa contagem).

## R15. Testes

- **Decisão**: Vitest — agregado por cidade (total, encerradas, por categoria,
  por modelo; bate com filtro direto das vagas → SC-004), `agruparRotulos`,
  `VIZINHOS` (simetria + adjacência na grade), haversine, `itensDaTrilha`,
  schemas `CidadeParamSchema`/`CidadeFocoSchema`, ordenação da lista, seleção
  das 40 construções da prévia. Playwright — fluxo Brasil → GO → foco Anápolis
  → entrar → trilha "Goiás" volta com Anápolis em foco → voltar do navegador;
  teclado só pela lista; estados vizinhos; SC-002 (27 UFs × 360/1920 px);
  celular (gaveta).
- **Motivo**: skill `testing` (mesmos runners da 001).
- **Alternativas**: snapshot visual (instável com dia/noite).
