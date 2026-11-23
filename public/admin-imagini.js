// Fila Imagini: poza apartamentului → Gemini (pe server) → imagine nouă, cu istoric și limită pe zi.
import { formatOra } from '/comun.js';
import { $, api, el, pregatesteFisier } from '/admin-baza.js';

let poza = null;

function aratRamase(ramase, limita) {
  $('img-ramase').textContent = `Azi mai puteți genera: ${ramase} din ${limita}`;
  $('img-ramase').dataset.gata = String(ramase === 0);
}

export async function incarca() {
  $('img-mesaj').textContent = 'Se încarcă…';
  try {
    const d = await api('/api/admin/imagini');
    aratRamase(d.ramase, d.limita);
    deseneaza(d.imagini);
  } catch (e) {
    if (e.message !== 'neautorizat') $('img-mesaj').textContent = `Nu s-a putut încărca istoricul: ${e.message}`;
  }
}

function element(i) {
  return el('li', { className: 'galerie__el' },
    el('a', { href: i.rezultat, target: '_blank', rel: 'noopener', className: 'galerie__rezultat' }, el('img', { src: i.rezultat, alt: `Imagine generată: ${i.stil_nume}`, loading: 'lazy' })),
    el('div', { className: 'galerie__info' },
      el('img', { src: i.sursa, alt: 'Poza inițială', className: 'galerie__sursa', loading: 'lazy' }),
      el('div', {},
        el('p', { className: 'galerie__stil', textContent: i.stil_nume }),
        el('p', { className: 'nota nota--mica', textContent: formatOra(i.created_at) }),
        i.dorinte ? el('p', { className: 'nota nota--mica', textContent: `„${i.dorinte}”` }) : null,
        el('a', { href: i.rezultat, download: `imagine-${i.id}.png`, target: '_blank', rel: 'noopener', className: 'link-mic', textContent: '⬇︎ Descarcă' }))));
}

function deseneaza(lista) {
  $('img-mesaj').textContent = lista.length ? '' : 'Încă nu ați generat nicio imagine.';
  $('img-istoric').replaceChildren(...lista.map(element));
}

$('img-fisier').addEventListener('change', async () => {
  const f = $('img-fisier').files[0];
  $('img-eroare').textContent = '';
  if (!f) return;
  try {
    poza = await pregatesteFisier(f, { max: 1600, calitate: 0.9 });
    $('img-previzualizare').src = poza.previzualizare;
    $('img-previzualizare').hidden = false;
  } catch (e) {
    poza = null; $('img-previzualizare').hidden = true;
    $('img-eroare').textContent = e.message;
  }
});

$('img-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  $('img-eroare').textContent = '';
  if (!poza) { $('img-eroare').textContent = 'Alegeți mai întâi o poză a apartamentului.'; return; }
  const stil = new FormData($('img-form')).get('stil');
  const b = $('img-genereaza');
  b.disabled = true; $('img-stare').textContent = '✨ Se generează… durează 10–40 de secunde.';
  try {
    const d = await api('/api/admin/imagini', { method: 'POST', body: JSON.stringify({ fisier: poza.base64, tip: poza.tip, stil, dorinte: $('img-dorinte').value }) });
    aratRamase(d.ramase, d.limita);
    $('img-mesaj').textContent = '';
    $('img-istoric').prepend(element(d.imagine));
    $('img-stare').textContent = '✅ Gata! Imaginea e prima în istoric.';
    $('img-istoric').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    if (e.message === 'neautorizat') return;
    $('img-stare').textContent = '';
    $('img-eroare').textContent = e.message;
    if (e.date?.limita_atinsa) aratRamase(0, e.date.limita);
  } finally { b.disabled = false; }
});
