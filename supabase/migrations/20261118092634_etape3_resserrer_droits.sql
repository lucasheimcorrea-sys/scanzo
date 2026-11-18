-- Défense en profondeur : retirer les droits d'écriture par défaut, ne garder que le nécessaire
revoke insert, update, delete, truncate, references, trigger
  on public.produits, public.magasins, public.prix,
     public.groupes_equivalents, public.equivalents_produits
  from anon, authenticated;

grant select on public.produits, public.magasins, public.prix,
                public.groupes_equivalents, public.equivalents_produits
  to anon, authenticated;
grant insert on public.produits to authenticated;
grant insert, update, delete on public.prix to authenticated;
