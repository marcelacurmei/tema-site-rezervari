// Tema 2: CRM, documente cu Claude, Telegram Mini App, imagini cu limită.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { instaleazaFals, CONT_PROBA, TOKEN_BOT_PROBA, BON_PROBA } from '../scripts/fals.mjs';
import { apeleaza } from '../scripts/apel.mjs';
import { aziChisinau, adunaZile } from '../public/comun.js';
import cerere from '../api/cerere.js';
import login from '../api/admin/login.js';
import crm from '../api/admin/crm.js';
import cheltuieli from '../api/admin/cheltuieli.js';
import imagini, { inceputulZilei } from '../api/admin/imagini.js';
import telegram from '../api/admin/telegram.js';
import mini from '../api/mini.js';
import { semneazaInitData, verificaInitData } from '../lib/telegram-mini.js';

let stare;
beforeEach(() => { stare = instaleazaFals({ tacut: true }); delete process.env.IMAGINI_PE_ZI; });

const azi = aziChisinau();
const bun = () => ({ nume: 'Ion Popescu', telefon: '+373 69 123 456', sosire: adunaZile(azi, 3), plecare: adunaZile(azi, 5), oaspeti: '2', comentariu: 'Zbor la 06:00', limba: 'ro' });
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0]).toString('base64');
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF').toString('base64');

async function logat() {
  const r = await apeleaza(login, { method: 'POST', body: { email: CONT_PROBA.email, parola: CONT_PROBA.parola } });
  return { authorization: `Bearer ${r.date.token}` };
}

function initData(user = { id: 555, first_name: 'Olena', last_name: 'Kovalenko', username: 'olena_k', language_code: 'uk' }, { auth = Math.floor(Date.now() / 1000), token = TOKEN_BOT_PROBA } = {}) {
  return semneazaInitData({ user: JSON.stringify(user), auth_date: String(auth), query_id: 'AAE1' }, token);
}

// ---------- 1. CRM ----------
test('CRM: cererea de pe site intră singură pe prima etapă, cu sursa „Site” și istoric', async () => {
  const r = await apeleaza(cerere, { method: 'POST', body: bun() });
  assert.equal(r.status, 200);
  const h = await logat();
  const l = await apeleaza(crm, { method: 'GET', headers: h });
  assert.equal(l.status, 200);
  assert.equal(l.date.clienti.length, 1);
  const c = l.date.clienti[0];
  assert.equal(c.nume, 'Ion Popescu');
  assert.equal(c.sursa, 'Site');
  assert.equal(c.etapa, 'noua');
  assert.equal(c.cerere_id, r.date.id);
  assert.match(c.detalii, /\(2 nopți\), oaspeți: 2/);
  assert.ok(c.created_at);
  assert.deepEqual(c.istoric.map((x) => [x.din_etapa, x.in_etapa]), [[null, 'noua']]);
  assert.ok(l.date.etape.length >= 5 && l.date.etape.includes('refuz'));
});

test('CRM: client adăugat de mână (sursa „Manual”), mutat pe etape, cu notițe și istoric', async () => {
  const h = await logat();
  const gol = await apeleaza(crm, { method: 'POST', headers: h, body: { nume: 'x' } });
  assert.equal(gol.status, 400);
  const nou = await apeleaza(crm, { method: 'POST', headers: h, body: { nume: 'Maria Ionescu', telefon: '069 123 456', notite: 'A sunat' } });
  assert.equal(nou.status, 201);
  assert.equal(nou.date.client.sursa, 'Manual');
  const id = nou.date.client.id;

  assert.equal((await apeleaza(crm, { method: 'PATCH', headers: h, body: { id, etapa: 'contactat' } })).status, 200);
  assert.equal((await apeleaza(crm, { method: 'PATCH', headers: h, body: { id, etapa: 'refuz' } })).status, 200);
  assert.equal((await apeleaza(crm, { method: 'PATCH', headers: h, body: { id, notite: 'Prea scump' } })).date.client.notite, 'Prea scump');
  assert.equal((await apeleaza(crm, { method: 'PATCH', headers: h, body: { id, etapa: 'sters' } })).status, 400);
  assert.equal((await apeleaza(crm, { method: 'PATCH', headers: h, body: { id: 999, etapa: 'cazat' } })).status, 404);

  const c = (await apeleaza(crm, { method: 'GET', headers: h })).date.clienti[0];
  assert.equal(c.etapa, 'refuz');
  assert.deepEqual(c.istoric.map((x) => [x.din_etapa, x.in_etapa]), [[null, 'noua'], ['noua', 'contactat'], ['contactat', 'refuz']]);
  assert.ok(c.istoric.every((x) => x.created_at));
});

