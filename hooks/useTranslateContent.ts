"use client";
import { useCallback } from "react";
import { useAutoTranslation } from "../components/AutoTranslationProvider";

/**
 * Hook to manually trigger translation of content
 */
export function useTranslateContent() {
  const { isEnabled, translateElement } = useAutoTranslation();

  /**
   * Translate all content within a given container element
   */
  const translateContainer = useCallback(
    async (container: Element | string) => {
      if (!isEnabled) {
        console.log("🔧 useTranslateContent: Translation not enabled");
        return;
      }

      let element: Element | null = null;

      if (typeof container === "string") {
        element = document.querySelector(container);
        if (!element) {
          console.warn("🔧 useTranslateContent: Element not found:", container);
          return;
        }
      } else {
        element = container;
      }

      console.log("🔧 useTranslateContent: Translating container:", element);

      try {
        // Find all elements with text content within the container
        const elementsToTranslate: Element[] = [];

        // Find text-containing elements, but be more selective
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_ELEMENT,
          {
            acceptNode: (node) => {
              const el = node as Element;
              const tagName = el.tagName.toLowerCase();

              // Skip structural elements that shouldn't be translated
              const structuralElements = [
                "html",
                "head",
                "body",
                "main",
                "header",
                "footer",
                "nav",
                "aside",
                "section",
                "article",
              ];
              if (structuralElements.includes(tagName)) {
                return NodeFilter.FILTER_SKIP; // Skip but continue to children
              }

              // Skip elements that should not be translated
              const excludeSelectors = [
                "[data-notranslate]",
                "script",
                "style",
                "noscript",
                "textarea",
                'input[type="text"]',
                'input[type="password"]',
                'input[type="email"]',
                'input[type="search"]',
                "button",
                "code",
                "pre",
                ".auto-translator-processing",
                ".no-translate",
                "[contenteditable]",
                "title", // Skip page title
                "meta",
              ];

              const shouldSkip = excludeSelectors.some((selector) => {
                try {
                  return el.matches(selector) || el.closest(selector);
                } catch {
                  return false;
                }
              });

              if (shouldSkip) return NodeFilter.FILTER_REJECT;

              // Only accept elements that have direct text content (not just from children)
              const hasDirectText = Array.from(el.childNodes).some(
                (child) =>
                  child.nodeType === Node.TEXT_NODE &&
                  (child.textContent?.trim().length || 0) > 2 // At least 3 characters
              );

              // Also accept common text containers even if they don't have direct text
              const textContainers = [
                "p",
                "span",
                "div",
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
                "li",
                "td",
                "th",
              ];
              const isTextContainer =
                textContainers.includes(tagName) &&
                el.textContent &&
                el.textContent.trim().length > 2;

              return hasDirectText || isTextContainer
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_SKIP;
            },
          }
        );

        let node;
        while ((node = walker.nextNode())) {
          elementsToTranslate.push(node as Element);
        }

        console.log(
          "🔧 useTranslateContent: Found",
          elementsToTranslate.length,
          "elements to translate:",
          elementsToTranslate.map((el) => ({
            tag: el.tagName,
            text: el.textContent?.slice(0, 50),
          }))
        );

        // Translate each element
        for (const el of elementsToTranslate) {
          // Skip if already has translation marker
          if (
            el.hasAttribute("data-translated") ||
            el.classList.contains("auto-translator-processing")
          ) {
            console.log(
              "🔧 useTranslateContent: Skipping already processed element:",
              el.tagName
            );
            continue;
          }

          console.log(
            "🔧 useTranslateContent: Calling translateElement for:",
            el.tagName,
            el.textContent?.slice(0, 50)
          );
          await translateElement(el);
        }

        console.log("🔧 useTranslateContent: Translation complete");
      } catch (error) {
        console.error("🔧 useTranslateContent: Translation error:", error);
      }
    },
    [isEnabled, translateElement]
  );

  /**
   * Translate all posts in the feed
   */
  const translatePosts = useCallback(async () => {
    console.log("🔧 translatePosts: Starting post translation...");
    const feedContainer = document.querySelector(
      '[data-posts-container], [class*="feed"], .posts, main section:last-child'
    );
    console.log("🔧 translatePosts: Found container:", feedContainer);
    if (feedContainer) {
      await translateContainer(feedContainer);
    } else {
      console.warn("🔧 useTranslateContent: Feed container not found");
    }
  }, [translateContainer]);

  /**
   * Translate all content on the current page
   */
  const translatePage = useCallback(async () => {
    await translateContainer(document.body);
  }, [translateContainer]);

  return {
    translateContainer,
    translatePosts,
    translatePage,
    isEnabled,
  };
}
