import { useEffect, useRef } from "react";

/**
 * Injeta um bloco de HTML/JS (ex: Google Analytics, Meta Pixel) no <head> da página.
 * Usar innerHTML diretamente não executa <script> tags — por isso recriamos cada
 * <script> manualmente para o browser os correr a sério.
 *
 * A injeção é propositadamente ADIADA até a página estar pronta (evento "load"
 * ou, no máximo, ~2s depois) — scripts de terceiros como o Google Ads costumam
 * ser a maior causa de "tarefas longas" na thread principal se corridos logo
 * de início, atrapalhando o primeiro desenho da página.
 */
export function useInjectAnalytics(scriptsHtml) {
  const injected = useRef(false);

  useEffect(() => {
    if (!scriptsHtml || injected.current) return;
    injected.current = true;

    const inject = () => {
      const container = document.createElement("div");
      container.innerHTML = scriptsHtml;

      container.querySelectorAll("script").forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
        newScript.text = oldScript.textContent;
        document.head.appendChild(newScript);
      });
    };

    if (document.readyState === "complete") {
      const timer = setTimeout(inject, 1500);
      return () => clearTimeout(timer);
    }

    const onLoad = () => setTimeout(inject, 1500);
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, [scriptsHtml]);
}
