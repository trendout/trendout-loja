const COLOR_HEX = {
  "preto": "#1c1c1c",
  "branco": "#f2f2f0",
  "cinza": "#8a8a86",
  "bege areia": "#d9cdb4",
  "bege": "#d9cdb4",
  "verde-lima": "#c9ff3f",
  "verde": "#3f7d4a",
  "azul": "#3d6fce",
  "azul marinho": "#1c2b4a",
  "vermelho": "#c9433f",
  "rosa": "#e6a3b8",
  "amarelo": "#e8d23d",
  "laranja": "#e07b3d",
  "roxo": "#7b4fa0",
  "castanho": "#6b4a34",
};

export function colorToHex(name) {
  if (!name) return "#8a9089";
  const key = name.trim().toLowerCase();
  return COLOR_HEX[key] || null; // null = cor desconhecida, mostra só o nome
}
