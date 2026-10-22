# Feature Specification: Mapa do Brasil (nível país)

**Feature Branch**: `001-mapa-brasil`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "Mapa do Brasil na plataforma, no espírito de thegitcity.com/town/brasil-town mas sem copiar. Primeiro nível do mapa em três níveis: estados com contagem de vagas abertas, em bolhas ou mapa de calor, sem prédios individuais. Visão geral e escolha de região. Apenas frontend com dados mock."

## Contexto

Hoje o jogo abre direto numa cidade fixa. O produto prevê três níveis de
mapa (Brasil → Estado → Cidade). Esta feature cria o nível **Brasil**, que
passa a ser a porta de entrada: a pessoa vê o país inteiro, percebe onde há
vagas e escolhe para onde ir.

Referência de ideia (não de estética): no Git City o Brasil é desenhado em
blocos e as cidades "acendem" conforme a densidade. Aqui o país é um
**relevo em blocos ilustrado**, no mesmo estilo low-poly da cidade
existente: cada estado é uma "ilha" de blocos colorida pelo seu bioma
predominante, o mar ao redor, e as vagas aparecem como **luzes e torres de
altura proporcional** sobre as cidades. Ao anoitecer (mesmo ciclo de dia e
noite real que a cidade já usa) as luzes de vagas abertas se destacam.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver o Brasil e onde há vagas (Priority: P1)

Ao abrir o jogo, a pessoa vê o mapa do Brasil inteiro, com cada estado
reconhecível pelo formato, e percebe de relance quais regiões concentram
mais vagas abertas.

**Why this priority**: É a primeira tela do produto e a materialização da
proposta "encontrar vagas perto de casa, inclusive no interior". Sem ela
não existe o mapa em três níveis.

**Independent Test**: Abrir o jogo sem nenhum dado salvo e verificar que o
Brasil aparece completo, com os 27 estados, e que a intensidade visual de
cada estado corresponde à quantidade de vagas abertas no conjunto mock.

**Acceptance Scenarios**:

1. **Given** o jogo recém-aberto, **When** a tela carrega, **Then** o Brasil
   aparece inteiro e enquadrado, com os 27 estados (26 + DF) distinguíveis
   pelo formato e pela borda.
2. **Given** o mapa do Brasil visível, **When** a pessoa observa, **Then**
   cada estado mostra um indicador de volume de vagas abertas (luzes/torres
   sobre as cidades e um número agregado), e estados com mais vagas são
   visivelmente mais "acesos" que estados com menos.
3. **Given** o mapa do Brasil, **When** não há nenhum prédio individual de
   vaga desenhado, **Then** a tela continua leve e legível (requisito do
   produto: nível país não mostra prédios).
4. **Given** um horário noturno no relógio do dispositivo, **When** o mapa
   aparece, **Then** a iluminação é de noite e as luzes de vagas abertas se
   destacam; de dia o relevo e os biomas ficam em evidência.

---

### User Story 2 - Inspecionar um estado (Priority: P1)

A pessoa passa o mouse (ou toca uma vez) num estado e vê um resumo: nome,
total de vagas abertas, divisão por modalidade (presencial, híbrida,
remota) e as três categorias com mais vagas.

**Why this priority**: Transforma a impressão visual em informação que
ajuda a decidir para onde ir.

**Independent Test**: Selecionar qualquer estado e conferir que os números
do resumo batem com o conjunto mock.

**Acceptance Scenarios**:

1. **Given** o mapa do Brasil, **When** a pessoa aponta para Goiás,
   **Then** aparece um cartão com "Goiás (GO)", total de vagas abertas,
   contagem por modalidade e top 3 categorias.
2. **Given** um cartão de resumo aberto no celular, **When** a pessoa toca
   fora do estado, **Then** o cartão fecha.
3. **Given** um estado em foco, **When** a pessoa usa o teclado, **Then**
   consegue passar de estado em estado (ordem alfabética) e o cartão
   acompanha o foco.

---

### User Story 3 - Escolher uma região e descer de nível (Priority: P1)

A pessoa confirma um estado (clique, segundo toque ou Enter) e a câmera
viaja até ele, abrindo o nível Estado (spec 002).

**Why this priority**: O nível Brasil existe para escolher região; sem
essa transição ele é só uma ilustração.

