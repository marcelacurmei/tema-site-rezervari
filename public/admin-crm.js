// Fila CRM: coloane pe etape, fișa clientului, mutarea între etape, clienți adăugați de mână.
import { formatOra } from '/comun.js';
import { $, api, el } from '/admin-baza.js';

export const ETAPE = [
  { id: 'noua', nume: 'Cerere nouă' },
  { id: 'contactat', nume: 'Contactat' },
  { id: 'confirmata', nume: 'Rezervare confirmată' },
  { id: 'cazat', nume: 'Cazat' },
  { id: 'refuz', nume: 'Refuz' },
];
const NUME_ETAPA = Object.fromEntries(ETAPE.map((e) => [e.id, e.nume]));
const SURSA_ICON = { Site: '🌐', Telegram: '✈️', Manual: '✍️' };

let clienti = [];
let deschis = null; // id-ul fișei deschise

export async function incarca() {
  $('crm-mesaj').textContent = 'Se încarcă…';
  try {
    const d = await api('/api/admin/crm');
    clienti = d.clienti;
    $('crm-mesaj').textContent = clienti.length ? '' : 'Încă nu există clienți. Cererile noi apar aici singure; puteți adăuga și de mână.';
    deseneaza();
  } catch (e) {
    if (e.message !== 'neautorizat') $('crm-mesaj').textContent = `Nu s-au putut încărca clienții: ${e.message}`;
  }
}

function insignaSursa(sursa) {
  return el('span', { className: 'sursa', dataset: { sursa }, textContent: `${SURSA_ICON[sursa] || ''} ${sursa}` });
}

function card(c) {
  const b = el('button', { type: 'button', className: 'fisa-card', draggable: true, dataset: { id: c.id } },
    el('span', { className: 'fisa-card__nume', textContent: c.nume }),
    c.telefon ? el('span', { className: 'fisa-card__tel', textContent: c.telefon }) : null,
    el('span', { className: 'fisa-card__jos' }, insignaSursa(c.sursa), el('span', { className: 'fisa-card__data', textContent: formatOra(c.created_at).split(',')[0] })));
  b.addEventListener('click', () => deschideFisa(c.id));
  b.addEventListener('dragstart', (ev) => { ev.dataTransfer.setData('text/plain', String(c.id)); b.classList.add('trage'); });
  b.addEventListener('dragend', () => b.classList.remove('trage'));
  return b;
}

function deseneaza() {
  const coloane = ETAPE.map((e) => {
    const ai = clienti.filter((c) => c.etapa === e.id);
    const lista = el('div', { className: 'coloana__lista' }, ...ai.map(card));
    if (!ai.length) lista.append(el('p', { className: 'coloana__gol', textContent: 'Nimic aici' }));
    const col = el('section', { className: 'coloana', dataset: { etapa: e.id } },
      el('h2', { className: 'coloana__titlu' }, e.nume, el('span', { className: 'coloana__nr', textContent: String(ai.length) })),
      lista);
    col.addEventListener('dragover', (ev) => { ev.preventDefault(); col.classList.add('peste'); });
    col.addEventListener('dragleave', () => col.classList.remove('peste'));
    col.addEventListener('drop', (ev) => {
      ev.preventDefault(); col.classList.remove('peste');
      const id = Number(ev.dataTransfer.getData('text/plain'));
      if (id) muta(id, e.id);
    });
    return col;
  });
  $('tabla').replaceChildren(...coloane);
}

async function muta(id, etapa) {
  const c = clienti.find((x) => x.id === id);
  if (!c || c.etapa === etapa) return;
  try {
    await api('/api/admin/crm', { method: 'PATCH', body: JSON.stringify({ id, etapa }) });
    await incarca();
    if (deschis === id) deschideFisa(id);
  } catch (e) {
    if (e.message !== 'neautorizat') alert(`Fișa nu s-a mutat: ${e.message}`);
  }
}

