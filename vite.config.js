import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Enquanto serves em https://trendout.github.io/trendout-loja/ (sem domínio próprio ainda),
// o base tem de bater certo com o nome do repositório. Quando ligares um domínio próprio
// (ex: loja.trendout.pt) na raiz, muda isto de volta para "/".
export default defineConfig({
  plugins: [react()],
  base: "/trendout-loja/",
});
