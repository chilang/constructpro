import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json({ limit: '10mb' }));

// ── Gemini OCR Proxy ──────────────────────────────────────
// Keeps API key server-side so it never ships to the client.
app.post('/api/ocr', async (req, res) => {
  const apiKey = process.env.GEMINI_WORKSHOP_API_KEY || process.env.GEMINI_API_KEY;
  const baseUrl = process.env.GEMINI_WORKSHOP_BASE_URL || 'https://generativelanguage.googleapis.com';

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured on server. Set GEMINI_WORKSHOP_API_KEY env var.' });
  }

  const { imageData, mimeType } = req.body;
  if (!imageData) {
    return res.status(400).json({ error: 'imageData is required' });
  }

  const OCR_PROMPT = `You are a receipt OCR assistant for a construction business expense tracker. Analyze this receipt image and extract the following information. Return ONLY valid JSON with this exact structure, no markdown or extra text:

{
  "vendor": "Store or vendor name",
  "date": "YYYY-MM-DD format or null",
  "total": 0.00,
  "description": "Brief description of what was purchased",
  "items": [
    {"description": "Item name", "amount": 0.00}
  ]
}

If you cannot determine a value, use null. The total should be the final amount including tax. Items should be individual line items if visible, otherwise an empty array.`;

  try {
    const response = await fetch(`${baseUrl}/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: OCR_PROMPT },
            { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageData } },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Gemini API error: ${errText}` });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    res.json({
      total: parsed?.total ?? null,
      vendor: parsed?.vendor ?? null,
      date: parsed?.date ?? null,
      description: parsed?.description ?? null,
      items: Array.isArray(parsed?.items) ? parsed.items : [],
      raw: text,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// SPA fallback: serve index.html for all non-file routes
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ConstructPro running on port ${PORT}`);
});
