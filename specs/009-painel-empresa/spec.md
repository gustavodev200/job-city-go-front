# Feature Specification: Painel da empresa

**Feature Branch**: `009-painel-empresa`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "Cadastro gratuito da empresa, com validação de CNPJ antes de aparecer no mapa. Publicação de vaga por formulário: categoria, modelo, faixa salarial, perguntas. Construção automática no mapa conforme a categoria, luz acesa enquanto aberta. Painel de candidaturas: aceitar, recusar, responder com mensagem curta. Selo 'responde rápido'. Destaque pago: marcador maior e brilho por um período, sempre com etiqueta 'Patrocinado'. Plano para empresas. Apenas frontend com dados mock."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar empresa com CNPJ (Priority: P1)

No papel Empresa (spec 005), a pessoa cadastra a empresa: razão social,
nome fantasia, CNPJ, cidade/endereço (cidade do mock), categoria
principal, contato. O CNPJ é validado pelo formato e dígitos verificadores
na hora; a "verificação cadastral" é simulada (aprovada após alguns
segundos; CNPJs de uma lista mock são reprovados para demonstrar o erro).
Enquanto não verificada, a empresa não aparece no mapa.

**Why this priority**: Porta de entrada do lado empresa e primeira
barreira contra golpes.

**Independent Test**: Cadastrar com CNPJ inválido (erro), com CNPJ da lista
reprovada (recusa) e com CNPJ válido (aprovado).

**Acceptance Scenarios**:

1. **Given** CNPJ com dígito verificador errado, **When** a pessoa sai do
   campo, **Then** aparece "CNPJ inválido".
2. **Given** CNPJ válido, **When** envia, **Then** status "Em
   verificação" e, após a simulação, "Verificada".
3. **Given** empresa "Em verificação", **When** tenta publicar vaga,
   **Then** pode preparar rascunho mas não publicar.

---

### User Story 2 - Publicar vaga e ver o prédio surgir (Priority: P1)

Formulário de vaga: título, categoria (7 do produto), modalidade
(presencial com endereço; híbrida com frequência; remota com abrangência),
faixa salarial (ou "a combinar"), turno, tipo de contrato, descrição,
requisitos, benefícios, "somente maiores de 18" e 3 a 5 perguntas (tipos da
spec 006). Ao publicar, a vaga entra no mock local e a construção da
categoria aparece no mapa (cidade ou Bairro Remoto) com luz acesa; o botão
"Ver no mapa" leva até ela.

**Why this priority**: Cria o conteúdo do mapa; prova o ciclo
empresa → mapa → candidato.

**Independent Test**: Publicar uma vaga de Saúde em Anápolis e encontrá-la
no mapa (contagens de Brasil/Estado/Cidade atualizadas) e na lista.

**Acceptance Scenarios**:

1. **Given** formulário válido, **When** publica, **Then** a vaga aparece
   em "Minhas vagas" como Aberta e no mapa como prédio com cruz iluminado.
2. **Given** menos de 3 ou mais de 5 perguntas, **When** tenta publicar,
   **Then** bloqueio com mensagem.
3. **Given** vaga aberta, **When** a empresa encerra, **Then** a luz do
   prédio apaga e novas candidaturas são bloqueadas.
4. **Given** texto com pedido de pagamento/taxa, **When** tenta publicar,
   **Then** é bloqueado pelo filtro da spec 011.

---

### User Story 3 - Gerenciar candidaturas (Priority: P1)

Painel "Candidaturas recebidas" por vaga: lista com nome, cidade, distância
(se houver), respostas às perguntas e tempo desde o envio. Abrir marca como
"Visualizada". Ações: **Aceitar para conversa** ou **Recusar**, ambas com
mensagem curta opcional (até 280 caracteres, com modelos prontos). Um
contador mostra o prazo de 48 h por candidatura.

**Why this priority**: Fecha o ciclo da candidatura (spec 006) do lado
empresa.

**Independent Test**: Como candidato, candidatar-se; trocar para Empresa,
abrir, aceitar com mensagem; voltar ao candidato e ver "Respondida".

**Acceptance Scenarios**:

1. **Given** candidatura nova, **When** a empresa abre, **Then** o status
   no lado candidato vira "Visualizada".
2. **Given** candidatura visualizada, **When** a empresa aceita com
   mensagem, **Then** o candidato vê "Aceita para conversa" com a
   mensagem.
3. **Given** candidatura perto de 48 h, **When** o painel abre, **Then**
   ela aparece no topo com alerta "Responda até HH:MM para manter o selo".

---

### User Story 4 - Destaque patrocinado e plano (Priority: P2)

