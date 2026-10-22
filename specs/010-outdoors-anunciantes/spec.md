# Feature Specification: Outdoors para marcas

**Feature Branch**: `010-outdoors-anunciantes`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "Placas em avenidas do mapa, vendidas por período e região. Segmentação por região, ex.: outdoor de farmácia perto de clínicas. Métricas de exibição baseadas no tráfego real do jogo. Publicidade sempre identificada. Apenas frontend com dados mock."

## Contexto

A cidade já tem outdoors na beira das avenidas com marcas fictícias
sorteadas. Esta feature dá ao **Anunciante** (papel da spec 005) um fluxo
para reservar outdoors e ver métricas, e faz os outdoors respeitarem
região e contexto.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Outdoors por região e contexto (Priority: P1)

Os outdoors exibidos numa cidade vêm das campanhas ativas daquela região
(cidade, estado ou Brasil). Campanhas podem pedir contexto: "perto de
prédios de Saúde", "perto de Comércio" etc., e então ocupam as placas mais
próximas dessas construções. Toda placa mostra a marcação **Publicidade**.

**Why this priority**: Sem segmentação não há produto para vender; também
corrige o comportamento atual (marcas iguais em qualquer lugar).

**Independent Test**: Criar no mock uma campanha de farmácia para Goiânia
com contexto Saúde e ver que ela aparece em Goiânia, perto de clínicas, e
não em outra cidade.

**Acceptance Scenarios**:

1. **Given** campanha "FarmaVida — Goiânia — perto de Saúde", **When** a
   pessoa anda em Goiânia, **Then** a placa da FarmaVida está nas
   avenidas mais próximas de prédios de Saúde.
2. **Given** a mesma campanha, **When** a pessoa está em Anápolis, **Then**
   a FarmaVida não aparece.
3. **Given** região sem campanha, **When** a cidade abre, **Then** as
   placas mostram "Anuncie aqui" (convite para anunciantes).

---

### User Story 2 - Reservar outdoor (Priority: P1)

No papel Anunciante, a pessoa cria uma campanha: marca (nome, cor, slogan,
categoria), região (cidade, estado ou nacional), contexto opcional
(categoria de vaga próxima), período (7, 15 ou 30 dias, data de início) e
quantidade de placas. Vê prévia da placa e um resumo com "preço a definir —
demonstração, nenhuma cobrança". Ao confirmar, a campanha fica ativa no
período.

**Why this priority**: Fluxo de venda que valida o modelo fase 3.

**Independent Test**: Criar campanha para a cidade atual, ir até a cidade e
ver a placa.

**Acceptance Scenarios**:

1. **Given** formulário válido, **When** confirma, **Then** a campanha
   aparece em "Minhas campanhas" como Agendada/Ativa e, se ativa, nas
   placas da região.
2. **Given** placas da região esgotadas no período, **When** tenta
   reservar, **Then** vê disponibilidade restante e sugestão de outra data
   ou região.
3. **Given** slogan com mais de 40 caracteres ou texto vazio, **When**
   envia, **Then** erro por campo.

---

### User Story 3 - Métricas de exibição (Priority: P2)

Cada campanha mostra métricas: exibições (vezes que uma placa ficou
visível na tela por pelo menos 1 segundo), aberturas (toques na placa para
ver detalhes) e cidades onde apareceu, por dia. As métricas contam o uso
real da própria demonstração somado a uma base fictícia claramente
identificada como "dados simulados".

**Why this priority**: O produto diz que vender exige dados de tráfego;
a demo precisa mostrar como eles seriam apresentados.

**Independent Test**: Andar perto de uma placa da campanha e ver as
exibições subirem.

**Acceptance Scenarios**:

1. **Given** campanha ativa, **When** a placa fica visível 1 s ou mais,
   **Then** soma 1 exibição (no máximo 1 por placa a cada 30 s).
2. **Given** painel de métricas, **When** aberto, **Then** separa "seu
   uso" de "dados simulados".

---

### Edge Cases

- Placas nunca cobrem prédios de vaga nem bloqueiam o caminho.
- Conteúdo de marca exibido como texto puro; cor com contraste mínimo
  garantido para leitura (ajuste automático da cor do texto).
- Campanhas proibidas: categorias de apostas, bebidas alcoólicas, tabaco e
  "vagas" pagas (bloqueadas na criação).
- Fim do período: a placa volta a outra campanha ou "Anuncie aqui".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Placas MUST exibir campanhas ativas da região da cidade
  atual (cidade > estado > nacional, nessa prioridade).
- **FR-002**: Campanhas com contexto MUST ocupar as placas mais próximas
  das construções da categoria pedida.
- **FR-003**: Toda placa e o detalhe da placa MUST exibir "Publicidade".
- **FR-004**: O anunciante MUST conseguir criar campanha com marca,
  região, contexto, período e quantidade, com validação por campo e prévia.
- **FR-005**: O sistema MUST respeitar a disponibilidade de placas por
  região e período.
- **FR-006**: A reserva MUST ser simulada, sem cobrança, com aviso claro.
- **FR-007**: O sistema MUST contar exibições (≥ 1 s visível, máx. 1 por
  placa a cada 30 s) e aberturas por campanha, por dia e cidade.
- **FR-008**: Métricas MUST separar uso real da demo e base simulada.
- **FR-009**: Categorias proibidas MUST ser bloqueadas na criação.

### Key Entities

- **Anunciante/Marca**: (já existe) nome, cor, slogan, categoria.
- **Campanha**: marca, região, contexto, período, placas, status.
- **Placa**: posição na cidade, avenida, categorias de construção
  próximas.
- **Métrica de campanha**: exibições e aberturas por dia e cidade.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Criar uma campanha leva menos de 3 minutos.
- **SC-002**: 100% das placas exibidas são da região correta e marcadas
  "Publicidade".
- **SC-003**: Contagem de exibições não varia mais que 10% entre duas
  execuções do mesmo percurso.

## Assumptions

- Placas existentes na cidade são reaproveitadas; quantidade por cidade
  proporcional ao tamanho da cidade.
- Integração com site de ofertas é fase 2, fora do escopo.
- Dados conforme decisões transversais em `specs/README.md`.
