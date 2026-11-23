-- Tema 2: CRM cu etape, cheltuieli din documente, imagini generate.
-- Se lipește o singură dată în Supabase → SQL Editor → Run (după schema.sql de la tema 1).
-- Se poate rula și de mai multe ori: nu strică nimic.

-- ---------- 1. Cererile știu de unde au venit ----------
alter table public.cereri add column if not exists sursa text not null default 'Site';
alter table public.cereri add column if not exists telegram_id bigint;
create index if not exists cereri_telegram on public.cereri (telegram_id, created_at desc);

-- ---------- 2. CRM: clienții, pe etape ----------
create table if not exists public.clienti (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  nume        text not null check (char_length(nume) between 1 and 100),
  telefon     text not null default '' check (char_length(telefon) <= 20),
  sursa       text not null check (sursa in ('Site', 'Manual', 'Telegram')),
  etapa       text not null default 'noua' check (etapa in ('noua', 'contactat', 'confirmata', 'cazat', 'refuz')),
  notite      text not null default '' check (char_length(notite) <= 5000),
  detalii     text not null default '' check (char_length(detalii) <= 1000),
  cerere_id   bigint references public.cereri (id) on delete set null,
  telegram_id bigint
);
create index if not exists clienti_creat on public.clienti (created_at desc);

-- Istoricul mutărilor între etape (cine, din ce etapă, în ce etapă, când).
create table if not exists public.istoric_etape (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  client_id   bigint not null references public.clienti (id) on delete cascade,
  din_etapa   text,
  in_etapa    text not null
);
create index if not exists istoric_client on public.istoric_etape (client_id, created_at);

-- Cererile vechi de pe site intră și ele în CRM, pe prima etapă (doar o dată).
with noi as (
  insert into public.clienti (created_at, nume, telefon, sursa, detalii, cerere_id)
  select c.created_at, c.nume, c.telefon, c.sursa,
         to_char(c.sosire, 'DD.MM.YYYY') || ' – ' || to_char(c.plecare, 'DD.MM.YYYY') || ', oaspeți: ' || c.oaspeti
           || case when c.comentariu <> '' then E'\n' || c.comentariu else '' end,
         c.id
  from public.cereri c
  where not exists (select 1 from public.clienti k where k.cerere_id = c.id)
  returning id, created_at
)
insert into public.istoric_etape (created_at, client_id, din_etapa, in_etapa)
select created_at, id, null, 'noua' from noi;

-- ---------- 3. Cheltuieli (din bonuri și facturi) ----------
create table if not exists public.cheltuieli (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  data           date,
  tip_document   text not null default 'bon' check (tip_document in ('bon', 'factura', 'chitanta', 'alt_document')),
  furnizor       text not null default '' check (char_length(furnizor) <= 200),
  numar_document text not null default '' check (char_length(numar_document) <= 100),
  descriere      text not null default '' check (char_length(descriere) <= 1000),
  categorie      text not null default 'Altele',
  suma           numeric(12, 2) not null check (suma >= 0),
  moneda         text not null default 'MDL' check (moneda in ('MDL', 'EUR', 'USD', 'RON', 'UAH')),
  fisier_cale    text not null,
  fisier_tip     text not null,
  fisier_nume    text not null default '',
  recunoscut     jsonb
);
create index if not exists cheltuieli_data on public.cheltuieli (data desc nulls last, id desc);

-- ---------- 4. Imagini generate (istoric + limita pe zi) ----------
create table if not exists public.imagini (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  user_id       text not null,
  stil          text not null,
  dorinte       text not null default '',
  cale_sursa    text not null,
  cale_rezultat text not null
);
create index if not exists imagini_user on public.imagini (user_id, created_at desc);

-- ---------- 5. Securitate: nimic public ----------
alter table public.clienti enable row level security;
alter table public.istoric_etape enable row level security;
alter table public.cheltuieli enable row level security;
alter table public.imagini enable row level security;
revoke all on public.clienti, public.istoric_etape, public.cheltuieli, public.imagini from anon, authenticated;

-- ---------- 6. Locurile pentru fișiere (private: se deschid doar cu link temporar) ----------
insert into storage.buckets (id, name, public)
values ('documente', 'documente', false), ('imagini', 'imagini', false)
on conflict (id) do nothing;
