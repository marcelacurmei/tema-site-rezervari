import { formatOra, formatData, noptiIntre } from '/comun.js';

const ETICHETE = { noua: 'Nouă', in_lucru: 'În lucru', inchisa: 'Închisă' };
const LIMBI = { ro: 'română', ru: 'rusă', uk: 'ucraineană', en: 'engleză' };
const $ = (id) => document.getElementById(id);

let token = null;
let cereri = [];
let filtru = '';

// ---------- sesiunea (ține doar cât e deschisă fila) ----------
function citesteSesiune() {
  try {
    const s = JSON.parse(sessionStorage.getItem('sesiune') || 'null');
    if (s && s.token && s.expira > Date.now() + 30000) return s.token;
  } catch { /* fără memorie – trebuie logare */ }
  return null;
}
function salveazaSesiune(t, expira) {
  token = t;
  try { sessionStorage.setItem('sesiune', JSON.stringify({ token: t, expira })); } catch { /* nu e grav */ }
}
function stergeSesiune() {
  token = null;
  try { sessionStorage.removeItem('sesiune'); } catch { /* nu e grav */ }
}

async function api(cale, optiuni = {}) {
  const r = await fetch(cale, {
    ...optiuni,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(optiuni.headers || {}) },
  });
  const date = await r.json().catch(() => ({}));
  if (r.status === 401 || r.status === 403) {
    stergeSesiune();
    arataLogare(date.eroare || 'Sesiunea a expirat. Logați-vă din nou.');
    throw new Error('neautorizat');
  }
  if (!r.ok || date.ok === false) throw new Error(date.eroare || `Eroare ${r.status}`);
  return date;
}

// ---------- ecrane ----------
function arataLogare(mesaj = '') {
  $('ecran-cereri').hidden = true;
  $('iesire').hidden = true;
  $('ecran-logare').hidden = false;
  $('eroare-logare').textContent = mesaj;
  $('email').focus();
}

async function arataCereri() {
  $('ecran-logare').hidden = true;
  $('ecran-cereri').hidden = false;
  $('iesire').hidden = false;
  await Promise.all([incarcaCereri(), verificaTelegram()]);
}

// ---------- logare ----------
$('form-logare').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const email = $('email').value.trim();
  const parola = $('parola').value;
  if (!email || !parola) { $('eroare-logare').textContent = 'Scrieți emailul și parola.'; return; }
  const b = $('buton-logare');
  b.disabled = true; b.textContent = 'Se verifică…';
  try {
    const r = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, parola }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.ok) { $('eroare-logare').textContent = d.eroare || 'Logarea nu a reușit.'; return; }
    salveazaSesiune(d.token, d.expira);
    $('parola').value = '';
    await arataCereri();
  } catch {
    $('eroare-logare').textContent = 'Nu există conexiune. Încercați din nou.';
  } finally {
    b.disabled = false; b.textContent = 'Intră';
  }
});

$('iesire').addEventListener('click', () => { stergeSesiune(); cereri = []; $('lista').replaceChildren(); arataLogare(); });

// ---------- lista ----------
async function incarcaCereri() {
  $('mesaj-lista').textContent = 'Se încarcă…';
  try {
    const d = await api('/api/admin/cereri');
    cereri = d.cereri;
    deseneaza();
  } catch (e) {
    if (e.message !== 'neautorizat') $('mesaj-lista').textContent = `Nu s-au putut încărca cererile: ${e.message}`;
  }
}

function el(tag, props = {}, ...copii) {
  const n = document.createElement(tag);
  Object.assign(n, props);
  for (const c of copii) if (c != null) n.append(c);
  return n;
}

function cardCerere(c) {
  const select = el('select', { className: 'status-select', ariaLabel: `Status pentru ${c.nume}` });
  for (const [v, t] of Object.entries(ETICHETE)) select.append(el('option', { value: v, textContent: t, selected: v === c.status }));
  select.dataset.status = c.status;
  select.addEventListener('change', () => schimbaStatus(c, select));

  const tel = String(c.telefon);
  const telCurat = tel.replace(/[^\d+]/g, '');
  const nopti = noptiIntre(c.sosire, c.plecare);
  const contact = el('dd', {},
    el('a', { href: `tel:${telCurat}`, textContent: tel }), ' · ',
    el('a', { href: `https://wa.me/${telCurat.replace('+', '')}`, target: '_blank', rel: 'noopener', textContent: 'WhatsApp' }), ' · ',
    el('a', { href: `viber://chat?number=${encodeURIComponent(telCurat)}`, textContent: 'Viber' }));

  const li = el('li', { className: 'cerere-card' },
    el('div', { className: 'cerere-card__sus' },
      el('div', {},
        el('p', { className: 'cerere-card__nume', textContent: `#${c.id} · ${c.nume}` }),
        el('p', { className: 'cerere-card__ora', textContent: `Primită: ${formatOra(c.created_at)}` })),
      select),
    el('dl', {},
      el('dt', { textContent: 'Telefon' }), contact,
      el('dt', { textContent: 'Perioada' }), el('dd', { textContent: `${formatData(c.sosire)} – ${formatData(c.plecare)} (${nopti} ${nopti === 1 ? 'noapte' : 'nopți'})` }),
      el('dt', { textContent: 'Oaspeți' }), el('dd', { textContent: String(c.oaspeti) }),
      el('dt', { textContent: 'Comentariu' }), el('dd', { textContent: c.comentariu || '—' }),
      el('dt', { textContent: 'Limba' }), el('dd', { textContent: LIMBI[c.limba] || c.limba || '—' })));
  li.dataset.status = c.status;
  return li;
}

