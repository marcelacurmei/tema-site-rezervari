// GET  /api/admin/telegram – e pornit Telegram? Cine i-a scris botului (ca să aflăm ID-ul de chat)?
// POST /api/admin/telegram – trimite un mesaj de probă.
// POST /api/admin/telegram { actiune: 'mini' } – pune butonul de meniu al botului să deschidă Mini App-ul (/mini).
import { chaturiRecente, conecteazaMiniApp, numeBot, telegramConfigurat, trimiteTelegram } from '../../lib/telegram.js';
import { cereAdmin, corp, metodaNepermisa } from '../../lib/raspuns.js';
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
    let bot = '';
    if (stare.areToken && !stare.areChat) {
      try { chaturi = await chaturiRecente(); } catch (e) { eroare = e.message; }
    }
    if (stare.areToken) {
      try { bot = await numeBot(); } catch (e) { eroare = eroare || e.message; }
    }
    return res.status(200).json({ ok: true, ...stare, chaturi, eroare, bot, mini: adresaMini(req) });
  }

  if (corp(req).actiune === 'mini') {
    try {
      const bot = await conecteazaMiniApp(adresaMini(req));
      return res.status(200).json({ ok: true, bot, mini: adresaMini(req) });
    } catch (e) {
      return res.status(200).json({ ok: false, eroare: e.message });
    }
  }

  try {
    await trimiteTelegram(`✅ Probă: notificările de pe site funcționează.\n🕒 ${formatOra(new Date().toISOString())}`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: false, eroare: e.message });
  }
}

/** Adresa publică a Mini App-ului, de pe domeniul pe care e deschis panoul. */
export function adresaMini(req) {
  const fix = (process.env.SITE_URL || '').trim().replace(/\/+$/, '');
  if (fix) return `${fix}/mini`;
  const gazda = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000').split(',')[0].trim();
  const protocol = /^localhost|^127\./.test(gazda) ? 'http' : 'https';
  return `${protocol}://${gazda}/mini`;
}
