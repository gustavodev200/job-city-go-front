# Feature Specification: Confiança, segurança e moderação

**Feature Branch**: `011-confianca-moderacao`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "Validação de empresas: CNPJ verificado antes da publicação. Filtro de golpes: bloqueio de vagas que pedem pagamento, depósito, compra de equipamento ou taxa; filtro de palavras-chave e revisão humana. Denúncia: botão em vagas e empresas, com revisão em até 24 horas. Vagas não verificadas: aviso visível. Publicidade: destaques e outdoors sempre identificados. Apenas frontend com dados mock."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Filtro anti-golpe na publicação (Priority: P1)

Ao publicar vaga (spec 009) o texto (título, descrição, requisitos,
benefícios, perguntas) passa por um filtro de termos e padrões de golpe:
pedido de pagamento, taxa, depósito, PIX, "kit", compra de equipamento ou
uniforme, curso obrigatório pago, salários irreais para a função. Casos
claros são **bloqueados** com explicação; casos duvidosos vão para
**revisão humana** (fila de moderação) e só aparecem no mapa após
aprovação.

**Why this priority**: Golpes com vagas falsas prejudicam diretamente o
público-alvo; é a proteção mais importante.

**Independent Test**: Tentar publicar 3 vagas — uma limpa, uma com
"pague a taxa de cadastro" e uma com salário 3x acima da média da
categoria — e ver publicada, bloqueada e em revisão.

**Acceptance Scenarios**:

1. **Given** descrição com "taxa de inscrição de R$ 50", **When** publica,
   **Then** é bloqueada com mensagem "Vagas não podem cobrar nada do
   candidato" e o trecho destacado.
2. **Given** salário muito acima da faixa típica da categoria, **When**
   publica, **Then** vai para "Em revisão" e não aparece no mapa.
3. **Given** tentativa de contornar ("p a g u e", "t@xa"), **When**
   publica, **Then** o filtro ainda detecta (normaliza espaços, símbolos e
   acentos).

---

### User Story 2 - Denunciar vaga ou empresa (Priority: P1)

Em todo pergaminho de vaga, página de empresa e conversa (spec 007) há
"Denunciar". A pessoa escolhe o motivo (pede dinheiro, vaga falsa,
discriminação, conteúdo ofensivo, outro) e descreve (opcional, até 500
caracteres). Recebe confirmação com prazo "Revisão em até 24 h" e
acompanha o status em "Minhas denúncias".

**Why this priority**: Rede de segurança para o que o filtro não pega.

**Independent Test**: Denunciar uma vaga e acompanhar até a decisão
(simulada ou feita no papel Moderação).

**Acceptance Scenarios**:

1. **Given** uma vaga, **When** a pessoa denuncia com motivo, **Then** vê
   confirmação e a denúncia aparece como "Em análise".
2. **Given** a mesma pessoa, **When** tenta denunciar a mesma vaga de novo,
   **Then** vê "Você já denunciou esta vaga".
3. **Given** vaga com 3 ou mais denúncias de pessoas diferentes por "pede
   dinheiro", **When** a terceira chega, **Then** a vaga é ocultada do
   mapa preventivamente até a revisão.

---

### User Story 3 - Fila de moderação (Priority: P2)

No papel Moderação, a pessoa vê a fila com vagas em revisão e denúncias,
ordenadas por prazo (24 h) e gravidade, com o texto destacado pelo filtro.
Ações: aprovar, remover vaga, suspender empresa, arquivar denúncia — com
motivo. O resultado aparece para quem denunciou e para a empresa.

**Why this priority**: Fecha o ciclo da revisão humana; sem backend é só
demonstração, por isso P2.

**Independent Test**: Como Moderação, remover uma vaga denunciada e ver o
prédio sumir do mapa e o status "Resolvida — vaga removida" para quem
denunciou.

**Acceptance Scenarios**:

1. **Given** vaga em revisão, **When** moderação aprova, **Then** ela
   aparece no mapa.
2. **Given** denúncia procedente, **When** moderação suspende a empresa,
   **Then** todas as vagas da empresa somem do mapa e a empresa vê o
   motivo.
