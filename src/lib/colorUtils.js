// Pequenas funções de cor para derivar uma paleta completa a partir das
// 3 cores que o admin escolhe no Tema (destaque, fundo, texto).

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHex(r, g, b) {
  const clamp = (n) => Math.min(255, Math.max(0, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

// devolve um valor entre 0 (escuro) e 1 (claro)
function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

// desloca a cor em direção ao branco (amount > 0) ou ao preto (amount < 0)
function shade(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const target = amount > 0 ? 255 : 0;
  const factor = Math.abs(amount);
  return rgbToHex(
    r + (target - r) * factor,
    g + (target - g) * factor,
    b + (target - b) * factor
  );
}

/**
 * Aplica o tema à página inteira via variáveis CSS — instantâneo, sem
 * precisar de voltar a desenhar componentes React (o browser resolve sozinho).
 */
export function applyTheme(theme) {
  if (!theme) return;
  const root = document.documentElement;
  const isDark = relativeLuminance(theme.bgColor) < 0.5;
  const dir = isDark ? 1 : -1; // clarear se for escuro, escurecer se for claro

  root.style.setProperty("--color-bg", theme.bgColor);
  root.style.setProperty("--color-bg-raised", shade(theme.bgColor, dir * 0.08));
  root.style.setProperty("--color-bg-raised-2", shade(theme.bgColor, dir * 0.14));
  root.style.setProperty("--color-border", shade(theme.bgColor, dir * 0.28));
  root.style.setProperty("--color-text", theme.textColor);
  root.style.setProperty("--color-muted", shade(theme.bgColor, dir * 0.65));
  root.style.setProperty("--color-accent", theme.accentColor);
  root.style.setProperty("--font-heading", `'${theme.headingFont}', sans-serif`);
  root.style.setProperty("--font-body", `'${theme.bodyFont}', sans-serif`);
}
