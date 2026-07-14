import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Serve a partir da raiz de loja.trendout.pt — se voltares a testar em
// <user>.github.io/trendout-loja/ sem domínio próprio, muda para "/trendout-loja/".
export default defineConfig({
  plugins: [react()],
  base: "/",
});