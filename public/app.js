import { valideaza, aziChisinau, adunaZile, noptiIntre, formatData } from '/comun.js';

const T = {
  ro: {
    eticheta: 'Chișinău · Satul German',
    titlu: 'Studio liniștit la 5 minute de aeroport',
    subtitlu: 'Ideal pentru zboruri devreme sau sosiri târzii. Rezervați direct la gazdă, fără comisionul platformelor.',
    buton_erou: 'Cere o rezervare',
    a1_t: '5 minute de aeroport', a1_d: 'cu taxiul, ziua sau noaptea',
    a2_t: 'Studio 29 m²', a2_d: 'până la 2 adulți și 1 copil',
    a3_t: 'Parcare gratuită', a3_d: 'chiar lângă bloc',
    a4_t: 'Wi-Fi gratuit', a4_d: 'rapid, în tot apartamentul',
    a5_t: 'Check-in de la 14:00', a5_d: 'sosirea târzie e acceptată',
    a6_t: 'Rezervare directă', a6_d: 'fără intermediari și comisioane',
    f_titlu: 'Cerere de rezervare',
    f_nota: 'Completați formularul și vă răspundem cât mai repede cu prețul și disponibilitatea. Cererea nu vă obligă la nimic.',
    l_nume: 'Nume și prenume', l_telefon: 'Telefon (Viber / WhatsApp / Telegram)',
    l_sosire: 'Sosire', l_plecare: 'Plecare', l_oaspeti: 'Număr de oaspeți',
    l_comentariu: 'Comentariu', optional: '(opțional)',
    p_comentariu: 'Ora sosirii, numărul zborului, întrebări…',
    trimite: 'Trimite cererea', se_trimite: 'Se trimite…',
    c_titlu: 'Mulțumim! Cererea a fost trimisă.',
    c_text: 'Vă contactăm în curând la numărul de telefon indicat.',
    c_rezumat: (n, s, p, k) => `${n}, ${s} – ${p} (${k} ${k === 1 ? 'noapte' : 'nopți'}).`,
    din_nou: 'Trimite altă cerere',
    i_titlu: 'Bine de știut',
    i1: 'Check-in de la 14:00, check-out până la 12:00.',
    i2: 'Fumatul și petrecerile sunt interzise.',
    i3: 'Adresa: str. Europa 7, Satul German, Chișinău.',
    e: {
      obligatoriu: 'Câmp obligatoriu.',
      nume_invalid: 'Scrieți numele (cel puțin 2 litere).',
      prea_lung: 'Textul e prea lung.',
      telefon_invalid: 'Număr greșit. Exemplu: +373 69 123 456.',
      data_invalida: 'Alegeți o dată.',
      data_trecuta: 'Data nu poate fi în trecut.',
      prea_departe: 'Primim cereri cu cel mult 2 ani înainte.',
      plecare_inainte: 'Plecarea trebuie să fie după sosire.',
      sejur_prea_lung: 'Cel mult 90 de nopți. Pentru mai mult, scrieți-ne.',
      oaspeti_invalid: 'Cel mult 3 oaspeți.',
      generala: 'Verificați câmpurile marcate cu roșu.',
      retea: 'Nu s-a putut trimite. Verificați internetul și încercați din nou.',
      server: 'A apărut o problemă la noi. Încercați din nou peste un minut.',
    },
  },
  ru: {
    eticheta: 'Кишинёв · Сатул Герман',
    titlu: 'Тихая студия в 5 минутах от аэропорта',
    subtitlu: 'Удобно для ранних вылетов и поздних прилётов. Бронируйте напрямую у хозяйки — без комиссии площадок.',
    buton_erou: 'Оставить заявку',
    a1_t: '5 минут до аэропорта', a1_d: 'на такси, днём и ночью',
    a2_t: 'Студия 29 м²', a2_d: 'до 2 взрослых и 1 ребёнка',
    a3_t: 'Бесплатная парковка', a3_d: 'прямо у дома',
    a4_t: 'Бесплатный Wi-Fi', a4_d: 'быстрый, по всей квартире',
    a5_t: 'Заезд с 14:00', a5_d: 'поздний заезд возможен',
    a6_t: 'Прямое бронирование', a6_d: 'без посредников и комиссий',
    f_titlu: 'Заявка на бронирование',
    f_nota: 'Заполните форму — мы быстро ответим с ценой и наличием мест. Заявка ни к чему не обязывает.',
    l_nume: 'Имя и фамилия', l_telefon: 'Телефон (Viber / WhatsApp / Telegram)',
    l_sosire: 'Заезд', l_plecare: 'Выезд', l_oaspeti: 'Количество гостей',
    l_comentariu: 'Комментарий', optional: '(необязательно)',
    p_comentariu: 'Время прибытия, номер рейса, вопросы…',
    trimite: 'Отправить заявку', se_trimite: 'Отправляем…',
    c_titlu: 'Спасибо! Заявка отправлена.',
    c_text: 'Мы скоро свяжемся с вами по указанному телефону.',
    c_rezumat: (n, s, p, k) => `${n}, ${s} – ${p} (ночей: ${k}).`,
    din_nou: 'Отправить ещё одну заявку',
    i_titlu: 'Полезно знать',
    i1: 'Заезд с 14:00, выезд до 12:00.',
    i2: 'Курение и вечеринки запрещены.',
    i3: 'Адрес: ул. Европа 7, Сатул Герман, Кишинёв.',
    e: {
      obligatoriu: 'Обязательное поле.',
      nume_invalid: 'Укажите имя (минимум 2 буквы).',
      prea_lung: 'Слишком длинный текст.',
      telefon_invalid: 'Неверный номер. Пример: +380 67 123 4567.',
      data_invalida: 'Выберите дату.',
      data_trecuta: 'Дата не может быть в прошлом.',
      prea_departe: 'Принимаем заявки не более чем на 2 года вперёд.',
      plecare_inainte: 'Выезд должен быть позже заезда.',
      sejur_prea_lung: 'Не более 90 ночей. Для долгого срока напишите нам.',
      oaspeti_invalid: 'Не более 3 гостей.',
      generala: 'Проверьте поля, отмеченные красным.',
      retea: 'Не удалось отправить. Проверьте интернет и попробуйте ещё раз.',
      server: 'У нас временная ошибка. Попробуйте через минуту.',
    },
  },
  uk: {
    eticheta: 'Кишинів · Сатул Герман',
    titlu: 'Тиха студія за 5 хвилин від аеропорту',
    subtitlu: 'Зручно для ранніх вильотів і пізніх прильотів. Бронюйте напряму в господині — без комісії платформ.',
    buton_erou: 'Залишити заявку',
    a1_t: '5 хвилин до аеропорту', a1_d: 'таксі, вдень і вночі',
    a2_t: 'Студія 29 м²', a2_d: 'до 2 дорослих і 1 дитини',
    a3_t: 'Безкоштовна парковка', a3_d: 'просто біля будинку',
    a4_t: 'Безкоштовний Wi-Fi', a4_d: 'швидкий, у всій квартирі',
    a5_t: 'Заїзд з 14:00', a5_d: 'пізній заїзд можливий',
    a6_t: 'Пряме бронювання', a6_d: 'без посередників і комісій',
    f_titlu: 'Заявка на бронювання',
    f_nota: 'Заповніть форму — ми швидко відповімо з ціною та наявністю. Заявка ні до чого не зобовʼязує.',
    l_nume: 'Імʼя та прізвище', l_telefon: 'Телефон (Viber / WhatsApp / Telegram)',
    l_sosire: 'Заїзд', l_plecare: 'Виїзд', l_oaspeti: 'Кількість гостей',
    l_comentariu: 'Коментар', optional: '(необовʼязково)',
    p_comentariu: 'Час прибуття, номер рейсу, питання…',
    trimite: 'Надіслати заявку', se_trimite: 'Надсилаємо…',
    c_titlu: 'Дякуємо! Заявку надіслано.',
    c_text: 'Ми скоро звʼяжемося з вами за вказаним телефоном.',
    c_rezumat: (n, s, p, k) => `${n}, ${s} – ${p} (ночей: ${k}).`,
    din_nou: 'Надіслати ще одну заявку',
    i_titlu: 'Корисно знати',
    i1: 'Заїзд з 14:00, виїзд до 12:00.',
    i2: 'Куріння та вечірки заборонені.',
    i3: 'Адреса: вул. Європа 7, Сатул Герман, Кишинів.',
    e: {
      obligatoriu: 'Обовʼязкове поле.',
      nume_invalid: 'Вкажіть імʼя (щонайменше 2 літери).',
      prea_lung: 'Занадто довгий текст.',
      telefon_invalid: 'Невірний номер. Приклад: +380 67 123 4567.',
      data_invalida: 'Оберіть дату.',
      data_trecuta: 'Дата не може бути в минулому.',
      prea_departe: 'Приймаємо заявки не більше ніж на 2 роки вперед.',
      plecare_inainte: 'Виїзд має бути пізніше за заїзд.',
      sejur_prea_lung: 'Не більше 90 ночей. Для довшого терміну напишіть нам.',
      oaspeti_invalid: 'Не більше 3 гостей.',
      generala: 'Перевірте поля, позначені червоним.',
      retea: 'Не вдалося надіслати. Перевірте інтернет і спробуйте ще раз.',
      server: 'У нас тимчасова помилка. Спробуйте за хвилину.',
    },
  },
  en: {
    eticheta: 'Chișinău · Satul German',
    titlu: 'A quiet studio 5 minutes from the airport',
    subtitlu: 'Perfect for early flights and late arrivals. Book directly with the host — no platform fees.',
    buton_erou: 'Request a booking',
    a1_t: '5 minutes to the airport', a1_d: 'by taxi, day or night',
    a2_t: '29 m² studio', a2_d: 'up to 2 adults and 1 child',
    a3_t: 'Free parking', a3_d: 'right next to the building',
    a4_t: 'Free Wi-Fi', a4_d: 'fast, in the whole flat',
    a5_t: 'Check-in from 14:00', a5_d: 'late arrival is fine',
    a6_t: 'Direct booking', a6_d: 'no middlemen, no fees',
    f_titlu: 'Booking request',
    f_nota: 'Fill in the form and we will quickly reply with the price and availability. The request is not binding.',
    l_nume: 'Full name', l_telefon: 'Phone (Viber / WhatsApp / Telegram)',
    l_sosire: 'Check-in', l_plecare: 'Check-out', l_oaspeti: 'Guests',
    l_comentariu: 'Comment', optional: '(optional)',
    p_comentariu: 'Arrival time, flight number, questions…',
    trimite: 'Send request', se_trimite: 'Sending…',
    c_titlu: 'Thank you! Your request has been sent.',
    c_text: 'We will contact you soon at the phone number you gave.',
    c_rezumat: (n, s, p, k) => `${n}, ${s} – ${p} (${k} ${k === 1 ? 'night' : 'nights'}).`,
    din_nou: 'Send another request',
    i_titlu: 'Good to know',
    i1: 'Check-in from 14:00, check-out by 12:00.',
    i2: 'No smoking and no parties.',
    i3: 'Address: 7 Europa St., Satul German, Chișinău.',
    e: {
      obligatoriu: 'This field is required.',
      nume_invalid: 'Please enter your name (at least 2 letters).',
      prea_lung: 'The text is too long.',
      telefon_invalid: 'Invalid number. Example: +44 7700 900123.',
      data_invalida: 'Please choose a date.',
      data_trecuta: 'The date cannot be in the past.',
      prea_departe: 'We accept requests up to 2 years ahead.',
      plecare_inainte: 'Check-out must be after check-in.',
      sejur_prea_lung: 'At most 90 nights. For longer stays, please write to us.',
      oaspeti_invalid: 'At most 3 guests.',
      generala: 'Please check the fields marked in red.',
      retea: 'Could not send. Check your connection and try again.',
      server: 'Something went wrong on our side. Please try again in a minute.',
    },
  },
};