**Independent Test**: Confirmar um estado e verificar que a câmera faz a
transição e que o endereço da página passa a identificar o estado, de modo
que recarregar mantém o estado escolhido.

**Acceptance Scenarios**:

1. **Given** um estado em foco, **When** a pessoa confirma, **Then** a
   câmera aproxima suavemente até enquadrar o estado e o nível Estado abre.
2. **Given** "reduzir movimento" ativo no sistema, **When** a pessoa
   confirma um estado, **Then** a troca de nível acontece sem animação de
   voo (corte direto ou esmaecimento).
3. **Given** a página de um estado aberta por link direto, **When** ela
   carrega, **Then** abre já no nível Estado correspondente.

---

### User Story 4 - Começar perto de casa e atalho para remoto (Priority: P2)

Se a pessoa já informou sua cidade (spec 005), o mapa destaca o estado
dela com um marcador "Você está aqui" e oferece o atalho "Ir para minha
cidade". Sempre há um atalho visível para o **Bairro Remoto** (vagas
remotas e híbridas do país todo), que fica representado como uma ilha
própria no mar, ao lado da costa.

**Why this priority**: Reduz passos para o caso mais comum (vaga perto de
casa) e dá destaque ao público "quero trabalhar remoto/no interior".

**Independent Test**: Com cidade salva no perfil, abrir o jogo e usar
"Ir para minha cidade"; sem cidade salva, o atalho não aparece. O atalho
do Bairro Remoto funciona em ambos os casos.

**Acceptance Scenarios**:

1. **Given** perfil com cidade "Anápolis/GO", **When** o mapa abre,
   **Then** GO tem o marcador "Você está aqui" e o botão "Ir para minha
   cidade" leva direto ao nível Cidade de Anápolis.
2. **Given** nenhum perfil, **When** o mapa abre, **Then** aparece um
   convite discreto "Informe sua cidade para ver vagas perto de você".
3. **Given** qualquer situação, **When** a pessoa escolhe a ilha/atalho
   "Bairro Remoto", **Then** vai para a zona Bairro Remoto (spec 003) com
   a contagem de vagas remotas visível antes de entrar.

---

### User Story 5 - Alternar visual: luzes ou calor (Priority: P3)

A pessoa alterna entre dois modos de leitura: **Luzes** (padrão: torres e
luzes por cidade) e **Calor** (cada estado pintado numa escala de cor pelo
número de vagas, com legenda).

**Why this priority**: O texto do produto cita bolhas ou mapa de calor; o
modo calor ajuda comparação objetiva, mas não é essencial para o fluxo.

**Independent Test**: Alternar o modo e conferir a legenda e as cores
contra o mock.

**Acceptance Scenarios**:

1. **Given** modo Luzes, **When** a pessoa escolhe Calor, **Then** os
   estados mudam para a escala de cor e aparece uma legenda com faixas de
   quantidade.
2. **Given** a escolha de modo feita, **When** a pessoa recarrega,
   **Then** o modo escolhido é mantido.

---

### Edge Cases

- Estado com poucas vagas (ex.: 3) continua visível e com número legível;
  nenhum estado aparece "apagado" a ponto de parecer sem dados.
- Estados pequenos e vizinhos (DF dentro de GO; SE, AL, PB, RN) precisam
  ser selecionáveis com o dedo — área de toque mínima ampliada ou lista de
  apoio.
- Tela estreita em retrato: o país inteiro cabe na tela ao abrir, sem
  rolagem horizontal.
- Dispositivo fraco ou sem aceleração 3D: a página mostra uma versão
  simplificada (mapa plano) com as mesmas informações e a mesma navegação,
  em vez de tela em branco.
- Mudança de dados (ex.: candidato publica vaga como empresa na spec 009):
  as contagens refletem a mudança ao voltar ao mapa.
- Link direto para estado inexistente: volta ao Brasil com aviso curto.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O nível Brasil MUST ser a tela inicial do jogo e exibir os
  27 estados com contorno geográfico fiel o bastante para serem
  reconhecidos.
- **FR-002**: O país MUST ser representado como relevo em blocos ilustrado,
  com cada estado tingido pelo bioma predominante (Amazônia, Cerrado,
  Caatinga, Mata Atlântica, Pampa, Pantanal) e mar ao redor, no mesmo
  estilo visual da cidade existente — sem fundo preto com quadrados neon
  nem tipografia pixel (diferenciação do Git City).
