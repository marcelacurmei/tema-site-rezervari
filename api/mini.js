// Telegram Mini App (pagina /mini). Orice cerere cu date se face doar cu initData semnat de Telegram.
// GET  /api/mini                                  – doar numele public al botului (pentru linkul „Deschide în Telegram”)
// POST /api/mini { actiune: 'start', initData }    – salutul cu numele din Telegram + cererile proprii
// POST /api/mini { actiune: 'cerere', initData, sosire, plecare, oaspeti, telefon, comentariu } – cerere nouă → CRM, sursa „Telegram”
import { valideaza } from '../public/comun.js';
import { cerereRest, insereazaCerere, v } from '../lib/supabase.js';
import { apel, mesajCerere, mesajConfirmareOaspete, numeBot, trimiteTelegram } from '../lib/telegram.js';
import { numeTelegram, verificaInitData } from '../lib/telegram-mini.js';
import { creeazaClient, detaliiCerere } from '../lib/crm.js';
import { corp, fara_cache, metodaNepermisa } from '../lib/raspuns.js';

const MAX_CERERI_PE_ZI = 5;
const LIMBI = ['ro', 'ru', 'uk', 'en'];

function limbaDin(user) {
  const l = String(user.language_code || '').slice(0, 2).toLowerCase();
  return LIMBI.includes(l) ? l : 'en';
}

async function cererileMele(telegramId) {
  return cerereRest(`cereri?select=id,created_at,sosire,plecare,oaspeti,status&telegram_id=eq.${v(telegramId)}&order=created_at.desc&limit=10`);
}

export default async function handler(req, res) {
  fara_cache(res);
  if (req.method === 'GET') {
    let bot = '';
    try { if ((process.env.TELEGRAM_BOT_TOKEN || '').trim()) bot = await numeBot(); } catch { /* fără nume */ }
    return res.status(200).json({ ok: true, bot });
  }
  if (req.method !== 'POST') return metodaNepermisa(res, ['GET', 'POST']);

  const d = corp(req);
  const sesiune = verificaInitData(d.initData, (process.env.TELEGRAM_BOT_TOKEN || '').trim());
  if (!sesiune) return res.status(401).json({ ok: false, eroare: 'doar_telegram' });
  const { user } = sesiune;
  const nume = numeTelegram(user);
  const limba = limbaDin(user);

  try {
    if (d.actiune === 'start') {
      return res.status(200).json({ ok: true, nume, prenume: user.first_name || nume, limba, cereri: await cererileMele(user.id) });
    }

    if (d.actiune === 'cerere') {
      const recente = await cerereRest(`cereri?select=id&telegram_id=eq.${v(user.id)}&created_at=gte.${v(new Date(Date.now() - 86400000).toISOString())}`);
      if (recente.length >= MAX_CERERI_PE_ZI) return res.status(429).json({ ok: false, eroare: 'prea_multe' });

      let verificare = valideaza({ ...d, nume, limba });
      // Unele nume din Telegram sunt doar emoji – atunci punem un nume neutru, ca cererea să nu se piardă.
      if (verificare.erori.nume) verificare = valideaza({ ...d, nume: user.username ? `Telegram @${user.username}` : 'Oaspete din Telegram', limba });
      if (!verificare.ok) return res.status(400).json({ ok: false, erori: verificare.erori });

      const rand = await insereazaCerere({ ...verificare.curat, sursa: 'Telegram', telegram_id: user.id });
      try {
        await creeazaClient({ nume: rand.nume, telefon: rand.telefon, sursa: 'Telegram', detalii: detaliiCerere(rand), cerere_id: rand.id, telegram_id: user.id });
      } catch (e) {
        console.error('Fișa din CRM nu s-a creat:', e.message);
      }
      const usernameLinie = user.username ? `\n✈️ <b>Telegram:</b> @${user.username}` : '';
      await trimiteTelegram(mesajCerere(rand) + usernameLinie).catch((e) => console.error('Telegram gazdă:', e.message));
      await apel('sendMessage', { chat_id: user.id, text: mesajConfirmareOaspete(limba, user.first_name || nume), parse_mode: 'HTML' })
        .catch((e) => console.error('Telegram oaspete:', e.message));
      return res.status(200).json({ ok: true, id: rand.id, cereri: await cererileMele(user.id) });
    }

    return res.status(400).json({ ok: false, eroare: 'actiune' });
  } catch (e) {
    console.error('Mini App – eroare:', e.message);
    return res.status(500).json({ ok: false, eroare: 'server' });
  }
}
