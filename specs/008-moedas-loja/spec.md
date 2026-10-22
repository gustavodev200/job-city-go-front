# Feature Specification: Moedas, missões e loja do personagem

**Feature Branch**: `008-moedas-loja`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "Moeda exclusivamente virtual, sem compra com dinheiro real. Ganhar: completar perfil, mini-quizzes de habilidades, missões na cidade, conquistas e exploração, enviar candidaturas (sem vantagem no ranking). Gastar: veículos com velocidade maior na cidade, roupas e acessórios, decoração da casa/apartamento do personagem. Itens com preço fixo, sem caixas aleatórias. Apenas frontend com dados mock."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Carteira e extrato de moedas (Priority: P1)

O HUD já mostra um saldo de moedas. Ele passa a ser real (por conta,
salvo no navegador) e, ao tocar, abre a carteira com saldo e extrato: cada
ganho/gasto com motivo, valor e data.

**Why this priority**: Base de toda a economia do jogo.

**Independent Test**: Ganhar e gastar moedas e conferir que o saldo bate
com o extrato após recarregar.

**Acceptance Scenarios**:

1. **Given** conta nova, **When** a carteira abre, **Then** saldo 0 e
   extrato vazio com dicas de como ganhar.
2. **Given** ganhos e gastos, **When** a pessoa recarrega, **Then** saldo e
   extrato são os mesmos.
