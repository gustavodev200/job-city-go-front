# Specs — Job City Go (frontend com dados mock)

Roadmap do frontend dividido em features independentes do spec-kit. Cada
pasta `NNN-slug/` tem `spec.md` + `checklists/requirements.md` e segue o
fluxo `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` →
`/speckit-implement` → `/test` → `/security` → `/review`, **uma feature por
janela de contexto**.

Para trabalhar numa feature, aponte o spec-kit para ela antes do
`/speckit-plan` editando `.specify/feature.json`:

```json
{ "feature_directory": "specs/003-cidade-dinamica" }
```

## Ordem sugerida e dependências

| # | Feature | Depende de | Resumo |
|---|---|---|---|
| 001 | [mapa-brasil](001-mapa-brasil/spec.md) | — | Nível Brasil: país em relevo de blocos por bioma, vagas por estado, escolha de região |
| 002 | [mapa-estado](002-mapa-estado/spec.md) | 001 | Nível Estado: cidades com contagem e categorias, navegação Brasil › Estado › Cidade |
| 003 | [cidade-dinamica](003-cidade-dinamica/spec.md) | 002 | Nível Cidade gerado a partir dos dados de qualquer cidade + Bairro Remoto nacional |
| 004 | [busca-filtros-lista](004-busca-filtros-lista/spec.md) | 001–003 | Filtros, "perto de mim", "posso morar no interior", lista acessível ao lado do mapa |
| 005 | [conta-perfil](005-conta-perfil/spec.md) | — | Entrada simulada, papéis de demonstração, perfil do candidato, idade mínima |
| 006 | [candidatura](006-candidatura/spec.md) | 003, 005 | Perguntas da empresa, envio, acompanhamento de status |
| 007 | [chat-conversa](007-chat-conversa/spec.md) | 006 | Conversa liberada após aceite das duas partes |
| 008 | [moedas-loja](008-moedas-loja/spec.md) | 005 | Moedas virtuais, missões, quizzes, conquistas, loja de itens com preço fixo |
| 009 | [painel-empresa](009-painel-empresa/spec.md) | 005, 006 | Cadastro com CNPJ, publicação de vaga, painel de candidaturas, destaque patrocinado |
| 010 | [outdoors-anunciantes](010-outdoors-anunciantes/spec.md) | 003, 005 | Compra de outdoor por região/período, métricas de exibição |
| 011 | [confianca-moderacao](011-confianca-moderacao/spec.md) | 009 | Filtro de golpes, denúncias, selo de verificação, fila de moderação |

001→003 formam o eixo do mapa em três níveis (decisão central do produto).
005 não depende do mapa e pode ser feita em paralelo.

## Decisões transversais (valem para todas as specs)

Tomadas sem o dono do produto disponível — revisar no `/speckit-clarify`
de cada feature se algo não fizer sentido.

1. **Só frontend, só mock.** Nenhuma feature chama servidor. Dados vêm de
   um conjunto fictício local; ações do usuário (candidatar, publicar,
   comprar item) ficam salvas **no navegador** e sobrevivem a recarregar a
   página. Um botão "Restaurar dados de demonstração" volta tudo ao
   estado inicial.
2. **Respostas de terceiros simuladas.** O que dependeria de outra pessoa
   (empresa visualizar/responder candidatura, moderação revisar denúncia,
   validação de CNPJ) é simulado com atraso curto e resultado
   determinístico, para dar para demonstrar o fluxo inteiro sozinho.
3. **Papéis de demonstração.** Uma pessoa pode alternar entre Candidato,
   Empresa, Anunciante e Moderação (spec 005). Não há senha real; a tela
   deixa claro que é demonstração.
4. **Dados fictícios plausíveis.** Empresas, marcas e pessoas são
   inventadas; cidades, estados e coordenadas são reais (dado geográfico
   público). Nunca usar nome de empresa ou marca real.
5. **Escala do mock.** Os 27 estados com vagas, pelo menos 80 cidades e
   pelo menos 600 vagas no total, com concentração realista (mais em SP,
   MG, RJ, Sul e capitais do Nordeste) mas sem nenhum estado zerado.
   Gerado de forma determinística — mesma semente, mesmos dados.
6. **Identidade visual própria.** O mapa do Brasil se inspira na ideia de
   "país como cidade em blocos" (referência: thegitcity.com/town/brasil-town)
   mas **não** copia a estética dela (fundo preto, quadrados neon,
   tipografia pixel). Aqui o país segue o estilo ilustrado/low-poly da
   cidade que já existe: relevo, biomas coloridos, água, ciclo de dia e
   noite real, luzes que acendem onde há vaga aberta.
7. **Idioma e acessibilidade.** Interface em português do Brasil. Tudo que
   o mapa mostra também está acessível em lista/texto (teclado e leitor
   de tela), e respeita "reduzir movimento".
8. **Celular primeiro.** Toda feature funciona em tela de celular (toque)
   e desktop (teclado + mouse).
9. **Fase 2/3 fora do escopo.** Porto Global, prédio personalizado com
   logo, integração com site de ofertas e cobrança real ficam fora.
   Destaque e outdoor são "comprados" em fluxo simulado, sem pagamento.
10. **Moeda virtual nunca dá vantagem.** Nada comprado com moeda muda
    visibilidade de candidatura ou chance de contratação (regra do produto).
