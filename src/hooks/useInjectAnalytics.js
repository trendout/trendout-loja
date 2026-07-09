import { useEffect, useRef } from "react";

/**
 * Injeta um bloco de HTML/JS (ex: Google Analytics, Meta Pixel) no <head> da página.
 * Usar innerHTML diretamente não executa <script> tags — por isso recriamos cada
 * <script> manualmente para o browser os correr a sério.
 */
export function useInjectAnalytics(scriptsHtml) {
  const injected = useRef(false);

  useEffect(() => {
    if (!scriptsHtml || injected.current) return;
    injected.current = true;

    const container = document.createElement("div");
    container.innerHTML = scriptsHtml;

    container.querySelectorAll("script").forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
      newScript.text = oldScript.textContent;
      document.head.appendChild(newScript);
    });
  }, [scriptsHtml]);
}
