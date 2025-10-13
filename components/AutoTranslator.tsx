"use client";
import React, { useEffect, useCallback, useRef } from "react";
import { useAutoTranslation } from "./AutoTranslationProvider";
import { useDOMMutation } from "../hooks/useDOMMutation";
import { translationUtils } from "../lib/translation-utils";

interface AutoTranslatorProps {
  /**
   * Additional elements to observe for mutations
   */
  observeElements?: Element[];

  /**
   * Callback when translation starts
   */
  onTranslationStart?: () => void;

  /**
   * Callback when translation completes
   */
  onTranslationComplete?: (success: boolean) => void;

  /**
   * Whether to automatically translate existing content on mount
   */
  translateOnMount?: boolean;
}

export function AutoTranslator({
  observeElements = [],
  onTranslationStart,
  onTranslationComplete,
  translateOnMount = true,
}: AutoTranslatorProps) {
  const { isEnabled, settings, isProcessing, translateElement, stats } =
    useAutoTranslation();

  const processingRef = useRef(false);
  const queueRef = useRef<Element[]>([]);
  const processedElementsRef = useRef(new WeakSet<Element>());

  /**
   * Processes the translation queue
   */
  const processQueue = useCallback(async () => {
    if (processingRef.current || !isEnabled || queueRef.current.length === 0) {
      return;
    }
    processingRef.current = true;
    onTranslationStart?.();

    try {
      const elementsToProcess = [...queueRef.current];
      queueRef.current = [];

      let successCount = 0;
      let errorCount = 0;

      // Process elements in batches to avoid overwhelming the API
      for (let i = 0; i < elementsToProcess.length; i += settings.batchSize) {
        const batch = elementsToProcess.slice(i, i + settings.batchSize);

        await Promise.all(
          batch.map(async (element) => {
            try {
              if (
                !processedElementsRef.current.has(element) &&
                element.isConnected
              ) {
                await translateElement(element);
                processedElementsRef.current.add(element);
                successCount++;
              }
            } catch (error) {
              console.error("Translation error:", error);
              errorCount++;
            }
          })
        );

        // Small delay between batches to prevent rate limiting
        if (i + settings.batchSize < elementsToProcess.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      onTranslationComplete?.(errorCount === 0);
    } catch (error) {
      console.error("Queue processing error:", error);
      onTranslationComplete?.(false);
    } finally {
      processingRef.current = false;

      // Process any new items that were added while we were processing
      if (queueRef.current.length > 0) {
        setTimeout(processQueue, settings.debounceMs);
      }
    }
  }, [
    isEnabled,
    settings,
    translateElement,
    onTranslationStart,
    onTranslationComplete,
  ]);

  /**
   * Adds elements to the translation queue
   */
  const queueElements = useCallback(
    (elements: Element[]) => {
      if (!isEnabled) return;

      const newElements = elements.filter((element) => {
        // Skip if already processed
        if (processedElementsRef.current.has(element)) return false;

        // Skip if not connected to DOM
        if (!element.isConnected) return false;

        // Skip if should be ignored
        const shouldIgnore = settings.excludeSelectors.some((selector) => {
          try {
            return element.matches(selector) || element.closest(selector);
          } catch {
            return false;
          }
        });

        if (shouldIgnore) return false;

        // Check if element has translatable content
        const textNodes = translationUtils.extractTextNodes(element);
        return textNodes.length > 0;
      });

      if (newElements.length > 0) {
        queueRef.current.push(...newElements);
        // Debounced processing
        setTimeout(processQueue, settings.debounceMs);
      }
    },
    [isEnabled, settings, processQueue]
  );

  /**
   * Handles DOM mutations
   */
  const handleMutations = useCallback(
    (mutationData: { addedNodes: Element[]; modifiedTextNodes: Text[] }) => {
      if (!isEnabled) return;

      const elementsToQueue: Element[] = [];

      // Handle added elements
      mutationData.addedNodes.forEach((element) => {
        elementsToQueue.push(element);
      });

      // Handle modified text nodes by finding their parent elements
      mutationData.modifiedTextNodes.forEach((textNode) => {
        let parent = textNode.parentElement;
        while (parent && parent !== document.body) {
          if (
            !elementsToQueue.includes(parent) &&
            !processedElementsRef.current.has(parent)
          ) {
            elementsToQueue.push(parent);
            break;
          }
          parent = parent.parentElement;
        }
      });

      queueElements(elementsToQueue);
    },
    [isEnabled, queueElements]
  );

  // Set up DOM mutation observer
  const { flushPendingMutations } = useDOMMutation(handleMutations, {
    enabled: isEnabled,
    targets: observeElements,
    debounceMs: settings.debounceMs,
    maxMutations: 100,
    ignoreSelectors: settings.excludeSelectors,
  });

  // Additional periodic scan for content that mutation observer might miss
  useEffect(() => {
    if (!isEnabled) return;

    const scanForNewContent = () => {
      // Look for elements that might have been missed by the mutation observer
      const allElements = Array.from(document.querySelectorAll("*")).filter(
        (element) => {
          // Skip if already processed
          if (processedElementsRef.current.has(element)) return false;

          // Skip if already marked as translated
          if (element.hasAttribute("data-translated")) return false;

          // Skip structural elements
          const tagName = element.tagName.toLowerCase();
          const structuralElements = [
            "html",
            "head",
            "body",
            "main",
            "header",
            "footer",
            "nav",
            "aside",
          ];
          if (structuralElements.includes(tagName)) return false;

          // Skip if should be ignored
          const shouldIgnore = settings.excludeSelectors.some((selector) => {
            try {
              return element.matches(selector) || element.closest(selector);
            } catch {
              return false;
            }
          });

          if (shouldIgnore) return false;

          // Only include elements with meaningful text content
          const textNodes = translationUtils.extractTextNodes(element);
          return (
            textNodes.length > 0 &&
            element.textContent &&
            element.textContent.trim().length > 2
          );
        }
      );

      if (allElements.length > 0) {
        queueElements(allElements);
      }
    };

    // Run periodic scan every 3 seconds when enabled
    const interval = setInterval(scanForNewContent, 3000);

    return () => clearInterval(interval);
  }, [isEnabled, settings, queueElements]);

  /**
   * Translates existing content on the page
   */
  const translateExistingContent = useCallback(() => {
    if (!isEnabled || !translateOnMount) {
      return;
    }

    // Find all elements with text content
    const elementsWithText: Element[] = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const element = node as Element;

          // Skip if should be ignored
          const shouldIgnore = settings.excludeSelectors.some((selector) => {
            try {
              return element.matches(selector) || element.closest(selector);
            } catch {
              return false;
            }
          });

          if (shouldIgnore) return NodeFilter.FILTER_REJECT;

          // Check if has text content
          const textNodes = translationUtils.extractTextNodes(element);
          return textNodes.length > 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      }
    );

    let element;
    while ((element = walker.nextNode())) {
      elementsWithText.push(element as Element);
    }

    // Queue elements for translation
    queueElements(elementsWithText);
  }, [isEnabled, translateOnMount, settings, queueElements]);

  // Handle enable/disable state changes
  useEffect(() => {
    if (isEnabled) {
      processedElementsRef.current = new WeakSet();
      translateExistingContent();
    } else {
      // Clear queue when disabled
      queueRef.current = [];
      processingRef.current = false;
    }
  }, [isEnabled, translateExistingContent]);

  // Handle settings changes
  useEffect(() => {
    if (isEnabled) {
      // Flush any pending mutations when settings change
      flushPendingMutations();

      // Clear processed elements to allow re-translation with new settings
      processedElementsRef.current = new WeakSet();
    }
  }, [
    settings.targetLanguage,
    settings.sourceLanguage,
    isEnabled,
    flushPendingMutations,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      queueRef.current = [];
      processingRef.current = false;
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}

export default AutoTranslator;
