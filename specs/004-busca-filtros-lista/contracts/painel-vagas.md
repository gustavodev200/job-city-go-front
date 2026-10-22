# Contrato — Painel de vagas, filtros e mapa (004)

Contrato de UI: o que cada nível mostra e como se opera por teclado e
leitor de tela. Textos em pt-BR exatamente como abaixo (os testes E2E
procuram por eles).

## Abertura

| Onde | Controle | Rótulo |
|---|---|---|
| Brasil, Estado | botão fixo no HUD | "Vagas (N)" — N = vagas no recorte com filtro |
| Cidade, Bairro Remoto | botão no HUD da cidade | "Vagas (N)" |
| Todos | atalho de teclado | `V` alterna o painel (não dispara com foco em campo de texto) |

O painel começa **fechado** no celular e **aberto** no desktop ≥ 1024 px.

## Layout

- **Desktop**: coluna à direita, `role="complementary"`,
  `aria-label="Vagas"`; o mapa ocupa a largura restante (não é coberto).
- **Celular**: gaveta inferior `role="region"` `aria-label="Vagas"`;
  puxador arrastável + botão `aria-expanded` com o texto "N vagas".
- **Estado (celular)**: uma gaveta com abas `role="tablist"` "Cidades" |
  "Vagas" (a gaveta de cidades da 002 vira a 1ª aba).

## Ordem dos elementos no painel

1. Título `h2`: "Vagas em {recorte}" — "no Brasil", "em Goiás", "em
   Goiânia", "no Bairro Remoto".
2. Busca: `<input type="search">` rotulado "Buscar por cargo ou empresa".
3. Atalho em destaque: botão-alternância `aria-pressed` **"Posso morar no
   interior"** com subtítulo "Remotas e híbridas até 1 dia/semana".
4. "Perto de mim": botão-alternância; ativo mostra "A partir de
   {Cidade – UF}" (trocar) e grupo de rádios "Raio": 10, 25, 50, 100, 200
   km; checkbox "Incluir remotas" (marcado). Sem cidade → `EscolherCidade`.
5. "Mais filtros" (`<details>`): fieldsets Categoria, Modalidade, Faixa
   salarial (dois campos numéricos "Mínimo"/"Máximo" + checkbox "Somente
   com salário informado"), Turno, Tipo de contrato.
6. Barra: "Filtros ativos (N)" + botão "Limpar" (só com N > 0) e
   `<select>` "Ordenar por": Relevância · Mais recentes · Maior salário ·
   Menor distância (esta só com cidade de referência).
7. Região viva (`aria-live="polite"`, `role="status"`): "{N} vagas" /
   "1 vaga" / "Nenhuma vaga com esses filtros".
8. Lista `<ul aria-label="Resultados">`.
9. "Mostrar mais {k}" quando houver mais itens (R10).

## Item da lista

```
<li><article aria-labelledby="vaga-{id}-titulo">
  [Patrocinado]                         ← sempre visível se destaque ativo
  <h3><button id="vaga-{id}-titulo">{titulo}</button></h3>
  {empresa} · {Cidade – UF | Remota: {rotuloAbrangencia}}
  {Categoria} · {Presencial | Híbrida 1x/semana | Remota} · {Contrato} · {Turno}
  {R$ min – R$ max | A combinar}   [{N} km]   ← km só com cidade de referência
  [Encerrada]
  <a>Ver no mapa</a>
</article></li>
```

- Botão do título → vista **detalhe** (`DetalhesVaga`) no próprio painel,
  foco no título do detalhe; "Voltar à lista" devolve o foco ao item.
- `Esc` no detalhe = Voltar; `Esc` na lista = fechar painel (foco volta ao
  botão "Vagas").

## Vazio

```
Nenhuma vaga com esses filtros.
Tirar "{rótulo}" mostra {k} vagas.  [Tirar "{rótulo}"]   [Limpar filtros]
```

## Efeito no mapa (FR-005)

| Nível | Com filtro ativo |
|---|---|
| Brasil | rótulos/lista de estados/`ResumoUf`/modo Calor com contagens filtradas; placa "N vagas abertas no país" filtrada; ilha do Bairro Remoto com contagem filtrada e **realce** quando `interior` ativo; chip "Filtros ativos (N) · Limpar" sobre o mapa |
| Estado | contagens das cidades filtradas; cidade com 0 esmaecida e fora da lista de cidades ("N cidades sem vagas com esses filtros"); anel do raio quando `perto` ativo |
| Cidade / Remoto | prédios de vagas fora do filtro esmaecidos e sem luz; placa/legenda com "N de M vagas no filtro" |

## Selos (`SelosVaga`)

| Selo | Quando |
|---|---|
| Patrocinado | `destaqueAtivo(v)` |
| Híbrida {n}x/semana / Híbrida 1x/mês | `modelo = hibrido` |
| Encerrada | `status = encerrada` |

"Responde rápido" e "Não verificada" entram nas features 006/009 e 011
(research R13).