const CAMPURI = ['nume', 'telefon', 'sosire', 'plecare', 'oaspeti', 'comentariu'];
const $ = (id) => document.getElementById(id);
const formular = $('formular');
const buton = $('trimite');
let limba = alegeLimba();
let ultimeleErori = {};

function alegeLimba() {
  try {
    const salvata = localStorage.getItem('limba');
    if (salvata && T[salvata]) return salvata;
  } catch { /* fără memorie locală – mergem mai departe */ }
  for (const l of navigator.languages || [navigator.language || 'ro']) {
    const scurt = String(l).slice(0, 2).toLowerCase();
    if (T[scurt]) return scurt;
  }
  return 'ro';
}

function aplicaLimba(l) {
  limba = l;
  document.documentElement.lang = l;
  const d = T[l];
  document.querySelectorAll('[data-t]').forEach((el) => {
    const v = d[el.dataset.t];
    if (typeof v === 'string') el.textContent = v;
  });
  document.querySelectorAll('[data-t-placeholder]').forEach((el) => {
    el.placeholder = d[el.dataset.tPlaceholder];
  });
  document.querySelectorAll('[data-limba]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.limba === l));
  });
  arataErori(ultimeleErori, false);
  try { localStorage.setItem('limba', l); } catch { /* nu e grav */ }
}

