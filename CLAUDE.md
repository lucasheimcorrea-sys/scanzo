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

## Décisions déjà prises
- Front : **PWA HTML/CSS/JS sans build**, hébergée sur **GitHub Pages** (dossier `public/`), déployée automatiquement à chaque push sur `main` par `.github/workflows/pages.yml` (depuis le 19.11.2026 ; avant : Netlify). Le repo est public. Le site est dans un sous-dossier (`/scanzo/`) : toujours utiliser des chemins **relatifs** (`icones/…`, `./`), jamais `/…`.
- Scan : API standard `BarcodeDetector` + polyfill `barcode-detector` (ZXing en WebAssembly, version figée), car Safari iPhone n'a pas l'API.
- Produits : **Open Food Facts** (API v2, sans clé). Un connecté peut ajouter un produit inconnu.
- Backend : **Supabase** (projet `scanzo`, eu-west-1). Tables produits, magasins (1 ligne par filiale), prix, groupes d'équivalents, signalements. RLS : tout le monde lit, les connectés ajoutent prix et produits, chacun corrige/supprime seulement ses prix. Historique SQL dans `supabase/migrations/`.
- Connexion : **email avec lien magique** (Supabase Auth).
- Source des prix : hybride (prix saisis dans Scanzo + prix Open Prices quand il y en a).
- Prix enregistrés **par filiale** (48 filiales du canton de Neuchâtel, tirées d'OpenStreetMap avec `outils/filiales-osm.py`). Repli à l'affichage (`public/repli.js`) : prix Scanzo de la filiale → sinon prix Scanzo d'une autre filiale de la même enseigne → sinon Open Prices. L'app affiche toujours l'origine du prix (filiale, âge).
- Bouton « prix faux » = table `signalements` (un signalement par personne et par prix).
- **Équivalents (étape 5) repoussés à la toute fin**, voire abandonnés (18.11.2026) : ne pas les coder sans demande de Lucas.

Ce qui n'est pas listé ici n'est **pas décidé** : propose, explique, et laisse Lucas choisir avant de partir dessus.

## Où on en est (18.11.2026)
Étapes 0 à 3 et 7 (identité visuelle) faites ; 4 et 6 presque finies. En ligne sur https://lucasheimcorrea-sys.github.io/scanzo/.
- Reste à faire : saisie de vrais prix par Lucas, test avec un ami (il faudra un service d'email SMTP : sans lui, Supabase n'envoie le lien qu'aux membres de l'équipe du projet), photo de l'étiquette (option).
- Questions encore ouvertes (âge max d'un prix, ordre Open Prices, prix signalé faux à cacher, service worker…) : `06_Suivi/questions-ouvertes.md` dans le dossier iCloud. Ne pas les trancher seul.

## Identité visuelle (piste B « Sticker », 18.11.2026)
Détail complet : `01_Concept/nom-et-identite.md` dans le dossier iCloud.
- Couleurs et polices : variables en haut de `public/style.css` (`--bleu`, `--rose`, `--encre`…). Utilise-les, n'écris pas de couleur en dur.
- Polices : Lilita One (titres, boutons, prix) + Nunito (texte), via Google Fonts dans `index.html`.
- Boutons : bleu, bord 2 px encre, coins 16 px, ombre nette 4 px. Badge « en action » rose penché.
- Pas de mode sombre (l'identité est pensée sur fond clair).
- Icônes de l'app dans `public/icones/` ; pour les refaire : `outils/generer-icones.html`.

## Façon de travailler
- Une fonctionnalité = une **branche** (`feature/scan-camera`, etc.), puis une pull request vers `main`. GitHub Pages n'a pas d'adresse de test par PR : on teste en local avant de fusionner.
- **PR en autonomie** (accord de Lucas, 18.11.2026) : Claude ouvre et fusionne les PR sans demander, après avoir vérifié lui-même (aperçu local au format iPhone, `node --test tests/*.test.js`, puis, après fusion, déploiement GitHub Actions « Déploiement GitHub Pages » réussi). Ensuite, il donne à Lucas le lien et ce qu'il faut tester sur iPhone.
- Messages de commit courts, en français, qui disent ce qui change.
- Garde le code simple et lisible pour un débutant. Pas de dépendance ajoutée sans dire pourquoi.
- Noms de fichiers : minuscules-avec-tirets, sans accent ni espace.

## Sécurité (non négociable)
- **Aucune clé, aucun mot de passe dans le code ni dans un commit.** Les secrets vont dans `.env` (ignoré par git) et, si un jour il en faut côté serveur, dans les secrets GitHub (Settings → Secrets). Repo public : tout ce qui est commité est lisible par tous, historique compris.
- La clé Supabase `anon` peut aller dans le front (protégée par le Row Level Security). La clé `service_role` **jamais**.
- Avant chaque commit, vérifie qu'aucun secret n'est inclus.
