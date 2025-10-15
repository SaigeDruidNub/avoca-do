"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useTranslation } from "./LanguageProvider";
import { translationUtils } from "../lib/translation-utils";

export interface AutoTranslationSettings {
  enabled: boolean;
  targetLanguage: string;
  sourceLanguage?: string;
  excludeSelectors: string[];
  batchSize: number;
  debounceMs: number;
  maxRetries: number;
}

interface AutoTranslationStats {
  totalTranslations: number;
  successfulTranslations: number;
  failedTranslations: number;
  cacheHits: number;
  lastTranslationTime?: number;
}

interface AutoTranslationContextType {
  // Settings
  settings: AutoTranslationSettings;
  updateSettings: (updates: Partial<AutoTranslationSettings>) => void;

  // Control
  isEnabled: boolean;
  enable: () => void;
  disable: () => void;
  toggle: () => void;

  // Status
  isProcessing: boolean;
  stats: AutoTranslationStats;

  // Actions
  translateElement: (element: Element) => Promise<void>;
  translateText: (text: string) => Promise<string | null>;
  clearCache: () => void;
  resetStats: () => void;
  forceRefresh: () => void;

  // Events
  onTranslationStart?: (element: Element) => void;
  onTranslationComplete?: (element: Element, success: boolean) => void;
  onError?: (error: Error) => void;
}

const AutoTranslationContext = createContext<
  AutoTranslationContextType | undefined
>(undefined);

const SETTINGS_VERSION = 3; // Increment when excludeSelectors change

const DEFAULT_SETTINGS: AutoTranslationSettings = {
  enabled: false,
  targetLanguage: "en",
  sourceLanguage: undefined,
  excludeSelectors: [
    "[data-notranslate]",
    "script",
    "style",
    "noscript",
    "textarea",
    'input[type="text"]',
    'input[type="password"]',
    'input[type="email"]',
    'input[type="search"]',
    'input[type="submit"]',
    'input[type="button"]',
    "code",
    "pre",
    ".auto-translator-processing",
    ".no-translate",
    "[contenteditable]",
    // Comprehensive name-related selectors
    "*[class*='name']",
    "*[class*='user']",
    "*[class*='author']",
    "*[class*='profile']",
    "*[class*='title']",
    "*[class*='handle']",
    "*[id*='name']",
    "*[id*='user']",
    "*[id*='author']",
    "*[id*='profile']",
    "*[data-name]",
    "*[data-username]",
    "*[data-user-name]",
    "*[data-display-name]",
    "*[data-full-name]",
    "*[data-author]",
    "*[data-profile]",
    "h1",
    "h2",
    "h3", // Headers often contain names/titles
    // Specific common class names
    ".username",
    ".user-name",
    ".display-name",
    ".profile-name",
    ".author-name",
    ".full-name",
    ".first-name",
    ".last-name",
    ".real-name",
    ".given-name",
    ".surname",
    ".nickname",
    ".title",
    ".name",
  ],
  batchSize: 10,
  debounceMs: 500,
  maxRetries: 3,
};

