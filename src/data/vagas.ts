import type { Uf } from "./brasil/estados";

// Fachada usada na cidade — cada categoria tem um prédio próprio (ver components/city/facades.ts).
export type Categoria =
  | "comercio"
  | "escritorio"
  | "saude"
  | "galpao"
  | "obra"
  | "escola"
  | "bairro";

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  comercio: "Comércio",
  escritorio: "Escritório",
  saude: "Saúde",
  galpao: "Logística e indústria",
  obra: "Construção",
  escola: "Educação",
  bairro: "Serviços gerais",
};

/** Ordem fixa de exibição das categorias (barras, legendas, prévia). */
export const ORDEM_CATEGORIAS: readonly Categoria[] = [
  "comercio",
  "escritorio",
  "saude",
  "galpao",
  "obra",
  "escola",
  "bairro",
];

export type Modelo = "presencial" | "hibrido" | "remoto";

export type Status = "aberta" | "encerrada";

export type Turno = "manha" | "tarde" | "noite" | "integral" | "escala";

export const TURNO_LABEL: Record<Turno, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  integral: "Integral",
  escala: "Escala",
};

export const ORDEM_TURNOS: readonly Turno[] = ["manha", "tarde", "noite", "integral", "escala"];

export type Contrato = "clt" | "estagio" | "aprendiz" | "pj" | "temporario";

export const CONTRATO_LABEL: Record<Contrato, string> = {
  clt: "CLT",
  estagio: "Estágio",
  aprendiz: "Aprendiz",
  pj: "PJ",
  temporario: "Temporário",
};

export const ORDEM_CONTRATOS: readonly Contrato[] = ["clt", "estagio", "aprendiz", "pj", "temporario"];

export const MODELO_LABEL: Record<Modelo, string> = { presencial: "Presencial", hibrido: "Híbrida", remoto: "Remota" };

export const ORDEM_MODELOS: readonly Modelo[] = ["presencial", "hibrido", "remoto"];

/** "Hoje" do mock: datas de publicação são relativas a ela, nunca ao relógio (determinismo). */
export const REFERENCIA_MOCK = "2026-10-01";

type VagaBase = {
  id: string;
  titulo: string;
  empresa: string;
  /** Texto de "Sobre a vaga". */
  descricao: string;
  requisitos: string[];
  beneficios: string[];
  /** Ausente = "A combinar". */
  faixaSalarial?: { min: number; max: number };
  status: Status;
  turno: Turno;
  contrato: Contrato;
  /** AAAA-MM-DD. */
  publicadaEm: string;
  /** Destaque patrocinado (spec 009): ativo até a data (AAAA-MM-DD, inclusive). */
  destaque?: { ate: string };
};

export type VagaPresencial = VagaBase & {
  modelo: "presencial";
  categoria: Categoria;
  cidade: string;
};

export type VagaHibrida = VagaBase & {
  modelo: "hibrido";
  categoria: Categoria;
  cidade: string;
  /** Presença exigida, ex.: "1 dia por semana na cidade". */
  frequencia: string;
  /** Presença em dias por semana (1 vez por mês = 0,25) — usado por "Posso morar no interior". */
  diasPorSemana: number;
};

/** De onde a pessoa pode trabalhar numa vaga remota. */
export type Abrangencia = { tipo: "brasil" } | { tipo: "ufs"; ufs: Uf[] } | { tipo: "fuso"; fuso: "brasilia" };

export type VagaRemota = VagaBase & {
  modelo: "remoto";
  abrangencia: Abrangencia;
};

/** Vagas que ficam na cidade (presenciais e híbridas). */
export type VagaCidade = VagaPresencial | VagaHibrida;

export type Vaga = VagaCidade | VagaRemota;