function arataErori(erori, cuFocus = true) {
  ultimeleErori = erori;
  const d = T[limba].e;
  let primul = null;
  for (const c of CAMPURI) {
    const el = $(c);
    const cod = erori[c];
    $(`eroare-${c}`).textContent = cod ? (d[cod] || d.generala) : '';
    el.toggleAttribute('aria-invalid', Boolean(cod));
    if (cod && !primul) primul = el;
  }
  const generala = erori._general || (primul ? 'generala' : '');
  $('eroare-generala').textContent = generala ? d[generala] : '';
  if (primul && cuFocus) primul.focus();
}

function dateFormular() {
  const fd = new FormData(formular);
  const date = Object.fromEntries(fd.entries());
  date.limba = limba;
  return date;
}

function setDateMinime() {
  const azi = aziChisinau();
  $('sosire').min = azi;
  $('plecare').min = adunaZile($('sosire').value || azi, 1);
}

// Câmpul cu eroare se curăță imediat ce oaspetele îl corectează.
formular.addEventListener('input', (ev) => {
  const c = ev.target.name;
  if (!ultimeleErori[c]) return;
  const v = valideaza(dateFormular());
  const noi = { ...ultimeleErori };
  if (!v.erori[c]) delete noi[c];
  if (c === 'sosire' && !v.erori.plecare) delete noi.plecare;
  delete noi._general;
  arataErori(noi, false);
});

