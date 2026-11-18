# Supabase : l'historique de la base

Ce dossier garde une trace écrite de **tout ce qui change dans la base Supabase** (projet `scanzo`).

## Pourquoi
La base vit dans le cloud, pas dans ce repo. Si on modifie les tables uniquement depuis le tableau de bord,
personne ne sait plus, trois mois plus tard, *quoi* a changé ni *pourquoi*. En gardant chaque changement
dans un fichier SQL daté, on peut relire l'historique, et même recréer la base de zéro.

## `migrations/`
Un fichier = un changement, nommé `<date-heure>_<nom>.sql` (c'est le format de la CLI Supabase).
Les fichiers s'appliquent **dans l'ordre** du nom, et on ne modifie jamais un fichier déjà appliqué :
pour corriger, on écrit une nouvelle migration.

### Récupérer les migrations déjà appliquées
Les deux premières (`etape3_tables_et_rls`, `etape3_resserrer_droits`) ont été appliquées avant ce dossier.
Pour retrouver leur SQL : Supabase > **SQL Editor** > coller et lancer

```sql
select version, name, array_to_string(statements, E';\n') as sql
from supabase_migrations.schema_migrations
order by version;
```

Puis copier chaque résultat dans `migrations/<version>_<name>.sql`.

## `donnees-test/`
Des scripts pour créer (puis supprimer) des données **marquées « TEST »**, pour essayer l'app
sans inventer de vraies filiales. À lancer à la main dans le SQL Editor.
