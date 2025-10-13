import { NextRequest, NextResponse } from "next/server";

interface TranslateRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

// GET endpoint to test API configuration
export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          status: "error",
          message: "Google Translate API key not configured",
          hasApiKey: false,
        },
        { status: 500 }
      );
    }

    // Test with a simple translation
    const url = "https://translation.googleapis.com/language/translate/v2";
    const params = new URLSearchParams({
      key: apiKey,
      q: "hello",
      target: "es",
      format: "text",
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const responseData = await response.text();

    if (!response.ok) {
      console.error("❌ API test failed:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      });

      return NextResponse.json({
        status: "error",
        message: "API key test failed",
        hasApiKey: true,
        apiStatus: response.status,
        apiError: responseData,
      });
    }

    const data = JSON.parse(responseData);

    return NextResponse.json({
      status: "success",
      message: "Google Translate API is working correctly",
      hasApiKey: true,
      testTranslation:
        data.data?.translations?.[0]?.translatedText || "No translation found",
    });
  } catch (error) {
    console.error("❌ API test error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to test API",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

interface TranslateResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TranslateRequest = await request.json();
    const { text, targetLanguage, sourceLanguage } = body;

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "Missing required fields: text and targetLanguage" },
        { status: 400 }
      );
    }

    // Check if we have the API key
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Translate API key not configured" },
        { status: 500 }
      );
    }

    // Skip translation if text is too short or already in target language
    if (text.trim().length < 2) {
      return NextResponse.json({
        translatedText: text,
        detectedSourceLanguage: sourceLanguage || "unknown",
      });
    }

    // Build the Google Cloud Translation API request
    const url = "https://translation.googleapis.com/language/translate/v2";
    const params = new URLSearchParams({
      key: apiKey,
      q: text,
      target: targetLanguage,
      format: "text",
    });

    if (sourceLanguage) {
      params.append("source", sourceLanguage);
    }

    const response = await fetch(`${url}?${params.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ Google Translate API error:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });

      // More specific error messages based on status code
      let errorMessage = "Translation service unavailable";
      if (response.status === 403) {
        errorMessage = "API key invalid or quota exceeded";
      } else if (response.status === 400) {
        errorMessage = "Invalid translation request parameters";
      } else if (response.status === 429) {
        errorMessage = "Translation rate limit exceeded";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: `HTTP ${response.status}: ${response.statusText}`,
          originalError: errorData,
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (
      data.data &&
      data.data.translations &&
      data.data.translations.length > 0
    ) {
      const translation = data.data.translations[0];

      const result: TranslateResponse = {
        translatedText: translation.translatedText,
        detectedSourceLanguage:
          translation.detectedSourceLanguage || sourceLanguage,
      };

      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: "No translation received" },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Batch translation endpoint for multiple texts
export async function PUT(request: NextRequest) {
  try {
    const body: {
      texts: string[];
      targetLanguage: string;
      sourceLanguage?: string;
    } = await request.json();
    const { texts, targetLanguage, sourceLanguage } = body;

    if (!texts || !Array.isArray(texts) || !targetLanguage) {
      return NextResponse.json(
        { error: "Missing required fields: texts (array) and targetLanguage" },
        { status: 400 }
      );
    }

    // Filter out empty or too short texts
    const validTexts = texts.filter((text) => text.trim().length >= 2);

    if (validTexts.length === 0) {
      return NextResponse.json({
        translations: texts.map((text) => ({
          originalText: text,
          translatedText: text,
          detectedSourceLanguage: sourceLanguage || "unknown",
        })),
      });
    }

    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Translate API key not configured" },
        { status: 500 }
      );
    }

    const url = "https://translation.googleapis.com/language/translate/v2";
    const params = new URLSearchParams({
      key: apiKey,
      target: targetLanguage,
      format: "text",
    });

    // Add all texts as separate 'q' parameters
    validTexts.forEach((text) => {
      params.append("q", text);
    });

    if (sourceLanguage) {
      params.append("source", sourceLanguage);
    }

    const response = await fetch(`${url}?${params.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ Google Translate API batch error:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });

      // More specific error messages based on status code
      let errorMessage = "Translation service unavailable";
      if (response.status === 403) {
        errorMessage = "API key invalid or quota exceeded";
      } else if (response.status === 400) {
        errorMessage = "Invalid batch translation request parameters";
      } else if (response.status === 429) {
        errorMessage = "Translation rate limit exceeded";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: `HTTP ${response.status}: ${response.statusText}`,
          originalError: errorData,
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.data && data.data.translations) {
      const translations = texts.map((originalText, index) => {
        if (originalText.trim().length < 2) {
          return {
            originalText,
            translatedText: originalText,
            detectedSourceLanguage: sourceLanguage || "unknown",
          };
        }

        const validIndex = validTexts.indexOf(originalText);
        const translation = data.data.translations[validIndex];

        return {
          originalText,
          translatedText: translation?.translatedText || originalText,
          detectedSourceLanguage:
            translation?.detectedSourceLanguage || sourceLanguage,
        };
      });

      return NextResponse.json({ translations });
    } else {
      return NextResponse.json(
        { error: "No translations received" },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Batch translation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
