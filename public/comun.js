// Reguli comune pentru browser și server: verificarea formularului și formatarea datelor.
// Același fișier e folosit de pagina publică (public/app.js) și de funcția de pe server (api/cerere.js).

export const FUS_ORAR = 'Europe/Chisinau';
export const STATUSURI = ['noua', 'in_lucru', 'inchisa'];
export const MAX_OASPETI = 3;
export const MAX_NOPTI = 90;

const ZI = 86400000;

/** Data de azi la Chișinău, ca text „AAAA-LL-ZZ”. */
export function aziChisinau(acum = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUS_ORAR, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(acum);
}

export function adunaZile(data, zile) {
  const d = new Date(Date.parse(data + 'T00:00:00Z') + zile * ZI);
  return d.toISOString().slice(0, 10);
}

export function noptiIntre(sosire, plecare) {
  return Math.round((Date.parse(plecare + 'T00:00:00Z') - Date.parse(sosire + 'T00:00:00Z')) / ZI);
}

function esteData(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const d = new Date(text + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text;
}

export function curataTelefon(text) {
  return String(text ?? '').replace(/[\s\-().]/g, '');
}

/**
 * Verifică o cerere. Întoarce { ok, erori: { camp: cod }, curat: {...} }.
 * Codurile de eroare se traduc în pagină (app.js), ca să apară în limba oaspetelui.
 */
export function valideaza(date, acum = new Date()) {
  const erori = {};
  const text = (v) => String(v ?? '').trim();

  const nume = text(date.nume).replace(/\s+/g, ' ');
  if (!nume) erori.nume = 'obligatoriu';
  else if (nume.length < 2 || !/\p{L}/u.test(nume)) erori.nume = 'nume_invalid';
  else if (nume.length > 100) erori.nume = 'prea_lung';

  const telefon = curataTelefon(date.telefon);
  if (!telefon) erori.telefon = 'obligatoriu';
  else if (!/^\+?\d{7,15}$/.test(telefon)) erori.telefon = 'telefon_invalid';

  const azi = aziChisinau(acum);
  const sosire = text(date.sosire);
  const plecare = text(date.plecare);
  if (!sosire) erori.sosire = 'obligatoriu';
  else if (!esteData(sosire)) erori.sosire = 'data_invalida';
  else if (sosire < azi) erori.sosire = 'data_trecuta';
  else if (sosire > adunaZile(azi, 730)) erori.sosire = 'prea_departe';

  if (!plecare) erori.plecare = 'obligatoriu';
  else if (!esteData(plecare)) erori.plecare = 'data_invalida';
  else if (!erori.sosire && plecare <= sosire) erori.plecare = 'plecare_inainte';
  else if (!erori.sosire && noptiIntre(sosire, plecare) > MAX_NOPTI) erori.plecare = 'sejur_prea_lung';

  const oaspeti = Number(text(date.oaspeti) || 2);
  if (!Number.isInteger(oaspeti) || oaspeti < 1 || oaspeti > MAX_OASPETI) erori.oaspeti = 'oaspeti_invalid';

  const comentariu = text(date.comentariu);
  if (comentariu.length > 1000) erori.comentariu = 'prea_lung';

  const limba = ['ro', 'ru', 'uk', 'en'].includes(date.limba) ? date.limba : 'ro';

  return {
    ok: Object.keys(erori).length === 0,
    erori,
    curat: { nume, telefon, sosire, plecare, oaspeti, comentariu, limba },
  };
}

/** „14.11.2026, 18:05” – ora Chișinăului, la fel în panou și pe Telegram. */
export function formatOra(iso) {
  return new Intl.DateTimeFormat('ro-RO', {
    timeZone: FUS_ORAR, day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso));
}

/** „2026-11-20” → „20.11.2026” */
export function formatData(data) {
  if (!data) return '';
  const [a, l, z] = String(data).split('-');
  return `${z}.${l}.${a}`;
}
