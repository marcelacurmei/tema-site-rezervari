// Fișierele trimise din panou vin ca text base64 în JSON (Vercel primește cel mult ~4,5 MB pe cerere).
import { randomUUID } from 'node:crypto';

export const MAX_OCTETI = 3 * 1024 * 1024; // 3 MB după micșorarea pozei în browser
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };

/** Verifică fișierul primit. Întoarce { base64, octeti, tip, nume } sau { eroare }. */
export function citesteFisier(d, tipuriPermise) {
  const tip = String(d.tip || '').toLowerCase();
  if (!tipuriPermise.includes(tip)) return { eroare: 'Alegeți o poză (JPG, PNG) sau un PDF.' };
  const base64 = String(d.fisier || '').replace(/^data:[^,]*,/, '');
  if (!base64 || !/^[A-Za-z0-9+/=\s]+$/.test(base64)) return { eroare: 'Fișierul lipsește sau e stricat.' };
  const octeti = Buffer.from(base64, 'base64');
  if (!octeti.length) return { eroare: 'Fișierul e gol.' };
  if (octeti.length > MAX_OCTETI) return { eroare: 'Fișierul e prea mare (cel mult 3 MB).' };
  // Verificăm și conținutul, nu doar ce spune browserul.
  const inceput = octeti.subarray(0, 12);
  const bun = (tip === 'application/pdf' && inceput.toString('latin1', 0, 5) === '%PDF-')
    || (tip === 'image/jpeg' && inceput[0] === 0xff && inceput[1] === 0xd8)
    || (tip === 'image/png' && inceput.toString('latin1', 1, 4) === 'PNG')
    || (tip === 'image/webp' && inceput.toString('latin1', 8, 12) === 'WEBP');
  if (!bun) return { eroare: 'Fișierul nu se potrivește cu tipul lui. Încercați altă poză sau alt PDF.' };
  const nume = String(d.nume || '').replace(/[^\p{L}\p{N} ._()-]/gu, '').slice(0, 120);
  return { base64: octeti.toString('base64'), octeti, tip, nume };
}

export function caleNoua(prefix, tip) {
  const luna = new Date().toISOString().slice(0, 7);
  return `${prefix}/${luna}/${randomUUID()}.${EXT[tip] || 'bin'}`;
}