3. **Given** qualquer tela, **When** a pessoa procura comprar moedas com
   dinheiro, **Then** essa opção não existe (texto: "Moedas não se compram
   — se ganham jogando").

---

### User Story 2 - Ganhar moedas (Priority: P1)

Fontes de moedas, com valores fixos:

| Ação | Moedas | Limite |
|---|---|---|
| Completar o perfil (spec 005) | 100 | 1 vez |
| Mini-quiz de habilidade concluído (≥ 60% de acerto) | 30 | 1 vez por quiz |
| Missão na cidade concluída | 20–60 | 1 vez por missão |
| Conquista desbloqueada | 25–100 | 1 vez |
| Visitar uma cidade nova (exploração) | 10 | 1 vez por cidade |
| Enviar candidatura (spec 006) | 5 | até 3 por dia |

Missões exemplo: "Visite 5 prédios de Saúde", "Ande até a praça",
"Encontre a vaga com selo Responde rápido", "Visite o Bairro Remoto".
Quizzes exemplo: atendimento ao cliente, planilhas básicas, segurança no
trabalho, matemática financeira (5 perguntas cada).

**Why this priority**: Sem ganho não há o que gastar; missões e quizzes
dão motivo para explorar o mapa.

**Independent Test**: Concluir 1 quiz, 1 missão e 1 visita a cidade nova e
conferir os valores no extrato.

**Acceptance Scenarios**:

1. **Given** quiz com 5 perguntas, **When** acerta 3, **Then** recebe 30
   moedas; refazer não dá moedas de novo.
2. **Given** missão "Visite 5 prédios de Saúde" ativa, **When** a pessoa
   abre o pergaminho de 5 vagas de Saúde diferentes, **Then** a missão
   conclui com notificação e moedas.
3. **Given** 3 candidaturas no dia, **When** envia a 4ª, **Then** não
   ganha moedas por ela (e a candidatura segue normal).

---

### User Story 3 - Loja com preço fixo (Priority: P1)

Loja com três seções: **Veículos** (bicicleta, patinete, moto, carro —
cada um mais rápido na cidade), **Roupas e acessórios** (camisetas, bonés,
óculos, mochilas, cores) e **Casa** (móveis e decoração). Cada item mostra
preço fixo e prévia. Comprar desconta o saldo e o item vai para o
inventário. Não existem caixas aleatórias nem itens por sorteio.

**Why this priority**: Dá sentido às moedas.

**Independent Test**: Comprar uma bicicleta e um boné e vê-los no
inventário; tentar comprar algo sem saldo e ser impedido.

**Acceptance Scenarios**:

1. **Given** saldo 150 e bicicleta por 120, **When** compra e confirma,
   **Then** saldo 30 e bicicleta no inventário.
2. **Given** saldo insuficiente, **When** tenta comprar, **Then** botão
   desabilitado com "Faltam N moedas".
3. **Given** item já comprado, **When** a loja é vista, **Then** aparece
   "Você já tem" no lugar do preço.

---

### User Story 4 - Usar itens no personagem e no mapa (Priority: P2)

No inventário a pessoa equipa roupa/acessório (o personagem muda na tela de
personagem e no jogo) e escolhe um veículo, que aumenta a velocidade de
deslocamento na cidade e aparece no lugar da caminhada.

**Why this priority**: Recompensa visível; depende da loja.

**Independent Test**: Equipar boné e moto e ver o personagem com boné e
andando de moto mais rápido.

**Acceptance Scenarios**:

1. **Given** moto no inventário, **When** equipada, **Then** o personagem
   anda de moto na cidade com velocidade maior; pode voltar a pé.
2. **Given** boné equipado, **When** a pessoa abre a tela de personagem,
   **Then** vê o personagem com o boné.

---

### User Story 5 - Casa do personagem (Priority: P3)

Uma casa/apartamento simples do personagem, acessível pelo menu, onde a
pessoa posiciona móveis comprados em posições pré-definidas.

**Why this priority**: Engajamento extra, menor impacto no objetivo de
emprego.

**Independent Test**: Comprar um sofá e colocá-lo na sala.

**Acceptance Scenarios**:

1. **Given** sofá no inventário, **When** a pessoa coloca na sala,
   **Then** ele aparece e continua lá ao voltar.

---

### Edge Cases

- Nenhuma ação de compra ou item altera candidatura, ordem de lista ou
  visibilidade para empresas (regra do produto).
- Veículos não atravessam prédios e respeitam os mesmos limites do
  personagem; "reduzir movimento" não é afetado.
- Saldo nunca fica negativo; compras são atômicas (ou desconta e entrega,
  ou nada).
- Restaurar dados de demonstração zera saldo e inventário.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Moedas MUST ser exclusivamente virtuais; o sistema MUST NOT
  oferecer compra de moedas ou itens com dinheiro.
- **FR-002**: O sistema MUST manter saldo e extrato por conta, persistidos.
- **FR-003**: O sistema MUST conceder moedas pelas ações e valores da
  tabela da US2, respeitando limites.
- **FR-004**: O sistema MUST oferecer ao menos 4 quizzes de 5 perguntas e
  8 missões.
- **FR-005**: A loja MUST ter itens de preço fixo nas seções Veículos,
  Roupas e acessórios, Casa; MUST NOT ter caixas aleatórias ou sorteio.
- **FR-006**: Compra MUST exigir saldo suficiente e confirmação.
- **FR-007**: Itens MUST poder ser equipados e aparecer no personagem
  (roupas) e no deslocamento na cidade (veículos, com velocidade maior).
- **FR-008**: Conquistas MUST ter lista visível com bloqueadas e
  desbloqueadas.
- **FR-009**: Moedas, itens e conquistas MUST NOT influenciar
  candidaturas nem a ordem/visibilidade de vagas.

### Key Entities

- **Carteira**: saldo, extrato (lançamento: tipo, motivo, valor, data).
- **Missão**, **Quiz**, **Conquista**: id, título, condição, recompensa,
  progresso/concluído.
- **Item**: seção, nome, preço fixo, efeito (visual ou velocidade).
- **Inventário**: itens possuídos e equipados; disposição da casa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Saldo sempre igual à soma do extrato (100% dos testes).
- **SC-002**: Uma pessoa nova consegue comprar o primeiro item em menos de
  10 minutos de jogo.
- **SC-003**: 0 telas com opção de pagamento real.

## Assumptions

- Preços: veículos 120–600; roupas 20–80; casa 30–200 (ajustáveis).
- Sem ranking público nesta fase.
- Dados conforme decisões transversais em `specs/README.md`.
