// GET  /api/admin/telegram – e pornit Telegram? Cine i-a scris botului (ca să aflăm ID-ul de chat)?
// POST /api/admin/telegram – trimite un mesaj de probă.
import { chaturiRecente, telegramConfigurat, trimiteTelegram } from '../../lib/telegram.js';
import { cereAdmin, metodaNepermisa } from '../../lib/raspuns.js';
import { formatOra } from '../../public/comun.js';

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return metodaNepermisa(res, ['GET', 'POST']);
  try {
    if (!(await cereAdmin(req, res))) return;
  } catch (e) {
    console.error('Panou – eroare:', e.message);
    return res.status(500).json({ ok: false, eroare: 'Eroare la verificarea logării' });
  }

  const stare = telegramConfigurat();

  if (req.method === 'GET') {
    let chaturi = [];
    let eroare = null;
    if (stare.areToken && !stare.areChat) {
      try { chaturi = await chaturiRecente(); } catch (e) { eroare = e.message; }
    }
    return res.status(200).json({ ok: true, ...stare, chaturi, eroare });
  }

  try {
    await trimiteTelegram(`✅ Probă: notificările de pe site funcționează.\n🕒 ${formatOra(new Date().toISOString())}`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: false, eroare: e.message });
  }
}
