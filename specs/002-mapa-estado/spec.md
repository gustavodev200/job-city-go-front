# Feature Specification: Mapa do Estado (nível região)

**Feature Branch**: `002-mapa-estado`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "Segundo nível do mapa: estado/região. Cidades com contagem e agregados por categoria. Prédios só nas cidades em foco. Objetivo: escolher a cidade. Apenas frontend com dados mock."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver as cidades de um estado (Priority: P1)

Ao entrar num estado (vindo do nível Brasil, spec 001), a pessoa vê o
estado ampliado em relevo, com cada cidade que tem vagas marcada por um
"aglomerado" (pequeno conjunto de silhuetas de prédios) e um rótulo com
nome e número de vagas abertas. Cidades vizinhas de outros estados ficam
esmaecidas na borda, para dar contexto.

**Why this priority**: É o passo intermediário obrigatório do mapa em três
níveis; sem ele não há como escolher cidade, sobretudo no interior.

**Independent Test**: Abrir o nível de um estado por link direto e
conferir que todas as cidades com vagas no mock aparecem, com contagens
corretas.

**Acceptance Scenarios**:

1. **Given** o nível Estado de MG aberto, **When** a tela carrega, **Then**
   aparecem todas as cidades de MG com pelo menos 1 vaga aberta, cada uma
   com rótulo "Nome · N vagas".
2. **Given** cidades muito próximas (ex.: região metropolitana), **When**
   a câmera está afastada, **Then** os rótulos não se sobrepõem — cidades
   menores se agrupam num rótulo "+3 cidades" que se desfaz ao aproximar.
3. **Given** uma cidade com vagas todas encerradas, **When** o mapa é
   exibido, **Then** ela aparece apagada com rótulo "0 vagas abertas",
   ainda selecionável.

---

### User Story 2 - Comparar cidades por categoria (Priority: P1)

Ao focar uma cidade, a pessoa vê o resumo: total de vagas abertas,
contagem por categoria (Comércio, Escritório, Saúde, Logística e
indústria, Construção, Educação, Serviços gerais) com o ícone da
construção correspondente, e contagem por modalidade.

**Why this priority**: O texto do produto pede "cidades com contagem e
agregados por categoria" — é o que permite escolher a cidade certa.

**Independent Test**: Focar 3 cidades e conferir cada contagem contra o
mock.

**Acceptance Scenarios**:

1. **Given** o nível Estado, **When** a pessoa foca "Uberlândia", **Then**
   aparece cartão com total, barras por categoria (só as categorias com
   vaga) e contagem por modalidade.
2. **Given** um painel lateral "Cidades deste estado", **When** aberto,
   **Then** lista todas as cidades ordenadas por número de vagas, com
   opção de ordenar por nome ou por distância da cidade do perfil.

---

### User Story 3 - Prévia de prédios na cidade em foco (Priority: P2)

Quando a câmera aproxima de uma cidade (foco), o aglomerado vira uma
prévia com as construções reais das vagas daquela cidade (lojinha, prédio
comercial, prédio com cruz, galpão, obra, escola, estabelecimento de
bairro) com luz acesa (aberta) ou apagada (encerrada). As demais cidades
continuam só como aglomerado.

