interface TranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
    targetLanguage: string;
  };
}

interface RateLimitState {
  requests: number;
  resetTime: number;
}

class TranslationUtils {
  private cache: TranslationCache = {};
  private rateLimiter: RateLimitState = {
    requests: 0,
    resetTime: Date.now() + 60000,
  };
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_REQUESTS_PER_MINUTE = 50;
  private readonly MIN_TEXT_LENGTH = 2;
  private readonly MAX_TEXT_LENGTH = 5000;

  /**
   * Creates a cache key for a translation
   */
  private getCacheKey(text: string, targetLanguage: string): string {
    return `${targetLanguage}:${text.trim().toLowerCase()}`;
  }

  /**
   * Checks if we can make a request (rate limiting)
   */
  private canMakeRequest(): boolean {
    const now = Date.now();

    // Reset counter if minute has passed
    if (now > this.rateLimiter.resetTime) {
      this.rateLimiter.requests = 0;
      this.rateLimiter.resetTime = now + 60000;
    }

    return this.rateLimiter.requests < this.MAX_REQUESTS_PER_MINUTE;
  }

  /**
   * Increments the rate limiter counter
   */
  private incrementRateLimit(): void {
    this.rateLimiter.requests++;
  }

  /**
   * Checks if text should be translated
   */
  shouldTranslate(text: string): boolean {
    const trimmedText = text.trim();

    // Skip empty, too short, or too long text
    if (
      trimmedText.length < this.MIN_TEXT_LENGTH ||
      trimmedText.length > this.MAX_TEXT_LENGTH
    ) {
      return false;
    }

    // Skip if it's only numbers, punctuation, or symbols
    const textOnlyRegex = /^[^\w\s]*$|^\d+[^\w]*$/;
    if (textOnlyRegex.test(trimmedText)) {
      return false;
    }

    // Skip URLs
    const urlRegex = /(https?:\/\/|www\.)/;
    if (urlRegex.test(trimmedText)) {
      return false;
    }

    // Skip email addresses
    const emailRegex = /\S+@\S+\.\S+/;
    if (emailRegex.test(trimmedText)) {
      return false;
    }

    return true;
  }

  /**
   * Gets cached translation if available and not expired
   */
  getCachedTranslation(text: string, targetLanguage: string): string | null {
    const key = this.getCacheKey(text, targetLanguage);
    const cached = this.cache[key];

    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_EXPIRY) {
      delete this.cache[key];
      return null;
    }

    return cached.translation;
  }

  /**
   * Caches a translation
   */
  setCachedTranslation(
    text: string,
    targetLanguage: string,
    translation: string
  ): void {
    const key = this.getCacheKey(text, targetLanguage);
    this.cache[key] = {
      translation,
      timestamp: Date.now(),
      targetLanguage,
    };
  }

  /**
   * Extracts translatable text nodes from an element
   */
  extractTextNodes(element: Element): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        // Skip if parent is a script, style, or other non-content element
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tagName = parent.tagName.toLowerCase();
        const skipTags = [
          "script",
          "style",
          "noscript",
          "textarea",
          "input",
          "button",
          "code",
          "pre",
        ];

        if (skipTags.includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        // Skip if parent has data-notranslate attribute
        if (
          parent.hasAttribute("data-notranslate") ||
          parent.closest("[data-notranslate]")
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        // Skip if text is not worth translating
        const text = node.textContent?.trim() || "";
        if (!this.shouldTranslate(text)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    return textNodes;
  }

  /**
   * Translates text using the API
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<string | null> {
    // Check cache first
    const cached = this.getCachedTranslation(text, targetLanguage);
    if (cached) {
      return cached;
    }

    // Check rate limiting
    if (!this.canMakeRequest()) {
      console.warn("Translation rate limit exceeded");
      return null;
    }

    try {
      this.incrementRateLimit();

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          targetLanguage,
          sourceLanguage,
        }),
      });

      if (!response.ok) {
        console.error("Translation API error:", response.statusText);
        return null;
      }

      const data = await response.json();

      if (data.translatedText) {
        // Cache the result
        this.setCachedTranslation(text, targetLanguage, data.translatedText);
        return data.translatedText;
      }

      return null;
    } catch (error) {
      console.error("Translation error:", error);
      return null;
    }
  }

  /**
   * Translates multiple texts in batch
   */
  async translateBatch(
    texts: string[],
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<Array<{ original: string; translated: string | null }>> {
    // Filter out cached translations and invalid texts
    const toTranslate: Array<{ text: string; index: number }> = [];
    const results: Array<{ original: string; translated: string | null }> = [];

    texts.forEach((text, index) => {
      results[index] = { original: text, translated: null };

      if (!this.shouldTranslate(text)) {
        results[index].translated = text; // Keep as is
        return;
      }

      const cached = this.getCachedTranslation(text, targetLanguage);
      if (cached) {
        results[index].translated = cached;
        return;
      }

      toTranslate.push({ text, index });
    });

    // If nothing to translate, return results
    if (toTranslate.length === 0) {
      return results;
    }

    // Check rate limiting
    if (!this.canMakeRequest()) {
      console.warn("Translation rate limit exceeded for batch");
      return results;
    }

    try {
      this.incrementRateLimit();

      const response = await fetch("/api/translate", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texts: toTranslate.map((item) => item.text),
          targetLanguage,
          sourceLanguage,
        }),
      });

      if (!response.ok) {
        console.error("Batch translation API error:", response.statusText);
        return results;
      }

      const data = await response.json();

      if (data.translations) {
        toTranslate.forEach((item, batchIndex) => {
          const translation = data.translations[batchIndex];
          if (translation?.translatedText) {
            results[item.index].translated = translation.translatedText;
            // Cache the result
            this.setCachedTranslation(
              item.text,
              targetLanguage,
              translation.translatedText
            );
          }
        });
      }

      return results;
    } catch (error) {
      console.error("Batch translation error:", error);
      return results;
    }
  }

  /**
   * Replaces text content in a text node
   */
  replaceTextNodeContent(textNode: Text, newText: string): void {
    if (textNode.textContent !== newText) {
      textNode.textContent = newText;
    }
  }

  /**
   * Clears expired cache entries
   */
  cleanupCache(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach((key) => {
      if (now - this.cache[key].timestamp > this.CACHE_EXPIRY) {
        delete this.cache[key];
      }
    });
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: Object.keys(this.cache).length,
      hitRate: 0, // Would need to track hits/misses for this
    };
  }

  /**
   * Clears all cached translations
   */
  clearCache(): void {
    this.cache = {};
  }
}

// Export a singleton instance
export const translationUtils = new TranslationUtils();
