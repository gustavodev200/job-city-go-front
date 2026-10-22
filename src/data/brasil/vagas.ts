// Vagas fictícias em escala nacional (dados mock). Determinístico: mesma semente,
// mesma lista. As vagas escritas à mão de data/vagas.ts entram com o mesmo id. É a
// fonte de vagas de todos os níveis (mapa, estado, cidade e Bairro Remoto).
import { criarAleatorio, type Aleatorio } from "@/lib/aleatorio";
import { vagas as vagasCidadeAtual, type Abrangencia, type Categoria, type Status, type Vaga } from "@/data/vagas";
import { cidades } from "./cidades";
import { estados, UFS, type Uf } from "./estados";
import type { Cidade, Porte } from "./tipos";

/** Vaga do mapa nacional: com UF e cidade (a posição na cena vem do mundo gerado). */
export type VagaNacional = Vaga & {
  /** Presencial/híbrida: UF da cidade. Remota: UF de origem da empresa. */
  uf: Uf;
  /** Presencial/híbrida: id da cidade. Remota: null (fica no Bairro Remoto). */
  cidadeId: string | null;
};

const SEMENTE = 2026;
const TOTAL_CIDADE = 620;
const TOTAL_REMOTAS = 40;
const MINIMO_ABERTAS_POR_UF = 5;
const TAXA_ENCERRADAS = 0.15;
const TAXA_HIBRIDAS = 0.2;

const PESO_PORTE: Record<Porte, number> = { capital: 12, grande: 7, media: 4, pequena: 2 };
const UFS_DENSAS: ReadonlySet<Uf> = new Set<Uf>(["SP", "MG", "RJ", "PR", "SC", "RS"]);
const FREQUENCIAS = ["1 dia por semana", "2 dias por semana", "1 vez por mês"];

type Modelo = {
  titulos: string[];
  nomes: string[];
  salario: [number, number];
  requisitos: string[];
  beneficios: string[];
};

// Empresas e marcas inventadas — nunca usar nomes reais.
const MODELOS: Record<Categoria, Modelo> = {
  comercio: {
    titulos: ["Vendedor(a)", "Operador(a) de Caixa", "Repositor(a)", "Atendente de Loja", "Padeiro(a)", "Gerente de Loja"],
    nomes: ["Mercadinho Bom Preço", "Loja Vitrine", "Padaria Trigo Dourado", "Empório da Praça", "Armazém Central", "Calçados Passo Certo"],
    salario: [1600, 3200],
    requisitos: ["Ensino médio completo", "Gosto por atendimento", "Disponibilidade aos sábados", "Experiência com caixa"],
    beneficios: ["Vale-transporte", "Vale-alimentação", "Comissão sobre vendas", "Desconto em produtos"],
  },
  escritorio: {
    titulos: ["Assistente Administrativo", "Recepcionista", "Auxiliar Financeiro", "Analista de RH", "Assistente Comercial"],
    nomes: ["Escritório Prisma", "Grupo Horizonte Serviços", "Contábil Alicerce", "Agência Ponto Alto", "Consultoria Raiz"],
    salario: [1900, 4200],
    requisitos: ["Pacote Office", "Boa comunicação", "Ensino médio completo", "Organização"],
    beneficios: ["Plano de saúde", "Vale-refeição", "Vale-transporte", "Day off no aniversário"],
  },
  saude: {
    titulos: ["Técnico(a) de Enfermagem", "Recepcionista de Clínica", "Atendente de Farmácia", "Auxiliar de Laboratório"],
    nomes: ["Clínica Vida Plena", "Farmácia Bem Estar", "Laboratório Diagnosta", "Policlínica Bom Cuidado"],
    salario: [1800, 3800],
    requisitos: ["Curso técnico na área", "Registro no conselho", "Disponibilidade para escala"],
    beneficios: ["Plano de saúde", "Adicional de insalubridade", "Vale-transporte"],
  },
  galpao: {
    titulos: ["Auxiliar de Logística", "Operador(a) de Empilhadeira", "Conferente", "Separador(a) de Pedidos", "Motorista Entregador"],
    nomes: ["Transportes Rota Certa", "Centro de Distribuição Leva", "Indústria Metalfort", "Logística Via Norte"],
    salario: [1800, 3500],
    requisitos: ["Ensino fundamental completo", "Curso de empilhadeira (para operador)", "CNH (para motorista)"],
    beneficios: ["Vale-transporte", "Refeição no local", "Cesta básica", "Seguro de vida"],
  },
  obra: {
    titulos: ["Pedreiro(a)", "Servente de Obras", "Eletricista", "Mestre de Obras", "Encanador(a)"],
    nomes: ["Construtora Alvenaria Forte", "Obras Pedra Firme", "Engenharia Prumo", "Reformas Bem Feito"],
    salario: [1700, 4500],
    requisitos: ["Experiência comprovada", "NR-18 em dia", "Leitura de projetos (para mestre)"],
    beneficios: ["Vale-transporte", "Café da manhã", "Seguro de vida", "EPI fornecido pela empresa"],
  },
  escola: {
    titulos: ["Professor(a) de Educação Infantil", "Auxiliar de Classe", "Professor(a) de Inglês", "Coordenador(a) Pedagógico(a)"],
    nomes: ["Colégio Saber Mais", "Escola Pequeno Mundo", "Curso de Idiomas Ponte", "Instituto Aprender"],
    salario: [1900, 4800],
    requisitos: ["Licenciatura ou cursando", "Experiência com crianças", "Boa didática"],
    beneficios: ["Bolsa de estudos", "Vale-transporte", "Recesso escolar remunerado"],
  },
  bairro: {
    titulos: ["Auxiliar de Limpeza", "Cabeleireiro(a)", "Mecânico(a)", "Porteiro(a)", "Cozinheiro(a)", "Manicure"],
    nomes: ["Salão Bela Arte", "Oficina Motor Bom", "Restaurante Sabor da Terra", "Condomínio Jardim Fictício", "Lava-Jato Brilho"],
    salario: [1500, 3000],
    requisitos: ["Experiência na função", "Pontualidade", "Referências"],
    beneficios: ["Vale-transporte", "Refeição no local", "Gorjetas"],
  },
};

