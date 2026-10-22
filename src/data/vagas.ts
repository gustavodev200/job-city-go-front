export type Categoria =
  | "tecnologia"
  | "saude"
  | "educacao"
  | "comercio"
  | "industria";

export type Modelo = "presencial" | "hibrido" | "remoto";

export type Status = "aberta" | "encerrada";

export type Vaga = {
  id: string;
  titulo: string;
  empresa: string;
  categoria: Categoria;
  modelo: Modelo;
  faixaSalarial: { min: number; max: number };
  status: Status;
  x: number;
  z: number;
};

// Dados fictícios — substituir pela API (NEXT_PUBLIC_API_URL) quando o backend existir.
export const vagas: Vaga[] = [
  {
    id: "vg-001",
    titulo: "Desenvolvedor(a) Front-end",
    empresa: "Pixel Norte",
    categoria: "tecnologia",
    modelo: "hibrido",
    faixaSalarial: { min: 6000, max: 9000 },
    status: "aberta",
    x: -20,
    z: -10,
  },
  {
    id: "vg-002",
    titulo: "Analista de Dados",
    empresa: "Quadra Dados",
    categoria: "tecnologia",
    modelo: "remoto",
    faixaSalarial: { min: 7000, max: 11000 },
    status: "aberta",
    x: -10,
    z: 20,
  },
  {
    id: "vg-003",
    titulo: "Técnico(a) de Enfermagem",
    empresa: "Clínica Vila Verde",
    categoria: "saude",
    modelo: "presencial",
    faixaSalarial: { min: 2800, max: 3500 },
    status: "aberta",
    x: 15,
    z: -20,
  },
  {
    id: "vg-004",
    titulo: "Professor(a) de Matemática",
    empresa: "Colégio Horizonte",
    categoria: "educacao",
    modelo: "presencial",
    faixaSalarial: { min: 3500, max: 4800 },
    status: "encerrada",
    x: 25,
    z: 10,
  },
  {
    id: "vg-005",
    titulo: "Vendedor(a) Interno",
    empresa: "Loja Esquina",
    categoria: "comercio",
    modelo: "presencial",
    faixaSalarial: { min: 2000, max: 3200 },
    status: "aberta",
    x: 0,
    z: -30,
  },
  {
    id: "vg-006",
    titulo: "Operador(a) de Produção",
    empresa: "Metalúrgica Sul",
    categoria: "industria",
    modelo: "presencial",
    faixaSalarial: { min: 2400, max: 3000 },
    status: "aberta",
    x: 30,
    z: 30,
  },
  {
    id: "vg-007",
    titulo: "Coordenador(a) Pedagógico",
    empresa: "Instituto Aprender",
    categoria: "educacao",
    modelo: "hibrido",
    faixaSalarial: { min: 5000, max: 6500 },
    status: "aberta",
    x: -30,
    z: 5,
  },
  {
    id: "vg-008",
    titulo: "Engenheiro(a) de Software Back-end",
    empresa: "Rota Cloud",
    categoria: "tecnologia",
    modelo: "remoto",
    faixaSalarial: { min: 9000, max: 14000 },
    status: "encerrada",
    x: 10,
    z: 0,
  },
];
