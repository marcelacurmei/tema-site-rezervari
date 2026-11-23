// GET   /api/admin/crm                        – toți clienții, cu istoricul mutărilor (doar după logare)
// POST  /api/admin/crm  { nume, telefon, notite } – client adăugat de mână (sursa „Manual”)
// PATCH /api/admin/crm  { id, etapa } sau { id, notite } – mută fișa în altă etapă / salvează notițele
import { cereAdmin, corp, metodaNepermisa } from '../../lib/raspuns.js';
import { ETAPE, creeazaClient, listeazaClienti, mutaClient, schimbaNotite } from '../../lib/crm.js';
import { curataTelefon } from '../../public/comun.js';

export default async function handler(req, res) {
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) return metodaNepermisa(res, ['GET', 'POST', 'PATCH']);
  try {
    if (!(await cereAdmin(req, res))) return;

    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, etape: ETAPE, clienti: await listeazaClienti() });
    }

    const d = corp(req);

    if (req.method === 'POST') {
      const nume = String(d.nume ?? '').trim().replace(/\s+/g, ' ');
      const telefon = curataTelefon(d.telefon);
      const notite = String(d.notite ?? '').trim();
      const erori = {};
      if (nume.length < 2 || !/\p{L}/u.test(nume)) erori.nume = 'Scrieți numele (cel puțin 2 litere).';
      else if (nume.length > 100) erori.nume = 'Numele e prea lung.';
      if (telefon && !/^\+?\d{7,15}$/.test(telefon)) erori.telefon = 'Număr greșit. Exemplu: +373 69 123 456.';
      if (notite.length > 5000) erori.notite = 'Notițele sunt prea lungi.';
      if (Object.keys(erori).length) return res.status(400).json({ ok: false, erori, eroare: Object.values(erori)[0] });
      const client = await creeazaClient({ nume, telefon, sursa: 'Manual', notite });
      return res.status(201).json({ ok: true, client });
    }

    const id = Number(d.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ ok: false, eroare: 'Date greșite' });
    let client;
    if (d.etapa !== undefined) {
      if (!ETAPE.includes(d.etapa)) return res.status(400).json({ ok: false, eroare: 'Etapă necunoscută' });
      client = await mutaClient(id, d.etapa);
    } else if (typeof d.notite === 'string') {
      if (d.notite.length > 5000) return res.status(400).json({ ok: false, eroare: 'Notițele sunt prea lungi.' });
      client = await schimbaNotite(id, d.notite.trim());
    } else {
      return res.status(400).json({ ok: false, eroare: 'Date greșite' });
    }
    if (!client) return res.status(404).json({ ok: false, eroare: 'Clientul nu există' });
    return res.status(200).json({ ok: true, client });
  } catch (e) {
    console.error('CRM – eroare:', e.message);
    const lipsaTabel = /clienti|istoric_etape/.test(e.message) && /does not exist|42P01|PGRST20/.test(e.message);
    return res.status(500).json({ ok: false, eroare: lipsaTabel ? 'Lipsesc tabelele CRM. Rulați supabase/tema2.sql în Supabase.' : 'Eroare la baza de date' });
  }
}