- **FR-003**: Cada estado MUST indicar o total de vagas abertas, com
  número visível e marcadores (luzes/torres) posicionados nas cidades que
  têm vagas, de intensidade proporcional à quantidade.
- **FR-004**: O nível Brasil MUST NOT exibir prédios individuais de vaga.
- **FR-005**: O mapa MUST seguir o mesmo ciclo de dia e noite pelo horário
  real do dispositivo já usado na cidade, incluindo o controle de hora
  existente para teste.
- **FR-006**: Ao apontar/focar um estado, o sistema MUST mostrar resumo com
  nome, sigla, total de vagas abertas, contagem por modalidade e top 3
  categorias.
- **FR-007**: Confirmar um estado MUST levar ao nível Estado com transição
  de câmera, ou sem animação quando "reduzir movimento" estiver ativo.
- **FR-008**: O endereço da página MUST refletir o nível atual (Brasil,
  estado, cidade, Bairro Remoto) de forma que links diretos e o botão
  voltar do navegador funcionem.
- **FR-009**: O mapa MUST oferecer um atalho sempre visível para o Bairro
  Remoto, representado também como uma ilha no mar próxima à costa.
- **FR-010**: Com cidade do perfil conhecida, o sistema MUST marcar o
  estado do usuário e oferecer "Ir para minha cidade".
- **FR-011**: O sistema MUST oferecer alternância entre modos Luzes e
  Calor, com legenda no modo Calor, e lembrar a escolha.
- **FR-012**: Todos os estados MUST ser alcançáveis por teclado e por uma
  lista textual de estados (com contagem), para acessibilidade e para
  estados pequenos demais para toque.
- **FR-013**: A câmera do nível Brasil MUST permitir aproximar/afastar e
  girar levemente dentro de limites que nunca percam o país de vista, além
  de um botão "Centralizar Brasil".
- **FR-014**: Na ausência de suporte a 3D, o sistema MUST mostrar versão
  plana equivalente com as mesmas informações.
- **FR-015**: Todos os números exibidos MUST vir do conjunto mock de vagas
  (nunca fixos na tela), contando apenas vagas com status aberta.

### Key Entities

- **Estado**: sigla, nome, região, bioma predominante, contorno geográfico,
  ponto central para câmera e rótulo.
- **Cidade**: nome, estado, coordenada geográfica, se é capital,
  população aproximada (para peso visual). Usada aqui só como ponto de luz.
- **Vaga** (já existente): passa a ter cidade e estado reais; contada por
  estado, modalidade e categoria.
- **Agregado de vagas**: total aberto por estado, por cidade, por
  modalidade e por categoria, derivado das vagas.
- **Zona Bairro Remoto**: zona especial nacional sem estado, com sua
  própria contagem.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste com 5 pessoas, todas identificam corretamente o
  estado com mais vagas e o próprio estado em menos de 10 segundos.
- **SC-002**: A partir da tela inicial, chegar a uma cidade escolhida leva
  no máximo 3 interações (estado → cidade → entrar).
- **SC-003**: O mapa do Brasil fica utilizável em até 3 segundos num
  celular intermediário com conexão 4G.
- **SC-004**: A animação do mapa se mantém fluida (sem travadas
  perceptíveis) em celular intermediário.
- **SC-005**: 100% dos estados podem ser selecionados só com teclado e só
  com toque.
- **SC-006**: Em comparação lado a lado com o Git City, 5 de 5 pessoas
  descrevem o visual como "diferente" (paleta, estilo e leitura próprios).

## Assumptions

- Dados de vagas, cidades e contagens são fictícios e locais (ver
  `specs/README.md`, decisões 1 e 5); o contorno dos estados usa dado
  geográfico público (malha do IBGE), simplificado.
- O nível Brasil substitui a cidade fixa como página inicial; a cidade
  atual vira o nível Cidade de Goiânia (spec 003).
- O controle de hora e o ciclo dia/noite já existentes são reutilizados.
- Porto Global (vagas estrangeiras) é fase 2 e não aparece no mapa.
- Personagem não anda no nível Brasil — ali a navegação é só de câmera.
