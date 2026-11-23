// Verificarea datelor de la Telegram Mini App (initData), pe server, cu HMAC-SHA256.
// Regula oficială: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
import { createHmac, timingSafeEqual } from 'node:crypto';

export const VALABIL_SECUNDE = 24 * 3600;

/**
 * Întoarce { user, authDate } dacă initData e semnat de Telegram pentru botul nostru și nu e prea vechi; altfel null.
 */
export function verificaInitData(initData, tokenBot, { acum = Date.now(), maxSecunde = VALABIL_SECUNDE } = {}) {
  if (typeof initData !== 'string' || !initData || initData.length > 4096 || !tokenBot) return null;
  const p = new URLSearchParams(initData);
  const hash = p.get('hash') || '';
  if (!/^[a-f0-9]{64}$/.test(hash)) return null;
  p.delete('hash');
  const deVerificat = [...p.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, val]) => `${k}=${val}`)
    .join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(tokenBot).digest();
  const calculat = createHmac('sha256', secret).update(deVerificat).digest();
  if (!timingSafeEqual(calculat, Buffer.from(hash, 'hex'))) return null;

  const authDate = Number(p.get('auth_date'));
  if (!Number.isInteger(authDate) || acum / 1000 - authDate > maxSecunde || authDate - acum / 1000 > 300) return null;

  let user;
  try { user = JSON.parse(p.get('user') || 'null'); } catch { return null; }
  if (!user || !Number.isSafeInteger(user.id)) return null;
  return { user, authDate };
}

/** Semnează date ca Telegram – doar pentru teste și proba locală. */
export function semneazaInitData(campuri, tokenBot) {
  const p = new URLSearchParams(campuri);
  const deVerificat = [...p.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, val]) => `${k}=${val}`).join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(tokenBot).digest();
  p.set('hash', createHmac('sha256', secret).update(deVerificat).digest('hex'));
  return p.toString();
}

export function numeTelegram(user) {
  const n = [user.first_name, user.last_name].filter(Boolean).join(' ').trim().replace(/\s+/g, ' ');
  return (n || (user.username ? `@${user.username}` : `Telegram ${user.id}`)).slice(0, 100);
}
