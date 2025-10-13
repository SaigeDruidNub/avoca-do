"use client";
import React, { useState } from "react";
import { useTranslation, availableLanguages } from "./LanguageProvider";
import { useAutoTranslation } from "./AutoTranslationProvider";
import { HiGlobeAlt } from "react-icons/hi";
import { MdTranslate } from "react-icons/md";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const { isEnabled, toggle, isProcessing } = useAutoTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = availableLanguages.find(
    (lang) => lang.code === locale
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-primary-dark rounded-md transition"
        aria-label="Select language"
      >
        <HiGlobeAlt className="w-5 h-5 text-secondary-dark" />
        <span className="hidden sm:block">{currentLanguage?.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* Language Selection */}
          <div className="py-1 border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Select Language
            </div>
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  setLocale(language.code);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                  locale === language.code
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <span className="mr-2">{getLanguageFlag(language.code)}</span>
                {language.name}
              </button>
            ))}
          </div>

          {/* Auto Translation Controls */}
          <div className="py-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MdTranslate className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto Translate
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isProcessing && (
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}

                <button
                  onClick={toggle}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isEnabled
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      isEnabled ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isEnabled
                ? "Automatically translating page content"
                : "Click to enable automatic page translation"}
            </p>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}

function getLanguageFlag(locale: string): string {
  const flags: Record<string, string> = {
    en: "🇺🇸",
    es: "🇪🇸",
    fr: "🇫🇷",
    de: "🇩🇪",
    it: "🇮🇹",
    pt: "🇵🇹",
    zh: "🇨🇳",
    ja: "🇯🇵",
  };
  return flags[locale] || "🌐";
}
