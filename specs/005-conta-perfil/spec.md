# Feature Specification: Conta de demonstração, papéis e perfil do candidato

**Feature Branch**: `005-conta-perfil`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "Perfil do candidato (cidade, disponibilidade, experiência) usado para 'perto de mim', deslocamento e candidaturas; idade mínima para uso e candidatura conforme legislação do trabalho do menor; completar perfil dá moedas. Como é só frontend com mock, precisa de entrada simulada e troca de papel (candidato, empresa, anunciante, moderação) para demonstrar todos os fluxos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar como candidato (simulado) (Priority: P1)

A pessoa pode explorar o mapa sem conta. Para se candidatar, ganhar moedas
ou salvar perfil, ela "entra" com um nome e e-mail fictícios num
formulário curto marcado claramente como **Demonstração — nenhum dado sai
do seu navegador**. A sessão continua ao recarregar e pode ser encerrada
("Sair") a qualquer momento.

**Why this priority**: Pré-requisito de candidatura (006), moedas (008),
painel de empresa (009) e outdoors (010).

**Independent Test**: Explorar sem conta, tentar se candidatar, ser
convidado a entrar, entrar e voltar à mesma vaga.

**Acceptance Scenarios**:

1. **Given** visitante sem conta, **When** tenta se candidatar, **Then**
   aparece o convite para entrar e, após entrar, volta à mesma vaga.
2. **Given** formulário de entrada, **When** e-mail é inválido, **Then**
   aparece mensagem de erro clara no campo e o envio é bloqueado.
3. **Given** pessoa logada, **When** recarrega a página, **Then** continua
   logada; **When** escolhe "Sair", **Then** volta a visitante.

---

### User Story 2 - Idade mínima (Priority: P1)

Na entrada a pessoa informa a data de nascimento. Menores de 14 anos não
podem usar a conta. De 14 a 15 anos só veem e só podem se candidatar a
vagas de **Aprendiz**. De 16 a 17 anos podem se candidatar a Aprendiz e
Estágio, além de vagas sem trabalho noturno, insalubre ou perigoso
(marcadas na vaga como "Somente maiores de 18"). A partir de 18 anos, todas.

**Why this priority**: Requisito legal e de segurança do produto.

**Independent Test**: Criar 4 perfis com idades 13, 15, 17 e 18 e conferir
o que cada um consegue fazer.

**Acceptance Scenarios**:

1. **Given** nascimento que dá 13 anos, **When** tenta entrar, **Then**
   recebe mensagem explicando a idade mínima e não entra.
2. **Given** perfil de 15 anos, **When** abre vaga CLT comum, **Then** o
   botão de candidatura fica desabilitado com explicação "Disponível a
   partir de 18 anos" (ou da idade aplicável).
3. **Given** perfil de 17 anos, **When** abre vaga de turno noturno,
   **Then** não pode se candidatar.

---

### User Story 3 - Perfil do candidato (Priority: P1)

Página "Meu perfil" com: nome de exibição, cidade de residência (busca por
nome entre as cidades do Brasil), disponibilidade de turno, tipos de
contrato de interesse, categorias de interesse, experiência resumida
(até 3 experiências: função, onde, quanto tempo), escolaridade e
"aceito trabalhar remoto/híbrido". Uma barra mostra o percentual
completo e quais campos faltam.

**Why this priority**: A cidade alimenta "perto de mim" e deslocamento; o
resto pré-preenche as candidaturas.

**Independent Test**: Preencher o perfil, recarregar, ver tudo salvo e a
barra em 100%.

**Acceptance Scenarios**:

1. **Given** perfil vazio, **When** a pessoa informa a cidade, **Then**
   o mapa passa a marcar "Você está aqui" (spec 001/002) e o deslocamento
   aparece nas vagas (spec 003).
2. **Given** perfil a 100%, **When** completado pela primeira vez, **Then**
   a pessoa recebe a recompensa de moedas de "Perfil completo" (uma única
   vez; spec 008 define o valor).
3. **Given** dado inválido (ex.: nome com 1 letra, cidade inexistente),
   **When** salvar, **Then** o campo mostra erro e nada é salvo.

---

