// CRM: fișele clienților, pe etape, cu istoricul mutărilor. Doar pe server.
import { cerereRest, v } from './supabase.js';
import { formatData, noptiIntre } from '../public/comun.js';

export const ETAPE = ['noua', 'contactat', 'confirmata', 'cazat', 'refuz'];
export const SURSE = ['Site', 'Manual', 'Telegram'];

/** Textul scurt cu datele cererii, pus în fișa clientului. */
export function detaliiCerere(c) {
  const n = noptiIntre(c.sosire, c.plecare);
  let t = `${formatData(c.sosire)} – ${formatData(c.plecare)} (${n} ${n === 1 ? 'noapte' : 'nopți'}), oaspeți: ${c.oaspeti}`;
  if (c.comentariu) t += `\n${c.comentariu}`;
  return t.slice(0, 1000);
}

/** Creează o fișă nouă pe prima etapă și scrie primul rând în istoric. */
export async function creeazaClient({ nume, telefon = '', sursa, notite = '', detalii = '', cerere_id = null, telegram_id = null }) {
  if (!SURSE.includes(sursa)) throw new Error('Sursă necunoscută');
  const [client] = await cerereRest('clienti', {
    method: 'POST', prefer: 'return=representation',
    body: { nume, telefon, sursa, notite, detalii, cerere_id, telegram_id, etapa: 'noua' },
  });
  await cerereRest('istoric_etape', { method: 'POST', body: { client_id: client.id, din_etapa: null, in_etapa: 'noua' } });
  return client;
}

/** Toți clienții (cei noi sus), fiecare cu istoricul lui în ordinea datelor. */
export async function listeazaClienti() {
  const clienti = await cerereRest('clienti?select=*&order=created_at.desc,id.desc&limit=500');
  if (!clienti.length) return [];
  const ids = clienti.map((c) => c.id).join(',');
  const istoric = await cerereRest(`istoric_etape?select=*&client_id=in.(${ids})&order=created_at.asc,id.asc`);
  const pe = new Map(clienti.map((c) => [c.id, { ...c, istoric: [] }]));
  for (const h of istoric) pe.get(h.client_id)?.istoric.push(h);
  return [...pe.values()];
}

async function unClient(id) {
  const [c] = await cerereRest(`clienti?select=*&id=eq.${v(id)}`);
  return c || null;
}

/** Mută fișa în altă etapă și notează mutarea în istoric. Întoarce null dacă fișa nu există. */
export async function mutaClient(id, etapa) {
  if (!ETAPE.includes(etapa)) throw new Error('Etapă necunoscută');
  const vechi = await unClient(id);
  if (!vechi) return null;
  if (vechi.etapa === etapa) return vechi;
  const [nou] = await cerereRest(`clienti?id=eq.${v(id)}`, { method: 'PATCH', body: { etapa }, prefer: 'return=representation' });
  await cerereRest('istoric_etape', { method: 'POST', body: { client_id: id, din_etapa: vechi.etapa, in_etapa: etapa } });
  return nou;
}

export async function schimbaNotite(id, notite) {
  const randuri = await cerereRest(`clienti?id=eq.${v(id)}`, { method: 'PATCH', body: { notite }, prefer: 'return=representation' });
  return randuri[0] || null;
}
