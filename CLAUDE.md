# Scanzo — instructions pour Claude Code

## Le projet
App type « Yuka » : on scanne le code-barres d'un produit et on voit son prix dans plusieurs magasins suisses (Migros, Coop, Denner, Lidl, Aldi) pour comparer. D'abord dans le canton de Neuchâtel.
Deux cas :
1. **Produit identique** : même code-barres (EAN) partout.
2. **Produit équivalent** : codes-barres différents, même usage (ex. cola Prix Garantie Coop ↔ cola M-Budget Migros).

Cible : d'abord usage perso de Lucas, pour tester et apprendre. Peut devenir une vraie app plus tard.

## Avec qui tu travailles
Lucas, 19 ans, étudiant en économie (UniNE), il apprend le développement avec ce projet. A déjà fait des PWA simples sur Netlify.
- Réponds en **français**, ton de camarade, clair et concis.
- **Explique le « pourquoi »** de chaque choix technique en une ou deux phrases. Le but est aussi qu'il apprenne.
- Avance par petits pas qu'il peut tester sur son téléphone.

## Où sont les choses
- **Ce repo** = le code uniquement.
- **Le pilotage** (décisions, feuille de route, questions ouvertes, journal) vit dans le dossier iCloud de Lucas :
  `~/Library/Mobile Documents/com~apple~CloudDocs/Scanzo/`
  - `06_Suivi/feuille-de-route.md` : les étapes 0 à 9 et leur statut
  - `03_Technique/architecture.md` : tables, Supabase, logique de repli des prix
  - `02_Recherche/sources-de-donnees.md` : Open Food Facts, Open Prices
  Lis-les quand tu as besoin du contexte. Ne les modifie pas : leur mise à jour se fait dans le projet Claude « Scanzo ».

## Décisions déjà prises (17.11.2026)
- Front : **PWA**, hébergée sur **Netlify**, déployée automatiquement depuis ce repo GitHub.
- Backend : **Supabase** (pas encore créé, étape 3).
- Source des prix : hybride (prix saisis dans Scanzo + prix Open Prices quand il y en a).
- Prix enregistrés **par filiale**. Repli à l'affichage : prix Scanzo de la filiale → sinon prix Scanzo d'une autre filiale de la même enseigne → sinon Open Prices. L'app affiche toujours l'origine du prix (filiale, âge).

Le reste (bibliothèque de scan, framework, etc.) n'est **pas décidé** : propose, explique, et laisse Lucas choisir avant de partir dessus.

## Étape en cours : 2 — prototype « scan → produit »
Pas de serveur à ce stade.
- [ ] PWA minimale qui ouvre la caméra et lit un code-barres
- [ ] Afficher nom, marque et photo depuis Open Food Facts
- [ ] Message clair si le produit est inconnu

## Identité visuelle (piste B « Sticker », 18.11.2026)
Détail complet : `01_Concept/nom-et-identite.md` dans le dossier iCloud.
- Couleurs et polices : variables en haut de `public/style.css` (`--bleu`, `--rose`, `--encre`…). Utilise-les, n'écris pas de couleur en dur.
- Polices : Lilita One (titres, boutons, prix) + Nunito (texte), via Google Fonts dans `index.html`.
- Boutons : bleu, bord 2 px encre, coins 16 px, ombre nette 4 px. Badge « en action » rose penché.
- Pas de mode sombre (l'identité est pensée sur fond clair).
- Icônes de l'app dans `public/icones/` ; pour les refaire : `outils/generer-icones.html`.

## Façon de travailler
- Une fonctionnalité = une **branche** (`feature/scan-camera`, etc.), puis une pull request vers `main`. Netlify crée une adresse de test pour chaque PR : Lucas teste sur son téléphone avant de fusionner.
- Messages de commit courts, en français, qui disent ce qui change.
- Garde le code simple et lisible pour un débutant. Pas de dépendance ajoutée sans dire pourquoi.
- Noms de fichiers : minuscules-avec-tirets, sans accent ni espace.

## Sécurité (non négociable)
- **Aucune clé, aucun mot de passe dans le code ni dans un commit.** Les secrets vont dans `.env` (ignoré par git) et dans les variables d'environnement Netlify.
- La clé Supabase `anon` peut aller dans le front (protégée par le Row Level Security). La clé `service_role` **jamais**.
- Avant chaque commit, vérifie qu'aucun secret n'est inclus.