test('CRM: fără logare nu se vede nimic', async () => {
  await apeleaza(cerere, { method: 'POST', body: bun() });
  const r = await apeleaza(crm, { method: 'GET' });
  assert.equal(r.status, 401);
  assert.equal(r.date.clienti, undefined);
});

test('dacă tabelele CRM lipsesc, cererea de pe site tot se salvează', async () => {
  stare.lipsaTabele = true;
  const r = await apeleaza(cerere, { method: 'POST', body: bun() });
  assert.equal(r.status, 200);
  assert.equal(stare.cereri.length, 1);
  const l = await apeleaza(crm, { method: 'GET', headers: await logat() });
  assert.equal(l.status, 500);
  assert.match(l.date.eroare, /tema2\.sql/);
});

// ---------- 2. Documente ----------
test('document: Claude citește bonul, ecranul de verificare primește câmpurile, nimic nu e salvat încă', async () => {
  const h = await logat();
  const r = await apeleaza(cheltuieli, { method: 'POST', headers: h, body: { actiune: 'recunoaste', fisier: JPG, tip: 'image/jpeg', nume: 'bon.jpg' } });
  assert.equal(r.status, 200);
  assert.equal(r.date.recunoscut.furnizor, 'Linella SRL');
  assert.equal(r.date.recunoscut.suma, 356.4);
  assert.equal(stare.tabele.cheltuieli.length, 0);
  assert.equal(stare.fisiere.size, 0);
  // Ce a primit Claude: poza, schema JSON, modelul.
  const trimis = stare.claude.cereri[0].corp;
  assert.equal(trimis.model, 'claude-opus-5-5');
  assert.equal(trimis.messages[0].content[0].type, 'image');
  assert.equal(trimis.output_config.format.type, 'json_schema');
});

