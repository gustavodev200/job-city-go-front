# Feature Specification: Busca, filtros e lista de vagas

**Feature Branch**: `004-busca-filtros-lista`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "Busca e filtros: perto de mim (raio a partir da cidade informada), categoria, modelo (presencial, híbrido, remoto), faixa salarial, turno, tipo de contrato (CLT, estágio, aprendiz, PJ, temporário). Filtro importante 'posso morar no interior', que mostra só vagas remotas ou com presença mínima. Lista de vagas ao lado do mapa, para acessibilidade e para quem prefere não explorar. Apenas frontend com dados mock."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lista de vagas ao lado do mapa (Priority: P1)

Em qualquer nível do mapa (Brasil, Estado, Cidade, Bairro Remoto) a pessoa
abre um painel "Vagas" com a lista das vagas do recorte atual: no Brasil,
todas; no Estado, as do estado; na Cidade, as da cidade. Cada item mostra
título, empresa, cidade/UF, categoria, modalidade, faixa salarial e selos
(Híbrida 1x/semana, Responde rápido, Patrocinado, Não verificada). Tocar
num item abre a vaga e, se a pessoa quiser, "Ver no mapa" leva até o
prédio.

**Why this priority**: Garante acessibilidade e atende quem não quer
explorar — sem isso o produto exclui parte do público.

**Independent Test**: Usar só teclado ou leitor de tela, achar uma vaga e
abrir os detalhes sem interagir com o mapa.

**Acceptance Scenarios**:

1. **Given** o nível Cidade de Goiânia, **When** a pessoa abre "Vagas",
   **Then** a lista mostra exatamente as vagas de Goiânia, abertas
   primeiro.
2. **Given** um item da lista, **When** a pessoa escolhe "Ver no mapa",
   **Then** o mapa navega até a cidade e o personagem/câmera vai até o
   prédio, destacando-o.
3. **Given** desktop, **When** o painel está aberto, **Then** fica ao lado
   do mapa sem cobri-lo; no celular, vira gaveta inferior arrastável.
4. **Given** vagas patrocinadas no recorte, **When** a lista aparece,
   **Then** elas podem aparecer no topo, sempre com etiqueta
   "Patrocinado", e nunca mais de 2 seguidas.

---

### User Story 2 - Filtrar por critérios (Priority: P1)

A pessoa combina filtros: categoria (multi), modalidade (multi), faixa
salarial (mín–máx), turno (manhã, tarde, noite, integral, escala), tipo de
contrato (CLT, estágio, aprendiz, PJ, temporário) e busca por texto
(título ou empresa). Os filtros valem ao mesmo tempo para a lista **e**
para o mapa: contagens do Brasil/Estado são recalculadas e prédios que não
passam no filtro ficam esmaecidos na cidade.

**Why this priority**: Busca é requisito explícito e o mapa só é útil se
refletir o que a pessoa procura.

**Independent Test**: Aplicar "Saúde + CLT + noite" e conferir contagens
no Brasil, no Estado, na Cidade e na lista contra o mock.

**Acceptance Scenarios**:

1. **Given** filtro "Saúde", **When** a pessoa volta ao nível Brasil,
   **Then** cada estado mostra só a contagem de vagas de Saúde e um aviso
   "Filtros ativos (1)" com opção de limpar.
2. **Given** filtros sem resultado, **When** aplicados, **Then** aparece
   "Nenhuma vaga com esses filtros" com sugestão de qual filtro afrouxar.
3. **Given** filtros aplicados, **When** a pessoa compartilha o link ou
   recarrega, **Then** os filtros continuam aplicados.

---

### User Story 3 - Perto de mim (Priority: P1)

Com a cidade informada (no perfil ou digitada na hora), a pessoa escolhe um
raio (10, 25, 50, 100, 200 km) e vê só vagas de cidades dentro do raio,
ordenadas por distância, com a distância em cada item. No mapa do estado,
um círculo mostra o raio.

**Why this priority**: É a proposta de valor nº 1 para o candidato.

**Independent Test**: Informar "Anápolis/GO" com raio 50 km e conferir que
só aparecem vagas de cidades a até 50 km.

**Acceptance Scenarios**:

1. **Given** cidade "Anápolis" e raio 25 km, **When** aplicado, **Then**
   aparecem vagas de Anápolis mas não de Goiânia (≈50 km em linha reta);
   **When** o raio muda para 100 km, **Then** as de Goiânia entram,
   ordenadas depois das de Anápolis.
