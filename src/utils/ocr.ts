/**
 * Receipt OCR using Gemini Vision via server proxy.
 * API key stays server-side — never exposed to the client.
 */

export interface OCRResult {
  total: number | null;
  vendor: string | null;
  date: string | null;
  description: string | null;
  items: { description: string; amount: number }[];
  raw: string;
}

export async function scanReceipt(imageBase64: string): Promise<OCRResult> {
  // Strip data URL prefix and extract mime type
  const mimeMatch = imageBase64.match(/^data:(image\/[^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const base64Data = imageBase64.replace(/^data:image\/[^;]+;base64,/, '');

  const response = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData: base64Data, mimeType }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'OCR request failed' }));
    throw new Error(err.error || `OCR error: ${response.status}`);
  }

  return response.json();
}
