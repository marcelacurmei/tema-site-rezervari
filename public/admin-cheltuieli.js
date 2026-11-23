// Fila Cheltuieli: poză/PDF → Claude citește → ecran de verificare → salvare cu originalul.
import { formatOra, formatData } from '/comun.js';
import { $, api, el, pregatesteFisier, formatSuma } from '/admin-baza.js';

const TIP = { bon: 'Bon fiscal', factura: 'Factură', chitanta: 'Chitanță', alt_document: 'Alt document' };
let fisier = null; // { base64, tip, nume, previzualizare }
let recunoscut = null;
let optiuniPuse = false;

export async function incarca() {
  $('chelt-mesaj').textContent = 'Se încarcă…';
  try {
    const d = await api('/api/admin/cheltuieli');
    if (!optiuniPuse) {
      $('d-moneda').replaceChildren(...d.monede.map((m) => el('option', { value: m, textContent: m })));
      $('d-categorie').replaceChildren(...d.categorii.map((c) => el('option', { value: c, textContent: c })));
      optiuniPuse = true;
    }
    deseneazaLista(d.cheltuieli);
  } catch (e) {
    if (e.message !== 'neautorizat') $('chelt-mesaj').textContent = `Nu s-au putut încărca cheltuielile: ${e.message}`;
  }
}

function deseneazaLista(lista) {
  $('chelt-mesaj').textContent = lista.length ? '' : 'Încă nu există cheltuieli. Adăugați primul bon mai sus.';
  const total = {};
  for (const c of lista) total[c.moneda] = (total[c.moneda] || 0) + Number(c.suma);
  $('chelt-total').textContent = lista.length ? `Total: ${Object.entries(total).map(([m, s]) => formatSuma(s, m)).join(' + ')}` : '';
  $('chelt-lista').replaceChildren(...lista.map((c) => {
    const deschide = el('button', { type: 'button', className: 'buton-mic buton-mic--contur', textContent: c.fisier_tip === 'application/pdf' ? '📄 Deschide PDF-ul' : '🖼️ Deschide originalul' });
    deschide.addEventListener('click', () => deschideOriginal(c.id, deschide));
    return el('li', { className: 'cheltuiala' },
      el('div', { className: 'cheltuiala__sus' },
        el('div', {},
          el('p', { className: 'cheltuiala__furnizor', textContent: c.furnizor || '—' }),
          el('p', { className: 'cheltuiala__meta', textContent: `${TIP[c.tip_document] || c.tip_document}${c.numar_document ? ` nr. ${c.numar_document}` : ''} · ${c.data ? formatData(c.data) : 'fără dată'} · ${c.categorie}` })),
        el('p', { className: 'cheltuiala__suma', textContent: formatSuma(c.suma, c.moneda) })),
      c.descriere ? el('p', { className: 'cheltuiala__desc', textContent: c.descriere }) : null,
      el('div', { className: 'cheltuiala__jos' }, el('span', { className: 'nota nota--mica', textContent: `Adăugat: ${formatOra(c.created_at)}` }), deschide));
  }));
}

async function deschideOriginal(id, buton) {
  // Fereastra se deschide imediat (altfel Safari o blochează), apoi primește linkul temporar.
  const fereastra = window.open('', '_blank');
  buton.disabled = true;
  try {
    const d = await api(`/api/admin/cheltuieli?fisier=${id}`);
    if (fereastra) fereastra.location = d.url; else location.href = d.url;
  } catch (e) {
    fereastra?.close();
    if (e.message !== 'neautorizat') alert(`Originalul nu se poate deschide: ${e.message}`);
  } finally { buton.disabled = false; }
}

// ---------- încărcare și recunoaștere ----------
function stare(text) { $('doc-stare').textContent = text; }

function reseteaza() {
  fisier = null; recunoscut = null;
  $('doc-fisier').value = '';
  $('doc-lucru').hidden = true;
  $('doc-alege').hidden = false;
}

$('doc-fisier').addEventListener('change', async () => {
  const f = $('doc-fisier').files[0];
  if (!f) return;
  $('doc-alege').hidden = true;
  $('doc-lucru').hidden = false;
  $('doc-form').hidden = true; $('doc-nu-e').hidden = true; $('doc-alt').hidden = true;
  $('doc-previzualizare').replaceChildren();
  stare('Se pregătește fișierul…');
  try {
    fisier = await pregatesteFisier(f);
  } catch (e) {
    stare(''); $('doc-nu-e').hidden = false; $('doc-nu-e').textContent = e.message; $('doc-alt').hidden = false;
    return;
  }
  $('doc-previzualizare').replaceChildren(fisier.previzualizare
    ? el('img', { src: fisier.previzualizare, alt: 'Documentul încărcat' })
    : el('div', { className: 'doc-pdf' }, el('span', { textContent: '📄' }), el('span', { textContent: fisier.nume })));
  stare('🤖 Claude citește documentul… (10–30 de secunde)');
  try {
    const d = await api('/api/admin/cheltuieli', { method: 'POST', body: JSON.stringify({ actiune: 'recunoaste', fisier: fisier.base64, tip: fisier.tip, nume: fisier.nume }) });
    recunoscut = d.recunoscut;
    completeazaForm(recunoscut);
    stare('✅ Gata. Verificați câmpurile, corectați ce e greșit și salvați.');
    $('doc-form').hidden = false;
  } catch (e) {
    if (e.message === 'neautorizat') return;
    stare('');
    $('doc-nu-e').hidden = false;
    $('doc-nu-e').replaceChildren(el('b', { textContent: e.date?.nu_e_document ? '⚠️ Nu e un document' : '⚠️ Nu a mers' }), el('p', { textContent: e.message }),
      e.date?.motiv ? el('p', { className: 'nota nota--mica', textContent: `Ce vede Claude: ${e.date.motiv}` }) : null);
    $('doc-alt').hidden = false;
  }
});

function completeazaForm(r) {
  $('d-tip').value = r.tip_document; $('d-data').value = r.data || '';
  $('d-furnizor').value = r.furnizor; $('d-suma').value = r.suma ? String(r.suma) : '';
  $('d-moneda').value = r.moneda; $('d-categorie').value = r.categorie;
  $('d-numar').value = r.numar_document; $('d-descriere').value = r.descriere;
  for (const p of document.querySelectorAll('#doc-form [data-pentru]')) p.textContent = '';
  $('doc-eroare').textContent = '';
}

$('doc-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const date = Object.fromEntries(new FormData($('doc-form')));
  const b = $('doc-salveaza');
  b.disabled = true; $('doc-eroare').textContent = 'Se salvează…';
  for (const p of document.querySelectorAll('#doc-form [data-pentru]')) p.textContent = '';
  try {
    await api('/api/admin/cheltuieli', { method: 'POST', body: JSON.stringify({ actiune: 'salveaza', fisier: fisier.base64, tip: fisier.tip, nume: fisier.nume, date, recunoscut }) });
    reseteaza();
    await incarca();
  } catch (e) {
    if (e.message === 'neautorizat') return;
    $('doc-eroare').textContent = e.message;
    for (const [camp, mesaj] of Object.entries(e.date?.erori || {})) {
      const p = document.querySelector(`#doc-form [data-pentru="${camp}"]`);
      if (p) p.textContent = mesaj;
    }
  } finally { b.disabled = false; }
});

$('doc-renunta').addEventListener('click', reseteaza);
$('doc-alt').addEventListener('click', () => { reseteaza(); $('doc-fisier').click(); });
