"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type Locale = "en" | "es" | "fr" | "de" | "it" | "pt" | "zh" | "ja";

interface Messages {
  [key: string]: any;
}

interface LanguageContextType {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const languages = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  zh: "中文",
  ja: "日本語",
};

export const availableLanguages = Object.entries(languages).map(
  ([code, name]) => ({
    code: code as Locale,
    name,
  })
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [messages, setMessages] = useState<Messages>({});

  // Load messages for the selected locale
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await import(`../messages/${locale}.json`);
        setMessages(response.default);
      } catch (error) {
        console.error(`Failed to load messages for ${locale}:`, error);
        // Fallback to English
        if (locale !== "en") {
          try {
            const response = await import(`../messages/en.json`);
            setMessages(response.default);
          } catch (fallbackError) {
            console.error("Failed to load fallback messages:", fallbackError);
          }
        }
      }
    };

    loadMessages();
  }, [locale]);

  // Load saved locale from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLocale = localStorage.getItem("locale") as Locale;
      if (
        savedLocale &&
        ["en", "es", "fr", "de", "it", "pt", "zh", "ja"].includes(savedLocale)
      ) {
        setLocale(savedLocale);
      }
    }
  }, []);

  // Save locale to localStorage when it changes
  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", newLocale);
    }
  };

  // Translation function
  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split(".");
    let value: any = messages;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    if (typeof value !== "string") {
      return key;
    }

    // Replace parameters in the translation
    if (params) {
      return Object.entries(params).reduce(
        (text, [param, replacement]) => text.replace(`{${param}}`, replacement),
        value
      );
    }

    return value;
  };

  const value: LanguageContextType = {
    locale,
    messages,
    setLocale: handleSetLocale,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
