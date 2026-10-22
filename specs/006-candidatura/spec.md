# Feature Specification: Candidatura estruturada e acompanhamento

**Feature Branch**: `006-candidatura`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "O candidato toca em uma vaga e lê a descrição. Responde de 3 a 5 perguntas definidas pela empresa (disponibilidade, experiência, turno). Envia. Acompanha o status: enviada, visualizada, respondida. A empresa responde em até 48 horas; quem cumpre ganha o selo 'responde rápido'. Regra: a candidatura não depende de nada comprado no jogo. Apenas frontend com dados mock."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Responder perguntas e enviar (Priority: P1)

No pergaminho da vaga (já existente), "Candidatar-se" abre um formulário em
passos com as 3 a 5 perguntas da empresa. Tipos de pergunta: escolha única
(ex.: turno), múltipla escolha (ex.: dias disponíveis), sim/não
(ex.: "Tem CNH B?") e texto curto (até 300 caracteres). Respostas que o
perfil já sabe (turno, cidade) vêm pré-preenchidas. Antes de enviar, uma
revisão mostra tudo; após enviar, uma confirmação.

**Why this priority**: É o objetivo final do candidato no jogo; substitui
a candidatura simulada atual.

**Independent Test**: Candidatar-se a uma vaga com 5 perguntas de tipos
diferentes e ver a candidatura em "Minhas candidaturas".

**Acceptance Scenarios**:

1. **Given** vaga aberta com 4 perguntas e pessoa logada, **When** ela
   responde e envia, **Then** vê confirmação e a candidatura aparece com
   status "Enviada".
2. **Given** pergunta obrigatória sem resposta, **When** tenta avançar,
   **Then** o passo mostra erro e não avança.
3. **Given** formulário pela metade, **When** fecha o pergaminho e volta,
   **Then** as respostas continuam lá (rascunho).
4. **Given** já se candidatou à vaga, **When** abre o pergaminho de novo,
   **Then** o botão vira "Ver minha candidatura" e não permite duplicar.

---

### User Story 2 - Acompanhar status (Priority: P1)

Em "Minhas candidaturas" a pessoa vê cada candidatura com uma linha do
tempo: **Enviada → Visualizada → Respondida** (resposta: "Aceita para
conversa" ou "Não seguiremos" com mensagem curta). No mapa, o prédio da
vaga ganha um marcador com o status. Mudanças geram notificação no HUD.

**Why this priority**: Transparência de status é parte da proposta de
valor contra portais "buraco negro".

**Independent Test**: Enviar candidatura e observar as mudanças de status
simuladas (decisão transversal 2) até "Respondida".

**Acceptance Scenarios**:

1. **Given** candidatura enviada, **When** passa o tempo simulado, **Then**
   o status vira "Visualizada" e depois "Respondida", cada mudança com
   data/hora e notificação.
2. **Given** resposta "Aceita para conversa", **When** a pessoa abre a
   candidatura, **Then** vê o botão "Aceitar e abrir conversa" (spec 007).
3. **Given** papel Empresa (spec 009), **When** a empresa responde
   manualmente, **Then** essa resposta prevalece sobre a simulação.

---

### User Story 3 - Prazo de 48 horas e selo "responde rápido" (Priority: P2)

Cada candidatura mostra o prazo esperado de resposta ("A empresa costuma
responder em até 48 h"). Empresas que responderam todas as candidaturas
dentro de 48 h exibem o selo **Responde rápido** no pergaminho, na lista
(spec 004) e na fachada do prédio.

**Why this priority**: Incentivo de qualidade do lado empresa; depende de
histórico, por isso P2.

**Independent Test**: Conferir no mock uma empresa com selo e outra sem, e
o selo nos três lugares.

**Acceptance Scenarios**:

1. **Given** empresa com histórico 100% dentro de 48 h, **When** a vaga é
   vista, **Then** tem o selo "Responde rápido".
2. **Given** candidatura sem resposta após 48 h (tempo simulado), **When**
   aberta, **Then** mostra "Prazo de resposta passou" e a empresa perde o
   selo.

---

### User Story 4 - Desistir da candidatura (Priority: P3)

A pessoa pode retirar uma candidatura que ainda não foi respondida.

**Why this priority**: Controle do candidato; baixo impacto na demo.

**Independent Test**: Retirar uma candidatura "Visualizada" e ver o status
"Retirada".

**Acceptance Scenarios**:

1. **Given** candidatura "Enviada" ou "Visualizada", **When** a pessoa
   retira e confirma, **Then** status vira "Retirada" e pode se candidatar
   de novo depois.

---

### Edge Cases

- Vaga encerra enquanto a candidatura está em rascunho: ao tentar enviar,
  aviso "Vaga encerrada" e rascunho descartado.
- Pessoa sem idade aplicável (spec 005): botão desabilitado com motivo.
- Texto curto com mais de 300 caracteres: contador e bloqueio.
- Tempo simulado: acelerado (minutos em vez de horas) e com controle na
  tela de demonstração para "avançar 24 h".
- Itens, moedas ou nível do personagem NÃO aparecem nem influenciam nada na
  candidatura (regra anti pay-to-win).
- Recompensa de moedas por candidatura (spec 008) não depende do
  resultado e tem limite diário.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada vaga MUST ter de 3 a 5 perguntas da empresa dos tipos:
  escolha única, múltipla escolha, sim/não, texto curto (máx. 300).
- **FR-002**: O formulário MUST validar todas as respostas antes de
  avançar/enviar e pré-preencher o que o perfil já informa.
- **FR-003**: O sistema MUST salvar rascunho por vaga até envio ou
  descarte.
- **FR-004**: O sistema MUST impedir candidatura duplicada ativa na mesma
  vaga e candidatura em vaga encerrada.
- **FR-005**: A candidatura MUST ter status Enviada, Visualizada,
  Respondida (Aceita para conversa / Não seguiremos) ou Retirada, cada
  mudança com data/hora.
- **FR-006**: Mudanças de status MUST ser simuladas com tempo acelerado e
  determinístico quando nenhuma empresa responder manualmente.
- **FR-007**: O sistema MUST notificar mudanças de status no HUD e marcar o
  prédio da vaga no mapa com o status.
- **FR-008**: O selo "Responde rápido" MUST ser calculado do histórico de
  respostas em até 48 h e exibido no pergaminho, na lista e na fachada.
- **FR-009**: A candidatura MUST NOT considerar, exibir ou ser
  influenciada por moedas, itens ou nível do jogador.
- **FR-010**: "Minhas candidaturas" MUST listar todas, filtráveis por
  status, com atalho "Ver no mapa".
- **FR-011**: Respostas em texto MUST ser exibidas como texto puro.

### Key Entities

- **Pergunta da vaga**: enunciado, tipo, opções, obrigatória.
- **Candidatura**: vaga, candidato, respostas, status, histórico de
  status com data/hora, mensagem da empresa.
- **Histórico de resposta da empresa**: tempo de resposta por
  candidatura, base do selo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Candidatar-se a uma vaga de 5 perguntas leva menos de 2
  minutos com perfil completo.
- **SC-002**: 95% das pessoas em teste concluem a candidatura sem ajuda.
- **SC-003**: 100% das candidaturas mostram status atual e histórico.
- **SC-004**: Nenhum elemento do jogo (moedas, itens) aparece no fluxo de
  candidatura.

## Assumptions

- Todas as vagas do mock ganham perguntas fictícias coerentes com a
  categoria.
- Tempo simulado: 1 hora de prazo = poucos segundos/minutos na demo,
  definido no plano.
- Dados conforme decisões transversais em `specs/README.md`.
