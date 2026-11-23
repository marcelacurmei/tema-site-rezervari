# Ghid: tema 2 (CRM, documente cu Claude, Telegram Mini App, imagini)

Termen: **23 noiembrie 2026, 23:59**, ora Chișinăului.

**Regula de aur:** cheile nu se trimit în chat și nu se scriu în cod. Le lipiți doar în Vercel → **Settings** → **Environment Variables**.

---

## Pasul 1. Baza de date (2 minute)

1. Intrați pe **supabase.com**, în proiectul `tema-site-rezervari`.
2. În stânga: **SQL Editor** → **New query**.
3. Copiați tot textul din fișierul `supabase/tema2.sql` (pe GitHub: deschideți fișierul și apăsați butonul „Copy raw file”) și lipiți-l.
4. Apăsați **Run**. Trebuie să apară „Success”.

## Pasul 2. Cheia Claude API (5 minute)

1. Intrați pe **console.anthropic.com** și logați-vă (sau faceți cont).
2. **Settings** → **Billing**: adăugați cardul și puneți 5 $ (ajung pentru sute de bonuri).
3. **Settings** → **Limits**: la **Spend limit** puneți o limită lunară mică, de exemplu **10 $**. Aceasta e „limita de cheltuieli” cerută la punctul 7.
4. **API Keys** → **Create Key**, numele `tema-site`. Copiați cheia (începe cu `sk-ant-`). Se arată o singură dată.
5. În **Vercel** → proiectul → **Settings** → **Environment Variables** → **Add**: Name `ANTHROPIC_API_KEY`, Value = cheia. **Save**.

## Pasul 3. Cheia Google Gemini (5 minute)

1. Intrați pe **aistudio.google.com** cu contul Google.
2. Apăsați **Get API key** → **Create API key**. Copiați cheia (începe cu `AIza`).
3. Generarea de imagini cere plată activată: în AI Studio, la **Billing**, apăsați **Set up billing** și adăugați cardul.
4. Limita de cheltuieli: în același loc (**Billing** / **Spend**) puneți o limită lunară, de exemplu **5 $**. Dacă vi se cere un „budget” în Google Cloud, puneți tot 5 $ cu alertă pe email.
5. În **Vercel**, adăugați: Name `GEMINI_API_KEY`, Value = cheia. **Save**.

## Pasul 4. Publicarea

1. În **Vercel** → **Deployments**: la ultimul rând apăsați **⋯** → **Redeploy** (ca să citească cheile noi).
2. Deschideți `https://tema-site-rezervari.vercel.app/admin` și logați-vă.

## Pasul 5. Botul și Mini App-ul (3 minute)

Folosim botul de la tema 1 (cel care vă trimite cererile).

1. În panou, fila **📩 Cereri**, jos, la **Telegram Mini App**, apăsați **Conectează butonul „Rezervare” la bot**.
2. Pe telefon, deschideți botul în Telegram. Jos, lângă câmpul de mesaj, apare butonul **Rezervare**. Îl apăsați: aplicația se deschide pe tot ecranul și vă salută cu numele.
3. (Opțional, pentru un link direct) La **@BotFather**: `/mybots` → botul → **Bot Settings** → **Configure Mini App** → **Enable Mini App**, lipiți adresa `https://tema-site-rezervari.vercel.app/mini` și alegeți modul **Fullscreen**.

## Pasul 6. Capturile de ecran

Vezi lista din chat (sau mai jos, în „Ce trimiteți”).
