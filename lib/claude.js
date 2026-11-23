// Citirea bonurilor și facturilor cu Claude API. Doar pe server; cheia vine din setările Vercel (ANTHROPIC_API_KEY).
import Anthropic from '@anthropic-ai/sdk';

export const CATEGORII = ['Curățenie', 'Utilități', 'Reparații', 'Mobilier și dotări', 'Consumabile', 'Comisioane platforme', 'Altele'];
export const MONEDE = ['MDL', 'EUR', 'USD', 'RON', 'UAH'];
export const TIPURI_DOCUMENT = ['bon', 'factura', 'chitanta', 'alt_document'];
export const TIPURI_FISIER = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['este_document', 'motiv', 'tip_document', 'furnizor', 'numar_document', 'data', 'suma', 'moneda', 'categorie', 'descriere'],
  properties: {
    este_document: { type: 'boolean', description: 'true doar dacă fișierul e un bon, o factură, o chitanță sau alt document de plată' },
    motiv: { type: 'string', description: 'Dacă nu e document: ce se vede în fișier, o propoziție în română. Altfel gol.' },
    tip_document: { type: 'string', enum: TIPURI_DOCUMENT },
    furnizor: { type: 'string', description: 'Magazinul sau firma care a emis documentul' },
    numar_document: { type: 'string', description: 'Numărul bonului sau al facturii, gol dacă lipsește' },
    data: { type: 'string', description: 'Data documentului, AAAA-LL-ZZ, gol dacă nu se vede' },
    suma: { type: 'number', description: 'Totalul de plată, cu TVA' },
    moneda: { type: 'string', enum: MONEDE },
    categorie: { type: 'string', enum: CATEGORII },
    descriere: { type: 'string', description: 'Ce s-a cumpărat, pe scurt, în română (cel mult 200 de caractere)' },
  },
};

const INSTRUCTIUNI = `Ești contabilul unei gazde care închiriază un apartament în regim hotelier la Chișinău (Airport Boutique Residence).
Primești o fotografie făcută cu telefonul sau un PDF. Dacă este un bon fiscal, o factură, o chitanță sau alt document de plată, extrage datele lui.
Dacă nu este un astfel de document (de exemplu o poză cu o cameră, o persoană, un peisaj, o captură de ecran fără sumă de plată), pune este_document = false, explică pe scurt în „motiv” ce se vede și lasă celelalte câmpuri goale sau 0.
Reguli: suma este totalul de plată; moneda implicită este MDL (lei moldovenești) dacă nu scrie altfel; categoria se alege după ce s-a cumpărat
(detergenți, servicii de curățenie → Curățenie; lumină, gaz, apă, internet → Utilități; meșteri, materiale → Reparații; mobilă, electrocasnice, lenjerie → Mobilier și dotări;
cafea, ceai, hârtie igienică, săpun pentru oaspeți → Consumabile; Booking, Airbnb → Comisioane platforme). Nu inventa date care nu se văd: lasă câmpul gol.`;

function client() {
  const cheie = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!cheie) throw new Error('Lipsește ANTHROPIC_API_KEY în setările Vercel');
  // fetch-ul global, ca să meargă la fel pe Vercel și în teste.
  return new Anthropic({ apiKey: cheie, baseURL: 'https://api.anthropic.com', fetch: (...a) => globalThis.fetch(...a), maxRetries: 1, timeout: 120000 });
}

function esteData(t) {
  return /^\d{4}-\d{2}-\d{2}$/.test(t) && !Number.isNaN(Date.parse(t + 'T00:00:00Z'));
}

/** Aduce răspunsul la forma așteptată, oricât de ciudat ar fi. */
export function curataRecunoastere(r) {
  const text = (x, max) => String(x ?? '').trim().slice(0, max);
  const suma = Math.round(Math.max(0, Number(r.suma) || 0) * 100) / 100;
  return {
    este_document: r.este_document === true,
    motiv: text(r.motiv, 300),
    tip_document: TIPURI_DOCUMENT.includes(r.tip_document) ? r.tip_document : 'alt_document',
    furnizor: text(r.furnizor, 200),
    numar_document: text(r.numar_document, 100),
    data: esteData(text(r.data, 10)) ? text(r.data, 10) : '',
    suma,
    moneda: MONEDE.includes(r.moneda) ? r.moneda : 'MDL',
    categorie: CATEGORII.includes(r.categorie) ? r.categorie : 'Altele',
    descriere: text(r.descriere, 1000),
  };
}

/** Trimite fișierul la Claude și întoarce câmpurile recunoscute. */
export async function recunoasteDocument({ base64, tip }) {
  const fisier = tip === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: tip, data: base64 } }
    : { type: 'image', source: { type: 'base64', media_type: tip, data: base64 } };

  const raspuns = await client().beta.messages.create({
    model: (process.env.CLAUDE_MODEL || 'claude-opus-5-5').trim(),
    max_tokens: 8000,
    // Dacă modelul principal refuză, Anthropic încearcă singur un model de rezervă.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: INSTRUCTIUNI,
    messages: [{ role: 'user', content: [fisier, { type: 'text', text: 'Citește acest fișier și completează câmpurile.' }] }],
  });

  if (raspuns.stop_reason === 'refusal') throw new Error('Claude a refuzat să citească fișierul');
  const bloc = raspuns.content.find((b) => b.type === 'text');
  if (!bloc) throw new Error('Claude nu a trimis niciun răspuns');
  return curataRecunoastere(JSON.parse(bloc.text));
}
