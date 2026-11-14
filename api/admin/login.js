// POST /api/admin/login – verifică emailul și parola în Supabase și dă un token pentru panou.
import { logare } from '../../lib/supabase.js';
import { corp, fara_cache, metodaNepermisa } from '../../lib/raspuns.js';

export default async function handler(req, res) {
  fara_cache(res);
  if (req.method !== 'POST') return metodaNepermisa(res, ['POST']);

  const { email, parola } = corp(req);
  if (!email || !parola) return res.status(400).json({ ok: false, eroare: 'Scrieți emailul și parola' });

  try {
    const sesiune = await logare(String(email).trim(), String(parola));
    if (!sesiune) return res.status(401).json({ ok: false, eroare: 'Email sau parolă greșită' });
    return res.status(200).json({ ok: true, token: sesiune.token, expira: Date.now() + sesiune.expiraIn * 1000 });
  } catch (e) {
    console.error('Logarea a eșuat:', e.message);
    return res.status(500).json({ ok: false, eroare: 'Logarea nu merge acum. Verificați setările Supabase.' });
  }
}
