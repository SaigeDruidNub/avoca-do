"use client";
import React, { useState } from "react";
import { useAutoTranslation } from "./AutoTranslationProvider";

export function AutoTranslatorDebug() {
  const { isEnabled, settings, stats, translateText, toggle, isProcessing } =
    useAutoTranslation();

  const [testText, setTestText] = useState("Hello, world!");
  const [translationResult, setTranslationResult] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isTestingAPI, setIsTestingAPI] = useState(false);

  const testTranslationAPI = async () => {
    setIsTestingAPI(true);
    setError(null);

    try {
      // Test the direct API endpoint first
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: testText,
          targetLanguage: settings.targetLanguage,
          sourceLanguage: "en",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      setTranslationResult(data.translatedText);
      console.log("Translation API Test Result:", data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      console.error("Translation API Test Error:", err);
    } finally {
      setIsTestingAPI(false);
    }
  };

  const testProviderTranslation = async () => {
    setIsTestingAPI(true);
    setError(null);

    try {
      const result = await translateText(testText);
      if (result) {
        setTranslationResult(result);
        console.log("Provider Translation Result:", result);
      } else {
        throw new Error("No translation result from provider");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      console.error("Provider Translation Error:", err);
    } finally {
      setIsTestingAPI(false);
    }
  };

  const createTestElement = () => {
    // Create a test element and add it to the page
    const testDiv = document.createElement("div");
    testDiv.id = "auto-translator-test-element";
    testDiv.innerHTML = "Hello, this is a test for auto translation!";
    testDiv.style.cssText =
      "position: fixed; top: 100px; right: 10px; background: yellow; padding: 10px; border: 1px solid black; z-index: 1000;";

    // Remove any existing test element
    const existing = document.getElementById("auto-translator-test-element");
    if (existing) {
      existing.remove();
    }

    // Add the new test element
    document.body.appendChild(testDiv);

    console.log("🔧 Test element created and added to page");
  };

  return (
    <div className="fixed top-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <div className="text-sm font-semibold mb-3 text-gray-800 dark:text-white">
        🔧 Auto-Translator Debug Panel
      </div>

      {/* Status */}
      <div className="space-y-2 mb-4">
        <div className="text-xs">
          <span className="font-medium">Status:</span>{" "}
          <span className={isEnabled ? "text-green-600" : "text-red-600"}>
            {isEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        <div className="text-xs">
          <span className="font-medium">Processing:</span>{" "}
          <span className={isProcessing ? "text-blue-600" : "text-gray-600"}>
            {isProcessing ? "Yes" : "No"}
          </span>
        </div>

        <div className="text-xs">
          <span className="font-medium">Target Language:</span>{" "}
          <span className="text-gray-700 dark:text-gray-300">
            {settings.targetLanguage}
          </span>
        </div>

        <div className="text-xs">
          <span className="font-medium">Total Translations:</span>{" "}
          <span className="text-gray-700 dark:text-gray-300">
            {stats.totalTranslations}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-2 mb-4">
        <button
          onClick={toggle}
          className={`w-full px-3 py-1 text-xs rounded ${
            isEnabled
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          {isEnabled ? "Disable" : "Enable"} Auto Translation
        </button>
      </div>

      {/* API Test */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Test Translation:
        </div>

        <input
          type="text"
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
          placeholder="Text to translate..."
        />

        <div className="flex gap-1">
          <button
            onClick={testTranslationAPI}
            disabled={isTestingAPI}
            className="flex-1 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {isTestingAPI ? "..." : "Test API"}
          </button>

          <button
            onClick={testProviderTranslation}
            disabled={isTestingAPI}
            className="flex-1 px-2 py-1 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded disabled:opacity-50"
          >
            {isTestingAPI ? "..." : "Test Provider"}
          </button>
        </div>

        <button
          onClick={createTestElement}
          className="w-full px-2 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded mt-1"
        >
          Add Test Element
        </button>

        {translationResult && (
          <div className="text-xs bg-green-50 dark:bg-green-900 p-2 rounded">
            <div className="font-medium text-green-800 dark:text-green-200">
              Result:
            </div>
            <div className="text-green-700 dark:text-green-300">
              {translationResult}
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs bg-red-50 dark:bg-red-900 p-2 rounded">
            <div className="font-medium text-red-800 dark:text-red-200">
              Error:
            </div>
            <div className="text-red-700 dark:text-red-300">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AutoTranslatorDebug;
