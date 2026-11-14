-- Tabelul cu cererile de rezervare.
-- Se lipește o singură dată în Supabase → SQL Editor → Run.

create table if not exists public.cereri (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  nume        text not null check (char_length(nume) between 2 and 100),
  telefon     text not null check (char_length(telefon) between 7 and 16),
  sosire      date not null,
  plecare     date not null check (plecare > sosire),
  oaspeti     smallint not null default 2 check (oaspeti between 1 and 3),
  comentariu  text not null default '' check (char_length(comentariu) <= 1000),
  limba       text not null default 'ro' check (limba in ('ro', 'ru', 'uk', 'en')),
  status      text not null default 'noua' check (status in ('noua', 'in_lucru', 'inchisa'))
);

comment on column public.cereri.status is 'noua = nouă, in_lucru = în lucru, inchisa = închisă';

create index if not exists cereri_status_creata on public.cereri (status, created_at desc);

-- Securitate: fără reguli de acces publice. Din internet nimeni nu poate citi sau scrie direct;
-- doar funcțiile site-ului de pe Vercel, cu cheia secretă din setările Vercel.
alter table public.cereri enable row level security;
revoke all on public.cereri from anon, authenticated;
