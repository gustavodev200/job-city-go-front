# Feature Specification: Cidade dinâmica e Bairro Remoto (nível cidade)

**Feature Branch**: `003-cidade-dinamica`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "Nível Cidade: prédios individuais, personagem andando, vagas com luz acesa ou apagada. Explorar e candidatar-se. Zona especial Bairro Remoto com vagas remotas/híbridas do país todo, cada prédio mostra estado ou fuso exigido. Tipos de vaga e construções por categoria. Modalidades presencial, híbrida (selo de frequência, distância e tempo de deslocamento a partir da cidade do candidato) e remota. Apenas frontend com dados mock."

## Contexto

Hoje existe **uma** cidade fixa (com dados de Goiânia/região) e uma "vila
remota" ligada por ponte. Esta feature transforma isso em um nível Cidade
que funciona para **qualquer** cidade do conjunto mock, e transforma a vila
no **Bairro Remoto** nacional, acessível também pelo mapa do Brasil.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explorar qualquer cidade com o personagem (Priority: P1)

Ao entrar numa cidade (spec 002), a pessoa aparece com o personagem numa
praça central e anda pelas ruas. Cada vaga daquela cidade é uma construção
no lote correspondente; o tamanho da cidade (número de quarteirões)
acompanha o número de vagas. Todo o comportamento atual (andar, correr,
pular, zoom, minimapa, balão de proximidade, pergaminho da vaga, ciclo dia
e noite, outdoors) continua funcionando.

**Why this priority**: É o coração do jogo; sem ele as outras cidades do
mapa não têm destino.

**Independent Test**: Entrar em 3 cidades de tamanhos diferentes (ex.: São
Paulo, Anápolis, uma cidade com 3 vagas) e verificar que cada uma mostra
exatamente as suas vagas, e que andar até um prédio abre o balão e o
pergaminho.

**Acceptance Scenarios**:

1. **Given** a cidade "Anápolis" com 12 vagas no mock, **When** a pessoa
   entra, **Then** há 12 construções de vaga, nenhuma de outra cidade.
2. **Given** a mesma cidade, **When** a pessoa sai e entra de novo,
   **Then** cada vaga está no mesmo lugar (disposição estável).
3. **Given** uma cidade com 3 vagas, **When** a pessoa entra, **Then** a
   cidade é pequena (poucos quarteirões), mas tem ruas, árvores e casas
   decorativas para não parecer vazia.
4. **Given** uma cidade com 150 vagas, **When** a pessoa entra, **Then** a
   cidade cresce em quarteirões e continua fluida.

---

### User Story 2 - Ler a construção: categoria e status (Priority: P1)

Cada categoria tem uma construção própria (Comércio → lojinha de rua;
Escritório → prédio comercial; Saúde → prédio com cruz; Logística e
indústria → galpão; Construção → obra com guindaste; Educação → escola;
Serviços gerais → estabelecimento de bairro). Vaga aberta: janelas/luz
acesas. Vaga encerrada: apagada e com placa "Encerrada".

**Why this priority**: Regra central de leitura do mapa no produto.

**Independent Test**: Conferir, para uma cidade, que cada construção
corresponde à categoria da vaga e que vagas encerradas aparecem apagadas e
não aceitam candidatura.

**Acceptance Scenarios**:

1. **Given** uma vaga de Saúde aberta, **When** a pessoa se aproxima,
   **Then** vê o prédio com cruz iluminado.
2. **Given** uma vaga encerrada, **When** a pessoa abre o pergaminho,
   **Then** vê o selo "Encerrada" e o botão de candidatura desabilitado.
3. **Given** a legenda do HUD, **When** consultada, **Then** mostra as 7
   categorias com o ícone da construção e a contagem na cidade atual.

---

### User Story 3 - Vagas híbridas com deslocamento (Priority: P2)

Vagas híbridas ficam na cidade da empresa com um selo de frequência
(ex.: "1 dia por semana"). Se a pessoa informou sua cidade (spec 005), o
pergaminho mostra a distância aproximada e o tempo estimado de
deslocamento até essa cidade.

**Why this priority**: Diferencial para quem mora no interior; depende do
perfil, por isso P2.

**Independent Test**: Com cidade do perfil "Trindade/GO", abrir vaga
híbrida em Goiânia e ver distância e tempo; sem perfil, ver convite para
informar a cidade.

**Acceptance Scenarios**:

1. **Given** vaga híbrida em Goiânia e perfil em Trindade, **When** o
   pergaminho abre, **Then** mostra "~25 km · ~35 min de carro · presença
   1 dia por semana".
2. **Given** nenhum perfil, **When** o pergaminho abre, **Then** mostra
   "Informe sua cidade para calcular o deslocamento".
3. **Given** uma construção híbrida, **When** vista na rua, **Then** tem
   um selo visível diferenciando-a das presenciais.

---

### User Story 4 - Bairro Remoto nacional (Priority: P1)

