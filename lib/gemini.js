// Generarea imaginilor cu Google Gemini („Nano Banana”). Doar pe server; cheia vine din setările Vercel (GEMINI_API_KEY).

export const STILURI = {
  catalog: {
    nume: 'Fotografie de catalog',
    format: '4:3',
    text: 'Turn this phone photo of a short-term rental apartment into a professional real-estate catalog photograph: '
      + 'bright soft natural daylight, balanced white balance, straight vertical lines, tidy and decluttered, crisp details, inviting atmosphere. '
      + 'Keep exactly the same room, layout, furniture, colours and architecture. Do not add or remove furniture, windows or doors. No text, no watermark.',
  },
  postare: {
    nume: 'Postare pătrată (Instagram / Facebook)',
    format: '1:1',
    text: 'Create a warm, cozy square social media image for a boutique apartment near Chișinău airport, based on this photo of the apartment. '
      + 'Keep the same room and furniture, make it look bright and welcoming, like a lifestyle hotel photo, with soft golden light. '
      + 'Leave some calm empty space at the top for a caption. No text, no logos, no watermark.',
  },
  story: {
    nume: 'Story vertical (9:16)',
    format: '9:16',
    text: 'Create a vertical 9:16 story image for a boutique apartment near Chișinău airport, based on this photo of the apartment. '
      + 'Keep the same room and furniture, extend the scene naturally to the vertical frame, bright welcoming light, premium travel feeling. '
      + 'No text, no logos, no watermark.',
  },
};

const MODEL_IMPLICIT = 'gemini-3.1-flash-image'; // Nano Banana 2
const MODEL_REZERVA = 'gemini-2.5-flash-image'; // Nano Banana (primul)

function cheie() {
  const k = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!k) throw new Error('Lipsește GEMINI_API_KEY în setările Vercel');
  return k;
}

async function apel(model, corp) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cheie() },
    body: JSON.stringify(corp),
  });
  const date = await r.json().catch(() => ({}));
  return { status: r.status, date };
}

/** Din poza apartamentului face o imagine nouă. Întoarce { base64, tip }. */
export async function genereazaImagine({ base64, tip, stil, dorinte = '' }) {
  const s = STILURI[stil];
  if (!s) throw new Error('Stil necunoscut');
  let text = s.text;
  if (dorinte) text += `\nExtra wishes from the host (may be in Romanian or Russian): ${dorinte}`;
  const corp = {
    contents: [{ role: 'user', parts: [{ inlineData: { mimeType: tip, data: base64 } }, { text }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: s.format } },
  };

  const ales = (process.env.GEMINI_IMAGE_MODEL || MODEL_IMPLICIT).trim();
  let { status, date } = await apel(ales, corp);
  if (status === 404 && ales !== MODEL_REZERVA) ({ status, date } = await apel(MODEL_REZERVA, corp));
  if (status === 429) throw Object.assign(new Error('Google: prea multe cereri sau limita de plată atinsă'), { cod: 'limita_furnizor' });
  if (status !== 200) throw new Error(`Gemini ${status}: ${(date.error && date.error.message) || 'eroare'}`.slice(0, 300));

  const parti = date.candidates?.[0]?.content?.parts || [];
  const img = parti.find((p) => p.inlineData || p.inline_data);
  if (!img) {
    const motiv = date.candidates?.[0]?.finishReason || date.promptFeedback?.blockReason || 'fără imagine';
    throw Object.assign(new Error(`Gemini nu a trimis imaginea (${motiv})`), { cod: 'fara_imagine' });
  }
  const d = img.inlineData || img.inline_data;
  return { base64: d.data, tip: d.mimeType || d.mime_type || 'image/png' };
}
