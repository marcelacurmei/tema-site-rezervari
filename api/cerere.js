// POST /api/cerere – primește cererea din formular, o salvează în Supabase, o pune în CRM (sursa „Site”)
// și anunță pe Telegram.
import { valideaza } from '../public/comun.js';
import { insereazaCerere } from '../lib/supabase.js';
import { mesajCerere, trimiteTelegram } from '../lib/telegram.js';
import { corp, fara_cache, metodaNepermisa } from '../lib/raspuns.js';
import { creeazaClient, detaliiCerere } from '../lib/crm.js';

export default async function handler(req, res) {
  fara_cache(res);
  if (req.method !== 'POST') return metodaNepermisa(res, ['POST']);

  const date = corp(req);
  // Câmp ascuns pe care îl completează doar roboții de spam: îi răspundem „ok” și nu salvăm nimic.
  if (date.site) return res.status(200).json({ ok: true });

  const verificare = valideaza(date);
  if (!verificare.ok) return res.status(400).json({ ok: false, erori: verificare.erori });

  let rand;
  try {
    rand = await insereazaCerere(verificare.curat);
  } catch (e) {
    console.error('Salvarea cererii a eșuat:', e.message);
    return res.status(500).json({ ok: false, eroare: 'salvare' });
  }

  // Cererea intră singură în CRM, pe prima etapă. Dacă nu reușește, cererea rămâne oricum salvată.
  try {
    await creeazaClient({ nume: rand.nume, telefon: rand.telefon, sursa: 'Site', detalii: detaliiCerere(rand), cerere_id: rand.id });
  } catch (e) {
    console.error('Fișa din CRM nu s-a creat:', e.message);
  }

  // Cererea e deja salvată; dacă Telegram nu merge, o vedem oricum în panou.
  try {
    await trimiteTelegram(mesajCerere(rand));
  } catch (e) {
    console.error('Mesajul pe Telegram nu a plecat:', e.message);
  }

  return res.status(200).json({ ok: true, id: rand.id });
}
