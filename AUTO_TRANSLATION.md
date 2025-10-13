# Auto Translation System

This project includes a comprehensive auto-translation system that automatically translates page content in real-time using Google Cloud Translation API.

## Features

✨ **Real-time Translation**: Automatically translates content as it loads or changes
🔄 **DOM Mutation Monitoring**: Detects new content added to the page dynamically
💾 **Smart Caching**: Caches translations to avoid redundant API calls
⚡ **Rate Limiting**: Built-in rate limiting to prevent API quota exhaustion
🎛️ **User Controls**: Toggle auto-translation on/off with language selection
📊 **Statistics Tracking**: Monitor translation success rates and performance
🎯 **Selective Translation**: Configurable selectors to exclude certain elements
🔧 **Batch Processing**: Efficiently processes multiple texts in batches

## Setup

### 1. Get Google Cloud Translation API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Cloud Translation API
4. Go to "Credentials" and create an API key
5. Restrict the API key to Cloud Translation API (recommended)

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and set your API key:

```bash
GOOGLE_TRANSLATE_API_KEY=your_actual_api_key_here
```

### 3. Usage

The auto-translation system is automatically integrated into your app. Users can:

1. **Enable/Disable**: Toggle auto-translation using the language switcher dropdown
2. **Select Target Language**: Choose which language to translate content to
3. **Monitor Progress**: See translation status and statistics

## Components

### Core Components

- **AutoTranslationProvider**: React context provider managing translation state
- **AutoTranslator**: Main component that orchestrates the translation process
- **AutoTranslatorControls**: UI controls for managing translation settings

### Utilities

- **translationUtils**: Helper functions for text processing and caching
- **useDOMMutation**: Custom hook for monitoring DOM changes
- **API Route**: `/api/translate` - Backend endpoint for Google Translation API

## Configuration

### Default Settings

```typescript
{
  enabled: false,
  targetLanguage: 'en',
  excludeSelectors: [
    '[data-notranslate]',
    'script',
    'style',
    'input',
    'textarea',
    'code',
    'pre'
  ],
  batchSize: 10,
  debounceMs: 500,
  maxRetries: 3
}
```

### Excluding Elements from Translation

Add the `data-notranslate` attribute to elements you don't want translated:

```html
<div data-notranslate>This won't be translated</div>
```

Or add custom selectors to the exclude list in the settings.

## API Endpoints

### POST `/api/translate`

Translate a single text string.

**Request:**

```json
{
  "text": "Hello world",
  "targetLanguage": "es",
  "sourceLanguage": "en" // optional
}
```

**Response:**

```json
{
  "translatedText": "Hola mundo",
  "detectedSourceLanguage": "en"
}
```

### PUT `/api/translate`

Batch translate multiple text strings.

**Request:**

```json
{
  "texts": ["Hello", "World"],
  "targetLanguage": "es",
  "sourceLanguage": "en" // optional
}
```

**Response:**

```json
{
  "translations": [
    {
      "originalText": "Hello",
      "translatedText": "Hola",
      "detectedSourceLanguage": "en"
    },
    {
      "originalText": "World",
      "translatedText": "Mundo",
      "detectedSourceLanguage": "en"
    }
  ]
}
```

## Performance Considerations

### Rate Limiting

- Default: 50 requests per minute
- Automatically throttles requests to prevent quota exhaustion
- Configurable via environment variables

### Caching

- Translations are cached for 24 hours by default
- Cache keys include source text and target language
- Reduces redundant API calls significantly

### Batch Processing

- Multiple texts are batched together for efficiency
- Default batch size: 10 texts per request
- Configurable batch size and debounce timing

## Troubleshooting

### Common Issues

1. **API Key Not Working**

   - Verify the API key is correct
   - Ensure Cloud Translation API is enabled
   - Check API key restrictions

2. **Translations Not Appearing**

   - Check browser console for errors
   - Verify auto-translation is enabled
   - Ensure target language is different from source

3. **Rate Limit Errors**
   - Reduce batch size in settings
   - Increase debounce delay
   - Check your Google Cloud quotas

### Debug Mode

Enable debug logging by setting:

```javascript
localStorage.setItem("debug-translation", "true");
```

## Browser Compatibility

- Chrome 88+
- Firefox 87+
- Safari 14+
- Edge 88+

Requires support for:

- MutationObserver API
- Intersection Observer API
- Fetch API
- ES6+ features

## Security Notes

- API keys should be stored securely
- Consider using service accounts in production
- Rate limiting prevents abuse
- Input sanitization prevents XSS

## Contributing

When adding new features:

1. Update type definitions
2. Add proper error handling
3. Include rate limiting considerations
4. Update documentation
5. Test with various content types

## License

This auto-translation system is part of the main project license.
