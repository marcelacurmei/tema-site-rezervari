// GET  /api/admin/imagini – istoricul imaginilor generate și câte mai puteți face azi (doar după logare)
// POST /api/admin/imagini { fisier, tip, stil, dorinte } – generează o imagine din poza apartamentului (cu limită pe zi)
import { cereAdmin, corp, metodaNepermisa } from '../../lib/raspuns.js';
import { cerereRest, incarcaFisier, linkuriTemporare, v } from '../../lib/supabase.js';
import { STILURI, genereazaImagine } from '../../lib/gemini.js';
import { caleNoua, citesteFisier } from '../../lib/fisier.js';
import { FUS_ORAR } from '../../public/comun.js';

const LOC = 'imagini';

export function limitaPeZi() {
  const n = Number(process.env.IMAGINI_PE_ZI || 5);
  return Number.isInteger(n) && n >= 0 ? n : 5;
}

/** Miezul nopții de azi la Chișinău, ca moment ISO (limita se reînnoiește atunci). */
export function inceputulZilei(acum = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: FUS_ORAR, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(acum).map((x) => [x.type, x.value]));
  const local = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  const decalaj = local - Math.floor(acum.getTime() / 1000) * 1000; // cât e Chișinăul înaintea UTC
  return new Date(Date.UTC(+p.year, +p.month - 1, +p.day) - decalaj).toISOString();
}

async function folositeAzi(userId) {
  const r = await cerereRest(`imagini?select=id&user_id=eq.${v(userId)}&created_at=gte.${v(inceputulZilei())}`);
  return r.length;
}

const MESAJ_LIMITA = (n) => `Ați folosit toate cele ${n} imagini de azi. Limita se reînnoiește la miezul nopții (ora Chișinăului).`;

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return metodaNepermisa(res, ['GET', 'POST']);
  let user;
  try {
    user = await cereAdmin(req, res);
    if (!user) return;
    const limita = limitaPeZi();

    if (req.method === 'GET') {
      const [randuri, folosite] = await Promise.all([
        cerereRest(`imagini?select=*&user_id=eq.${v(user.id)}&order=created_at.desc,id.desc&limit=60`),
        folositeAzi(user.id),
      ]);
      const linkuri = await linkuriTemporare(LOC, randuri.flatMap((r) => [r.cale_sursa, r.cale_rezultat]));
      const imagini = randuri.map((r) => ({
        id: r.id, created_at: r.created_at, stil: r.stil, stil_nume: STILURI[r.stil]?.nume || r.stil, dorinte: r.dorinte,
        sursa: linkuri[r.cale_sursa] || null, rezultat: linkuri[r.cale_rezultat] || null,
      }));
      return res.status(200).json({ ok: true, imagini, limita, ramase: Math.max(0, limita - folosite), stiluri: Object.fromEntries(Object.entries(STILURI).map(([k, s]) => [k, s.nume])) });
    }

    const d = corp(req);
    if (!STILURI[d.stil]) return res.status(400).json({ ok: false, eroare: 'Alegeți stilul imaginii.' });
    const dorinte = String(d.dorinte ?? '').trim().slice(0, 300);
    const f = citesteFisier(d, ['image/jpeg', 'image/png', 'image/webp']);
    if (f.eroare) return res.status(400).json({ ok: false, eroare: f.eroare === 'Alegeți o poză (JPG, PNG) sau un PDF.' ? 'Alegeți o poză a apartamentului (JPG sau PNG).' : f.eroare });

    // Limita se verifică pe server, înainte de a plăti generarea.
    const folosite = await folositeAzi(user.id);
    if (folosite >= limita) return res.status(429).json({ ok: false, limita_atinsa: true, eroare: MESAJ_LIMITA(limita), limita, ramase: 0 });

    let img;
    try {
      img = await genereazaImagine({ base64: f.base64, tip: f.tip, stil: d.stil, dorinte });
    } catch (e) {
      console.error('Gemini – eroare:', e.message);
      const mesaj = /GEMINI_API_KEY/.test(e.message) ? 'Lipsește cheia Google (GEMINI_API_KEY) în setările Vercel.'
        : e.cod === 'limita_furnizor' ? 'Google a oprit cererea: s-a atins limita contului. Încercați mai târziu.'
          : e.cod === 'fara_imagine' ? 'Google nu a generat imaginea pentru această poză. Încercați altă poză sau alt text.'
            : 'Imaginea nu a putut fi generată acum. Încercați din nou peste un minut.';
      return res.status(502).json({ ok: false, eroare: mesaj });
    }

    const caleSursa = caleNoua(`${user.id}/sursa`, f.tip);
    const caleRez = caleNoua(`${user.id}/rezultat`, img.tip);
    await incarcaFisier(LOC, caleSursa, f.octeti, f.tip);
    await incarcaFisier(LOC, caleRez, Buffer.from(img.base64, 'base64'), img.tip);
    const [rand] = await cerereRest('imagini', {
      method: 'POST', prefer: 'return=representation',
      body: { user_id: user.id, stil: d.stil, dorinte, cale_sursa: caleSursa, cale_rezultat: caleRez },
    });
    const linkuri = await linkuriTemporare(LOC, [caleSursa, caleRez]);
    return res.status(201).json({
      ok: true, ramase: Math.max(0, limita - folosite - 1), limita,
      imagine: { id: rand.id, created_at: rand.created_at, stil: d.stil, stil_nume: STILURI[d.stil].nume, dorinte, sursa: linkuri[caleSursa], rezultat: linkuri[caleRez] },
    });
  } catch (e) {
    console.error('Imagini – eroare:', e.message);
    const lipsa = /imagini/.test(e.message) && /does not exist|42P01|PGRST20/.test(e.message);
    return res.status(500).json({ ok: false, eroare: lipsa ? 'Lipsește tabelul imagini. Rulați supabase/tema2.sql în Supabase.' : 'Eroare la salvare. Încercați din nou.' });
  }
}
