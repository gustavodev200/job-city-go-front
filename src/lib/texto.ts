/** Sem acentos, minúsculas e sem espaços nas pontas: "Médico " → "medico". */
export const normalizar = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
