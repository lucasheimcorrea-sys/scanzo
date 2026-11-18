-- Étape 6 : bouton « prix faux ».
-- Une ligne = « tel utilisateur pense que tel prix est faux ».
-- La clé primaire (prix_id, utilisateur) empêche de signaler deux fois le même prix.

create table public.signalements (
  prix_id     uuid        not null references public.prix(id) on delete cascade,  -- prix supprimé → ses signalements aussi
  utilisateur uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (prix_id, utilisateur)
);

-- Row Level Security : sans règle, personne ne peut rien faire.
alter table public.signalements enable row level security;

-- Tout le monde voit combien de fois un prix a été signalé.
create policy "Tout le monde lit les signalements"
  on public.signalements for select
  to anon, authenticated
  using (true);

-- Un connecté signale seulement en son propre nom.
create policy "Un connecté signale en son nom"
  on public.signalements for insert
  to authenticated
  with check (utilisateur = (select auth.uid()));

-- Chacun peut retirer son propre signalement (pas celui des autres).
create policy "Chacun retire son signalement"
  on public.signalements for delete
  to authenticated
  using (utilisateur = (select auth.uid()));

-- Droits de base sur la table (les règles RLS ci-dessus filtrent ensuite ligne par ligne).
-- Pas d'update : un signalement se crée ou se retire, il ne se modifie pas.
revoke all on public.signalements from anon, authenticated;
grant select on public.signalements to anon, authenticated;
grant insert, delete on public.signalements to authenticated;