const CATEGORIAS = Object.keys(MODELOS) as Categoria[];

const REMOTAS: Modelo = {
  titulos: ["Desenvolvedor(a) Front-end", "Analista de Suporte", "Atendente de Chat", "Designer Gráfico", "Analista de Dados", "Redator(a)"],
  nomes: ["Nuvem Azul Software", "Atende Fácil Digital", "Estúdio Pixel Norte", "Dados Claros Tech"],
  salario: [2200, 9000],
  requisitos: ["Computador próprio", "Internet estável", "Boa comunicação escrita"],
  beneficios: ["Auxílio home office", "Plano de saúde", "Horário flexível"],
};

function sortearVaga(a: Aleatorio, modelo: Modelo, cidade: string) {
  const titulo = a.escolher(modelo.titulos);
  const empresa = a.escolher(modelo.nomes);
  const [piso, teto] = modelo.salario;
  const min = Math.round((piso + a.proximo() * (teto - piso) * 0.6) / 100) * 100;
  const max = Math.round((min * (1.2 + a.proximo() * 0.4)) / 100) * 100;
  const status: Status = a.proximo() < TAXA_ENCERRADAS ? "encerrada" : "aberta";
  return {
    titulo,
    empresa,
    descricao: `${empresa} procura ${titulo.toLowerCase()} para a equipe de ${cidade}. Dados fictícios de demonstração.`,
    requisitos: [a.escolher(modelo.requisitos), a.escolher(modelo.requisitos)].filter((r, i, l) => l.indexOf(r) === i),
    beneficios: [a.escolher(modelo.beneficios), a.escolher(modelo.beneficios)].filter((b, i, l) => l.indexOf(b) === i),
    faixaSalarial: { min, max },
    status,
  };
}

function pesoCidade(c: Cidade) {
  const denso = UFS_DENSAS.has(c.uf) || (c.capital && estados[c.uf].regiao === "Nordeste");
  return PESO_PORTE[c.porte] * (denso ? 1.5 : 1);
}

function converterCidadeAtual(): VagaNacional[] {
  return vagasCidadeAtual.map((v) => {
    const resto = v;
    if (resto.modelo === "remoto") return { ...resto, uf: "GO", cidadeId: null };
    const cidade = cidades.find((c) => c.uf === "GO" && c.nome === resto.cidade);
    if (!cidade) throw new Error(`Cidade sem cadastro: ${resto.cidade}`);
    return { ...resto, uf: "GO", cidadeId: cidade.id };
  });
}

export function gerarVagasBrasil(semente = SEMENTE): VagaNacional[] {
  const a = criarAleatorio(semente);
  const lista = converterCidadeAtual();
  let n = 0;
  const novoId = () => `vn-${String(++n).padStart(4, "0")}`;

  const criarNaCidade = (cidade: Cidade, forcarAberta = false): VagaNacional => {
    const categoria = a.escolher(CATEGORIAS);
    const base = sortearVaga(a, MODELOS[categoria], cidade.nome);
    if (forcarAberta) base.status = "aberta";
    const comum = { id: novoId(), ...base, categoria, cidade: cidade.nome, uf: cidade.uf, cidadeId: cidade.id };
    return a.proximo() < TAXA_HIBRIDAS
      ? { ...comum, modelo: "hibrido", frequencia: a.escolher(FREQUENCIAS) }
      : { ...comum, modelo: "presencial" };
  };

  const pesoTotal = cidades.reduce((s, c) => s + pesoCidade(c), 0);
  for (const cidade of cidades) {
    const quantidade = Math.max(1, Math.round((pesoCidade(cidade) / pesoTotal) * TOTAL_CIDADE));
    for (let i = 0; i < quantidade; i++) lista.push(criarNaCidade(cidade));
  }

  // Nenhum estado com menos de 5 vagas abertas: completa na maior cidade da UF.
  for (const uf of UFS) {
    const abertas = lista.filter((v) => v.uf === uf && v.cidadeId && v.status === "aberta").length;
    const destino = cidades.filter((c) => c.uf === uf).sort((x, y) => pesoCidade(y) - pesoCidade(x))[0];
    for (let i = abertas; i < MINIMO_ABERTAS_POR_UF; i++) lista.push(criarNaCidade(destino, true));
  }

  for (let i = 0; i < TOTAL_REMOTAS; i++) {
    const origem = a.escolher(cidades);
    const abrangencia = a.escolher<Abrangencia>([
      { tipo: "brasil" },
      { tipo: "ufs", ufs: [origem.uf] },
      { tipo: "fuso", fuso: "brasilia" },
    ]);
    lista.push({
      id: novoId(),
      ...sortearVaga(a, REMOTAS, origem.nome),
      modelo: "remoto",
      abrangencia,
      uf: origem.uf,
      cidadeId: null,
    });
  }

  // Uma remota patrocinada para demonstrar o destaque (a spec 009 cria os de verdade).
  const patrocinada = lista.find((v) => v.modelo === "remoto" && v.status === "aberta" && v.id.startsWith("vn-"));
  if (patrocinada) patrocinada.destaque = { ate: "2099-12-31" };
  return lista;
}

export const vagasBrasil = gerarVagasBrasil();