export function AutoTranslationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = useTranslation();
  const [settings, setSettings] =
    useState<AutoTranslationSettings>(DEFAULT_SETTINGS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<AutoTranslationStats>({
    totalTranslations: 0,
    successfulTranslations: 0,
    failedTranslations: 0,
    cacheHits: 0,
  });

  // Force refresh counter to trigger re-translation
  const [forceRefreshCounter, setForceRefreshCounter] = useState(0);

  // Update target language when locale changes
  useEffect(() => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        targetLanguage: locale,
      };

      // Auto-enable translation when user changes to a non-English language
      if (locale !== "en" && !prev.enabled) {
        newSettings.enabled = true;
      }

      return newSettings;
    });
  }, [locale]);

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("autoTranslationSettings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          // Check if settings are from old version
          if (parsed.version !== SETTINGS_VERSION) {
            localStorage.removeItem("autoTranslationSettings");
            setSettings(DEFAULT_SETTINGS);
          } else {
            // Merge with current default settings to ensure we get updated excludeSelectors
            setSettings((prev) => ({ ...DEFAULT_SETTINGS, ...parsed }));
          }
        } catch (error) {
          console.warn("Failed to parse saved translation settings:", error);
          localStorage.removeItem("autoTranslationSettings");
          setSettings(DEFAULT_SETTINGS);
        }
      }
    }
  }, []);

  // Save settings to localStorage
  const updateSettings = useCallback(
    (updates: Partial<AutoTranslationSettings>) => {
      setSettings((prev) => {
        const newSettings = { ...prev, ...updates };

        if (typeof window !== "undefined") {
          localStorage.setItem(
            "autoTranslationSettings",
            JSON.stringify({ ...newSettings, version: SETTINGS_VERSION })
          );
        }

        return newSettings;
      });
    },
    []
  );

  const enable = useCallback(() => {
    updateSettings({ enabled: true });
  }, [updateSettings]);

  const disable = useCallback(() => {
    updateSettings({ enabled: false });
    setIsProcessing(false);
  }, [updateSettings]);

  const toggle = useCallback(() => {
    updateSettings({ enabled: !settings.enabled });
  }, [settings.enabled, updateSettings]);

  const updateStats = useCallback((updates: Partial<AutoTranslationStats>) => {
    setStats((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetStats = useCallback(() => {
    setStats({
      totalTranslations: 0,
      successfulTranslations: 0,
      failedTranslations: 0,
      cacheHits: 0,
    });
  }, []);

  const clearCache = useCallback(async () => {
    try {
      // Clear client-side cache
      if (typeof window !== "undefined") {
        localStorage.removeItem("translationCache");
      }

      // Note: Server-side cache clearing would need an additional API endpoint
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }, []);

  const forceRefresh = useCallback(() => {
    setForceRefreshCounter((prev) => prev + 1);
  }, []);

  const translateText = useCallback(
    async (text: string): Promise<string | null> => {
      if (!settings.enabled || !text.trim()) {
        return null;
      }

      try {
        updateStats({
          totalTranslations: stats.totalTranslations + 1,
          lastTranslationTime: Date.now(),
        });

        const response = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text.trim(),
            targetLanguage: settings.targetLanguage,
            sourceLanguage: settings.sourceLanguage,
          }),
        });

        if (!response.ok) {
          throw new Error(`Translation API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.translatedText) {
          updateStats({
            successfulTranslations: stats.successfulTranslations + 1,
          });
          return data.translatedText;
        }

        throw new Error("No translation received");
      } catch (error) {
        console.error("Translation error:", error);
        updateStats({ failedTranslations: stats.failedTranslations + 1 });
        return null;
      }
    },
    [settings, stats, updateStats]
  );

  const shouldSkipElement = useCallback(
    (element: Element): boolean => {
      const matchingSelector = settings.excludeSelectors.find((selector) => {
        try {
          const matches = element.matches(selector);
          const closest = element.closest(selector);
          if (matches || closest) {
            return true;
          }
          return false;
        } catch {
          return false;
        }
      });
      return !!matchingSelector;
    },
    [settings.excludeSelectors]
  );

  const translateElement = useCallback(
    async (element: Element): Promise<void> => {
      if (!settings.enabled) {
      }

      const shouldSkip = shouldSkipElement(element);

      if (shouldSkip) {
        return;
      }

      try {
        setIsProcessing(true);

        // Add processing class to prevent re-processing
        element.classList.add("auto-translator-processing");

        // Use the improved text node extraction from translationUtils
        const textNodes = translationUtils.extractTextNodes(element);

        // Batch translate text nodes
        const textsToTranslate = textNodes.map(
          (node: Text) => node.textContent || ""
        );

        if (textsToTranslate.length === 0) {
        } else {
          // Process in batches
          for (
            let i = 0;
            i < textsToTranslate.length;
            i += settings.batchSize
          ) {
            const batch = textsToTranslate.slice(i, i + settings.batchSize);
            const batchNodes = textNodes.slice(i, i + settings.batchSize);

            try {
              const response = await fetch("/api/translate", {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  texts: batch,
                  targetLanguage: settings.targetLanguage,
                  sourceLanguage: settings.sourceLanguage,
                }),
              });

              if (response.ok) {
                const data = await response.json();

                if (data.translations) {
                  type TranslationResult = { translatedText: string };
                  data.translations.forEach(
                    (translation: TranslationResult, index: number) => {
                      if (translation.translatedText && batchNodes[index]) {
                        const originalText = batchNodes[index].textContent;
                        batchNodes[index].textContent =
                          translation.translatedText;
                      }
                    }
                  );
                }
              } else {
                const errorData = await response.text();
                console.error(
                  "🔧 translateElement: API error:",
                  response.status,
                  errorData
                );
              }
            } catch (batchError) {
              console.error(
                "🔧 translateElement: Batch translation error:",
                batchError
              );
            }
          }
        }

        // Mark element as translated
        element.setAttribute("data-translated", "true");
      } catch (error) {
        console.error("🔧 translateElement: Element translation error:", error);
      } finally {
        element.classList.remove("auto-translator-processing");
        setIsProcessing(false);
      }
    },
    [settings, shouldSkipElement]
  );

  const value: AutoTranslationContextType = {
    settings,
    updateSettings,
    isEnabled: settings.enabled,
    enable,
    disable,
    toggle,
    isProcessing,
    stats,
    translateElement,
    translateText,
    clearCache,
    resetStats,
    forceRefresh,
  };

  return (
    <AutoTranslationContext.Provider value={value}>
      {children}
    </AutoTranslationContext.Provider>
  );
}

export function useAutoTranslation() {
  const context = useContext(AutoTranslationContext);
  if (context === undefined) {
    throw new Error(
      "useAutoTranslation must be used within an AutoTranslationProvider"
    );
  }
  return context;
}
