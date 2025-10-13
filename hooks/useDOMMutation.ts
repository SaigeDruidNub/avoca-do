"use client";
import { useEffect, useRef, useCallback } from "react";

interface UseDOMMutationOptions {
  /**
   * Whether the observer is enabled
   */
  enabled: boolean;

  /**
   * Elements to observe (default: document.body)
   */
  targets?: Element[];

  /**
   * Debounce delay in milliseconds
   */
  debounceMs?: number;

  /**
   * Maximum number of mutations to process at once
   */
  maxMutations?: number;

  /**
   * Selectors to ignore
   */
  ignoreSelectors?: string[];
}

interface MutationData {
  addedNodes: Element[];
  modifiedTextNodes: Text[];
  timestamp: number;
}

/**
 * Custom hook that observes DOM mutations and reports new/modified content
 */
export function useDOMMutation(
  callback: (mutations: MutationData) => void,
  options: UseDOMMutationOptions
) {
  const observerRef = useRef<MutationObserver | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMutationsRef = useRef<MutationRecord[]>([]);

  const {
    enabled,
    targets = [],
    debounceMs = 500,
    maxMutations = 50,
    ignoreSelectors = [
      "[data-notranslate]",
      "script",
      "style",
      "noscript",
      "textarea",
      "input",
      "button",
      "code",
      "pre",
      ".auto-translator-processing",
    ],
  } = options;

  /**
   * Checks if an element should be ignored based on selectors
   */
  const shouldIgnoreElement = useCallback(
    (element: Element): boolean => {
      return ignoreSelectors.some((selector) => {
        try {
          return element.matches?.(selector) || element.closest?.(selector);
        } catch {
          return false;
        }
      });
    },
    [ignoreSelectors]
  );

  /**
   * Processes accumulated mutations
   */
  const processMutations = useCallback(() => {
    if (pendingMutationsRef.current.length === 0) return;

    const addedNodes: Element[] = [];
    const modifiedTextNodes: Text[] = [];
    const processedNodes = new Set<Node>();

    // Limit the number of mutations to process
    const mutationsToProcess = pendingMutationsRef.current.slice(
      0,
      maxMutations
    );
    pendingMutationsRef.current =
      pendingMutationsRef.current.slice(maxMutations);

    for (const mutation of mutationsToProcess) {
      // Handle added nodes
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (processedNodes.has(node)) return;
          processedNodes.add(node);

          // Handle element nodes
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            if (!shouldIgnoreElement(element)) {
              addedNodes.push(element);

              // Also collect text nodes within the added element
              const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                {
                  acceptNode: (textNode) => {
                    const parent = textNode.parentElement;
                    if (!parent || shouldIgnoreElement(parent)) {
                      return NodeFilter.FILTER_REJECT;
                    }

                    const text = textNode.textContent?.trim() || "";
                    return text.length > 1
                      ? NodeFilter.FILTER_ACCEPT
                      : NodeFilter.FILTER_REJECT;
                  },
                }
              );

              let textNode;
              while ((textNode = walker.nextNode())) {
                if (!processedNodes.has(textNode)) {
                  processedNodes.add(textNode);
                  modifiedTextNodes.push(textNode as Text);
                }
              }
            }
          }
          // Handle text nodes directly added
          else if (node.nodeType === Node.TEXT_NODE) {
            const textNode = node as Text;
            const parent = textNode.parentElement;

            if (parent && !shouldIgnoreElement(parent)) {
              const text = textNode.textContent?.trim() || "";
              if (text.length > 1) {
                modifiedTextNodes.push(textNode);
              }
            }
          }
        });
      }
      // Handle character data changes (text content modifications)
      else if (mutation.type === "characterData") {
        const textNode = mutation.target as Text;
        if (!processedNodes.has(textNode)) {
          processedNodes.add(textNode);

          const parent = textNode.parentElement;
          if (parent && !shouldIgnoreElement(parent)) {
            const text = textNode.textContent?.trim() || "";
            if (text.length > 1) {
              modifiedTextNodes.push(textNode);
            }
          }
        }
      }
    }

    // Call the callback if we have any relevant changes
    if (addedNodes.length > 0 || modifiedTextNodes.length > 0) {
      callback({
        addedNodes,
        modifiedTextNodes,
        timestamp: Date.now(),
      });
    }

    // Process remaining mutations if any
    if (pendingMutationsRef.current.length > 0) {
      debounceTimerRef.current = setTimeout(processMutations, debounceMs / 2);
    }
  }, [callback, maxMutations, shouldIgnoreElement, debounceMs]);

  /**
   * Handles mutations from MutationObserver
   */
  const handleMutations = useCallback(
    (mutations: MutationRecord[]) => {
      // Add new mutations to pending list
      pendingMutationsRef.current.push(...mutations);

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set up new debounced processing
      debounceTimerRef.current = setTimeout(processMutations, debounceMs);
    },
    [processMutations, debounceMs]
  );

  /**
   * Sets up the MutationObserver
   */
  const setupObserver = useCallback(() => {
    if (typeof window === "undefined" || !enabled) return;

    // Clean up existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new MutationObserver(handleMutations);

    // Determine targets to observe
    const observeTargets = targets.length > 0 ? targets : [document.body];

    // Start observing each target
    observeTargets.forEach((target) => {
      if (target && target.isConnected) {
        observerRef.current?.observe(target, {
          childList: true,
          subtree: true,
          characterData: true,
          characterDataOldValue: false,
          attributes: true,
          attributeFilter: ["class", "style"], // Watch for class/style changes that might indicate content updates
        });
      }
    });
  }, [enabled, targets, handleMutations]);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    pendingMutationsRef.current = [];
  }, []);

  // Setup observer when enabled or targets change
  useEffect(() => {
    setupObserver();
    return cleanup;
  }, [setupObserver, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    /**
     * Manually trigger processing of pending mutations
     */
    flushPendingMutations: useCallback(() => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      processMutations();
    }, [processMutations]),

    /**
     * Check if observer is currently active
     */
    isObserving: observerRef.current !== null,

    /**
     * Get count of pending mutations
     */
    pendingCount: pendingMutationsRef.current.length,
  };
}
