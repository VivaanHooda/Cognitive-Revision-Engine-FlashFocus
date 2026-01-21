# PDF Processing - Robust Solution Options

## Current Issues
1. **Unicode escape sequences**: PDFs contain backslashes (`\u`, `\x`) that PostgreSQL misinterprets
2. **Embedding format**: Passing as string `"[1,2,3]"` instead of array `[1,2,3]`
3. **Limited extraction**: pdf-parse doesn't handle images, tables, or complex layouts well

## Option A: Upgrade to pdf.js (RECOMMENDED ✅)

### Why?
- **Industry standard**: Used by Firefox, Chrome PDF viewers
- **Better text extraction**: Proper Unicode handling, preserves layout
- **Future-proof**: Can extract images, tables, metadata
- **Actively maintained**: Regular updates from Mozilla

### Changes Required:
```bash
npm install pdfjs-dist
```

### Code Changes:
- Replace pdf-parse with pdfjs-dist in `lib/ingest.ts`
- Better text extraction with proper encoding
- Fix embedding format to use arrays

### Bundle Impact:
- Add ~200KB to server bundle (only affects API routes)
- No impact on client bundle

### Timeline: ~30 minutes implementation

---

## Option B: Fix Current Implementation

### Changes:
1. Aggressive text sanitization (remove ALL backslashes)
2. Fix embedding format to use arrays
3. Add better error handling

### Limitations:
- Still won't extract images/tables
- Text quality not as good as pdf.js
- May have other encoding issues in the future

### Timeline: ~10 minutes

---

## Recommendation

**Use Option A (pdf.js)** because:
1. Solves encoding issues properly
2. Future-ready for image/table extraction
3. Better text quality
4. Only 30 min vs 10 min but much more robust

## Implementation Plan (Option A)

1. Install pdfjs-dist
2. Update `lib/ingest.ts`:
   - Replace pdf-parse with pdfjs-dist
   - Fix embedding format (string → array)
   - Better text cleaning
3. Test with your problematic PDFs

Would you like me to proceed with **Option A** (pdf.js upgrade)?
