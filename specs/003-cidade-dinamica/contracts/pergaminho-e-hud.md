# Contrato — O que a pessoa lê na cidade (HUD, construção, pergaminho)

Interface de leitura para quem joga e para leitor de tela. Textos em pt-BR.

## Placa do HUD (FR-010)

| Mundo | Título | Linha 2 |
|---|---|---|
| Cidade | "Anápolis · GO" | "**7** vagas abertas de 9" |
| Remoto | "Bairro Remoto" | "**45** vagas remotas abertas de 50" |

Trilha (002) acima da placa. Botão de portal ao lado: "Bairro Remoto"
(cidade) ou "Voltar para Anápolis" / "Voltar ao mapa" (remoto).

## Legenda (US2-3)

7 categorias, sempre na ordem `ORDEM_CATEGORIAS`, ícone da construção +
rótulo de setor + contagem de vagas **abertas** do mundo atual (0 aparece
esmaecido). No remoto: uma linha "Casa remota" com a contagem.

## Construção

| Situação | Visual |
|---|---|
| Aberta | fachada da categoria com janelas acesas |
| Encerrada | fachada apagada + placa "Encerrada" na frente |
| Híbrida | selo "Híbrido" na fachada (já existe) |
| Patrocinada ativa | marcador flutuante 1,5× com brilho + etiqueta "Patrocinado" |
| Casa decorativa | casa sem luz de vaga, sem marcador, não interage |

## Pergaminho da vaga

Ordem dos blocos (novos em **negrito**):

1. Selo aberta/encerrada, título, empresa.
2. Linha de modalidade:
   - presencial/híbrida: "Presencial em Anápolis · Saúde"
   - híbrida: + "Frequência de presença: 1 dia por semana"
   - remota: "Remoto — **Remoto para GO**" + "**Empresa de Goiás**"
3. **Deslocamento** (presencial/híbrida):
   - perfil em outra cidade: "~25 km · ~35 min de carro" (+ " · presença 1 dia por semana" se híbrida)
   - perfil na mesma cidade: "Na sua cidade"
   - sem perfil: "Informe sua cidade para calcular o deslocamento" (botão abre `EscolherCidade`)
4. **Aviso de abrangência** (remota, perfil fora): "Esta vaga pede residência em GO" / "Esta vaga pede o fuso de Brasília" (`role="note"`).
5. **"Patrocinado"** (se ativo).
6. Descrição, requisitos, benefícios, faixa salarial (sem mudança).
7. Botão: "Candidatar-se" (aberta) · "Vaga encerrada" desabilitado (encerrada, FR-012) · "Candidatura enviada".