$('sosire').addEventListener('change', () => {
  setDateMinime();
  const s = $('sosire').value;
  const p = $('plecare');
  if (s && (!p.value || p.value <= s)) p.value = adunaZile(s, 1);
});

formular.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const date = dateFormular();
  const v = valideaza(date);
  if (!v.ok) return arataErori(v.erori);

  buton.disabled = true;
  buton.textContent = T[limba].se_trimite;
  try {
    const r = await fetch('/api/cerere', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(date),
    });
    const rasp = await r.json().catch(() => ({}));
    if (r.status === 400 && rasp.erori) return arataErori(rasp.erori);
    if (!r.ok || !rasp.ok) return arataErori({ _general: 'server' });
    arataConfirmare(v.curat);
  } catch {
    arataErori({ _general: 'retea' });
  } finally {
    buton.disabled = false;
    buton.textContent = T[limba].trimite;
  }
});

function arataConfirmare(c) {
  const k = noptiIntre(c.sosire, c.plecare);
  $('c-rezumat').textContent = T[limba].c_rezumat(c.nume, formatData(c.sosire), formatData(c.plecare), k);
  $('zona-formular').hidden = true;
  const conf = $('confirmare');
  conf.hidden = false;
  conf.focus();
  conf.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

$('din-nou').addEventListener('click', () => {
  formular.reset();
  arataErori({}, false);
  setDateMinime();
  $('confirmare').hidden = true;
  $('zona-formular').hidden = false;
  $('nume').focus();
});

document.querySelectorAll('[data-limba]').forEach((b) => {
  b.addEventListener('click', () => aplicaLimba(b.dataset.limba));
});

$('an').textContent = new Date().getFullYear();
setDateMinime();
aplicaLimba(limba);
