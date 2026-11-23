// Un Supabase, un Telegram, un Claude și un Gemini „de jucărie”, în memorie – doar pentru teste și pentru proba pe Mac.
// Înlocuiește fetch-ul global, așa că se verifică exact codul care rulează și pe Vercel.

export const CONT_PROBA = { email: 'gazda@proba.local', parola: 'proba-locala-123' };
export const TOKEN_BOT_PROBA = '1:proba';

// O poză PNG de 1×1 pixel (ce „generează” Gemini-ul de probă dacă nu primește nimic).
const PNG_MIC = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

export const BON_PROBA = {
  este_document: true, motiv: '', tip_document: 'bon', furnizor: 'Linella SRL', numar_document: '0042',
  data: '2026-11-20', suma: 356.4, moneda: 'MDL', categorie: 'Consumabile', descriere: 'Cafea, ceai, hârtie igienică pentru oaspeți',
};

export function instaleazaFals({ tacut = false, url = 'https://proba.supabase.co' } = {}) {
  const tabele = { cereri: [], clienti: [], istoric_etape: [], cheltuieli: [], imagini: [] };
  const stare = {
    tabele, cereri: tabele.cereri, idUrmator: {}, telegram: [], telegramApeluri: [], tokenuri: new Set(), telegramStricat: false,
    fisiere: new Map(), claude: { apeluri: 0, raspuns: BON_PROBA, cereri: [] }, gemini: { apeluri: 0, stricat: false },
    lipsaTabele: false,
  };
  const fetchVechi = globalThis.fetch;

  process.env.SUPABASE_URL = url;
  process.env.SUPABASE_SECRET_KEY = 'sb_secret_proba';
  process.env.TELEGRAM_BOT_TOKEN = TOKEN_BOT_PROBA;
  process.env.TELEGRAM_CHAT_ID = '42';
  process.env.ANTHROPIC_API_KEY = 'sk-ant-proba';
  process.env.GEMINI_API_KEY = 'gemini-proba';

  const json = (date, status = 200) => new Response(JSON.stringify(date), {
    status, headers: { 'Content-Type': 'application/json' },
  });

  // ---------- un PostgREST mic: filtre eq / gte / in, ordonare, limită ----------
  function filtreaza(randuri, params) {
    let r = [...randuri];
    for (const [col, val] of params) {
      if (['select', 'order', 'limit'].includes(col)) continue;
      if (val.startsWith('eq.')) r = r.filter((x) => String(x[col]) === val.slice(3));
      else if (val.startsWith('gte.')) r = r.filter((x) => String(x[col]) >= val.slice(4));
      else if (val.startsWith('in.(')) {
        const lista = val.slice(4, -1).split(',');
        r = r.filter((x) => lista.includes(String(x[col])));
      }
    }
    const ord = params.get('order');
    if (ord) {
      const chei = ord.split(',').map((o) => o.split('.'));
      r.sort((a, b) => {
        for (const [col, dir] of chei) {
          const va = a[col]; const vb = b[col];
          const c = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
          if (c) return dir === 'desc' ? -c : c;
        }
        return 0;
      });
    }
    const lim = Number(params.get('limit'));
    return lim ? r.slice(0, lim) : r;
  }

  function rest(tabel, metoda, params, corp) {
    if (!(tabel in tabele)) return json({ message: `relation "public.${tabel}" does not exist`, code: '42P01' }, 404);
    if (stare.lipsaTabele && tabel !== 'cereri') return json({ message: `relation "public.${tabel}" does not exist`, code: '42P01' }, 404);
    const t = tabele[tabel];
    if (metoda === 'POST') {
      stare.idUrmator[tabel] = (stare.idUrmator[tabel] || 0) + 1;
      const rand = {
        id: stare.idUrmator[tabel], created_at: new Date(Date.now() + stare.idUrmator[tabel]).toISOString(),
        ...(tabel === 'cereri' ? { status: 'noua', sursa: 'Site', telegram_id: null } : {}),
        ...(tabel === 'clienti' ? { notite: '', detalii: '', telefon: '' } : {}),
        ...corp,
      };
      t.push(rand);
      return json([rand], 201);
    }
    if (metoda === 'GET') {
      const sel = params.get('select');
      const r = filtreaza(t, params);
      if (!sel || sel === '*') return json(r);
      const col = sel.split(',');
      return json(r.map((x) => Object.fromEntries(col.map((c) => [c, x[c]]))));
    }
    if (metoda === 'PATCH') {
      const gasite = filtreaza(t, params);
      for (const x of gasite) Object.assign(x, corp);
      return json(gasite);
    }
    return json({ message: 'necunoscut' }, 405);
  }

  globalThis.fetch = async (adresa, optiuni = {}) => {
    const u = new URL(String(adresa));
    const metoda = (optiuni.method || 'GET').toUpperCase();
    const antete = Object.fromEntries([...new Headers(optiuni.headers || {}).entries()].map(([k, v]) => [k.toLowerCase(), v]));
    let corp = null;
    if (typeof optiuni.body === 'string') { try { corp = JSON.parse(optiuni.body); } catch { corp = optiuni.body; } }

    // ---------- Telegram ----------
    if (u.hostname === 'api.telegram.org') {
      const metodaTg = u.pathname.split('/').pop();
      stare.telegramApeluri.push({ metoda: metodaTg, corp });
      if (stare.telegramStricat) return json({ ok: false, description: 'Bad Request: chat not found' }, 400);
      if (metodaTg === 'sendMessage') {
        stare.telegram.push(corp);
        if (!tacut) console.log(`\n— Telegram (probă) către ${corp.chat_id} —\n` + corp.text.replace(/<\/?b>/g, '') + '\n');
        return json({ ok: true, result: { message_id: stare.telegram.length } });
      }
      if (metodaTg === 'getUpdates') {
        return json({ ok: true, result: [{ update_id: 1, message: { chat: { id: 42, type: 'private', first_name: 'Gazda' } } }] });
      }
      if (metodaTg === 'getMe') return json({ ok: true, result: { id: 1, is_bot: true, username: 'airport_boutique_proba_bot' } });
      if (['setChatMenuButton', 'setMyShortDescription'].includes(metodaTg)) return json({ ok: true, result: true });
      return json({ ok: false, description: 'Not Found' }, 404);
    }

    // ---------- Claude ----------
    if (u.hostname === 'api.anthropic.com') {
      stare.claude.apeluri++;
      stare.claude.cereri.push({ corp, antete });
      if (antete['x-api-key'] !== process.env.ANTHROPIC_API_KEY && antete.authorization !== `Bearer ${process.env.ANTHROPIC_API_KEY}`) return json({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }, 401);
      return json({
        id: 'msg_proba', type: 'message', role: 'assistant', model: corp.model,
        content: [{ type: 'text', text: JSON.stringify(stare.claude.raspuns) }],
        stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 },
      });
    }

    // ---------- Gemini ----------
    if (u.hostname === 'generativelanguage.googleapis.com') {
      stare.gemini.apeluri++;
      stare.gemini.ultimul = { model: u.pathname, corp };
      if (stare.gemini.stricat) return json({ error: { message: 'Quota exceeded' } }, 429);
      const intrare = corp.contents?.[0]?.parts?.find((p) => p.inlineData)?.inlineData;
      return json({ candidates: [{ content: { parts: [{ inlineData: { mimeType: intrare?.mimeType || 'image/png', data: intrare?.data || PNG_MIC } }] }, finishReason: 'STOP' }] });
    }

    if (u.origin !== new URL(process.env.SUPABASE_URL).origin) return fetchVechi(adresa, optiuni);
    if (antete.apikey !== process.env.SUPABASE_SECRET_KEY) return json({ message: 'Invalid API key' }, 401);

    // ---------- Supabase Auth ----------
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

    // ---------- Supabase Storage ----------
    if (u.pathname.startsWith('/storage/v1/object/sign/')) {
      const loc = u.pathname.split('/')[5];
      return json(corp.paths.map((p) => (stare.fisiere.has(`${loc}/${p}`)
        ? { path: p, signedURL: `/object/sign/${loc}/${p}?token=proba`, error: null }
        : { path: p, signedURL: null, error: 'Object not found' })));
    }
    if (u.pathname.startsWith('/storage/v1/object/') && metoda === 'POST') {
      const cale = decodeURIComponent(u.pathname.slice('/storage/v1/object/'.length));
      stare.fisiere.set(cale, { octeti: Buffer.from(optiuni.body), tip: antete['content-type'] });
      return json({ Key: cale });
    }

    // ---------- Supabase baza de date ----------
    if (u.pathname.startsWith('/rest/v1/')) return rest(u.pathname.slice(9), metoda, u.searchParams, corp);
    return json({ message: 'necunoscut' }, 404);
  };

  return stare;
}