A empresa pode destacar uma vaga por 7, 15 ou 30 dias: o prédio fica maior
com brilho e a vaga pode subir na lista, sempre com etiqueta
**Patrocinado**. A "compra" é simulada (sem pagamento; tela diz
"Demonstração — nenhuma cobrança"). Uma página "Planos" mostra Gratuito
(até 3 vagas abertas) e Empresa (mais vagas, relatórios) com preços "a
definir"; o plano Empresa pode ser ativado em modo demonstração.

**Why this priority**: Modelo de receita fase 1; essencial para validar com
empresas, mas não para o fluxo do candidato.

**Independent Test**: Destacar uma vaga e verificar o prédio e a lista com
"Patrocinado"; tentar abrir a 4ª vaga no plano Gratuito.

**Acceptance Scenarios**:

1. **Given** vaga aberta, **When** a empresa ativa destaque de 7 dias,
   **Then** o prédio fica destacado e com etiqueta "Patrocinado" até o
   fim do período (tempo simulado).
2. **Given** plano Gratuito com 3 vagas abertas, **When** tenta publicar a
   4ª, **Then** é convidada a encerrar uma ou conhecer o plano Empresa.

---

### User Story 5 - Relatório simples (Priority: P3)

Painel com, por vaga: visualizações do prédio (quantas vezes o pergaminho
foi aberto), candidaturas, tempo médio de resposta e status do selo
"Responde rápido".

**Why this priority**: Benefício do plano pago; útil para a demonstração
comercial.

**Independent Test**: Abrir o pergaminho de uma vaga como candidato e ver o
contador subir no relatório.

**Acceptance Scenarios**:

1. **Given** vaga com aberturas e candidaturas, **When** o relatório abre,
   **Then** mostra os números consistentes com as ações feitas.

---

### Edge Cases

- Endereço da vaga presencial precisa ser de uma cidade do mock; cidades
  fora da lista não são aceitas nesta fase.
- Editar vaga com candidaturas: só campos que não mudam o contrato
  (descrição, benefícios); perguntas ficam travadas.
- Empresa sem vagas abertas não tem prédio no mapa.
- Selo "Responde rápido" se recalcula a cada resposta.
- Todo texto da empresa é exibido como texto puro no mapa e na lista.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O cadastro de empresa MUST validar CNPJ (formato e dígitos)
  e simular verificação cadastral antes de permitir publicação.
- **FR-002**: Empresa não verificada MUST NOT aparecer no mapa nem
  publicar.
- **FR-003**: O formulário de vaga MUST cobrir os campos da US2 com
  validação por campo e 3 a 5 perguntas.
- **FR-004**: Vaga publicada MUST aparecer imediatamente no mapa
  (construção da categoria, luz acesa), nas contagens e na lista.
- **FR-005**: Encerrar vaga MUST apagar a luz e bloquear candidaturas.
- **FR-006**: O painel MUST listar candidaturas por vaga com respostas e
  permitir Aceitar para conversa/Recusar com mensagem de até 280
  caracteres.
- **FR-007**: Abrir candidatura MUST marcá-la como Visualizada para o
  candidato.
- **FR-008**: O painel MUST mostrar o prazo de 48 h e o status do selo
  "Responde rápido".
- **FR-009**: Destaque MUST durar o período escolhido e SEMPRE exibir
  "Patrocinado" onde a vaga aparecer.
- **FR-010**: Planos Gratuito (até 3 vagas abertas) e Empresa MUST existir
  em modo demonstração, sem cobrança real.
- **FR-011**: Textos publicados MUST passar pelo filtro anti-golpe (spec
  011) antes de publicar.

### Key Entities

- **Empresa**: razão social, nome fantasia, CNPJ, cidade, categoria,
  status de verificação, plano, selo responde rápido.
- **Vaga**: (ver specs 003/004/006) + empresa dona, destaque (início/fim).
- **Resposta da empresa**: candidatura, decisão, mensagem, data/hora.
- **Métrica de vaga**: aberturas do pergaminho, candidaturas, tempo médio
  de resposta.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Cadastrar empresa e publicar a primeira vaga leva menos de 5
  minutos.
- **SC-002**: Vaga publicada aparece no mapa em menos de 1 segundo.
- **SC-003**: 100% das vagas destacadas mostram "Patrocinado" em todos os
  lugares onde aparecem.
- **SC-004**: Empresa responde uma candidatura em menos de 30 segundos
  usando modelos de mensagem.

## Assumptions

- Verificação de CNPJ real (consulta à Receita) fica para o backend;
  aqui só dígitos + simulação.
- Prédio personalizado com logo é fase 2, fora do escopo.
- Dados conforme decisões transversais em `specs/README.md`.