function deschideFisa(id) {
  const c = clienti.find((x) => x.id === id);
  if (!c) return;
  deschis = id;
  const tel = String(c.telefon || '');
  const telCurat = tel.replace(/[^\d+]/g, '');

  const select = el('select', { id: 'fisa-etapa', className: 'status-select' });
  for (const e of ETAPE) select.append(el('option', { value: e.id, textContent: e.nume, selected: e.id === c.etapa }));
  select.dataset.etapa = c.etapa;
  select.addEventListener('change', () => muta(c.id, select.value));

  const notite = el('textarea', { id: 'fisa-notite', rows: 4, maxLength: 5000, value: c.notite || '', placeholder: 'De exemplu: a cerut transfer de la aeroport, preț oferit 45 €/noapte…' });
  const rezultat = el('span', { className: 'nota nota--mica', role: 'status' });
  const salveaza = el('button', { type: 'button', className: 'buton-mic', textContent: 'Salvează notițele' });
  salveaza.addEventListener('click', async () => {
    salveaza.disabled = true; rezultat.textContent = 'Se salvează…';
    try {
      const d = await api('/api/admin/crm', { method: 'PATCH', body: JSON.stringify({ id: c.id, notite: notite.value }) });
      Object.assign(c, d.client);
      rezultat.textContent = '✅ Salvat';
    } catch (e) {
      if (e.message !== 'neautorizat') rezultat.textContent = `❌ ${e.message}`;
    } finally { salveaza.disabled = false; }
  });

  const istoric = el('ol', { className: 'istoric' }, ...c.istoric.map((h) => el('li', {},
    el('span', { className: 'istoric__data', textContent: formatOra(h.created_at) }),
    el('span', { textContent: h.din_etapa ? `${NUME_ETAPA[h.din_etapa] || h.din_etapa} → ${NUME_ETAPA[h.in_etapa] || h.in_etapa}` : `Creat în „${NUME_ETAPA[h.in_etapa] || h.in_etapa}”` }))));

  $('fisa-continut').replaceChildren(
    el('h2', { className: 'fisa__titlu', textContent: c.nume }),
    el('dl', { className: 'fisa__date' },
      el('dt', { textContent: 'Telefon' }), el('dd', {}, tel
        ? el('span', {}, el('a', { href: `tel:${telCurat}`, textContent: tel }), ' · ',
          el('a', { href: `https://wa.me/${telCurat.replace('+', '')}`, target: '_blank', rel: 'noopener', textContent: 'WhatsApp' }), ' · ',
          el('a', { href: `viber://chat?number=${encodeURIComponent(telCurat)}`, textContent: 'Viber' }))
        : '—'),
      el('dt', { textContent: 'Sursa' }), el('dd', {}, insignaSursa(c.sursa)),
      el('dt', { textContent: 'Creat' }), el('dd', { textContent: formatOra(c.created_at) }),
      c.detalii ? el('dt', { textContent: 'Cererea' }) : null, c.detalii ? el('dd', { className: 'pre', textContent: c.detalii }) : null,
      el('dt', {}, el('label', { htmlFor: 'fisa-etapa', textContent: 'Mută în etapa' })), el('dd', {}, select)),
    el('div', { className: 'camp' }, el('label', { htmlFor: 'fisa-notite', textContent: 'Notițe' }), notite),
    el('div', { className: 'butoane-rand' }, salveaza, rezultat),
    el('h3', { textContent: 'Istoricul mutărilor' }), istoric);
  if (!$('fisa').open) $('fisa').showModal();
}

$('fisa').addEventListener('close', () => { deschis = null; });
$('crm-reincarca').addEventListener('click', incarca);

// ---------- client nou, de mână ----------
$('crm-nou').addEventListener('click', () => {
  $('form-nou').reset(); $('nou-eroare').textContent = '';
  $('dialog-nou').showModal();
  $('nou-nume').focus();
});

$('form-nou').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const b = $('nou-salveaza');
  const nume = $('nou-nume').value.trim();
  if (nume.length < 2) { $('nou-eroare').textContent = 'Scrieți numele (cel puțin 2 litere).'; return; }
  b.disabled = true; $('nou-eroare').textContent = '';
  try {
    await api('/api/admin/crm', { method: 'POST', body: JSON.stringify({ nume, telefon: $('nou-telefon').value, notite: $('nou-notite').value }) });
    $('dialog-nou').close();
    await incarca();
  } catch (e) {
    if (e.message !== 'neautorizat') $('nou-eroare').textContent = e.message;
  } finally { b.disabled = false; }
});
