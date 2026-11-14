// Un Supabase și un Telegram „de jucărie”, în memorie – doar pentru teste și pentru proba pe Mac.
// Înlocuiește fetch-ul global, așa că se verifică exact codul care rulează și pe Vercel.

export const CONT_PROBA = { email: 'gazda@proba.local', parola: 'proba-locala-123' };

export function instaleazaFals({ tacut = false } = {}) {
  const stare = { cereri: [], idUrmator: 1, telegram: [], tokenuri: new Set(), telegramStricat: false };
  const fetchVechi = globalThis.fetch;

  process.env.SUPABASE_URL = 'https://proba.supabase.co';
  process.env.SUPABASE_SECRET_KEY = 'sb_secret_proba';
  process.env.TELEGRAM_BOT_TOKEN = '1:proba';
  process.env.TELEGRAM_CHAT_ID = '42';

  const json = (date, status = 200) => new Response(JSON.stringify(date), {
    status, headers: { 'Content-Type': 'application/json' },
  });

  globalThis.fetch = async (adresa, optiuni = {}) => {
    const u = new URL(String(adresa));
    const metoda = (optiuni.method || 'GET').toUpperCase();
    const antete = Object.fromEntries(Object.entries(optiuni.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
    const corp = optiuni.body ? JSON.parse(optiuni.body) : null;

    if (u.hostname === 'api.telegram.org') {
      if (stare.telegramStricat) return json({ ok: false, description: 'Bad Request: chat not found' }, 400);
      if (u.pathname.endsWith('/sendMessage')) {
        stare.telegram.push(corp);
        if (!tacut) console.log('\n— Telegram (probă) —\n' + corp.text.replace(/<\/?b>/g, '') + '\n');
        return json({ ok: true, result: { message_id: stare.telegram.length } });
      }
      if (u.pathname.endsWith('/getUpdates')) {
        return json({ ok: true, result: [{ update_id: 1, message: { chat: { id: 42, type: 'private', first_name: 'Gazda' } } }] });
      }
      return json({ ok: false, description: 'Not Found' }, 404);
    }

    if (u.origin !== process.env.SUPABASE_URL) return fetchVechi(adresa, optiuni);
    if (antete.apikey !== process.env.SUPABASE_SECRET_KEY) return json({ message: 'Invalid API key' }, 401);

    if (u.pathname === '/auth/v1/token') {
      if (corp.email === CONT_PROBA.email && corp.password === CONT_PROBA.parola) {
        const t = `token-${Math.random().toString(36).slice(2)}`;
        stare.tokenuri.add(t);
        return json({ access_token: t, expires_in: 3600 });
      }
      return json({ error: 'invalid_grant' }, 400);
    }
    if (u.pathname === '/auth/v1/user') {
      const t = (antete.authorization || '').replace('Bearer ', '');
      return stare.tokenuri.has(t) ? json({ id: 'u1', email: CONT_PROBA.email }) : json({ msg: 'invalid JWT' }, 401);
    }

    if (u.pathname === '/rest/v1/cereri') {
      if (metoda === 'POST') {
        const rand = { id: stare.idUrmator++, created_at: new Date().toISOString(), status: 'noua', ...corp };
        stare.cereri.push(rand);
        return json([rand], 201);
      }
      if (metoda === 'GET') {
        let r = [...stare.cereri];
        const s = u.searchParams.get('status');
        if (s) r = r.filter((c) => `eq.${c.status}` === s);
        r.sort((a, b) => (b.created_at.localeCompare(a.created_at)) || b.id - a.id);
        return json(r);
      }
      if (metoda === 'PATCH') {
        const id = Number((u.searchParams.get('id') || '').replace('eq.', ''));
        const c = stare.cereri.find((x) => x.id === id);
        if (c) Object.assign(c, corp);
        return json(c ? [c] : []);
      }
    }
    return json({ message: 'necunoscut' }, 404);
  };

  return stare;
}
