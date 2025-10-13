"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useTranslation } from "./LanguageProvider";

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

const SETTINGS_VERSION = 2; // Increment when excludeSelectors change

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
    console.log("🔧 AutoTranslationProvider: Locale changed to:", locale);
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        targetLanguage: locale,
      };

      // Auto-enable translation when user changes to a non-English language
      if (locale !== "en" && !prev.enabled) {
        console.log(
          "🔧 AutoTranslationProvider: Auto-enabling translation for non-English locale"
        );
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
            console.log(
              "🔧 AutoTranslationProvider: Clearing old settings version"
            );
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
      console.log("Translation cache cleared");
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }, []);

  const forceRefresh = useCallback(() => {
    console.log("🔧 AutoTranslationProvider: Force refresh triggered");
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
            console.log(
              "🔧 shouldSkipElement: Element",
              element.tagName,
              "matches selector:",
              selector,
              "direct:",
              matches,
              "closest:",
              !!closest
            );
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
      console.log(
        "🔧 translateElement called for:",
        element.tagName,
        element.textContent?.slice(0, 50),
        "enabled:",
        settings.enabled,
        "targetLanguage:",
        settings.targetLanguage
      );

      if (!settings.enabled) {
        console.log("🔧 translateElement: Translation not enabled");
        return;
      }

      const shouldSkip = shouldSkipElement(element);
      console.log("🔧 translateElement: shouldSkip result:", shouldSkip);

      if (shouldSkip) {
        console.log("🔧 translateElement: Element should be skipped");
        return;
      }

      try {
        console.log("🔧 translateElement: Starting translation for element");
        setIsProcessing(true);

        // Add processing class to prevent re-processing
        element.classList.add("auto-translator-processing");

        // Find all text nodes in the element
        const textNodes: Text[] = [];
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              const parent = node.parentElement;
              const text = node.textContent?.trim() || "";

              if (!parent) {
                return NodeFilter.FILTER_REJECT;
              }

              // Check parent for exclusion but ignore .auto-translator-processing since we're currently processing
              const shouldSkipParent = settings.excludeSelectors
                .filter(
                  (selector) => selector !== ".auto-translator-processing"
                ) // Skip this selector
                .some((selector) => {
                  try {
                    return parent.matches(selector) || parent.closest(selector);
                  } catch {
                    return false;
                  }
                });

              if (shouldSkipParent) {
                return NodeFilter.FILTER_REJECT;
              }

              if (text.length <= 1) {
                return NodeFilter.FILTER_REJECT;
              }

              return NodeFilter.FILTER_ACCEPT;
            },
          }
        );

        let node;
        while ((node = walker.nextNode())) {
          textNodes.push(node as Text);
        }

        // Batch translate text nodes
        const textsToTranslate = textNodes.map(
          (node) => node.textContent || ""
        );

        console.log(
          "🔧 translateElement: Found",
          textsToTranslate.length,
          "text nodes:",
          textsToTranslate
        );

        if (textsToTranslate.length === 0) {
          console.log(
            "🔧 translateElement: No text nodes to translate, skipping API calls"
          );
        } else {
          // Process in batches
          for (
            let i = 0;
            i < textsToTranslate.length;
            i += settings.batchSize
          ) {
            const batch = textsToTranslate.slice(i, i + settings.batchSize);
            const batchNodes = textNodes.slice(i, i + settings.batchSize);

            console.log(
              "🔧 translateElement: Translating batch:",
              batch,
              "target:",
              settings.targetLanguage
            );

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

              console.log(
                "🔧 translateElement: API response status:",
                response.status
              );

              if (response.ok) {
                const data = await response.json();
                console.log("🔧 translateElement: API response data:", data);

                if (data.translations) {
                  data.translations.forEach(
                    (translation: any, index: number) => {
                      if (translation.translatedText && batchNodes[index]) {
                        const originalText = batchNodes[index].textContent;
                        batchNodes[index].textContent =
                          translation.translatedText;
                        console.log(
                          "🔧 translateElement: Updated text:",
                          originalText,
                          "->",
                          translation.translatedText
                        );
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
        console.log(
          "🔧 translateElement: Successfully translated element:",
          element.tagName
        );
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
