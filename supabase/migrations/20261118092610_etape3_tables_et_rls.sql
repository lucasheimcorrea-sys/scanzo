-- Scanzo — étape 3 : tables de base + Row Level Security
-- Modèle : 03_Technique/architecture.md (prix par filiale, EAN = clé qui relie tout)

-- 1. Produits (rempli à partir d'Open Food Facts)
create table public.produits (
  ean        text primary key check (ean ~ '^[0-9]{6,14}$'),
  nom        text,
  marque     text,
  quantite   text,               -- texte brut d'Open Food Facts, ex. "1,5 l"
  created_at timestamptz not null default now()
);

-- 2. Magasins : une ligne par filiale
create table public.magasins (
  id         uuid primary key default gen_random_uuid(),
  enseigne   text not null check (enseigne in ('migros','coop','denner','lidl','aldi')),
  nom        text not null,      -- ex. "Migros Métropole"
  adresse    text,
  npa        text,
  ville      text,
  osm_id     text unique,        -- piste : liste tirée d'OpenStreetMap
  created_at timestamptz not null default now()
);

-- 3. Prix : produit + filiale + prix + date
create table public.prix (
  id          uuid primary key default gen_random_uuid(),
  ean         text not null references public.produits(ean) on delete cascade,
  magasin_id  uuid not null references public.magasins(id) on delete cascade,
  prix        numeric(8,2) not null check (prix > 0),
  date_releve date not null default current_date,
  en_action   boolean not null default false,
  utilisateur uuid not null default auth.uid() references auth.users(id) on delete cascade,
  photo_url   text,
  created_at  timestamptz not null default now()
);
create index prix_ean_idx on public.prix (ean);
create index prix_magasin_idx on public.prix (magasin_id);
create index prix_utilisateur_idx on public.prix (utilisateur);

-- 4. Groupes d'équivalents + liste des EAN de chaque groupe
create table public.groupes_equivalents (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null unique,   -- ex. "cola 1,5 L premier prix"
  created_at timestamptz not null default now()
);
create table public.equivalents_produits (
  groupe_id uuid not null references public.groupes_equivalents(id) on delete cascade,
  ean       text not null references public.produits(ean) on delete cascade,
  primary key (groupe_id, ean)
);
create index equivalents_produits_ean_idx on public.equivalents_produits (ean);

-- Row Level Security : activée partout
alter table public.produits             enable row level security;
alter table public.magasins             enable row level security;
alter table public.prix                 enable row level security;
alter table public.groupes_equivalents  enable row level security;
alter table public.equivalents_produits enable row level security;

-- Droits de base (la RLS filtre ensuite ligne par ligne)
grant select on public.produits, public.magasins, public.prix,
                public.groupes_equivalents, public.equivalents_produits
  to anon, authenticated;
grant insert on public.produits to authenticated;
grant insert, update, delete on public.prix to authenticated;

-- Tout le monde lit
create policy "lecture pour tous" on public.produits             for select to anon, authenticated using (true);
create policy "lecture pour tous" on public.magasins             for select to anon, authenticated using (true);
create policy "lecture pour tous" on public.prix                 for select to anon, authenticated using (true);
create policy "lecture pour tous" on public.groupes_equivalents  for select to anon, authenticated using (true);
create policy "lecture pour tous" on public.equivalents_produits for select to anon, authenticated using (true);

-- Seuls les connectés ajoutent un produit (quand un scan tombe sur un produit pas encore en base)
create policy "ajout par les connectes" on public.produits
  for insert to authenticated with check (true);

-- Prix : les connectés ajoutent ; chacun ne modifie / supprime que les siens
create policy "ajout de ses propres prix" on public.prix
  for insert to authenticated with check (utilisateur = (select auth.uid()));
create policy "modif de ses propres prix" on public.prix
  for update to authenticated
  using (utilisateur = (select auth.uid()))
  with check (utilisateur = (select auth.uid()));
create policy "suppression de ses propres prix" on public.prix
  for delete to authenticated using (utilisateur = (select auth.uid()));

-- Magasins et équivalents : pas d'écriture depuis l'app (remplis par Lucas/Claude)
