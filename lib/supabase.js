// Legătura cu Supabase (baza de date și logarea), doar pe server.
// Cheile vin din setările Vercel (variabile de mediu), niciodată din cod.

function config() {
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const cheie = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !cheie) throw new Error('Lipsesc SUPABASE_URL sau SUPABASE_SECRET_KEY în setările Vercel');
  return { url, cheie };
}

function antete(cheie, extra = {}) {
  const h = { apikey: cheie, 'Content-Type': 'application/json' };
  // Cheile vechi (JWT) merg și în Authorization; cele noi („sb_secret_…”) doar în apikey.
  if (!cheie.startsWith('sb_')) h.Authorization = `Bearer ${cheie}`;
  return { ...h, ...extra };
}

async function cerereRest(cale, { method = 'GET', body, prefer } = {}) {
  const { url, cheie } = config();
  const extra = prefer ? { Prefer: prefer } : {};
  const r = await fetch(`${url}/rest/v1/${cale}`, {
    method,
    headers: antete(cheie, extra),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

export async function insereazaCerere(cerere) {
  const randuri = await cerereRest('cereri', { method: 'POST', body: cerere, prefer: 'return=representation' });
  return randuri[0];
}

export async function listeazaCereri(status) {
  let cale = 'cereri?select=*&order=created_at.desc,id.desc&limit=500';
  if (status) cale += `&status=eq.${encodeURIComponent(status)}`;
  return cerereRest(cale);
}

export async function schimbaStatus(id, status) {
  const randuri = await cerereRest(`cereri?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH', body: { status }, prefer: 'return=representation',
  });
  return randuri[0] || null;
}

/** Logare cu email și parolă (utilizatorul se creează în Supabase → Authentication). */
export async function logare(email, parola) {
  const { url, cheie } = config();
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: antete(cheie),
    body: JSON.stringify({ email, password: parola }),
  });
  if (r.status === 400 || r.status === 401 || r.status === 422) return null;
  if (!r.ok) throw new Error(`Supabase auth ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const date = await r.json();
  return { token: date.access_token, expiraIn: date.expires_in };
}

/** Verifică tokenul primit de la panou; întoarce utilizatorul sau null. */
export async function utilizator(token) {
  const { url, cheie } = config();
  const r = await fetch(`${url}/auth/v1/user`, {
    headers: { ...antete(cheie), Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  return r.json();
}
