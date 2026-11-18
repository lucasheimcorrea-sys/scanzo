-- Filiales de TEST pour essayer l'app (ce ne sont PAS de vrais magasins).
-- À coller dans Supabase > SQL Editor (l'app, elle, ne peut pas écrire dans « magasins »).
-- Deux filiales Migros pour tester le repli « autre filiale de la même enseigne », une Coop.

insert into magasins (enseigne, nom, ville)
values
  ('migros', 'TEST Migros A', 'TEST'),
  ('migros', 'TEST Migros B', 'TEST'),
  ('coop',   'TEST Coop A',   'TEST');

-- Vérifier :
-- select * from magasins where nom like 'TEST %';
