import { valideaza, aziChisinau, adunaZile, formatData, noptiIntre } from '/comun.js';

const T = {
  ro: {
    incarcare: 'Se încarcă…',
    doar_telegram: 'Această pagină funcționează doar în Telegram. Deschideți botul și apăsați butonul „Rezervare” din meniu.',
    deschide_bot: (b) => `Deschide @${b} în Telegram`,
    salut: (n) => `Bună, ${n}! 👋`,
    intro: 'Studio liniștit la 5 minute de aeroportul Chișinău. Trimiteți o cerere și gazda vă răspunde cu prețul.',
    titlu_form: 'Cerere de rezervare',
    sosire: 'Sosire', plecare: 'Plecare', oaspeti: 'Oaspeți', telefon: 'Telefon (Viber / WhatsApp)', comentariu: 'Comentariu (opțional)',
    trimite: 'Trimite cererea', se_trimite: 'Se trimite…',
    multumim: 'Mulțumim! Cererea a fost trimisă.', multumim_text: 'Gazda vă scrie în curând. Confirmarea a venit și în chat.',
    inca_una: 'Trimite altă cerere', cererile_mele: 'Cererile mele',
    stari: { noua: 'Nouă', in_lucru: 'În lucru', inchisa: 'Închisă' },
    nopti: (k) => `${k} ${k === 1 ? 'noapte' : 'nopți'}`,
    e: {
      obligatoriu: 'Câmp obligatoriu.', telefon_invalid: 'Număr greșit. Exemplu: +373 69 123 456.', data_invalida: 'Alegeți o dată.',
      data_trecuta: 'Data nu poate fi în trecut.', prea_departe: 'Cel mult 2 ani înainte.', plecare_inainte: 'Plecarea trebuie să fie după sosire.',
      sejur_prea_lung: 'Cel mult 90 de nopți.', oaspeti_invalid: 'Cel mult 3 oaspeți.', prea_lung: 'Textul e prea lung.', nume_invalid: 'Nume greșit.',
      generala: 'Verificați câmpurile marcate cu roșu.', retea: 'Nu s-a putut trimite. Verificați internetul.',
      server: 'A apărut o problemă. Încercați din nou peste un minut.', prea_multe: 'Ați trimis deja multe cereri azi. Gazda vă va scrie.',
      sesiune: 'Sesiunea Telegram a expirat. Închideți și redeschideți aplicația.',
    },
  },
  ru: {
    incarcare: 'Загрузка…',
    doar_telegram: 'Эта страница работает только в Telegram. Откройте бота и нажмите кнопку «Rezervare» в меню.',
    deschide_bot: (b) => `Открыть @${b} в Telegram`,
    salut: (n) => `Здравствуйте, ${n}! 👋`,
    intro: 'Тихая студия в 5 минутах от аэропорта Кишинёва. Оставьте заявку — хозяйка ответит с ценой.',
    titlu_form: 'Заявка на бронирование',
    sosire: 'Заезд', plecare: 'Выезд', oaspeti: 'Гостей', telefon: 'Телефон (Viber / WhatsApp)', comentariu: 'Комментарий (необязательно)',
    trimite: 'Отправить заявку', se_trimite: 'Отправляем…',
    multumim: 'Спасибо! Заявка отправлена.', multumim_text: 'Хозяйка скоро напишет вам. Подтверждение пришло и в чат.',
    inca_una: 'Отправить ещё одну', cererile_mele: 'Мои заявки',
    stari: { noua: 'Новая', in_lucru: 'В работе', inchisa: 'Закрыта' },
    nopti: (k) => `ночей: ${k}`,
    e: {
      obligatoriu: 'Обязательное поле.', telefon_invalid: 'Неверный номер. Пример: +373 69 123 456.', data_invalida: 'Выберите дату.',
      data_trecuta: 'Дата не может быть в прошлом.', prea_departe: 'Не более чем на 2 года вперёд.', plecare_inainte: 'Выезд должен быть позже заезда.',
      sejur_prea_lung: 'Не более 90 ночей.', oaspeti_invalid: 'Не более 3 гостей.', prea_lung: 'Слишком длинный текст.', nume_invalid: 'Неверное имя.',
      generala: 'Проверьте поля, отмеченные красным.', retea: 'Не удалось отправить. Проверьте интернет.',
      server: 'Возникла проблема. Попробуйте через минуту.', prea_multe: 'Сегодня вы уже отправили много заявок. Хозяйка вам напишет.',
      sesiune: 'Сессия Telegram устарела. Закройте и откройте приложение снова.',
    },
  },
  uk: {
    incarcare: 'Завантаження…',
    doar_telegram: 'Ця сторінка працює лише в Telegram. Відкрийте бота й натисніть кнопку «Rezervare» в меню.',
    deschide_bot: (b) => `Відкрити @${b} у Telegram`,
    salut: (n) => `Вітаємо, ${n}! 👋`,
    intro: 'Тиха студія за 5 хвилин від аеропорту Кишинева. Залиште заявку — господиня відповість із ціною.',
    titlu_form: 'Заявка на бронювання',
    sosire: 'Заїзд', plecare: 'Виїзд', oaspeti: 'Гостей', telefon: 'Телефон (Viber / WhatsApp)', comentariu: 'Коментар (необовʼязково)',
    trimite: 'Надіслати заявку', se_trimite: 'Надсилаємо…',
    multumim: 'Дякуємо! Заявку надіслано.', multumim_text: 'Господиня скоро напише вам. Підтвердження прийшло й у чат.',
    inca_una: 'Надіслати ще одну', cererile_mele: 'Мої заявки',
    stari: { noua: 'Нова', in_lucru: 'В роботі', inchisa: 'Закрита' },
    nopti: (k) => `ночей: ${k}`,
    e: {
      obligatoriu: 'Обовʼязкове поле.', telefon_invalid: 'Невірний номер. Приклад: +380 67 123 4567.', data_invalida: 'Оберіть дату.',
      data_trecuta: 'Дата не може бути в минулому.', prea_departe: 'Не більше ніж на 2 роки вперед.', plecare_inainte: 'Виїзд має бути пізніше заїзду.',
      sejur_prea_lung: 'Не більше 90 ночей.', oaspeti_invalid: 'Не більше 3 гостей.', prea_lung: 'Задовгий текст.', nume_invalid: 'Невірне імʼя.',
      generala: 'Перевірте поля, позначені червоним.', retea: 'Не вдалося надіслати. Перевірте інтернет.',
      server: 'Виникла проблема. Спробуйте за хвилину.', prea_multe: 'Сьогодні ви вже надіслали багато заявок. Господиня вам напише.',
      sesiune: 'Сесія Telegram застаріла. Закрийте й відкрийте застосунок знову.',
    },
  },
  en: {
    incarcare: 'Loading…',
    doar_telegram: 'This page only works inside Telegram. Open the bot and tap the “Rezervare” menu button.',
    deschide_bot: (b) => `Open @${b} in Telegram`,
    salut: (n) => `Hello, ${n}! 👋`,
    intro: 'A quiet studio 5 minutes from Chișinău airport. Send a request and the host will reply with the price.',
    titlu_form: 'Booking request',
    sosire: 'Check-in', plecare: 'Check-out', oaspeti: 'Guests', telefon: 'Phone (Viber / WhatsApp)', comentariu: 'Comment (optional)',
    trimite: 'Send request', se_trimite: 'Sending…',
    multumim: 'Thank you! Your request was sent.', multumim_text: 'The host will message you soon. A confirmation is also in the chat.',
    inca_una: 'Send another request', cererile_mele: 'My requests',
    stari: { noua: 'New', in_lucru: 'In progress', inchisa: 'Closed' },
    nopti: (k) => `${k} ${k === 1 ? 'night' : 'nights'}`,
    e: {
      obligatoriu: 'Required.', telefon_invalid: 'Invalid number. Example: +373 69 123 456.', data_invalida: 'Choose a date.',
      data_trecuta: 'The date cannot be in the past.', prea_departe: 'At most 2 years ahead.', plecare_inainte: 'Check-out must be after check-in.',
      sejur_prea_lung: 'At most 90 nights.', oaspeti_invalid: 'At most 3 guests.', prea_lung: 'Text is too long.', nume_invalid: 'Invalid name.',
      generala: 'Please check the fields marked in red.', retea: 'Could not send. Check your connection.',
      server: 'Something went wrong. Please try again in a minute.', prea_multe: 'You have already sent many requests today. The host will message you.',
      sesiune: 'The Telegram session expired. Close and reopen the app.',
    },
  },
};