function deseneaza() {
  const numar = { '': cereri.length, noua: 0, in_lucru: 0, inchisa: 0 };
  for (const c of cereri) numar[c.status] = (numar[c.status] || 0) + 1;
  document.querySelectorAll('[data-filtru]').forEach((b) => {
    b.setAttribute('aria-selected', String(b.dataset.filtru === filtru));
    b.querySelector('span').textContent = `(${numar[b.dataset.filtru] || 0})`;
  });

  const vizibile = filtru ? cereri.filter((c) => c.status === filtru) : cereri;
  $('lista').replaceChildren(...vizibile.map(cardCerere));
  $('mesaj-lista').textContent = vizibile.length ? '' :
    (cereri.length ? 'Nicio cerere cu acest status.' : 'Încă nu există cereri. Ele apar aici imediat după ce un oaspete trimite formularul.');
}

async function schimbaStatus(c, select) {
  const vechi = c.status;
  select.disabled = true;
  try {
    const d = await api('/api/admin/cereri', { method: 'PATCH', body: JSON.stringify({ id: c.id, status: select.value }) });
    Object.assign(c, d.cerere);
    deseneaza();
  } catch (e) {
    if (e.message === 'neautorizat') return;
    select.value = vechi;
    alert(`Statusul nu s-a schimbat: ${e.message}`);
  } finally {
    select.disabled = false;
  }
}

document.querySelectorAll('[data-filtru]').forEach((b) => {
  b.addEventListener('click', () => { filtru = b.dataset.filtru; deseneaza(); });
});
$('reincarca').addEventListener('click', incarcaCereri);

// ---------- Telegram ----------
async function verificaTelegram() {
  const cutie = $('telegram');
  try {
    const d = await api('/api/admin/telegram');
    $('test-telegram').hidden = !(d.areToken && d.areChat);
    if (d.areToken && d.areChat) { cutie.hidden = true; return; }
    cutie.hidden = false;
    if (!d.areToken) {
      cutie.replaceChildren(el('h2', { textContent: 'Telegram nu e încă pornit' }),
        el('p', { textContent: 'Lipsește tokenul botului (TELEGRAM_BOT_TOKEN) în setările Vercel. Urmați pasul din ghid.' }));
      return;
    }
    const pasi = el('ol', {},
      el('li', { textContent: 'Deschideți botul în Telegram și apăsați „Start” (sau scrieți-i orice mesaj).' }),
      el('li', { textContent: 'Apăsați aici „↻ Reîncarcă”.' }),
      el('li', { textContent: 'Copiați numărul de mai jos în Vercel, ca TELEGRAM_CHAT_ID, apoi faceți „Redeploy”.' }));
    const lista = d.chaturi.length
      ? el('ul', {}, ...d.chaturi.map((c) => el('li', {}, `${c.nume || 'chat'}: `, el('code', { textContent: c.id }))))
      : el('p', { textContent: d.eroare ? `Telegram răspunde: ${d.eroare}` : 'Botul nu a primit încă niciun mesaj.' });
    cutie.replaceChildren(el('h2', { textContent: 'Ultimul pas pentru Telegram: ID-ul chat-ului' }), pasi, lista);
  } catch (e) {
    if (e.message === 'neautorizat') return;
    cutie.hidden = false;
    cutie.textContent = `Nu am putut verifica Telegram: ${e.message}`;
  }
}

$('reincarca').addEventListener('click', verificaTelegram);

$('test-telegram').addEventListener('click', async () => {
  const b = $('test-telegram');
  b.disabled = true; $('rezultat-test').textContent = 'Se trimite…';
  try {
    const d = await api('/api/admin/telegram', { method: 'POST' });
    $('rezultat-test').textContent = d.ok ? '✅ Trimis. Verificați Telegram.' : `❌ ${d.eroare}`;
  } catch (e) {
    if (e.message !== 'neautorizat') $('rezultat-test').textContent = `❌ ${e.message}`;
  } finally {
    b.disabled = false;
  }
});

// ---------- pornire ----------
token = citesteSesiune();
if (token) arataCereri(); else arataLogare();