2. **Given** nenhuma cidade informada, **When** a pessoa ativa "Perto de
   mim", **Then** é pedido que informe a cidade (campo com busca por nome).
3. **Given** "Perto de mim" ativo, **When** combinado com outros filtros,
   **Then** todos se aplicam juntos.

---

### User Story 4 - Posso morar no interior (Priority: P2)

Um atalho em destaque "Posso morar no interior" mostra só vagas remotas
e híbridas com presença mínima (até 1 dia por semana ou menos), incluindo
as de outros estados.

**Why this priority**: Filtro chamado de "importante" no produto, mas é
uma combinação dos filtros da US2.

**Independent Test**: Ativar o atalho e conferir que nenhuma vaga
presencial nem híbrida com mais de 1 dia/semana aparece.

**Acceptance Scenarios**:

1. **Given** o atalho ativado, **When** a lista aparece, **Then** só há
   vagas remotas e híbridas de até 1 dia/semana.
2. **Given** o atalho ativado no nível Brasil, **When** a pessoa olha o
   mapa, **Then** o Bairro Remoto ganha destaque e as contagens por estado
   mostram só híbridas elegíveis.

---

### Edge Cases

- Faixa salarial: vaga com faixa 2.000–3.200 aparece num filtro
  2.500–4.000 (sobreposição, não contenção).
- Vaga sem salário informado: aparece com "A combinar" e só some se a
  pessoa marcar "Somente com salário informado".
- Vagas remotas não têm distância: em "Perto de mim" elas ficam fora,
  salvo se "Incluir remotas" estiver marcado (padrão: marcado).
- Busca de texto ignora acentos e maiúsculas ("medico" acha "Médico").
- Lista com centenas de itens continua fluida (carregamento progressivo).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST oferecer uma lista de vagas em todos os
  níveis do mapa, restrita ao recorte geográfico atual.
- **FR-002**: Cada item MUST mostrar título, empresa, cidade/UF ou
  abrangência remota, categoria, modalidade, faixa salarial (ou "A
  combinar"), contrato, turno e selos aplicáveis.
- **FR-003**: Itens MUST permitir abrir os detalhes da vaga e "Ver no
  mapa".
- **FR-004**: O sistema MUST filtrar por categoria, modalidade, faixa
  salarial, turno, tipo de contrato e texto livre, combináveis.
- **FR-005**: Filtros MUST afetar lista e mapa (contagens nos níveis
  Brasil/Estado; esmaecimento na Cidade).
- **FR-006**: O sistema MUST oferecer "Perto de mim" com raios de 10, 25,
  50, 100 e 200 km a partir da cidade do perfil ou informada na hora.
- **FR-007**: O sistema MUST oferecer o atalho "Posso morar no interior"
  (remotas + híbridas com até 1 dia/semana de presença).
- **FR-008**: Filtros ativos MUST ficar visíveis com contagem e opção
  "Limpar", e MUST persistir no endereço da página e ao recarregar.
- **FR-009**: Ordenação MUST oferecer: relevância (padrão), mais recentes,
  maior salário, menor distância (quando houver cidade).
- **FR-010**: Vagas patrocinadas MUST sempre ter etiqueta "Patrocinado";
  o destaque nunca esconde vagas não patrocinadas que atendem o filtro.
- **FR-011**: Lista e filtros MUST ser totalmente operáveis por teclado e
  anunciados corretamente por leitor de tela (quantidade de resultados
  anunciada ao mudar filtro).

### Key Entities

- **Vaga**: ganha turno, tipo de contrato, data de publicação e salário
  opcional.
- **Filtro de busca**: conjunto de critérios ativos, cidade de referência
  e raio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Encontrar uma vaga com 3 critérios combinados leva menos de
  30 segundos.
- **SC-002**: Resultado de filtro aparece em menos de 0,5 segundo com o
  mock completo.
- **SC-003**: Teste com leitor de tela: pessoa encontra e abre uma vaga
  sem usar o mapa.
- **SC-004**: 100% dos resultados respeitam todos os filtros ativos.

## Assumptions

- Distância em linha reta entre coordenadas das cidades.
- "Presença mínima" = até 1 dia por semana.
- Relevância = vagas abertas, patrocinadas (limitadas), mais recentes.
- Dados conforme decisões transversais em `specs/README.md`.
