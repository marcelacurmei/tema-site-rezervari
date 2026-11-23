// GET  /api/admin/cheltuieli                 – lista cheltuielilor (doar după logare)
// GET  /api/admin/cheltuieli?fisier=ID       – link temporar spre originalul documentului
// POST /api/admin/cheltuieli { actiune: 'recunoaste', fisier, tip, nume }  – Claude citește documentul (nu salvează nimic)
// POST /api/admin/cheltuieli { actiune: 'salveaza', fisier, tip, nume, date } – salvează cheltuiala verificată + originalul
import { cereAdmin, corp, metodaNepermisa } from '../../lib/raspuns.js';
import { cerereRest, incarcaFisier, linkuriTemporare, v } from '../../lib/supabase.js';
import { CATEGORII, MONEDE, TIPURI_DOCUMENT, TIPURI_FISIER, curataRecunoastere, recunoasteDocument } from '../../lib/claude.js';
import { caleNoua, citesteFisier } from '../../lib/fisier.js';

const LOC = 'documente';

export const NU_E_DOCUMENT = 'Acesta nu pare a fi un bon, o factură sau o chitanță. Nu s-a salvat nimic. Fotografiați documentul de aproape, cu tot textul în cadru.';

/** Verifică câmpurile corectate de gazdă pe ecranul de verificare. */
export function verificaCampuri(d) {
  const erori = {};
  const c = curataRecunoastere({ ...d, este_document: true });
  const suma = Number(String(d.suma ?? '').replace(',', '.'));
  if (!Number.isFinite(suma) || suma <= 0) erori.suma = 'Scrieți suma (mai mare decât 0).';
  else if (suma > 10000000) erori.suma = 'Suma e prea mare.';
  if (d.data && !c.data) erori.data = 'Data nu e corectă.';
  if (!TIPURI_DOCUMENT.includes(d.tip_document)) erori.tip_document = 'Alegeți tipul documentului.';
  if (!MONEDE.includes(d.moneda)) erori.moneda = 'Alegeți moneda.';
  if (!CATEGORII.includes(d.categorie)) erori.categorie = 'Alegeți categoria.';
  if (!c.furnizor) erori.furnizor = 'Scrieți de la cine e documentul.';
  return { erori, curat: { ...c, suma: Math.round(suma * 100) / 100 } };
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return metodaNepermisa(res, ['GET', 'POST']);
  try {
    if (!(await cereAdmin(req, res))) return;

    if (req.method === 'GET') {
      const idFisier = req.query?.fisier;
      if (idFisier !== undefined) {
        if (!/^\d+$/.test(String(idFisier))) return res.status(400).json({ ok: false, eroare: 'Date greșite' });
        const [rand] = await cerereRest(`cheltuieli?select=fisier_cale&id=eq.${v(idFisier)}`);
        if (!rand) return res.status(404).json({ ok: false, eroare: 'Cheltuiala nu există' });
        const linkuri = await linkuriTemporare(LOC, [rand.fisier_cale], 600);
        return res.status(200).json({ ok: true, url: linkuri[rand.fisier_cale] });
      }
      const cheltuieli = await cerereRest('cheltuieli?select=id,created_at,data,tip_document,furnizor,numar_document,descriere,categorie,suma,moneda,fisier_tip,fisier_nume&order=created_at.desc,id.desc&limit=300');
      return res.status(200).json({ ok: true, cheltuieli, categorii: CATEGORII, monede: MONEDE });
    }

    const d = corp(req);
    const f = citesteFisier(d, TIPURI_FISIER);
    if (f.eroare) return res.status(400).json({ ok: false, eroare: f.eroare });

    if (d.actiune === 'recunoaste') {
      let r;
      try {
        r = await recunoasteDocument({ base64: f.base64, tip: f.tip });
      } catch (e) {
        console.error('Claude – eroare:', e.message);
        const fara = /ANTHROPIC_API_KEY/.test(e.message);
        return res.status(502).json({ ok: false, eroare: fara ? 'Lipsește cheia Claude (ANTHROPIC_API_KEY) în setările Vercel.' : 'Documentul nu a putut fi citit acum. Încercați din nou peste un minut.' });
      }
      if (!r.este_document) return res.status(422).json({ ok: false, nu_e_document: true, eroare: NU_E_DOCUMENT, motiv: r.motiv });
      return res.status(200).json({ ok: true, recunoscut: r });
    }

    if (d.actiune === 'salveaza') {
      const { erori, curat } = verificaCampuri(d.date || {});
      if (Object.keys(erori).length) return res.status(400).json({ ok: false, erori, eroare: Object.values(erori)[0] });
      const cale = caleNoua('cheltuieli', f.tip);
      await incarcaFisier(LOC, cale, f.octeti, f.tip);
      const recunoscut = d.recunoscut && typeof d.recunoscut === 'object' ? curataRecunoastere(d.recunoscut) : null;
      const [rand] = await cerereRest('cheltuieli', {
        method: 'POST', prefer: 'return=representation',
        body: {
          data: curat.data || null, tip_document: curat.tip_document, furnizor: curat.furnizor, numar_document: curat.numar_document,
          descriere: curat.descriere, categorie: curat.categorie, suma: curat.suma, moneda: curat.moneda,
          fisier_cale: cale, fisier_tip: f.tip, fisier_nume: f.nume, recunoscut,
        },
      });
      return res.status(201).json({ ok: true, cheltuiala: rand });
    }

    return res.status(400).json({ ok: false, eroare: 'Acțiune necunoscută' });
  } catch (e) {
    console.error('Cheltuieli – eroare:', e.message);
    const lipsa = /cheltuieli/.test(e.message) && /does not exist|42P01|PGRST20/.test(e.message);
    return res.status(500).json({ ok: false, eroare: lipsa ? 'Lipsește tabelul cheltuieli. Rulați supabase/tema2.sql în Supabase.' : 'Eroare la salvare. Încercați din nou.' });
  }
}
