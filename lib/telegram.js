// Mesajele pe Telegram, doar pe server. Tokenul botului și ID-ul chat-ului vin din setările Vercel.
import { formatData, formatOra, noptiIntre } from '../public/comun.js';

const LIMBI = { ro: 'română', ru: 'rusă', uk: 'ucraineană', en: 'engleză' };

function esc(text) {
  return String(text ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function mesajCerere(r) {
  const nopti = noptiIntre(r.sosire, r.plecare);
  const linii = [
    `🏠 <b>Cerere nouă #${esc(r.id)}</b> – Airport Boutique Residence`,
    '',
    `📍 <b>Sursa:</b> ${esc(r.sursa || 'Site')}`,
    `👤 <b>Nume:</b> ${esc(r.nume)}`,
    `📞 <b>Telefon:</b> ${esc(r.telefon)}`,
    `📅 <b>Sosire:</b> ${formatData(r.sosire)}`,
    `📅 <b>Plecare:</b> ${formatData(r.plecare)} (${nopti} ${nopti === 1 ? 'noapte' : 'nopți'})`,
    `👥 <b>Oaspeți:</b> ${esc(r.oaspeti)}`,
    `💬 <b>Comentariu:</b> ${r.comentariu ? esc(r.comentariu) : '—'}`,
    `🌐 <b>Limba:</b> ${LIMBI[r.limba] || esc(r.limba)}`,
    `🕒 <b>Primită:</b> ${formatOra(r.created_at)} (ora Chișinăului)`,
  ];
  return linii.join('\n');
}

function token() {
  const t = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  if (!t) throw new Error('Lipsește TELEGRAM_BOT_TOKEN în setările Vercel');
  return t;
}

export async function apel(metoda, body) {
  const r = await fetch(`https://api.telegram.org/bot${token()}/${metoda}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const date = await r.json().catch(() => ({}));
  if (!r.ok || !date.ok) throw new Error(`Telegram ${metoda}: ${date.description || r.status}`);
  return date.result;
}

export function telegramConfigurat() {
  return {
    areToken: Boolean((process.env.TELEGRAM_BOT_TOKEN || '').trim()),
    areChat: Boolean((process.env.TELEGRAM_CHAT_ID || '').trim()),
  };
}

export async function trimiteTelegram(text) {
  const chat = (process.env.TELEGRAM_CHAT_ID || '').trim();
  if (!chat) throw new Error('Lipsește TELEGRAM_CHAT_ID în setările Vercel');
  return apel('sendMessage', { chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true });
}

/** Cine i-a scris recent botului – ca utilizatoarea să-și afle ID-ul de chat din panou. */
export async function chaturiRecente() {
  const actualizari = await apel('getUpdates', { limit: 50 });
  const chaturi = new Map();
  for (const a of actualizari) {
    const m = a.message || a.edited_message || a.channel_post || a.my_chat_member;
    const c = m && m.chat;
    if (!c) continue;
    const nume = c.title || [c.first_name, c.last_name].filter(Boolean).join(' ') || c.username || '';
    chaturi.set(String(c.id), { id: String(c.id), nume, tip: c.type });
  }
  return [...chaturi.values()];
}

let botMemorat = null;
/** Numele botului (@nume), aflat de la Telegram o singură dată. */
export async function numeBot() {
  if (botMemorat) return botMemorat;
  const eu = await apel('getMe');
  botMemorat = eu.username || '';
  return botMemorat;
}

/** Pune butonul de meniu al botului să deschidă Mini App-ul. */
export async function conecteazaMiniApp(urlMini) {
  await apel('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Rezervare', web_app: { url: urlMini } } });
  await apel('setMyShortDescription', { short_description: 'Airport Boutique Residence – studio la 5 minute de aeroportul Chișinău. Rezervare directă.' }).catch(() => {});
  return numeBot();
}

export function mesajConfirmareOaspete(limba, nume) {
  const t = {
    ro: `Mulțumim, ${nume}! Am primit cererea de rezervare. Gazda vă răspunde în curând.`,
    ru: `Спасибо, ${nume}! Мы получили вашу заявку. Хозяйка скоро ответит.`,
    uk: `Дякуємо, ${nume}! Ми отримали вашу заявку. Господиня скоро відповість.`,
    en: `Thank you, ${nume}! We have received your booking request. The host will reply soon.`,
  };
  return esc(t[limba] || t.en);
}