O Bairro Remoto é uma zona especial (ilha acessível pelo mapa do Brasil e
por um portal/ponte em qualquer cidade) com as vagas remotas de empresas de
todo o país. Cada prédio mostra a abrangência exigida ("Brasil inteiro",
"Remoto para GO", "Fuso de Brasília") e o estado de origem da empresa.

**Why this priority**: Zona especial explícita no produto e público
secundário prioritário ("quero trabalhar remoto").

**Independent Test**: Entrar no Bairro Remoto pelo mapa e por uma cidade, e
verificar que só há vagas remotas, com abrangência e origem visíveis.

**Acceptance Scenarios**:

1. **Given** o mapa do Brasil, **When** a pessoa vai ao Bairro Remoto,
   **Then** aparece no bairro com todas as vagas remotas do mock.
2. **Given** qualquer cidade, **When** a pessoa usa o portal/ponte "Bairro
   Remoto", **Then** viaja para o bairro e pode voltar à mesma cidade.
3. **Given** uma vaga "Remoto para GO" e perfil em SP, **When** o
   pergaminho abre, **Then** aparece aviso "Esta vaga pede residência em
   GO".

---

### Edge Cases

- Cidade com vagas de uma só categoria: a cidade continua variada
  (construções decorativas não-vaga, sem luz de vaga e não clicáveis).
- Vaga remota nunca aparece em cidade; vaga presencial/híbrida nunca
  aparece no Bairro Remoto.
- Link direto para cidade inexistente no mock: volta ao estado (ou ao
  Brasil) com aviso.
- Personagem não atravessa prédios nem sai dos limites da cidade, que
  mudam conforme o tamanho.
- Outdoors da cidade (já existentes) passam a mostrar anúncios da região
  da cidade (base para a spec 010).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O nível Cidade MUST ser gerado a partir dos dados de
  qualquer cidade do mock, com tamanho proporcional ao número de vagas e
  mínimo de 2×2 quarteirões.
- **FR-002**: A posição de cada vaga MUST ser estável entre visitas
  (mesma vaga, mesmo lote).
- **FR-003**: Cada vaga MUST ser desenhada com a construção da sua
  categoria (7 categorias do produto) e luz acesa/apagada conforme status.
- **FR-004**: Todos os comportamentos atuais da cidade (movimento, câmera,
  minimapa, legenda, balão de proximidade, pergaminho, dia/noite, outdoors,
  controle de hora) MUST continuar funcionando em qualquer cidade.
- **FR-005**: Vagas híbridas MUST exibir selo de frequência na construção e
  no pergaminho.
- **FR-006**: Com cidade do perfil conhecida, o pergaminho de vaga
  presencial ou híbrida MUST mostrar distância aproximada e tempo estimado
  de deslocamento; sem perfil, MUST convidar a informar a cidade.
- **FR-007**: O Bairro Remoto MUST conter todas e somente as vagas remotas,
  cada uma com abrangência e estado de origem visíveis.
- **FR-008**: O Bairro Remoto MUST ser acessível pelo mapa do Brasil e de
  qualquer cidade, com retorno ao ponto de origem.
- **FR-009**: Vagas com restrição de residência MUST alertar quando o
  perfil não atende.
- **FR-010**: O HUD MUST mostrar nome da cidade/estado atual, vagas abertas
  na cidade e a trilha de navegação (spec 002).
- **FR-011**: Vagas com destaque patrocinado (spec 009) MUST ter marcador
  maior e brilho, sempre com a etiqueta "Patrocinado"; o modelo de dado já
  prevê o campo.
- **FR-012**: A vaga encerrada MUST NOT aceitar candidatura.

### Key Entities

- **Vaga**: ganha cidade e estado reais, categoria das 7 do produto,
  modalidade, frequência (híbrida), abrangência (remota), estado de origem
  da empresa, destaque patrocinado (sim/não, até quando).
- **Layout de cidade**: grade de quarteirões e lotes derivada de forma
  estável da lista de vagas da cidade.
- **Zona Bairro Remoto**: layout próprio com as vagas remotas.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Qualquer cidade do mock abre pronta para andar em até 2
  segundos após confirmar a entrada.
- **SC-002**: 100% das vagas de uma cidade estão presentes e na categoria
  certa; 0 vagas de outra cidade aparecem.
- **SC-003**: Pessoas identificam se uma vaga está aberta ou encerrada só
  olhando a construção, em 9 de 10 tentativas.
- **SC-004**: A maior cidade do mock roda fluida em celular intermediário.

## Assumptions

- O mundo atual (cidade + vila) é a base; a vila vira o Bairro Remoto.
- Tempo de deslocamento é estimativa simples por distância (sem trânsito
  nem rota real).
- "Mini-mapa" e legenda existentes são reaproveitados, só recebendo dados
  da cidade atual.
- Dados conforme decisões transversais em `specs/README.md`.