test('document: PDF-ul merge ca „document”, iar salvarea păstrează originalul și câmpurile corectate', async () => {
  const h = await logat();
  const r = await apeleaza(cheltuieli, { method: 'POST', headers: h, body: { actiune: 'recunoaste', fisier: PDF, tip: 'application/pdf', nume: 'factura.pdf' } });
  assert.equal(r.status, 200);
  assert.equal(stare.claude.cereri[0].corp.messages[0].content[0].type, 'document');

  const date = { ...r.date.recunoscut, furnizor: 'Linella', suma: '400,50' };
  const gresit = await apeleaza(cheltuieli, { method: 'POST', headers: h, body: { actiune: 'salveaza', fisier: PDF, tip: 'application/pdf', nume: 'factura.pdf', date: { ...date, suma: '0' } } });
  assert.equal(gresit.status, 400);
  assert.ok(gresit.date.erori.suma);

  const s = await apeleaza(cheltuieli, { method: 'POST', headers: h, body: { actiune: 'salveaza', fisier: PDF, tip: 'application/pdf', nume: 'factura.pdf', date, recunoscut: r.date.recunoscut } });
  assert.equal(s.status, 201);
  const rand = stare.tabele.cheltuieli[0];
  assert.equal(rand.furnizor, 'Linella');
  assert.equal(rand.suma, 400.5);
  assert.equal(rand.recunoscut.furnizor, 'Linella SRL');
  assert.ok(stare.fisiere.has(`documente/${rand.fisier_cale}`));
  assert.equal(stare.fisiere.get(`documente/${rand.fisier_cale}`).octeti.toString('base64'), PDF);

  const lista = await apeleaza(cheltuieli, { method: 'GET', headers: h });
  assert.equal(lista.date.cheltuieli.length, 1);
  assert.equal(lista.date.cheltuieli[0].fisier_cale, undefined);
  const link = await apeleaza(cheltuieli, { method: 'GET', headers: h, query: { fisier: String(rand.id) } });
  assert.equal(link.status, 200);
  assert.match(link.date.url, /\/storage\/v1\/object\/sign\/documente\/cheltuieli\//);
});

test('document: dacă nu e document, mesaj clar și nu se salvează nimic', async () => {
  const h = await logat();
  stare.claude.raspuns = { ...BON_PROBA, este_document: false, motiv: 'O fotografie cu o pisică pe canapea.', suma: 0 };
  const r = await apeleaza(cheltuieli, { method: 'POST', headers: h, body: { actiune: 'recunoaste', fisier: JPG, tip: 'image/jpeg' } });
  assert.equal(r.status, 422);
  assert.equal(r.date.nu_e_document, true);
  assert.match(r.date.eroare, /Nu s-a salvat nimic/);
  assert.equal(stare.tabele.cheltuieli.length, 0);
  assert.equal(stare.fisiere.size, 0);
});

test('document: fișier fals (text cu nume de poză) sau fără logare – refuzat fără să ajungă la Claude', async () => {
  const h = await logat();
  const fals = await apeleaza(cheltuieli, { method: 'POST', headers: h, body: { actiune: 'recunoaste', fisier: Buffer.from('salut').toString('base64'), tip: 'image/jpeg' } });
  assert.equal(fals.status, 400);
  const fara = await apeleaza(cheltuieli, { method: 'POST', body: { actiune: 'recunoaste', fisier: JPG, tip: 'image/jpeg' } });
  assert.equal(fara.status, 401);
  assert.equal(stare.claude.apeluri, 0);
});

// ---------- 3–5. Telegram Mini App ----------
test('Mini App: initData semnat corect trece, cel falsificat, vechi sau pentru alt bot nu', () => {
  const bun1 = initData();
  assert.equal(verificaInitData(bun1, TOKEN_BOT_PROBA).user.first_name, 'Olena');
  const schimbat = bun1.replace('Olena', 'Hacker');
  assert.equal(verificaInitData(schimbat, TOKEN_BOT_PROBA), null);
  assert.equal(verificaInitData(initData(undefined, { token: '2:alt' }), TOKEN_BOT_PROBA), null);
  assert.equal(verificaInitData(initData(undefined, { auth: Math.floor(Date.now() / 1000) - 3 * 86400 }), TOKEN_BOT_PROBA), null);
  assert.equal(verificaInitData('', TOKEN_BOT_PROBA), null);
  assert.equal(verificaInitData('user=%7B%7D&hash=abc', TOKEN_BOT_PROBA), null);
});

test('Mini App: salută cu numele din Telegram (după verificarea pe server)', async () => {
  const r = await apeleaza(mini, { method: 'POST', body: { actiune: 'start', initData: initData() } });
  assert.equal(r.status, 200);
  assert.equal(r.date.prenume, 'Olena');
  assert.equal(r.date.nume, 'Olena Kovalenko');
  assert.equal(r.date.limba, 'uk');
  assert.deepEqual(r.date.cereri, []);
});

test('Mini App: cererea ajunge în CRM cu sursa „Telegram” și numele din Telegram', async () => {
  const { sosire, plecare } = bun();
  const r = await apeleaza(mini, { method: 'POST', body: { actiune: 'cerere', initData: initData(), sosire, plecare, oaspeti: '3', telefon: '+380 67 123 4567', comentariu: '', nume: 'Încerc alt nume' } });
  assert.equal(r.status, 200);
  assert.equal(r.date.cereri.length, 1);
  const c = stare.tabele.clienti[0];
  assert.equal(c.sursa, 'Telegram');
  assert.equal(c.nume, 'Olena Kovalenko');
  assert.equal(c.telegram_id, 555);
  assert.equal(stare.cereri[0].sursa, 'Telegram');
  // gazda primește anunțul, oaspetele – confirmarea
  assert.ok(stare.telegram.some((m) => m.chat_id === '42' && m.text.includes('Telegram') && m.text.includes('@olena_k')));
  assert.ok(stare.telegram.some((m) => m.chat_id === 555));

  const h = await logat();
  const l = await apeleaza(crm, { method: 'GET', headers: h });
  assert.equal(l.date.clienti[0].sursa, 'Telegram');
});

test('Mini App: în browser obișnuit (fără initData sau cu initData falsificat) nu arată datele nimănui', async () => {
  await apeleaza(mini, { method: 'POST', body: { actiune: 'cerere', initData: initData(), ...bun() } });
  for (const date of [undefined, '', 'query_id=x&user=%7B%22id%22%3A555%7D&auth_date=1&hash=' + 'a'.repeat(64), initData().replace('Olena', 'Alta')]) {
    const r = await apeleaza(mini, { method: 'POST', body: { actiune: 'start', initData: date } });
    assert.equal(r.status, 401);
    assert.equal(r.date.cereri, undefined);
    assert.equal(r.date.nume, undefined);
  }
  const g = await apeleaza(mini, { method: 'GET' });
  assert.deepEqual(Object.keys(g.date).sort(), ['bot', 'ok']);
  // Pagina nu conține date: totul vine de la server, după verificare.
  const html = readFileSync(new URL('../public/mini.html', import.meta.url), 'utf8');
  assert.ok(!html.includes('Olena') && !html.includes('Kovalenko'));
});

test('Mini App: alt utilizator Telegram nu vede cererile primului', async () => {
  await apeleaza(mini, { method: 'POST', body: { actiune: 'cerere', initData: initData(), ...bun() } });
  const r = await apeleaza(mini, { method: 'POST', body: { actiune: 'start', initData: initData({ id: 999, first_name: 'Ana', language_code: 'ro' }) } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.date.cereri, []);
});

test('panou: butonul „Rezervare” se pune în bot cu adresa /mini', async () => {
  const h = await logat();
  const r = await apeleaza(telegram, { method: 'POST', headers: { ...h, host: 'tema-site-rezervari.vercel.app' }, body: { actiune: 'mini' } });
  assert.equal(r.date.ok, true);
  assert.equal(r.date.bot, 'airport_boutique_proba_bot');
  const apel = stare.telegramApeluri.find((a) => a.metoda === 'setChatMenuButton');
  assert.equal(apel.corp.menu_button.web_app.url, 'https://tema-site-rezervari.vercel.app/mini');
  assert.equal(stare.telegram.length, 0);
});

// ---------- 6. Imagini ----------
test('imagini: se generează pe server, rămân în istoric, iar a 6-a din zi e oprită cu mesaj clar', async () => {
  const h = await logat();
  for (let i = 1; i <= 5; i++) {
    const r = await apeleaza(imagini, { method: 'POST', headers: h, body: { fisier: JPG, tip: 'image/jpeg', stil: 'catalog', dorinte: 'flori' } });
    assert.equal(r.status, 201, `imaginea ${i}`);
    assert.equal(r.date.ramase, 5 - i);
  }
  const a6 = await apeleaza(imagini, { method: 'POST', headers: h, body: { fisier: JPG, tip: 'image/jpeg', stil: 'postare' } });
  assert.equal(a6.status, 429);
  assert.equal(a6.date.limita_atinsa, true);
  assert.match(a6.date.eroare, /toate cele 5 imagini de azi/);
  assert.equal(stare.gemini.apeluri, 5);

  const istoric = await apeleaza(imagini, { method: 'GET', headers: h });
  assert.equal(istoric.date.imagini.length, 5);
  assert.equal(istoric.date.ramase, 0);
  assert.ok(istoric.date.imagini.every((i) => i.rezultat && i.sursa));
  assert.equal(stare.fisiere.size, 10);
});

test('imagini: limita e pe utilizator și pe zi (ieri nu contează), iar stilul greșit e refuzat', async () => {
  const h = await logat();
  process.env.IMAGINI_PE_ZI = '1';
  stare.tabele.imagini.push({ id: 90, user_id: 'u1', created_at: new Date(Date.parse(inceputulZilei()) - 1000).toISOString(), stil: 'catalog', cale_sursa: 'x', cale_rezultat: 'y', dorinte: '' });
  stare.tabele.imagini.push({ id: 91, user_id: 'alt', created_at: new Date().toISOString(), stil: 'catalog', cale_sursa: 'x', cale_rezultat: 'y', dorinte: '' });
  assert.equal((await apeleaza(imagini, { method: 'POST', headers: h, body: { fisier: JPG, tip: 'image/jpeg', stil: 'altceva' } })).status, 400);
  assert.equal((await apeleaza(imagini, { method: 'POST', headers: h, body: { fisier: JPG, tip: 'image/jpeg', stil: 'story' } })).status, 201);
  assert.equal((await apeleaza(imagini, { method: 'POST', headers: h, body: { fisier: JPG, tip: 'image/jpeg', stil: 'story' } })).status, 429);
  assert.match(stare.gemini.ultimul.model, /gemini-/);
  assert.equal(stare.gemini.ultimul.corp.generationConfig.imageConfig.aspectRatio, '9:16');
});

test('imagini: fără logare nu se generează nimic', async () => {
  const r = await apeleaza(imagini, { method: 'POST', body: { fisier: JPG, tip: 'image/jpeg', stil: 'catalog' } });
  assert.equal(r.status, 401);
  assert.equal(stare.gemini.apeluri, 0);
});

test('miezul nopții la Chișinău se calculează corect (iarna UTC+2, vara UTC+3)', () => {
  assert.equal(inceputulZilei(new Date('2026-11-23T21:30:00Z')), '2026-11-22T22:00:00.000Z'); // 23:30 la Chișinău
  assert.equal(inceputulZilei(new Date('2026-11-23T23:30:00Z')), '2026-11-23T22:00:00.000Z');
  assert.equal(inceputulZilei(new Date('2026-11-23T10:00:00Z')), '2026-11-22T22:00:00.000Z');
  assert.equal(inceputulZilei(new Date('2026-07-01T10:00:00Z')), '2026-06-30T21:00:00.000Z');
});

// ---------- 7. Chei ----------
test('nicio cheie în cod: fișierele din proiect nu conțin chei reale', () => {
  const fisiere = ['lib/claude.js', 'lib/gemini.js', 'lib/telegram.js', 'lib/supabase.js', 'lib/telegram-mini.js', 'api/mini.js', 'public/mini.js', 'public/admin-baza.js', '.env.example'];
  for (const f of fisiere) {
    const t = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
    assert.doesNotMatch(t, /sk-ant-api\d|AIza[0-9A-Za-z_-]{30}|\d{8,10}:AA[0-9A-Za-z_-]{30}|sb_secret_[0-9A-Za-z]{20}/, f);
  }
});