3. **Given** item da fila passando de 24 h, **When** a fila abre, **Then**
   ele aparece no topo com alerta de atraso.

---

### User Story 4 - Sinais de confiança visíveis (Priority: P1)

Selos e avisos aparecem consistentemente em pergaminho, lista e prédio:
**Empresa verificada** (CNPJ ok), **Não verificada** (aviso amarelo:
"Esta empresa ainda não foi verificada. Nunca pague nada para se
candidatar"), **Patrocinado** (destaque) e **Publicidade** (outdoor). Uma
página curta "Dicas de segurança" explica como reconhecer golpes.

**Why this priority**: Requisito explícito do produto e barato de fazer.

**Independent Test**: Conferir no mock uma vaga de empresa verificada e uma
de não verificada nos três lugares.

**Acceptance Scenarios**:

1. **Given** vaga de empresa não verificada no mock (importada/legada),
   **When** exibida, **Then** o aviso amarelo aparece no pergaminho, na
   lista e uma placa no prédio.
2. **Given** a página "Dicas de segurança", **When** aberta, **Then** está
   acessível pelo rodapé do HUD e pelo aviso.

---

### Edge Cases

- Falsos positivos: "Vale-transporte pago pela empresa" não deve
  bloquear — o filtro considera quem paga (frases do tipo "pago pela
  empresa", "a empresa fornece" são permitidas).
- A empresa bloqueada pode editar e reenviar; tentativas repetidas (5+)
  vão automaticamente para revisão humana.
- Denúncia não revela quem denunciou à empresa.
- Na demo sem moderação manual, decisões são simuladas após o prazo
  acelerado, com resultado determinístico por caso de teste.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Todo texto de vaga MUST passar pelo filtro anti-golpe antes
  de publicar, com resultado Publicar, Bloquear (com trecho e motivo) ou
  Revisão humana.
- **FR-002**: O filtro MUST normalizar acentos, espaços, símbolos e
  substituições comuns de letras antes de comparar.
- **FR-003**: O filtro MUST distinguir pedido ao candidato de benefício
  pago pela empresa para reduzir falsos positivos.
- **FR-004**: Vagas em revisão MUST NOT aparecer no mapa nem na lista.
- **FR-005**: Vaga, empresa e conversa MUST ter "Denunciar" com motivo e
  descrição opcional (até 500 caracteres).
- **FR-006**: O sistema MUST evitar denúncia duplicada da mesma pessoa
  para o mesmo alvo.
- **FR-007**: Três denúncias de pessoas diferentes por "pede dinheiro"
  MUST ocultar a vaga preventivamente.
- **FR-008**: O papel Moderação MUST ter fila ordenada por prazo de 24 h e
  gravidade, com ações aprovar, remover, suspender, arquivar e motivo.
- **FR-009**: Selos Verificada/Não verificada/Patrocinado/Publicidade MUST
  aparecer de forma consistente em pergaminho, lista e mapa.
- **FR-010**: O sistema MUST oferecer página "Dicas de segurança".
- **FR-011**: A identidade de quem denuncia MUST NOT ser mostrada à
  empresa.

### Key Entities

- **Regra do filtro**: padrão, tipo (bloqueio/revisão), exceções,
  mensagem.
- **Denúncia**: alvo (vaga, empresa, mensagem), motivo, descrição, autor
  (oculto), status, decisão, prazo.
- **Item de moderação**: origem (filtro ou denúncia), prioridade, prazo,
  decisão, motivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% de um conjunto de 30 textos de golpe de teste são
  bloqueados ou enviados para revisão.
- **SC-002**: No máximo 1 em 30 textos legítimos de teste é bloqueado
  (falso positivo).
- **SC-003**: Denunciar leva menos de 30 segundos.
- **SC-004**: 100% das vagas não verificadas mostram o aviso nos três
  lugares.

## Assumptions

- Lista inicial de termos e padrões definida no plano e revisável.
- "Revisão humana" real depende do backend; aqui é o papel Moderação ou
  simulação.
- Dados conforme decisões transversais em `specs/README.md`.
