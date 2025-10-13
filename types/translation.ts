// Google Cloud Translation API types
export interface GoogleTranslateRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface GoogleTranslateBatchRequest {
  texts: string[];
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface GoogleTranslateResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
}

export interface GoogleTranslateBatchResponse {
  translations: Array<{
    originalText: string;
    translatedText: string;
    detectedSourceLanguage?: string;
  }>;
}

// Auto Translation System types
export interface TranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
    targetLanguage: string;
  };
}

export interface TranslationStats {
  totalTranslations: number;
  successfulTranslations: number;
  failedTranslations: number;
  cacheHits: number;
  lastTranslationTime?: number;
}

export interface AutoTranslationSettings {
  enabled: boolean;
  targetLanguage: string;
  sourceLanguage?: string;
  excludeSelectors: string[];
  batchSize: number;
  debounceMs: number;
  maxRetries: number;
}

export interface MutationData {
  addedNodes: Element[];
  modifiedTextNodes: Text[];
  timestamp: number;
}

// DOM Mutation Observer types
export interface UseDOMMutationOptions {
  enabled: boolean;
  targets?: Element[];
  debounceMs?: number;
  maxMutations?: number;
  ignoreSelectors?: string[];
}

export interface UseDOMMutationReturn {
  flushPendingMutations: () => void;
  isObserving: boolean;
  pendingCount: number;
}

// Translation Utils types
export interface TranslationUtilsConfig {
  cacheExpiry: number;
  maxRequestsPerMinute: number;
  minTextLength: number;
  maxTextLength: number;
}

export interface RateLimitState {
  requests: number;
  resetTime: number;
}

// Component Props types
export interface AutoTranslatorProps {
  observeElements?: Element[];
  onTranslationStart?: () => void;
  onTranslationComplete?: (success: boolean) => void;
  translateOnMount?: boolean;
}

export interface AutoTranslatorControlsProps {
  showAdvancedSettings?: boolean;
  className?: string;
}

// Context types
export interface AutoTranslationContextType {
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
  stats: TranslationStats;

  // Actions
  translateElement: (element: Element) => Promise<void>;
  translateText: (text: string) => Promise<string | null>;
  clearCache: () => void;
  resetStats: () => void;

  // Events
  onTranslationStart?: (element: Element) => void;
  onTranslationComplete?: (element: Element, success: boolean) => void;
  onError?: (error: Error) => void;
}

// Language types (extending existing)
export type SupportedLanguage =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "pt"
  | "zh"
  | "ja"
  | "ko"
  | "ru"
  | "ar"
  | "hi"
  | "th"
  | "vi"
  | "tr"
  | "pl"
  | "nl"
  | "sv"
  | "da"
  | "no"
  | "fi"
  | "cs"
  | "sk"
  | "hu"
  | "ro"
  | "bg"
  | "hr"
  | "sl"
  | "et"
  | "lv"
  | "lt"
  | "mt";

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName?: string;
  flag?: string;
}

// Error types
export class TranslationError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = "TranslationError";
  }
}

export class RateLimitError extends TranslationError {
  constructor(message = "Translation rate limit exceeded") {
    super(message, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
  }
}

export class APIError extends TranslationError {
  constructor(
    message: string,
    public statusCode?: number,
    originalError?: Error
  ) {
    super(message, "API_ERROR", originalError);
    this.name = "APIError";
  }
}

// Utility types
export type TranslationResult = {
  original: string;
  translated: string | null;
  cached: boolean;
  error?: Error;
};

export type BatchTranslationResult = Array<{
  original: string;
  translated: string | null;
}>;

// Configuration types
export interface TranslationConfig {
  apiKey: string;
  endpoint?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// Event types
export interface TranslationStartEvent {
  type: "translation-start";
  element: Element;
  textCount: number;
}

export interface TranslationCompleteEvent {
  type: "translation-complete";
  element: Element;
  success: boolean;
  duration: number;
  translatedCount: number;
}

export interface TranslationErrorEvent {
  type: "translation-error";
  error: Error;
  element?: Element;
  text?: string;
}
