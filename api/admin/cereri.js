// GET   /api/admin/cereri[?status=noua]  – lista cererilor, cele noi sus (doar după logare)
// PATCH /api/admin/cereri  { id, status } – schimbă statusul unei cereri
import { STATUSURI } from '../../public/comun.js';
import { listeazaCereri, schimbaStatus } from '../../lib/supabase.js';
import { cereAdmin, corp, metodaNepermisa } from '../../lib/raspuns.js';

export default async function handler(req, res) {
  if (!['GET', 'PATCH'].includes(req.method)) return metodaNepermisa(res, ['GET', 'PATCH']);
  try {
    if (!(await cereAdmin(req, res))) return;

    if (req.method === 'GET') {
      const status = req.query?.status;
      if (status && !STATUSURI.includes(status)) return res.status(400).json({ ok: false, eroare: 'Status necunoscut' });
      const cereri = await listeazaCereri(status);
      return res.status(200).json({ ok: true, cereri });
    }

    const { id, status } = corp(req);
    if (!Number.isInteger(Number(id)) || !STATUSURI.includes(status)) {
      return res.status(400).json({ ok: false, eroare: 'Date greșite' });
    }
    const rand = await schimbaStatus(Number(id), status);
    if (!rand) return res.status(404).json({ ok: false, eroare: 'Cererea nu există' });
    return res.status(200).json({ ok: true, cerere: rand });
  } catch (e) {
    console.error('Panou – eroare:', e.message);
    return res.status(500).json({ ok: false, eroare: 'Eroare la baza de date' });
  }
}
