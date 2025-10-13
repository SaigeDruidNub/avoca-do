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

  // Manual blocklist for specific names that should never be translated
  private readonly NAME_BLOCKLIST: Set<string> = new Set([
    // Original English names
    /* "Charity Zielony",
    "Charity S. Zielony", // Missing variation!
    "Charity",
    "Zielony",*/
    // Add more specific names as needed
  ]);

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
   * Checks if text appears to be a name
   */
  private isLikelyName(text: string): boolean {
    const trimmedText = text.trim();

    // Check manual blocklist first (case-insensitive)
    const lowerText = trimmedText.toLowerCase();
    for (const blockedName of this.NAME_BLOCKLIST) {
      if (blockedName.toLowerCase() === lowerText) {
        return true;
      }
    }

    // Skip if text is too long to be a typical name (likely a sentence)
    if (trimmedText.length > 50) {
      return false;
    }

    // Check for usernames or handles (starting with @)
    if (/^@[a-zA-Z0-9_]+$/.test(trimmedText)) {
      return true;
    }

    // Broader name patterns to catch more cases
    // Pattern 1: Traditional names (John, Mary, John Smith)
    const traditionalNamePattern = /^[A-Z][a-z]+(?: [A-Z][a-z]*)*$/;

    // Pattern 2: Names with special characters (O'Brien, Jean-Claude, etc.)
    const specialNamePattern =
      /^[A-Z][a-z]*(?:['-][A-Z]?[a-z]*)*(?:\s[A-Z][a-z]*(?:['-][A-Z]?[a-z]*)*)*$/;

    // Pattern 3: Initials (J.R.R., A.B., etc.)
    const initialPattern = /^[A-Z]\.(?:[A-Z]\.)*(?:\s[A-Z][a-z]*)?$/;

    // Pattern 4: Single capitalized word that could be a name
    const singleWordPattern = /^[A-Z][a-z]+$/;

    const matchesPattern =
      traditionalNamePattern.test(trimmedText) ||
      specialNamePattern.test(trimmedText) ||
      initialPattern.test(trimmedText) ||
      singleWordPattern.test(trimmedText);

    if (matchesPattern) {
      // Skip common words that might be capitalized at start of sentences
      const commonWords = [
        "The",
        "This",
        "That",
        "These",
        "Those",
        "Here",
        "There",
        "Where",
        "When",
        "What",
        "Why",
        "How",
        "Who",
        "Which",
        "Welcome",
        "Hello",
        "Please",
        "Thank",
        "Thanks",
        "Sorry",
        "Yes",
        "No",
        "Maybe",
        "Today",
        "Tomorrow",
        "Yesterday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
        "Create",
        "Update",
        "Delete",
        "Save",
        "Cancel",
        "Submit",
        "Login",
        "Logout",
        "Settings",
        "Profile",
        "Dashboard",
        "Home",
        "About",
        "Contact",
        "Help",
        "Search",
        "Filter",
        "Sort",
        "View",
        "Edit",
        "Add",
        "Remove",
        "Next",
        "Previous",
        "Back",
        "Forward",
        "Close",
        "Open",
      ];

      if (commonWords.includes(trimmedText)) {
        return false;
      }

      // If it's 1-4 words and follows name pattern, likely a name
      const wordCount = trimmedText.split(/\s+/).length;
      const isLikelyName = wordCount <= 4;

      return isLikelyName;
    }

    return false;
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

    // Skip names
    if (this.isLikelyName(trimmedText)) {
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
   * More aggressive name detection for standalone names
   */
  private isVeryLikelyName(text: string): boolean {
    const trimmed = text.trim();

    // Short capitalized words are often names
    if (/^[A-Z][a-z]{1,20}$/.test(trimmed)) {
      return true;
    }

    // Two capitalized words are very likely names
    if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(trimmed)) {
      return true;
    }

    // Three words with middle initial
    if (/^[A-Z][a-z]+ [A-Z]\. [A-Z][a-z]+$/.test(trimmed)) {
      return true;
    }

    return false;
  }

  /**
   * Checks if an element appears to be a name field
   */
  private isNameField(element: Element): boolean {
    // Check element and all ancestors up to 5 levels (increased scope)
    let current: Element | null = element;
    let level = 0;

    while (current && level < 5) {
      // Check class names - much more comprehensive patterns
      const className = current.className || "";
      const nameClassPatterns = [
        // Direct name patterns
        /\bname\b/i,
        /\bfull-?name\b/i,
        /\bfirst-?name\b/i,
        /\blast-?name\b/i,
        /\buser-?name\b/i,
        /\bdisplay-?name\b/i,
        /\bprofile-?name\b/i,
        /\bauthor-?name\b/i,
        /\breal-?name\b/i,
        /\bgiven-?name\b/i,
        /\bsurname\b/i,
        /\bnickname\b/i,
        /\bhandle\b/i,
        // User/profile related
        /\buser\b/i,
        /\bprofile\b/i,
        /\bauthor\b/i,
        /\bmember\b/i,
        /\bperson\b/i,
        /\baccount\b/i,
        // Title/header patterns
        /\btitle\b/i,
        /\bheader\b/i,
        /\bheading\b/i,
        // Avatar/image context (names often near avatars)
        /\bavatar\b/i,
        /\bphoto\b/i,
        /\bpicture\b/i,
        /\bimg\b/i,
        // Card/container patterns
        /\bcard\b/i,
        /\bcontainer\b/i,
        /\bwrapper\b/i,
        /\bbox\b/i,
        // Social/contact patterns
        /\bcontact\b/i,
        /\bsocial\b/i,
        /\bfriend\b/i,
        /\bconnection\b/i,
      ];

      if (nameClassPatterns.some((pattern) => pattern.test(className))) {
        return true;
      }

      // Check data attributes - more comprehensive
      const dataAttrs = Array.from(current.attributes)
        .filter((attr) => attr.name.startsWith("data-"))
        .map((attr) => attr.name);

      const nameDataPatterns = [
        /data-.*name/i,
        /data-.*user/i,
        /data-.*author/i,
        /data-.*profile/i,
        /data-.*member/i,
        /data-.*person/i,
        /data-.*title/i,
      ];

      if (
        dataAttrs.some((attr) =>
          nameDataPatterns.some((pattern) => pattern.test(attr))
        )
      ) {
        return true;
      }

      // Check ID - more patterns
      const id = current.id || "";
      const nameIdPatterns = [
        /\bname\b/i,
        /\buser\b/i,
        /\bauthor\b/i,
        /\bprofile\b/i,
        /\btitle\b/i,
        /\bmember\b/i,
        /\bperson\b/i,
        /\bheader\b/i,
      ];

      if (nameIdPatterns.some((pattern) => pattern.test(id))) {
        return true;
      }

      // Check for semantic elements that often contain names
      const tagName = current.tagName.toLowerCase();
      if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
        // Headers often contain names - be more aggressive here
        const text = current.textContent?.trim() || "";
        if (text && this.isLikelyName(text)) {
          return true;
        }
      }

      // Check for profile/user/card containers - more aggressive
      const contextPatterns = [
        /\b(profile|user|card|avatar|member|person|author|contact)\b/i,
        /\b(bio|about|info|details)\b/i,
        /\b(header|title|name|label)\b/i,
      ];

      if (contextPatterns.some((pattern) => pattern.test(className))) {
        // In these contexts, be very aggressive about protecting text that could be names
        const text = element.textContent?.trim() || "";
        if (text && text.length > 1 && text.length < 100) {
          // If it's short text in a name-context, protect it
          return true;
        }
      }

      // Check for common name field structures
      // Look for elements that are direct children of profile/user containers
      const parentClass = current.parentElement?.className || "";
      if (contextPatterns.some((pattern) => pattern.test(parentClass))) {
        const text = element.textContent?.trim() || "";
        if (text && text.length > 1 && text.length < 50) {
          return true;
        }
      }

      current = current.parentElement;
      level++;
    }

    // Final check: if the text itself looks very much like a name, protect it
    const text = element.textContent?.trim() || "";
    if (text && this.isVeryLikelyName(text)) {
      return true;
    }

    return false;
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

        // Skip if element or ancestor appears to be a name field
        if (this.isNameField(parent)) {
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
    // Check if text should not be translated (including name detection)
    if (!this.shouldTranslate(text)) {
      return text; // Return original text unchanged
    }

    // Check cache first
    const cached = this.getCachedTranslation(text, targetLanguage);
    if (cached) {
      return cached;
    }

    // Check rate limiting
    if (!this.canMakeRequest()) {
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

  /**
   * Adds a name to the blocklist to prevent translation
   */
  addNameToBlocklist(name: string): void {
    this.NAME_BLOCKLIST.add(name.trim());
    // Also clear any existing cached translations for this name
    this.clearCachedTranslation(name.trim());
  }

  /**
   * Clears cached translation for a specific text
   */
  clearCachedTranslation(text: string): void {
    // Clear from all target languages
    Object.keys(this.cache).forEach((key) => {
      if (key.includes(`:${text.trim().toLowerCase()}`)) {
        delete this.cache[key];
      }
    });
  }

  /**
   * Removes a name from the blocklist
   */
  removeNameFromBlocklist(name: string): void {
    this.NAME_BLOCKLIST.delete(name.trim());
  }

  /**
   * Gets all names in the blocklist
   */
  getNameBlocklist(): string[] {
    return Array.from(this.NAME_BLOCKLIST);
  }

  /**
   * Clears cache for all blocked names
   */
  clearBlockedNameCache(): void {
    this.NAME_BLOCKLIST.forEach((name) => {
      this.clearCachedTranslation(name);
    });
  }
}

// Export a singleton instance
export const translationUtils = new TranslationUtils();

// Clear any cached translations for blocked names on initialization
translationUtils.clearBlockedNameCache();

// Also clear any existing translations that might be cached
if (typeof window !== "undefined") {
  // Clear localStorage cache that might have the old translations
  localStorage.removeItem("translationCache");
}

// Make it available globally for debugging
if (typeof window !== "undefined") {
  (window as any).translationUtils = translationUtils;
  (window as any).testNameDetection = (text: string) => {
    const shouldTranslate = translationUtils.shouldTranslate(text);
    const isName = (translationUtils as any).isLikelyName(text);
    return { shouldTranslate, isName };
  };
  (window as any).clearNameCache = () => {
    translationUtils.clearBlockedNameCache();
    // Also clear browser localStorage translation cache
    localStorage.removeItem("translationCache");
  };
  (window as any).debugTranslation = (text: string) => {
    return {
      inBlocklist: translationUtils.getNameBlocklist().includes(text),
      shouldTranslate: translationUtils.shouldTranslate(text),
      isLikelyName: (translationUtils as any).isLikelyName(text),
      isVeryLikelyName: (translationUtils as any).isVeryLikelyName(text),
      blocklistContents: translationUtils.getNameBlocklist(),
    };
  };

  (window as any).inspectElement = (element: Element) => {
    const textNodes = translationUtils.extractTextNodes(element);
    return {
      element: {
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        textContent: element.textContent?.trim(),
      },
      isNameField: (translationUtils as any).isNameField(element),
      shouldTranslateText: translationUtils.shouldTranslate(
        element.textContent?.trim() || ""
      ),
      extractableTextNodes: textNodes.map((n) => n.textContent?.trim()),
    };
  };

  (window as any).inspectBySelector = (selector: string) => {
    const elements = document.querySelectorAll(selector);
    return {
      selector,
      count: elements.length,
      elements: Array.from(elements).map((el, i) =>
        (window as any).inspectElement(el)
      ),
    };
  };
}
