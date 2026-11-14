import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { instaleazaFals, CONT_PROBA } from '../scripts/fals.mjs';
import { apeleaza } from '../scripts/apel.mjs';
import { valideaza, aziChisinau, adunaZile, formatOra } from '../public/comun.js';
import cerere from '../api/cerere.js';
import login from '../api/admin/login.js';
import cereri from '../api/admin/cereri.js';
import telegram from '../api/admin/telegram.js';
import { mesajCerere } from '../lib/telegram.js';

let stare;
beforeEach(() => { stare = instaleazaFals({ tacut: true }); });

const azi = aziChisinau();
const bun = () => ({
  nume: 'Olena Kovalenko', telefon: '+380 67 123 4567',
  sosire: adunaZile(azi, 3), plecare: adunaZile(azi, 5), oaspeti: '2', comentariu: 'Zbor la 06:00', limba: 'uk',
});

async function logat() {
  const r = await apeleaza(login, { method: 'POST', body: { email: CONT_PROBA.email, parola: CONT_PROBA.parola } });
  assert.equal(r.status, 200);
  return { authorization: `Bearer ${r.date.token}` };
}

// ---------- verificarea formularului ----------
test('formularul gol nu trece', () => {
  const v = valideaza({});
  assert.equal(v.ok, false);
  assert.deepEqual(Object.keys(v.erori).sort(), ['nume', 'plecare', 'sosire', 'telefon']);
});

test('telefon greșit, date în trecut și plecare înainte de sosire', () => {
  const v = valideaza({ ...bun(), telefon: '12ab', sosire: adunaZile(azi, -1) });
  assert.equal(v.erori.telefon, 'telefon_invalid');
  assert.equal(v.erori.sosire, 'data_trecuta');
  const v2 = valideaza({ ...bun(), plecare: bun().sosire });
  assert.equal(v2.erori.plecare, 'plecare_inainte');
  assert.equal(valideaza({ ...bun(), nume: '1' }).erori.nume, 'nume_invalid');
  assert.equal(valideaza({ ...bun(), oaspeti: '7' }).erori.oaspeti, 'oaspeti_invalid');
  assert.equal(valideaza({ ...bun(), plecare: '2026-02-30' }).erori.plecare, 'data_invalida');
});

test('cerere bună: telefonul se curăță, comentariul e opțional', () => {
  const v = valideaza({ ...bun(), comentariu: '' });
  assert.equal(v.ok, true);
  assert.equal(v.curat.telefon, '+380671234567');
  assert.equal(v.curat.oaspeti, 2);
});

// ---------- trimiterea cererii ----------
test('cererea bună se salvează cu status „noua” și pleacă pe Telegram', async () => {
  const r = await apeleaza(cerere, { method: 'POST', body: bun() });
  assert.equal(r.status, 200);
  assert.equal(r.date.ok, true);
  assert.equal(stare.cereri.length, 1);
  assert.equal(stare.cereri[0].status, 'noua');
  assert.ok(stare.cereri[0].created_at);
  assert.equal(stare.telegram.length, 1);
  const text = stare.telegram[0].text;
  assert.match(text, /Olena Kovalenko/);
  assert.match(text, /\+380671234567/);
  assert.match(text, /Zbor la 06:00/);
  assert.ok(text.includes(formatOra(stare.cereri[0].created_at)), 'aceeași oră ca în panou');
  assert.equal(stare.telegram[0].chat_id, '42');
});

test('cererea greșită nu se salvează și întoarce erorile', async () => {
  const r = await apeleaza(cerere, { method: 'POST', body: { nume: '', telefon: 'x' } });
  assert.equal(r.status, 400);
  assert.equal(r.date.erori.nume, 'obligatoriu');
  assert.equal(r.date.erori.telefon, 'telefon_invalid');
  assert.equal(stare.cereri.length, 0);
  assert.equal(stare.telegram.length, 0);
});

test('robotul de spam (câmpul ascuns) nu salvează nimic', async () => {
  const r = await apeleaza(cerere, { method: 'POST', body: { ...bun(), site: 'http://spam' } });
  assert.equal(r.status, 200);
  assert.equal(stare.cereri.length, 0);
});

test('dacă Telegram nu merge, cererea rămâne salvată', async () => {
  stare.telegramStricat = true;
  const r = await apeleaza(cerere, { method: 'POST', body: bun() });
  assert.equal(r.status, 200);
  assert.equal(stare.cereri.length, 1);
});

