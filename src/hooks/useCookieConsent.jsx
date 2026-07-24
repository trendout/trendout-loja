import React, { createContext, useContext, useState, useEffect } from "react";

const STORAGE_KEY = "trendout_cookie_consent";
const CONSENT_VERSION = 1; // sobe isto se um dia mudares as categorias — volta a perguntar a todos

const CookieConsentContext = createContext(null);

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null; // categorias mudaram, pergunta outra vez
    return parsed;
  } catch {
    return null;
  }
}

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(() => loadStored());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const save = (partial) => {
    const next = { necessary: true, analytics: false, marketing: false, ...partial, version: CONSENT_VERSION, decidedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setConsent(next);
    setSettingsOpen(false);
  };

  const acceptAll = () => save({ analytics: true, marketing: true });
  const rejectAll = () => save({ analytics: false, marketing: false });

  return (
    <CookieConsentContext.Provider value={{ consent, hasDecided: !!consent, acceptAll, rejectAll, savePreferences: save, settingsOpen, openSettings: () => setSettingsOpen(true), closeSettings: () => setSettingsOpen(false) }}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent tem de ser usado dentro de <CookieConsentProvider>");
  return ctx;
}
