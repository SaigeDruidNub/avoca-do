"use client";
import React, { useState } from "react";
import { useAutoTranslation } from "./AutoTranslationProvider";
import { useTranslation } from "./LanguageProvider";

interface AutoTranslatorControlsProps {
  /**
   * Whether to show detailed settings
   */
  showAdvancedSettings?: boolean;

  /**
   * Custom styling class
   */
  className?: string;
}

export function AutoTranslatorControls({
  showAdvancedSettings = false,
  className = "",
}: AutoTranslatorControlsProps) {
  const {
    isEnabled,
    settings,
    updateSettings,
    toggle,
    isProcessing,
    stats,
    clearCache,
    resetStats,
  } = useAutoTranslation();

  const { t, locale } = useTranslation();
  const [showStats, setShowStats] = useState(false);

  const handleTargetLanguageChange = (language: string) => {
    updateSettings({ targetLanguage: language });
  };

  const handleExcludeSelectorAdd = (selector: string) => {
    if (
      selector.trim() &&
      !settings.excludeSelectors.includes(selector.trim())
    ) {
      updateSettings({
        excludeSelectors: [...settings.excludeSelectors, selector.trim()],
      });
    }
  };

  const handleExcludeSelectorRemove = (selector: string) => {
    updateSettings({
      excludeSelectors: settings.excludeSelectors.filter((s) => s !== selector),
    });
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "it", name: "Italiano" },
    { code: "pt", name: "Português" },
    { code: "zh", name: "中文" },
    { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },
    { code: "ru", name: "Русский" },
    { code: "ar", name: "العربية" },
    { code: "hi", name: "हिन्दी" },
  ];

  return (
    <div
      className={`auto-translator-controls bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm ${className}`}
    >
      {/* Main Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Auto Translation
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Automatically translate page content as it loads
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Translating...
            </div>
          )}

          <button
            onClick={toggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isEnabled
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Target Language Selection */}
      {isEnabled && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Language
            </label>
            <select
              value={settings.targetLanguage}
              onChange={(e) => handleTargetLanguageChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Advanced Settings */}
          {showAdvancedSettings && (
            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Advanced Settings
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Batch Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.batchSize}
                    onChange={(e) =>
                      updateSettings({
                        batchSize: parseInt(e.target.value) || 10,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Debounce (ms)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    step="100"
                    value={settings.debounceMs}
                    onChange={(e) =>
                      updateSettings({
                        debounceMs: parseInt(e.target.value) || 500,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Stats Toggle */}
          <button
            onClick={() => setShowStats(!showStats)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            {showStats ? "Hide" : "Show"} Statistics
          </button>

          {/* Statistics */}
          {showStats && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Translation Statistics
              </h4>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Total:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {stats.totalTranslations}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Successful:
                  </span>
                  <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                    {stats.successfulTranslations}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Failed:
                  </span>
                  <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                    {stats.failedTranslations}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Cache Hits:
                  </span>
                  <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">
                    {stats.cacheHits}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={resetStats}
                  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Reset Stats
                </button>

                <button
                  onClick={clearCache}
                  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Clear Cache
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AutoTranslatorControls;