test('textul din cerere nu poate strica formatul mesajului Telegram', () => {
  const t = mesajCerere({ id: 1, nume: '<b>x</b> & y', telefon: '+37369', sosire: '2026-12-01', plecare: '2026-12-02', oaspeti: 1, comentariu: '<script>', limba: 'ro', created_at: new Date().toISOString() });
  assert.ok(t.includes('&lt;b&gt;x&lt;/b&gt; &amp; y'));
  assert.ok(t.includes('&lt;script&gt;'));
  assert.ok(t.includes('1 noapte'));
});

test('doar POST pe /api/cerere', async () => {
  const r = await apeleaza(cerere, { method: 'GET' });
  assert.equal(r.status, 405);
});

// ---------- panoul ----------
test('fără logare nu se vede nicio cerere', async () => {
  await apeleaza(cerere, { method: 'POST', body: bun() });
  const fara = await apeleaza(cereri, { method: 'GET' });
  assert.equal(fara.status, 401);
  assert.equal(fara.date.cereri, undefined);
  const fals = await apeleaza(cereri, { method: 'GET', headers: { authorization: 'Bearer inventat' } });
  assert.equal(fals.status, 401);
  const tg = await apeleaza(telegram, { method: 'GET' });
  assert.equal(tg.status, 401);
});

test('parola greșită nu intră', async () => {
  const r = await apeleaza(login, { method: 'POST', body: { email: CONT_PROBA.email, parola: 'gresita' } });
  assert.equal(r.status, 401);
  assert.equal(r.date.token, undefined);
});

test('după logare: lista cu cele noi sus, schimbarea statusului și filtrul', async () => {
  const h = await logat();
  await apeleaza(cerere, { method: 'POST', body: { ...bun(), nume: 'Prima' } });
  await new Promise((r) => setTimeout(r, 5));
  await apeleaza(cerere, { method: 'POST', body: { ...bun(), nume: 'A doua' } });

  const lista = await apeleaza(cereri, { method: 'GET', headers: h });
  assert.equal(lista.status, 200);
  assert.deepEqual(lista.date.cereri.map((c) => c.nume), ['A doua', 'Prima']);
  assert.equal(lista.antete['cache-control'], 'no-store');

  const id = lista.date.cereri[1].id;
  const sch = await apeleaza(cereri, { method: 'PATCH', headers: h, body: { id, status: 'in_lucru' } });
  assert.equal(sch.status, 200);
  assert.equal(sch.date.cerere.status, 'in_lucru');

  const filtrat = await apeleaza(cereri, { method: 'GET', headers: h, query: { status: 'in_lucru' } });
  assert.deepEqual(filtrat.date.cereri.map((c) => c.nume), ['Prima']);

  const gresit = await apeleaza(cereri, { method: 'PATCH', headers: h, body: { id, status: 'sters' } });
  assert.equal(gresit.status, 400);
  const lipsa = await apeleaza(cereri, { method: 'PATCH', headers: h, body: { id: 999, status: 'inchisa' } });
  assert.equal(lipsa.status, 404);
});

test('ADMIN_EMAILS oprește alte conturi', async () => {
  const h = await logat();
  process.env.ADMIN_EMAILS = 'altcineva@exemplu.md';
  try {
    const r = await apeleaza(cereri, { method: 'GET', headers: h });
    assert.equal(r.status, 403);
  } finally {
    delete process.env.ADMIN_EMAILS;
  }
});

test('Telegram din panou: arată ID-ul chat-ului și trimite mesaj de probă', async () => {
  const h = await logat();
  delete process.env.TELEGRAM_CHAT_ID;
  const g = await apeleaza(telegram, { method: 'GET', headers: h });
  assert.equal(g.date.areToken, true);
  assert.equal(g.date.areChat, false);
  assert.deepEqual(g.date.chaturi.map((c) => c.id), ['42']);

  process.env.TELEGRAM_CHAT_ID = '42';
  const p = await apeleaza(telegram, { method: 'POST', headers: h });
  assert.equal(p.date.ok, true);
  assert.equal(stare.telegram.length, 1);
});

test('fără cheile Supabase, cererea dă eroare clară (nu se pierde în tăcere)', async () => {
  delete process.env.SUPABASE_URL;
  const r = await apeleaza(cerere, { method: 'POST', body: bun() });
  assert.equal(r.status, 500);
  assert.equal(r.date.ok, false);
});