const $ = (id) => document.getElementById(id);
const tg = window.Telegram && window.Telegram.WebApp;
const initData = (tg && tg.initData) || '';
let limba = ['ro', 'ru', 'uk', 'en'].includes(document.documentElement.lang) ? document.documentElement.lang : 'ro';
const t = () => T[limba] || T.en;

function arata(id) {
  for (const e of ['ecran-incarcare', 'ecran-doar-telegram', 'ecran-app']) $(e).hidden = e !== id;
}

async function post(corp) {
  const r = await fetch('/api/mini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...corp, initData }) });
  const d = await r.json().catch(() => ({}));
  return { status: r.status, d };
}

// ---------- Deschis în afara Telegram: nu arătăm nicio dată ----------
async function doarTelegram() {
  const l = (navigator.language || '').slice(0, 2);
  limba = T[l] ? l : 'ro';
  document.documentElement.lang = limba;
  $('t-doar-telegram').textContent = t().doar_telegram;
  arata('ecran-doar-telegram');
  try {
    const d = await (await fetch('/api/mini')).json();
    if (d.bot) {
      const a = $('link-bot');
      a.href = `https://t.me/${encodeURIComponent(d.bot)}`;
      a.textContent = t().deschide_bot(d.bot);
      a.hidden = false;
    }
  } catch { /* fără link */ }
}

// ---------- Textele în limba utilizatorului ----------
function scrieTexte(prenume) {
  const x = t();
  document.documentElement.lang = limba;
  $('salut').textContent = x.salut(prenume);
  $('t-intro').textContent = x.intro;
  $('t-titlu-form').textContent = x.titlu_form;
  $('l-sosire').textContent = x.sosire;
  $('l-plecare').textContent = x.plecare;
  $('l-oaspeti').textContent = x.oaspeti;
  $('l-telefon').textContent = x.telefon;
  $('l-comentariu').textContent = x.comentariu;
  $('trimite').textContent = x.trimite;
  $('t-multumim').textContent = x.multumim;
  $('t-multumim-text').textContent = x.multumim_text;
  $('inca-una').textContent = x.inca_una;
  $('t-cererile-mele').textContent = x.cererile_mele;
}

function deseneazaCereri(cereri) {
  $('cererile-mele').hidden = !cereri || !cereri.length;
  if (!cereri) return;
  $('lista-cereri').replaceChildren(...cereri.map((c) => {
    const li = document.createElement('li');
    const st = document.createElement('span');
    st.className = 'stare'; st.dataset.s = c.status; st.textContent = t().stari[c.status] || c.status;
    const txt = document.createElement('span');
    txt.textContent = `${formatData(c.sosire)} – ${formatData(c.plecare)} · ${t().nopti(noptiIntre(c.sosire, c.plecare))} · 👥 ${c.oaspeti}`;
    li.append(txt, st);
    return li;
  }));
}

// ---------- Formularul ----------
function pregatesteDate() {
  const azi = aziChisinau();
  $('sosire').min = azi; $('plecare').min = adunaZile(azi, 1);
  $('sosire').max = adunaZile(azi, 730); $('plecare').max = adunaZile(azi, 820);
  $('sosire').addEventListener('change', () => {
    const s = $('sosire').value;
    if (!s) return;
    $('plecare').min = adunaZile(s, 1);
    if (!$('plecare').value || $('plecare').value <= s) $('plecare').value = adunaZile(s, 1);
  });
}

function aratErori(erori) {
  for (const p of document.querySelectorAll('[data-pentru]')) {
    const cod = erori[p.dataset.pentru];
    p.textContent = cod ? (t().e[cod] || t().e.generala) : '';
    const camp = document.getElementById(p.dataset.pentru);
    if (camp) camp.setAttribute('aria-invalid', cod ? 'true' : 'false');
  }
}

function dateFormular() {
  const f = new FormData($('form'));
  return {
    sosire: f.get('sosire') || '', plecare: f.get('plecare') || '', oaspeti: f.get('oaspeti') || '2',
    telefon: f.get('telefon') || '', comentariu: f.get('comentariu') || '', limba,
  };
}

$('form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const date = dateFormular();
  const v = valideaza({ ...date, nume: 'Telegram' });
  aratErori(v.erori);
  $('eroare-generala').textContent = '';
  if (!v.ok) {
    $('eroare-generala').textContent = t().e.generala;
    tg?.HapticFeedback?.notificationOccurred('error');
    return;
  }
  const b = $('trimite');
  b.disabled = true; b.textContent = t().se_trimite;
  try {
    const { status, d } = await post({ actiune: 'cerere', ...date });
    if (status === 200 && d.ok) {
      $('form').hidden = true;
      $('multumim').hidden = false;
      deseneazaCereri(d.cereri);
      tg?.HapticFeedback?.notificationOccurred('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (d.erori) { aratErori(d.erori); $('eroare-generala').textContent = t().e.generala; return; }
    $('eroare-generala').textContent = status === 401 ? t().e.sesiune : status === 429 ? t().e.prea_multe : t().e.server;
  } catch {
    $('eroare-generala').textContent = t().e.retea;
  } finally {
    b.disabled = false; b.textContent = t().trimite;
  }
});

$('inca-una').addEventListener('click', () => {
  $('form').reset();
  aratErori({});
  $('multumim').hidden = true;
  $('form').hidden = false;
});

// ---------- Pornire ----------
async function porneste() {
  if (!tg || !initData) return doarTelegram();

  tg.ready();
  tg.expand();
  // Pe telefon: pe tot ecranul (Telegram 8.0+), fără să se închidă când derulăm formularul.
  try {
    if (tg.isVersionAtLeast && tg.isVersionAtLeast('8.0') && ['ios', 'android'].includes(tg.platform)) tg.requestFullscreen();
    if (tg.isVersionAtLeast && tg.isVersionAtLeast('7.7')) tg.disableVerticalSwipes();
  } catch { /* versiune veche de Telegram – rămâne extins */ }
  try { tg.setHeaderColor('secondary_bg_color'); tg.setBackgroundColor('secondary_bg_color'); } catch { /* nu e grav */ }

  const cod = String(tg.initDataUnsafe?.user?.language_code || '').slice(0, 2);
  limba = T[cod] ? cod : 'en';
  $('t-incarcare').textContent = t().incarcare;

  try {
    // Numele și cererile vin de la server, după verificarea semnăturii Telegram (HMAC).
    const { status, d } = await post({ actiune: 'start' });
    if (status !== 200 || !d.ok) {
      if (status === 401) return doarTelegram();
      throw new Error(d.eroare || 'server');
    }
    limba = T[d.limba] ? d.limba : limba;
    scrieTexte(d.prenume || d.nume);
    pregatesteDate();
    deseneazaCereri(d.cereri);
    arata('ecran-app');
  } catch {
    $('t-incarcare').textContent = t().e.server;
    document.querySelector('.rotita').hidden = true;
  }
}

porneste();
