import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from '@/lib/i18n/en.js';
import hi from '@/lib/i18n/hi.js';

const DICTIONARIES = { en, hi };
const STORAGE_KEY = 'cs.lang';

const I18nContext = createContext(null);

function readStoredLang() {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'hi' || v === 'en' ? v : 'en';
  } catch {
    return 'en';
  }
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage may be unavailable (private mode); language still switches for this visit.
    }
  }, []);

  const t = useCallback(
    (key) => DICTIONARIES[lang]?.[key] ?? en[key] ?? key,
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, t, toggle: () => setLang(lang === 'en' ? 'hi' : 'en') }),
    [lang, setLang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
