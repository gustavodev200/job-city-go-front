// Marcas fictícias exibidas nos outdoors da cidade (dados mock).

export type CategoriaAnunciante = "alimentacao" | "farmacia" | "moda" | "servicos" | "tecnologia";

export type Anunciante = {
  id: string;
  nome: string;
  /** Cor de fundo do painel. */
  cor: string;
  slogan: string;
  categoria: CategoriaAnunciante;
};

export const anunciantes: Anunciante[] = [
  { id: "burger-bairro", nome: "Burger do Bairro", cor: "#e8743b", slogan: "Sabor de casa, rapidinho", categoria: "alimentacao" },
  { id: "padaria-sol", nome: "Padaria Sol", cor: "#d9a23a", slogan: "Pão quentinho toda hora", categoria: "alimentacao" },
  { id: "farma-vida", nome: "FarmaVida", cor: "#2f9e6e", slogan: "Saúde perto de você", categoria: "farmacia" },
  { id: "estilo-urbano", nome: "Estilo Urbano", cor: "#c4447a", slogan: "Vista o seu melhor dia", categoria: "moda" },
  { id: "conserta-ja", nome: "Conserta Já", cor: "#4a6fa5", slogan: "Resolvemos em 24 horas", categoria: "servicos" },
  { id: "limpa-mais", nome: "Limpa Mais", cor: "#3aa7c4", slogan: "Sua casa brilhando", categoria: "servicos" },
  { id: "nuvem-tech", nome: "NuvemTech", cor: "#5b4bc4", slogan: "Internet que voa", categoria: "tecnologia" },
  { id: "pixel-store", nome: "Pixel Store", cor: "#2d3a4a", slogan: "Tecnologia sem complicação", categoria: "tecnologia" },
];
