// Ce folosesc toate filele panoului: sesiunea, apelurile la server și construirea elementelor.

export const $ = (id) => document.getElementById(id);

let token = null;
let laNeautorizat = () => {};
export const laIesire = (fn) => { laNeautorizat = fn; };

export function citesteSesiune() {
  try {
    const s = JSON.parse(sessionStorage.getItem('sesiune') || 'null');
    if (s && s.token && s.expira > Date.now() + 30000) token = s.token;
  } catch { /* fără memorie – trebuie logare */ }
  return token;
}
export function salveazaSesiune(t, expira) {
  token = t;
  try { sessionStorage.setItem('sesiune', JSON.stringify({ token: t, expira })); } catch { /* nu e grav */ }
}
export function stergeSesiune() {
  token = null;
  try { sessionStorage.removeItem('sesiune'); } catch { /* nu e grav */ }
}

/** Apel la server cu tokenul de logare. Aruncă Error('neautorizat') dacă sesiunea a expirat. */
export async function api(cale, optiuni = {}) {
  const r = await fetch(cale, {
    ...optiuni,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(optiuni.headers || {}) },
  });
  const date = await r.json().catch(() => ({}));
  if (r.status === 401 || r.status === 403) {
    stergeSesiune();
    laNeautorizat(date.eroare || 'Sesiunea a expirat. Logați-vă din nou.');
    throw new Error('neautorizat');
  }
  if (!r.ok || date.ok === false) throw Object.assign(new Error(date.eroare || `Eroare ${r.status}`), { date, status: r.status });
  return date;
}

export function el(tag, props = {}, ...copii) {
  const n = document.createElement(tag);
  const { dataset, ...rest } = props;
  Object.assign(n, rest);
  if (dataset) Object.assign(n.dataset, dataset);
  for (const c of copii) if (c != null && c !== false) n.append(c);
  return n;
}

/** Citește un fișier ca base64. Pozele mari le micșorăm (latura cea mai lungă ≤ max px) ca să încapă în cerere. */
export async function pregatesteFisier(fisier, { max = 2000, calitate = 0.88 } = {}) {
  if (fisier.type === 'application/pdf') {
    if (fisier.size > 3 * 1024 * 1024) throw new Error('PDF-ul e prea mare (cel mult 3 MB).');
    return { base64: await caBase64(fisier), tip: 'application/pdf', nume: fisier.name, previzualizare: null };
  }
  if (!fisier.type.startsWith('image/')) throw new Error('Alegeți o poză sau un PDF.');
  let bmp;
  try {
    bmp = await createImageBitmap(fisier, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('Poza nu poate fi deschisă. Încercați JPG sau PNG.');
  }
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  const url = c.toDataURL('image/jpeg', calitate);
  return { base64: url.split(',')[1], tip: 'image/jpeg', nume: fisier.name.replace(/\.\w+$/, '') + '.jpg', previzualizare: url };
}

function caBase64(fisier) {
  return new Promise((ok, nu) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(',')[1]);
    r.onerror = () => nu(new Error('Fișierul nu poate fi citit.'));
    r.readAsDataURL(fisier);
  });
}

export const formatSuma = (s, m) => `${Number(s).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${m}`;
