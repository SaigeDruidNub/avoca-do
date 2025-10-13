# Auto Translation Troubleshooting Guide

## Current Status Check

The auto-translation system should now have:

1. ✅ **Debug Panel**: Look for the debug panel in the top-right corner of your browser
2. ✅ **API Key**: Set in `.env.local` as `GOOGLE_TRANSLATE_API_KEY`
3. ✅ **Auto-Enable**: Should auto-enable when switching to non-English languages

## Step-by-Step Testing

### 1. Check the Debug Panel

- Look for the debug panel in the top-right corner
- Check if "Status" shows "Enabled" or "Disabled"
- Note the "Target Language" setting

### 2. Test the Translation API Directly

- In the debug panel, enter some text like "Hello world"
- Click "Test API" button
- Check if you get a translation result or error

### 3. Enable Auto-Translation

- Use the language switcher (globe icon in header)
- Select a non-English language (like Spanish or French)
- Auto-translation should enable automatically
- Or manually toggle it in the debug panel

### 4. Test Element Translation

- Click "Add Test Element" in debug panel
- A yellow box should appear with test text
- If auto-translation is enabled, it should translate automatically

## Common Issues & Solutions

### Issue 1: API Key Not Working

**Symptoms**: API test returns "API key not configured" or 403 error
**Solutions**:

- Verify `GOOGLE_TRANSLATE_API_KEY` in `.env.local`
- Ensure Google Cloud Translation API is enabled
- Check API key restrictions in Google Cloud Console

### Issue 2: Auto-Translation Not Starting

**Symptoms**: Debug panel shows "Disabled", no automatic translation
**Solutions**:

- Switch to a non-English language in language switcher
- Manually click the toggle in the debug panel
- Check browser console for errors

### Issue 3: No Content Being Translated

**Symptoms**: Auto-translation enabled but page content unchanged
**Solutions**:

- Check if content has `data-notranslate` attribute
- Verify content isn't in excluded selectors (scripts, inputs, etc.)
- Look for console logs showing element discovery

### Issue 4: Rate Limiting

**Symptoms**: Translations stop working after a few requests
**Solutions**:

- Wait 1 minute for rate limit reset
- Reduce batch size in settings
- Check Google Cloud quotas

## Debug Console Commands

Open browser console (F12) and run these commands:

```javascript
// Check auto-translation status
localStorage.getItem("autoTranslationSettings");

// Enable debug logging
localStorage.setItem("debug-translation", "true");

// Manually test translation
fetch("/api/translate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "Hello world",
    targetLanguage: "es",
  }),
})
  .then((r) => r.json())
  .then(console.log);
```

## Expected Console Output

When working correctly, you should see console messages like:

- `🔧 AutoTranslationProvider: Locale changed to: [language]`
- `🔧 AutoTranslator: isEnabled changed to: true`
- `🔧 AutoTranslator: Starting translation of existing content...`
- `🔧 AutoTranslator: Found X elements with text content`

## Manual Testing Steps

1. **Start fresh**: Clear browser cache and reload page
2. **Check language**: Switch to Spanish (es) or French (fr)
3. **Verify debug panel**: Should show "Enabled" status
4. **Test API**: Use debug panel to test translation
5. **Add test element**: Click "Add Test Element" button
6. **Watch console**: Check for debug messages

## If Still Not Working

1. **Restart development server**:

   ```bash
   # Kill existing processes
   taskkill /F /IM node.exe
   # Clear cache and restart
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

2. **Check API key validity**:

   - Test in Google Cloud Console
   - Verify quotas and billing

3. **Browser issues**:

   - Try incognito/private mode
   - Clear all browser data
   - Try different browser

4. **Network issues**:
   - Check if API requests are blocked by firewall
   - Verify ngrok tunnel is working
   - Test direct localhost access

## Success Indicators

✅ Debug panel shows "Enabled"  
✅ API test returns translated text  
✅ Test element appears and gets translated  
✅ Console shows discovery and translation messages  
✅ Page content changes when switching languages

If you see all these indicators, the auto-translation system is working correctly!