// Dados fictícios — substituir pela API (NEXT_PUBLIC_API_URL) quando o backend existir.
// A posição na cena vem do mundo gerado (src/lib/cidade/mundo.ts), não daqui.
export const vagas: Vaga[] = [
  // ── Cidade ────────────────────────────────────────────────────────────
  {
    id: "vg-001",
    titulo: "Professor(a) de Matemática",
    empresa: "Colégio Horizonte",
    descricao:
      "Dar aulas de Matemática para turmas do 6º ao 9º ano, preparar avaliações e acompanhar o desenvolvimento de cada aluno junto à coordenação.",
    requisitos: ["Licenciatura em Matemática", "Experiência com Ensino Fundamental II", "Boa comunicação com famílias"],
    beneficios: ["Vale-alimentação", "Plano de saúde", "Bolsa de estudos para filhos"],
    modelo: "presencial",
    categoria: "escola",
    cidade: "Goiânia",
    faixaSalarial: { min: 3500, max: 4800 },
    status: "aberta",
    turno: "manha",
    contrato: "clt",
    publicadaEm: "2026-09-28",
    destaque: { ate: "2099-12-31" },
  },
  {
    id: "vg-002",
    titulo: "Vendedor(a) Interno",
    empresa: "Loja Esquina",
    descricao:
      "Atender clientes no salão, organizar vitrines e manter o estoque da loja sempre abastecido e bem apresentado.",
    requisitos: ["Ensino médio completo", "Gosto por atendimento", "Disponibilidade aos sábados"],
    beneficios: ["Comissão sobre vendas", "Vale-transporte", "Desconto em produtos"],
    modelo: "presencial",
    categoria: "comercio",
    cidade: "Goiânia",
    faixaSalarial: { min: 2000, max: 3200 },
    status: "aberta",
    turno: "tarde",
    contrato: "clt",
    publicadaEm: "2026-09-25",
  },
  {
    id: "vg-003",
    titulo: "Mestre de Obras",
    empresa: "Construtora Alicerce",
    descricao:
      "Coordenar equipes de pedreiros e serventes, garantir o cronograma da obra e zelar pelas normas de segurança no canteiro.",
    requisitos: ["Experiência como mestre de obras", "Leitura de projetos", "NR-18 em dia"],
    beneficios: ["Plano de saúde", "Participação nos lucros", "Seguro de vida"],
    modelo: "presencial",
    categoria: "obra",
    cidade: "Aparecida de Goiânia",
    faixaSalarial: { min: 4500, max: 6500 },
    status: "aberta",
    turno: "integral",
    contrato: "clt",
    publicadaEm: "2026-09-20",
  },
  {
    id: "vg-004",
    titulo: "Operador(a) de Empilhadeira",
    empresa: "Logística Cerrado",
    descricao:
      "Operar empilhadeira na movimentação de cargas, organizar paletes e apoiar o carregamento de caminhões no centro de distribuição.",
    requisitos: ["Curso de operador de empilhadeira", "Experiência em logística", "Disponibilidade de turno"],
    beneficios: ["Adicional noturno", "Refeitório no local", "Vale-transporte"],
    modelo: "presencial",
    categoria: "galpao",
    cidade: "Anápolis",
    faixaSalarial: { min: 2600, max: 3300 },
    status: "aberta",
    turno: "noite",
    contrato: "clt",
    publicadaEm: "2026-09-30",
  },
  {
    id: "vg-005",
    titulo: "Atendente de Lavanderia",
    empresa: "Lavanderia Bolha",
    descricao:
      "Receber e entregar peças, operar máquinas de lavar e secar e cuidar do atendimento no balcão da lavanderia.",
    requisitos: ["Ensino médio completo", "Organização", "Simpatia no atendimento"],
    beneficios: ["Vale-transporte", "Folga aos domingos", "Uniforme fornecido"],
    modelo: "presencial",
    categoria: "bairro",
    cidade: "Goiânia",
    status: "aberta",
    turno: "tarde",
    contrato: "temporario",
    publicadaEm: "2026-09-15",
  },
  {
    id: "vg-006",
    titulo: "Recepcionista de Clínica",
    empresa: "Clínica Bem-Estar",
    descricao:
      "Recepcionar pacientes, agendar consultas e organizar prontuários da clínica.",
    requisitos: ["Ensino médio completo", "Experiência em recepção", "Conhecimento em agenda digital"],
    beneficios: ["Plano de saúde", "Vale-refeição", "Horário comercial"],
    modelo: "presencial",
    categoria: "saude",
    cidade: "Goiânia",
    faixaSalarial: { min: 1900, max: 2400 },
    status: "encerrada",
    turno: "manha",
    contrato: "clt",
    publicadaEm: "2026-08-10",
  },
  {
    id: "vg-007",
    titulo: "Analista de RH",
    empresa: "Grupo Ipê",
    descricao:
      "Conduzir processos seletivos, apoiar a integração de novos colaboradores e acompanhar indicadores de clima e retenção.",
    requisitos: ["Graduação em Psicologia, Administração ou RH", "Experiência com recrutamento", "Excel intermediário"],
    beneficios: ["Plano de saúde e odontológico", "Vale-refeição", "Auxílio home office"],
    modelo: "hibrido",
    categoria: "escritorio",
    cidade: "Goiânia",
    frequencia: "2 dias por semana no escritório",
    diasPorSemana: 2,
    faixaSalarial: { min: 4200, max: 5800 },
    status: "aberta",
    turno: "integral",
    contrato: "clt",
    publicadaEm: "2026-09-22",
  },
  {
    id: "vg-008",
    titulo: "Gerente de Loja",
    empresa: "Mercadinho da Raposinha",
    descricao:
      "Liderar a equipe da loja, cuidar das metas de vendas, do estoque e da experiência dos clientes do Mercadinho.",
    requisitos: ["Experiência com gestão de varejo", "Liderança de equipe", "Conhecimento de indicadores de venda"],
    beneficios: ["Bônus por metas", "Plano de saúde", "Desconto nas compras"],
    modelo: "hibrido",
    categoria: "comercio",
    cidade: "Goiânia",
    frequencia: "3 dias por semana na loja",
    diasPorSemana: 3,
    faixaSalarial: { min: 4000, max: 5500 },
    status: "aberta",
    turno: "integral",
    contrato: "clt",
    publicadaEm: "2026-09-05",
  },
  {
    id: "vg-009",
    titulo: "Assistente Administrativo(a)",
    empresa: "Contábil Araguaia",
    descricao:
      "Apoiar a rotina administrativa do escritório contábil: lançamentos, arquivo de documentos e atendimento a clientes.",
    requisitos: ["Ensino médio completo", "Pacote Office", "Organização"],
    beneficios: ["Vale-refeição", "Vale-transporte", "Curso de capacitação"],
    modelo: "presencial",
    categoria: "escritorio",
    cidade: "Goiânia",
    faixaSalarial: { min: 2200, max: 2900 },
    status: "aberta",
    turno: "integral",
    contrato: "clt",
    publicadaEm: "2026-09-18",
  },
  {
    id: "vg-010",
    titulo: "Auxiliar de Estoque",
    empresa: "Distribuidora Pequi",
    descricao:
      "Conferir mercadorias, organizar o estoque e separar pedidos para expedição.",
    requisitos: ["Ensino fundamental completo", "Agilidade", "Disponibilidade de horário"],
    beneficios: ["Vale-transporte", "Cesta básica", "Refeitório no local"],
    modelo: "presencial",
    categoria: "galpao",
    cidade: "Anápolis",
    faixaSalarial: { min: 1900, max: 2300 },
    status: "encerrada",
    turno: "manha",
    contrato: "temporario",
    publicadaEm: "2026-08-12",
  },
  {
    id: "vg-011",
    titulo: "Coordenador(a) Pedagógico",
    empresa: "Instituto Aprender",
    descricao:
      "Coordenar o planejamento pedagógico, apoiar professores e acompanhar a aprendizagem dos alunos da escola.",
    requisitos: ["Graduação em Pedagogia", "Experiência em coordenação", "Pós-graduação na área (desejável)"],
    beneficios: ["Plano de saúde", "Auxílio home office", "Bolsa de estudos"],
    modelo: "hibrido",
    categoria: "escola",
    cidade: "Goiânia",
    frequencia: "1 dia por semana na escola",
    diasPorSemana: 1,
    faixaSalarial: { min: 5000, max: 6500 },
    status: "aberta",
    turno: "manha",
    contrato: "clt",
    publicadaEm: "2026-09-26",
  },
  {
    id: "vg-012",
    titulo: "Técnico(a) de Enfermagem",
    empresa: "Clínica Vila Verde",
    descricao:
      "Prestar cuidados de enfermagem aos pacientes, administrar medicamentos e apoiar a equipe médica nos atendimentos.",
    requisitos: ["Curso técnico em Enfermagem", "Registro ativo no COREN", "Disponibilidade para escala 12x36"],
    beneficios: ["Adicional de insalubridade", "Plano de saúde", "Vale-alimentação"],
    modelo: "presencial",
    categoria: "saude",
    cidade: "Aparecida de Goiânia",
    faixaSalarial: { min: 2800, max: 3500 },
    status: "aberta",
    turno: "escala",
    contrato: "clt",
    publicadaEm: "2026-09-29",
  },
  {
    id: "vg-013",
    titulo: "Desenvolvedor(a) Front-end",
    empresa: "Pixel Norte",
    descricao:
      "Desenvolver interfaces web acessíveis e rápidas em React, colaborando com design e back-end em um time ágil.",
    requisitos: ["Experiência com React e TypeScript", "Noções de acessibilidade", "Git e code review"],
    beneficios: ["Plano de saúde", "Auxílio home office", "Verba para cursos"],
    modelo: "hibrido",
    categoria: "escritorio",
    cidade: "Goiânia",
    frequencia: "2 dias por semana no escritório",
    diasPorSemana: 2,
    faixaSalarial: { min: 6000, max: 9000 },
    status: "aberta",
    turno: "integral",
    contrato: "pj",
    publicadaEm: "2026-09-27",
  },
  {
    id: "vg-014",
    titulo: "Barbeiro(a)",
    empresa: "Barbearia do Bairro",
    descricao:
      "Realizar cortes de cabelo e barba, cuidar do atendimento e da organização da barbearia.",
    requisitos: ["Experiência como barbeiro(a)", "Portfólio de cortes", "Pontualidade"],
    beneficios: ["Comissão por atendimento", "Horário flexível", "Produtos fornecidos"],
    modelo: "presencial",
    categoria: "bairro",
    cidade: "Goiânia",
    status: "aberta",
    turno: "tarde",
    contrato: "pj",
    publicadaEm: "2026-09-07",
  },
  {
    id: "vg-015",
    titulo: "Pedreiro(a)",
    empresa: "Construtora Alicerce",
    descricao:
      "Executar alvenaria, reboco e assentamento de pisos seguindo o projeto e as orientações do mestre de obras.",
    requisitos: ["Experiência como pedreiro(a)", "Uso correto de EPIs", "Trabalho em equipe"],
    beneficios: ["Cesta básica", "Vale-transporte", "Seguro de vida"],
    modelo: "presencial",
    categoria: "obra",
    cidade: "Aparecida de Goiânia",
    faixaSalarial: { min: 2500, max: 3200 },
    status: "aberta",
    turno: "integral",
    contrato: "temporario",
    publicadaEm: "2026-09-12",
  },
  {
    id: "vg-016",
    titulo: "Analista de Logística",
    empresa: "Logística Cerrado",
    descricao:
      "Planejar rotas, acompanhar indicadores de entrega e otimizar a operação logística do centro de distribuição.",
    requisitos: ["Graduação em Logística ou Engenharia", "Excel avançado", "Experiência com transporte"],
    beneficios: ["Plano de saúde", "Participação nos lucros", "Auxílio home office"],
    modelo: "hibrido",
    categoria: "galpao",
    cidade: "Anápolis",
    frequencia: "1 dia por semana no galpão",
    diasPorSemana: 1,
    faixaSalarial: { min: 3800, max: 5000 },
    status: "aberta",
    turno: "integral",
    contrato: "clt",
    publicadaEm: "2026-09-24",
  },
  {
    id: "vg-017",
    titulo: "Padeiro(a)",
    empresa: "Padaria Trigo Bom",
    descricao:
      "Preparar pães, bolos e salgados, controlar a produção diária e manter a higiene da cozinha.",
    requisitos: ["Experiência em panificação", "Curso de manipulação de alimentos", "Disponibilidade de madrugada"],
    beneficios: ["Adicional noturno", "Café da manhã no local", "Vale-transporte"],
    modelo: "presencial",
    categoria: "comercio",
    cidade: "Goiânia",
    faixaSalarial: { min: 2100, max: 2700 },
    status: "aberta",
    turno: "noite",
    contrato: "clt",
    publicadaEm: "2026-09-21",
  },
  {
    id: "vg-018",
    titulo: "Recepcionista",
    empresa: "Grupo Ipê",
    descricao:
      "Recepcionar visitantes, atender telefonemas e organizar a agenda de salas do edifício.",
    requisitos: ["Ensino médio completo", "Boa comunicação", "Pacote Office"],
    beneficios: ["Vale-refeição", "Vale-transporte", "Plano de saúde"],
    modelo: "presencial",
    categoria: "escritorio",
    cidade: "Goiânia",
    faixaSalarial: { min: 1900, max: 2300 },
    status: "encerrada",
    turno: "manha",
    contrato: "clt",
    publicadaEm: "2026-08-05",
  },
  {
    id: "vg-019",
    titulo: "Nutricionista",
    empresa: "Clínica Bem-Estar",
    descricao:
      "Realizar consultas nutricionais, montar planos alimentares e apoiar programas de saúde da clínica.",
    requisitos: ["Graduação em Nutrição", "Registro no CRN", "Experiência clínica"],
    beneficios: ["Plano de saúde", "Auxílio home office", "Agenda flexível"],
    modelo: "hibrido",
    categoria: "saude",
    cidade: "Goiânia",
    frequencia: "2 dias por semana na clínica",
    diasPorSemana: 2,
    faixaSalarial: { min: 3800, max: 5200 },
    status: "aberta",
    turno: "tarde",
    contrato: "clt",
    publicadaEm: "2026-09-17",
  },
  {
    id: "vg-020",
    titulo: "Auxiliar de Sala",
    empresa: "Escola Pequeno Saber",
    descricao:
      "Apoiar a professora regente nas atividades da turma, cuidar da rotina e do bem-estar das crianças.",
    requisitos: ["Cursando Pedagogia", "Gosto por trabalhar com crianças", "Paciência"],
    beneficios: ["Bolsa-auxílio", "Vale-transporte", "Recesso escolar"],
    modelo: "presencial",
    categoria: "escola",
    cidade: "Trindade",
    faixaSalarial: { min: 1800, max: 2200 },
    status: "aberta",
    turno: "manha",
    contrato: "estagio",
    publicadaEm: "2026-09-23",
  },
  {
    id: "vg-021",
    titulo: "Engenheiro(a) Civil",
    empresa: "Construtora Alicerce",
    descricao:
      "Gerenciar obras residenciais, acompanhar orçamentos e garantir qualidade e prazos junto às equipes de campo.",
    requisitos: ["Graduação em Engenharia Civil", "Registro no CREA", "Experiência com gestão de obras"],
    beneficios: ["Plano de saúde", "Carro da empresa", "Participação nos lucros"],
    modelo: "hibrido",
    categoria: "obra",
    cidade: "Aparecida de Goiânia",
    frequencia: "3 dias por semana no canteiro",
    diasPorSemana: 3,
    faixaSalarial: { min: 8000, max: 12000 },
    status: "aberta",
    turno: "integral",
    contrato: "clt",
    publicadaEm: "2026-09-10",
  },
  {
    id: "vg-022",
    titulo: "Supervisor(a) de Franquia",
    empresa: "Lavanderia Bolha",
    descricao:
      "Acompanhar o desempenho das unidades franqueadas, treinar equipes e padronizar processos de atendimento.",
    requisitos: ["Experiência com franquias ou varejo", "CNH categoria B", "Liderança"],
    beneficios: ["Ajuda de custo", "Plano de saúde", "Bônus por resultados"],
    modelo: "hibrido",
    categoria: "bairro",
    cidade: "Goiânia",
    frequencia: "1 dia por semana na loja",
    diasPorSemana: 1,
    faixaSalarial: { min: 3500, max: 4500 },
    status: "encerrada",
    turno: "integral",
    contrato: "clt",
    publicadaEm: "2026-08-20",
  },
  {
    id: "vg-023",
    titulo: "Operador(a) de Caixa",
    empresa: "Mercadinho da Raposinha",
    descricao:
      "Registrar compras no caixa, receber pagamentos e garantir um atendimento ágil e cordial.",
    requisitos: ["Ensino médio completo", "Agilidade com números", "Disponibilidade aos fins de semana"],
    beneficios: ["Vale-transporte", "Desconto nas compras", "Cesta básica"],
    modelo: "presencial",
    categoria: "comercio",
    cidade: "Goiânia",
    faixaSalarial: { min: 1700, max: 2100 },
    status: "aberta",
    turno: "escala",
    contrato: "clt",
    publicadaEm: "2026-09-06",
  },
  {
    id: "vg-024",
    titulo: "Professor(a) de Inglês",
    empresa: "Colégio Horizonte",
    descricao:
      "Ensinar inglês para turmas do Fundamental e Médio com aulas dinâmicas e foco em conversação.",
    requisitos: ["Licenciatura em Letras/Inglês", "Inglês fluente", "Experiência em sala de aula"],
    beneficios: ["Plano de saúde", "Bolsa de estudos", "Vale-alimentação"],
    modelo: "presencial",
    categoria: "escola",
    cidade: "Goiânia",
    faixaSalarial: { min: 3200, max: 4200 },
    status: "aberta",
    turno: "tarde",
    contrato: "clt",
    publicadaEm: "2026-09-14",
  },
  {
    id: "vg-025",
    titulo: "Analista Financeiro(a)",
    empresa: "Contábil Araguaia",
    descricao:
      "Elaborar relatórios financeiros, acompanhar fluxo de caixa e apoiar o planejamento orçamentário de clientes.",
    requisitos: ["Graduação em Contabilidade, Economia ou Administração", "Excel avançado", "Experiência em finanças"],
    beneficios: ["Plano de saúde", "Auxílio home office", "Participação nos lucros"],
    modelo: "hibrido",
    categoria: "escritorio",
    cidade: "Goiânia",
    frequencia: "3 dias por semana no escritório",
    diasPorSemana: 3,
    faixaSalarial: { min: 5000, max: 7000 },
    status: "aberta",
    turno: "integral",
    contrato: "clt",
    publicadaEm: "2026-09-08",
  },
  {
    id: "vg-026",
    titulo: "Farmacêutico(a)",
    empresa: "Drogaria Cerrado",
    descricao:
      "Dispensar medicamentos, orientar clientes sobre o uso correto e responder tecnicamente pela drogaria.",
    requisitos: ["Graduação em Farmácia", "Registro no CRF", "Disponibilidade de escala"],
    beneficios: ["Plano de saúde", "Comissão", "Desconto em medicamentos"],
    modelo: "presencial",
    categoria: "saude",
    cidade: "Senador Canedo",
    faixaSalarial: { min: 4200, max: 5200 },
    status: "aberta",
    turno: "noite",
    contrato: "clt",
    publicadaEm: "2026-09-30",
  },
  {
    id: "vg-027",
    titulo: "Motorista de Entrega",
    empresa: "Distribuidora Pequi",
    descricao:
      "Realizar entregas na região metropolitana, conferir mercadorias e cuidar do veículo da empresa.",
    requisitos: ["CNH categoria C", "Experiência com entregas", "Conhecimento da região"],
    beneficios: ["Vale-refeição", "Seguro de vida", "Ajuda de custo"],
    modelo: "presencial",
    categoria: "galpao",
    cidade: "Anápolis",
    faixaSalarial: { min: 2500, max: 3100 },
    status: "aberta",
    turno: "manha",
    contrato: "clt",
    publicadaEm: "2026-09-19",
  },
  {
    id: "vg-028",
    titulo: "Costureiro(a)",
    empresa: "Ateliê da Vila",
    descricao:
      "Confeccionar e ajustar peças de roupa sob medida, atendendo clientes do ateliê.",
    requisitos: ["Experiência com costura", "Máquina reta e overloque", "Capricho nos acabamentos"],
    beneficios: ["Horário flexível", "Vale-transporte", "Comissão por peça"],
    modelo: "presencial",
    categoria: "bairro",
    cidade: "Goiânia",
    status: "aberta",
    turno: "tarde",
    contrato: "pj",
    publicadaEm: "2026-09-11",
  },
  {
    id: "vg-029",
    titulo: "Eletricista",
    empresa: "Instala Fácil",
    descricao:
      "Executar instalações elétricas residenciais e comerciais, seguindo normas técnicas e de segurança.",
    requisitos: ["Curso técnico em Eletrotécnica", "NR-10 em dia", "Experiência em obras"],
    beneficios: ["Seguro de vida", "Vale-transporte", "Ferramentas fornecidas"],
    modelo: "presencial",
    categoria: "obra",
    cidade: "Goiânia",
    faixaSalarial: { min: 2800, max: 3600 },
    status: "encerrada",
    turno: "integral",
    contrato: "temporario",
    publicadaEm: "2026-08-15",
  },
  {
    id: "vg-030",
    titulo: "Designer Gráfico(a)",
    empresa: "Agência Ipê",
    descricao:
      "Criar peças visuais para campanhas, redes sociais e identidades de marca dos clientes da agência.",
    requisitos: ["Portfólio", "Domínio de Figma ou Adobe", "Noções de tipografia"],
    beneficios: ["Plano de saúde", "Auxílio home office", "Day off no aniversário"],
    modelo: "hibrido",
    categoria: "escritorio",
    cidade: "Goiânia",
    frequencia: "2 dias por semana na agência",
    diasPorSemana: 2,
    faixaSalarial: { min: 3500, max: 5000 },
    status: "aberta",
    turno: "integral",
    contrato: "pj",
    publicadaEm: "2026-09-16",
  },

  // ── Vila remota ───────────────────────────────────────────────────────
  {
    id: "vg-031",
    titulo: "Engenheiro(a) de Software Back-end",
    empresa: "Rota Cloud",
    descricao:
      "Projetar e manter APIs escaláveis, cuidar de bancos de dados e da observabilidade dos serviços em nuvem.",
    requisitos: ["Experiência com Node.js ou Go", "Bancos relacionais", "Cloud (AWS ou GCP)"],
    beneficios: ["Plano de saúde", "Auxílio home office", "Horário flexível"],
    modelo: "remoto",
    abrangencia: { tipo: "brasil" },
    faixaSalarial: { min: 9000, max: 14000 },
    status: "encerrada",
    turno: "integral",
    contrato: "pj",
    publicadaEm: "2026-08-04",
  },
  {
    id: "vg-032",
    titulo: "Analista de Dados",
    empresa: "Quadra Dados",
    descricao:
      "Transformar dados em análises e dashboards que apoiem decisões de produto e negócio.",
    requisitos: ["SQL avançado", "Python ou R", "Ferramentas de BI"],
    beneficios: ["Plano de saúde", "Auxílio home office", "Verba para cursos"],
    modelo: "remoto",
    abrangencia: { tipo: "brasil" },
    faixaSalarial: { min: 7000, max: 11000 },
    status: "aberta",
    turno: "integral",
    contrato: "clt",
    publicadaEm: "2026-09-27",
  },
  {
    id: "vg-033",
    titulo: "Suporte Técnico N1",
    empresa: "Help Cerrado",
    descricao:
      "Atender chamados de clientes por chat e telefone, resolver problemas de primeiro nível e documentar soluções.",
    requisitos: ["Ensino médio completo", "Noções de informática", "Boa escrita"],
    beneficios: ["Auxílio internet", "Plano de saúde", "Equipamento fornecido"],
    modelo: "remoto",
    abrangencia: { tipo: "ufs", ufs: ["GO"] },
    faixaSalarial: { min: 2200, max: 2800 },
    status: "aberta",
    turno: "manha",
    contrato: "clt",
    publicadaEm: "2026-09-20",
  },
  {
    id: "vg-034",
    titulo: "Redator(a) de Conteúdo",
    empresa: "Palavra Viva",
    descricao:
      "Escrever artigos, roteiros e posts otimizados para buscas, mantendo a voz das marcas clientes.",
    requisitos: ["Excelente escrita", "Noções de SEO", "Portfólio de textos"],
    beneficios: ["Horário flexível", "Auxílio home office", "Day off no aniversário"],
    modelo: "remoto",
    abrangencia: { tipo: "brasil" },
    status: "aberta",
    turno: "tarde",
    contrato: "pj",
    publicadaEm: "2026-09-13",
  },
  {
    id: "vg-035",
    titulo: "Atendimento ao Cliente",
    empresa: "Conecta Goiás",
    descricao:
      "Atender clientes por canais digitais, registrar solicitações e garantir uma experiência acolhedora.",
    requisitos: ["Ensino médio completo", "Boa comunicação", "Internet estável"],
    beneficios: ["Auxílio internet", "Vale-alimentação", "Equipamento fornecido"],
    modelo: "remoto",
    abrangencia: { tipo: "ufs", ufs: ["GO"] },
    faixaSalarial: { min: 1800, max: 2300 },
    status: "aberta",
    turno: "tarde",
    contrato: "clt",
    publicadaEm: "2026-09-25",
  },
  {
    id: "vg-036",
    titulo: "Designer UX/UI",
    empresa: "Pixel Norte",
    descricao:
      "Pesquisar, prototipar e testar experiências digitais com foco em usabilidade e acessibilidade.",
    requisitos: ["Portfólio de UX/UI", "Figma", "Experiência com pesquisa com usuários"],
    beneficios: ["Plano de saúde", "Auxílio home office", "Verba para cursos"],
    modelo: "remoto",
    abrangencia: { tipo: "brasil" },
    faixaSalarial: { min: 6000, max: 9500 },
    status: "aberta",
    turno: "integral",
    contrato: "pj",
    publicadaEm: "2026-09-29",
  },
  {
    id: "vg-037",
    titulo: "Tutor(a) EAD",
    empresa: "Instituto Aprender",
    descricao:
      "Tirar dúvidas de alunos em cursos online, corrigir atividades e acompanhar o engajamento das turmas.",
    requisitos: ["Graduação na área do curso", "Familiaridade com plataformas EAD", "Boa escrita"],
    beneficios: ["Horário flexível", "Auxílio internet", "Bolsa de estudos"],
    modelo: "remoto",
    abrangencia: { tipo: "ufs", ufs: ["GO"] },
    faixaSalarial: { min: 2500, max: 3200 },
    status: "encerrada",
    turno: "manha",
    contrato: "temporario",
    publicadaEm: "2026-08-18",
  },
  {
    id: "vg-038",
    titulo: "Desenvolvedor(a) Mobile",
    empresa: "Rota Cloud",
    descricao:
      "Desenvolver aplicativos móveis com foco em desempenho, publicando nas lojas e cuidando da qualidade do código.",
    requisitos: ["React Native ou Flutter", "Publicação em lojas de apps", "Testes automatizados"],
    beneficios: ["Plano de saúde", "Auxílio home office", "Horário flexível"],
    modelo: "remoto",
    abrangencia: { tipo: "brasil" },
    faixaSalarial: { min: 7500, max: 12000 },
    status: "aberta",
    turno: "integral",
    contrato: "clt",
    publicadaEm: "2026-09-22",
  },
  {
    id: "vg-039",
    titulo: "Analista de Marketing Digital",
    empresa: "Agência Ipê",
    descricao:
      "Planejar e otimizar campanhas pagas, analisar métricas e propor estratégias de crescimento para clientes.",
    requisitos: ["Experiência com Google e Meta Ads", "Google Analytics", "Análise de dados"],
    beneficios: ["Bônus por resultados", "Auxílio home office", "Verba para cursos"],
    modelo: "remoto",
    abrangencia: { tipo: "ufs", ufs: ["GO"] },
    faixaSalarial: { min: 3500, max: 5000 },
    status: "aberta",
    turno: "integral",
    contrato: "pj",
    publicadaEm: "2026-09-09",
  },
  {
    id: "vg-040",
    titulo: "Contador(a)",
    empresa: "Contábil Araguaia",
    descricao:
      "Cuidar da escrituração contábil e fiscal de empresas clientes, fechamentos mensais e obrigações acessórias.",
    requisitos: ["Graduação em Ciências Contábeis", "Registro no CRC", "Experiência com Lucro Presumido"],
    beneficios: ["Plano de saúde", "Auxílio home office", "Participação nos lucros"],
    modelo: "remoto",
    abrangencia: { tipo: "ufs", ufs: ["DF", "GO"] },
    faixaSalarial: { min: 5000, max: 7500 },
    status: "aberta",
    turno: "integral",
    contrato: "clt",
    publicadaEm: "2026-09-03",
  },
];
