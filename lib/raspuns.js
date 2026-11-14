// Mici ajutoare comune pentru funcțiile din api/.
import { utilizator } from './supabase.js';

export function corp(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

export function fara_cache(res) {
  res.setHeader('Cache-Control', 'no-store');
}

export function metodaNepermisa(res, permise) {
  res.setHeader('Allow', permise.join(', '));
  return res.status(405).json({ ok: false, eroare: 'Metodă nepermisă' });
}

/** Lasă mai departe doar cererile cu un token valid de la logare. Altfel răspunde 401 și întoarce null. */
export async function cereAdmin(req, res) {
  fara_cache(res);
  const antet = req.headers.authorization || req.headers.Authorization || '';
  const token = antet.startsWith('Bearer ') ? antet.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ ok: false, eroare: 'Trebuie să vă logați' });
    return null;
  }
  const user = await utilizator(token);
  if (!user || !user.id) {
    res.status(401).json({ ok: false, eroare: 'Sesiunea a expirat. Logați-vă din nou.' });
    return null;
  }
  const permisi = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (permisi.length && !permisi.includes(String(user.email || '').toLowerCase())) {
    res.status(403).json({ ok: false, eroare: 'Acest cont nu are acces la panou' });
    return null;
  }
  return user;
}