**Why this priority**: Regra do produto ("prédios só nas cidades em
foco") e ponte visual para o nível Cidade; não é essencial para escolher.

**Independent Test**: Focar uma cidade e contar as construções da prévia
contra as vagas da cidade no mock.

**Acceptance Scenarios**:

1. **Given** câmera afastada, **When** nenhuma cidade está em foco,
   **Then** nenhum prédio individual é desenhado.
2. **Given** a pessoa foca "Goiânia", **When** a câmera aproxima, **Then**
   aparecem as construções das vagas de Goiânia com o tipo de construção da
   categoria e luz conforme status; ao tirar o foco, voltam ao aglomerado.

---

### User Story 4 - Entrar na cidade e navegar entre níveis (Priority: P1)

A pessoa confirma uma cidade e entra no nível Cidade (spec 003). Em
qualquer nível existe uma trilha "Brasil › Goiás › Anápolis" para voltar,
e o botão voltar do navegador também funciona.

**Why this priority**: Completa o caminho Brasil → Estado → Cidade e
garante que a pessoa nunca fica presa.

**Independent Test**: Fazer Brasil → GO → Anápolis → voltar pela trilha
→ voltar pelo navegador e conferir cada tela.

**Acceptance Scenarios**:

1. **Given** uma cidade em foco, **When** a pessoa confirma "Entrar na
   cidade", **Then** abre o nível Cidade dessa cidade.
2. **Given** o nível Cidade de Anápolis, **When** a pessoa clica "Goiás" na
   trilha, **Then** volta ao nível Estado com Anápolis em foco.
3. **Given** o nível Estado, **When** a pessoa usa "Estados vizinhos",
   **Then** pode pular direto para um estado que faz fronteira, sem voltar
   ao Brasil.

---

### Edge Cases

- Estado com uma única cidade com vagas: abre já com essa cidade em foco.
- DF: o nível Estado do DF mostra Brasília e regiões administrativas como
  "cidades".
- Cidade com mais de 40 vagas: a prévia mostra no máximo 40 construções e
  indica "+N" (o nível Cidade mostra todas).
- Cidade sem vagas de nenhum tipo não aparece no mapa (só na busca da
  spec 004, se o candidato morar lá).
- Celular em retrato: o estado inteiro cabe ao abrir; o painel de cidades
  vira gaveta inferior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O nível Estado MUST mostrar o estado escolhido ampliado, no
  mesmo estilo visual do nível Brasil, com estados vizinhos esmaecidos.
- **FR-002**: Toda cidade do estado com ao menos uma vaga (aberta ou
  encerrada) MUST aparecer como aglomerado com rótulo de nome e vagas
  abertas.
- **FR-003**: Rótulos MUST NOT se sobrepor; cidades próximas agrupam-se
  e desagrupam conforme o zoom.
- **FR-004**: O foco numa cidade MUST mostrar total, contagem por
  categoria (com ícone da construção) e por modalidade.
- **FR-005**: Somente a cidade em foco MUST exibir construções individuais
  (máx. 40, com indicador do excedente); as demais MUST NOT.
- **FR-006**: Construções MUST usar o tipo correspondente à categoria e
  mostrar luz acesa (aberta) ou apagada (encerrada).
- **FR-007**: O sistema MUST oferecer lista lateral de cidades do estado,
  ordenável por vagas, nome e distância da cidade do perfil (quando houver).
- **FR-008**: Confirmar uma cidade MUST abrir o nível Cidade (spec 003).
- **FR-009**: Todos os níveis MUST exibir a trilha de navegação clicável
  e sincronizar com o histórico do navegador.
- **FR-010**: O sistema MUST permitir pular para estados vizinhos.
- **FR-011**: A cidade do perfil, se pertencer ao estado, MUST ter marcador
  "Você está aqui".
- **FR-012**: Cidades e lista MUST ser navegáveis por teclado e leitor de
  tela, com os mesmos dados do mapa.

### Key Entities

- **Estado**, **Cidade**, **Vaga**, **Agregado de vagas**: definidos na
  spec 001.
- **Vizinhança**: lista de estados que fazem fronteira com cada estado.
- **Aglomerado**: representação visual resumida de uma cidade (tamanho
  proporcional ao número de vagas).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pessoas encontram e entram numa cidade do interior escolhida
  em menos de 20 segundos a partir do nível Estado.
- **SC-002**: Nenhum rótulo sobreposto em nenhum estado do mock, em telas
  de 360 px a 1920 px de largura.
- **SC-003**: A troca entre níveis (Brasil ↔ Estado ↔ Cidade) leva menos
  de 1,5 segundo percebido.
- **SC-004**: 100% das contagens exibidas batem com o conjunto mock.

## Assumptions

- Reaproveita as construções por categoria já existentes na cidade atual.
- Distância entre cidades é calculada em linha reta pelas coordenadas
  (sem rotas reais) — suficiente para mock.
- Dados conforme decisões transversais em `specs/README.md`.
