# Ghid: publicarea site-ului cu cereri (tema N1)

Termen: **16 noiembrie 2026, 23:59**, ora Chișinăului.

Site-ul e gata și testat pe Mac. Mai rămân conturile și setările, pe care le faceți dumneavoastră. Claude vă ghidează la fiecare pas.

**Regula de aur:** tokenul botului și cheile Supabase nu se trimit în chat. Le lipiți doar în Vercel, la pasul 5.

Țineți o notiță deschisă (de exemplu în Notes, pe Mac) în care să copiați, pe rând:

- tokenul botului;
- adresa proiectului Supabase;
- cheia secretă Supabase.

La final o puteți șterge.

---

## Pasul 1. Botul de Telegram (5 minute, pe telefon)

1. În Telegram căutați **@BotFather** (are bifa albastră) și apăsați **Start**.
2. Scrieți `/newbot`.
3. Numele botului: de exemplu `Airport Boutique Cereri`.
4. Numele de utilizator trebuie să se termine cu `bot`, de exemplu `airport_boutique_cereri_bot`.
5. BotFather vă trimite un **token**, un text lung de forma `123456:ABC...`. Copiați-l în notiță.
6. Deschideți linkul botului vostru (`t.me/...`) și apăsați **Start**. Fără acest pas, botul nu vă poate scrie.

## Pasul 2. Baza de date Supabase (10 minute)

1. Intrați pe **supabase.com** și apăsați **Start your project**. Vă înregistrați cel mai ușor cu GitHub (pasul 3) sau cu emailul.
2. Faceți un proiect nou (**New project**):
   - Nume: `tema-site-rezervari`.
   - Parola bazei de date: apăsați **Generate a password**. Nu o folosim, deci nu trebuie s-o țineți minte.
   - Regiunea: **Central EU (Frankfurt)**.
   - Apăsați **Create new project** și așteptați 1–2 minute.
3. Creați tabelul cu cereri:
   - În meniul din stânga alegeți **SQL Editor**.
   - Copiați tot textul din fișierul `supabase/schema.sql` și lipiți-l acolo.
   - Apăsați **Run**. Trebuie să apară „Success”.
4. Creați contul pentru panou:
   - În meniul din stânga alegeți **Authentication**, apoi **Users**, apoi **Add user** → **Create new user**.
   - Scrieți emailul vostru și o parolă nouă, puternică (doar pentru panou).
   - Bifați **Auto Confirm User** și apăsați **Create user**.
5. Copiați cheile în notiță:
   - Mergeți la **Project Settings** (rotița), apoi **Data API**, și copiați **Project URL** (de forma `https://xxxx.supabase.co`).
   - Mergeți la **Project Settings**, apoi **API Keys**. La **Secret keys** apăsați pe ochi sau pe „copy” și copiați cheia care începe cu `sb_secret_`.
   - Dacă acolo vedeți doar cheile vechi, copiați cheia **service_role** (secret).

## Pasul 3. GitHub (5 minute)

1. Intrați pe **github.com** și apăsați **Sign up**, dacă nu aveți deja cont.
2. Claude trimite codul site-ului pe GitHub. Vă va cere doar să confirmați în browser, cu un cod de 8 caractere.

## Pasul 4. Vercel: publicarea (5 minute)

1. Intrați pe **vercel.com** și apăsați **Sign Up**. Alegeți planul **Hobby** (gratuit) și **Continue with GitHub**.
2. Apăsați **Add New…**, apoi **Project**, și alegeți `tema-site-rezervari`, cu butonul **Import**.
3. La **Framework Preset** lăsați **Other**. Nu schimbați nimic altceva.
4. **Înainte de Deploy**, deschideți **Environment Variables** și adăugați câte un rând (pasul 5).

## Pasul 5. Cheile, doar în Vercel

| Name (scris exact așa) | Value (din notiță) |
|---|---|
| `SUPABASE_URL` | adresa proiectului, `https://xxxx.supabase.co` |
| `SUPABASE_SECRET_KEY` | cheia `sb_secret_...` |
| `TELEGRAM_BOT_TOKEN` | tokenul de la BotFather |

Apoi apăsați **Deploy**. După un minut primiți linkul public, de forma `https://tema-site-rezervari.vercel.app`.

## Pasul 6. ID-ul chat-ului de Telegram

1. Deschideți `linkul-vostru/admin` și intrați cu emailul și parola de la pasul 2.4.
2. Sus apare o casetă galbenă cu un număr: acela e ID-ul chat-ului.
   - Dacă nu apare, scrieți-i botului orice mesaj și apăsați **↻ Reîncarcă**.
3. În Vercel deschideți proiectul, apoi **Settings** → **Environment Variables**, și adăugați `TELEGRAM_CHAT_ID` cu acel număr.
4. Mergeți la **Deployments**. La ultimul rând apăsați **⋯** și apoi **Redeploy**.
5. În panou, butonul **Trimite un mesaj de probă pe Telegram** trebuie să vă trimită un mesaj în Telegram.

## Pasul 7. Verificarea finală și capturile de ecran

Faceți capturile pe telefon sau pe Mac (Cmd + Shift + 4):

1. **Site-ul pe telefon:** pagina principală deschisă pe telefon.
2. **Formularul gol:** apăsați „Trimite cererea” fără date. Se văd erorile roșii.
3. **Confirmarea:** completați o cerere de probă (de exemplu „Test Maria”). Se vede „Mulțumim! Cererea a fost trimisă”.
4. **Supabase:** **Table Editor**, tabelul `cereri`. Se vede rândul cu data creării și statusul `noua`.
5. **Fereastra incognito:**
   - Pe Mac, în Safari, apăsați Cmd + Shift + N și deschideți `linkul/admin`. Se vede doar formularul de logare, fără cereri.
   - Opțional, deschideți și `linkul/api/admin/cereri`: apare „Trebuie să vă logați”.
6. **Panoul după logare:** se vede lista, cu cererea de probă sus.
7. **Schimbarea statusului:** treceți cererea pe „În lucru” și apăsați filtrul „În lucru”.
8. **Telegram:** mesajul cu aceeași cerere, cu același nume și aceeași oră ca în panou.
9. **Cheile în Vercel:** **Settings** → **Environment Variables**, cu valorile ascunse (nu le dezvăluiți).
10. **GitHub:** fișierele proiectului. Nu există nicio cheie în ele (fișierul `.env.example` are doar modele).

## Ce scrieți la temă

- Linkul public: `https://....vercel.app`
- Linkul GitHub: `https://github.com/.../tema-site-rezervari`
- Capturile de mai sus.
- 2–3 propoziții despre ce a fost cel mai greu (în cuvintele voastre).
