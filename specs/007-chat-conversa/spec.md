# Feature Specification: Conversa entre candidato e empresa

**Feature Branch**: `007-chat-conversa`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "Após o aceite das duas partes, a conversa livre é liberada no chat. O candidato envia candidatura estruturada e só depois conversa com a empresa. Apenas frontend com dados mock."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abrir conversa após aceite mútuo (Priority: P1)

Quando a empresa responde "Aceita para conversa" (spec 006), o candidato vê
"Aceitar e abrir conversa" ou "Recusar". Só depois do aceite do candidato a
conversa existe. Antes disso não há caixa de mensagem em lugar nenhum.

**Why this priority**: Regra central do produto: candidatura estruturada
primeiro, conversa livre depois, com consentimento dos dois lados.

**Independent Test**: Levar uma candidatura até "Aceita para conversa",
aceitar e ver a conversa aberta; repetir recusando e ver que nada abre.

**Acceptance Scenarios**:

1. **Given** candidatura "Aceita para conversa", **When** o candidato
   aceita, **Then** a conversa abre com uma mensagem inicial da empresa.
2. **Given** a mesma situação, **When** o candidato recusa, **Then** a
   candidatura fica "Encerrada pelo candidato" e não há conversa.
3. **Given** candidatura em qualquer outro status, **When** a pessoa
   procura conversar, **Then** não existe opção de mensagem.

---

### User Story 2 - Trocar mensagens (Priority: P1)

Na tela "Conversas" a pessoa vê a lista de conversas (empresa, vaga,
última mensagem, não lidas) e, ao abrir uma, troca mensagens de texto. No
papel Candidato a empresa responde de forma simulada (respostas fictícias
coerentes, com atraso curto); no papel Empresa (spec 009), a pessoa
responde como empresa e vê o lado dela.

**Why this priority**: É o que destrava o processo seletivo.

**Independent Test**: Enviar 3 mensagens como candidato, trocar para o
papel Empresa, responder, voltar ao Candidato e ver a resposta.

**Acceptance Scenarios**:

1. **Given** conversa aberta, **When** o candidato envia mensagem, **Then**
   ela aparece com horário e estado "enviada"; uma resposta simulada chega
   depois com indicador "digitando".
2. **Given** mensagens novas, **When** a pessoa está fora da conversa,
   **Then** o HUD mostra contador de não lidas.
3. **Given** mensagem vazia ou com mais de 1.000 caracteres, **When**
   tenta enviar, **Then** o envio é bloqueado com aviso.

---

### User Story 3 - Segurança na conversa (Priority: P2)

A conversa mostra um aviso fixo: "Nenhuma empresa séria pede dinheiro,
depósito ou compra de equipamento". Se a mensagem da empresa contiver
pedido de pagamento/taxa/PIX/depósito, ela aparece com alerta e botão
"Denunciar" (spec 011). Qualquer lado pode encerrar a conversa.

**Why this priority**: Golpes de vagas falsas são um problema citado no
produto; a conversa é o ponto mais provável do golpe.

**Independent Test**: Usar a conversa mock "suspeita" e ver o alerta e a
denúncia.

**Acceptance Scenarios**:

1. **Given** mensagem da empresa contendo "pague uma taxa", **When**
   exibida, **Then** aparece destacada com alerta e "Denunciar".
2. **Given** conversa aberta, **When** a pessoa escolhe "Encerrar
   conversa" e confirma, **Then** não é mais possível enviar mensagens.

---

### Edge Cases

- Mensagens exibidas como texto puro; links aparecem como texto não
  clicável com aviso "links externos desativados na demonstração".
- Vaga encerrada não fecha conversa existente.
- Conversa encerrada continua legível (histórico).
- Muitas mensagens: rolagem preservada ao chegar mensagem nova.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Conversa MUST existir somente após "Aceita para conversa"
  pela empresa e aceite do candidato.
- **FR-002**: O sistema MUST listar conversas com empresa, vaga, última
  mensagem e não lidas.
- **FR-003**: Mensagens MUST ser texto de 1 a 1.000 caracteres, exibidas
  como texto puro, com horário e estado.
- **FR-004**: No papel Candidato, respostas da empresa MUST ser simuladas
  de forma determinística; no papel Empresa, a pessoa responde.
- **FR-005**: O HUD MUST mostrar contador de mensagens não lidas.
- **FR-006**: Toda conversa MUST mostrar aviso permanente anti-golpe.
- **FR-007**: Mensagens com termos de pagamento/taxa/depósito/PIX MUST
  ser destacadas com alerta e opção de denúncia.
- **FR-008**: Qualquer lado MUST poder encerrar a conversa; histórico
  continua legível.
- **FR-009**: Lista e conversa MUST ser acessíveis por teclado e anunciar
  mensagens novas a leitores de tela.

### Key Entities

- **Conversa**: candidatura de origem, participantes, estado (aberta,
  encerrada), não lidas por lado.
- **Mensagem**: autor (candidato/empresa), texto, data/hora, estado,
  marcada como suspeita (sim/não).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 caminhos para conversar sem aceite mútuo.
- **SC-002**: 100% das mensagens suspeitas do mock são destacadas.
- **SC-003**: Enviar mensagem e ver na tela leva menos de 0,3 segundo.

## Assumptions

- Somente texto; sem anexos, áudio ou chamadas nesta fase.
- Lista de termos suspeitos é a mesma da spec 011.
- Dados conforme decisões transversais em `specs/README.md`.
