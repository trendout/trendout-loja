// Estas cores referenciam variáveis CSS que o Tema, definido no backoffice,
// atualiza em tempo real (ver src/lib/colorUtils.js). O valor depois da
// vírgula em cada var(...) é só um recurso, para o 1º instante antes do
// tema carregar — os valores reais vêm de index.html e são substituídos
// assim que a loja sabe as tuas escolhas.
export const T = {
  bg: "var(--color-bg, #0f1210)",
  bgRaised: "var(--color-bg-raised, #171b18)",
  bgRaised2: "var(--color-bg-raised-2, #1c211d)",
  border: "var(--color-border, #262b26)",
  text: "var(--color-text, #eef0ec)",
  muted: "var(--color-muted, #8a9089)",
  accent: "var(--color-accent, #c9ff3f)",
  accentDim: "#7c9a2e",
  danger: "#ff6b5e",
  warn: "#ffb44d",
  fontHeading: "var(--font-heading, 'Bebas Neue', sans-serif)",
  fontBody: "var(--font-body, 'Inter', sans-serif)",
};