### User Story 4 - Trocar de papel para demonstrar (Priority: P2)

Um seletor "Ver como" permite alternar entre **Candidato**, **Empresa**
(uma empresa fictícia pré-cadastrada ou a que a pessoa cadastrar na spec
009), **Anunciante** e **Moderação**. Cada papel muda o menu principal. Um
botão "Restaurar dados de demonstração" apaga tudo que foi salvo e volta ao
conjunto inicial (com confirmação).

**Why this priority**: Necessário para demonstrar os lados empresa,
anunciante e moderação sem backend, mas cada um desses só existe nas specs
seguintes.

**Independent Test**: Alternar entre os 4 papéis e ver o menu mudar;
restaurar dados e conferir que candidaturas e perfil voltaram ao inicial.

**Acceptance Scenarios**:

1. **Given** papel Candidato, **When** troca para Empresa, **Then** o menu
   mostra "Minhas vagas" e "Candidaturas recebidas" no lugar de "Minhas
   candidaturas".
2. **Given** dados salvos, **When** a pessoa escolhe restaurar e confirma,
   **Then** tudo volta ao inicial e ela volta a visitante.

---

### Edge Cases

- Data de nascimento no futuro ou mais de 100 anos: erro de validação.
- Pessoa que faz aniversário e muda de faixa: a regra usa a idade do dia.
- Armazenamento do navegador indisponível (modo privado restrito): o app
  funciona na sessão e avisa que nada será guardado ao fechar.
- Texto livre do perfil é exibido como texto puro (sem formatação ativa).
- Cidade de residência pode ser uma cidade sem vagas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Explorar mapa e vagas MUST funcionar sem conta.
- **FR-002**: Candidatar, ganhar/gastar moedas e editar perfil MUST exigir
  entrada (simulada), retornando ao ponto de origem após entrar.
- **FR-003**: Toda tela de entrada MUST indicar que é demonstração e que
  os dados ficam só no navegador; MUST NOT pedir senha.
- **FR-004**: Todas as entradas do formulário MUST ser validadas com
  mensagens claras por campo antes de salvar.
- **FR-005**: O sistema MUST aplicar a idade mínima: < 14 bloqueia uso;
  14–15 só Aprendiz; 16–17 Aprendiz, Estágio e vagas sem restrição de
  maioridade; 18+ todas.
- **FR-006**: Vagas MUST poder ser marcadas "Somente maiores de 18"
  (noturno, insalubre, perigoso) no mock.
- **FR-007**: O perfil MUST conter os campos listados na US3 e mostrar
  percentual de completude com campos faltantes.
- **FR-008**: Completar o perfil pela primeira vez MUST gerar o evento de
  recompensa "Perfil completo" (uma vez por conta).
- **FR-009**: O sistema MUST oferecer o seletor "Ver como" com 4 papéis e
  menus distintos.
- **FR-010**: O sistema MUST oferecer "Restaurar dados de demonstração"
  com confirmação.
- **FR-011**: Sessão e perfil MUST persistir ao recarregar e sumir ao
  sair/restaurar.

### Key Entities

- **Conta (demo)**: id, nome, e-mail, data de nascimento, papel atual.
- **Perfil do candidato**: cidade de residência, turnos, contratos,
  categorias, experiências, escolaridade, aceita remoto/híbrido,
  completude.
- **Empresa demo**: empresa fictícia associada à conta no papel Empresa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Entrar e completar o perfil leva menos de 3 minutos.
- **SC-002**: 100% das regras de idade dos 4 cenários de teste se
  comportam como especificado.
- **SC-003**: Recarregar a página nunca perde sessão nem perfil salvos.
- **SC-004**: Pessoas entendem que é demonstração (5 de 5 em teste rápido).

## Assumptions

- Regras de idade baseadas na legislação brasileira de trabalho do menor
  (aprendiz a partir de 14; trabalho a partir de 16; vedado noturno,
  insalubre e perigoso a menores de 18). Revisar com jurídico antes do
  produto real.
- Autenticação real (backend) substituirá a entrada simulada em fase
  futura; nada aqui é segurança real.
- Dados conforme decisões transversais em `specs/README.md`.
