// Scanzo — choisir QUEL prix afficher pour chaque enseigne (la « logique de repli »).
//
// Décidé le 17.11.2026, dans cet ordre :
//   1. prix Scanzo de TA filiale (celle où tu relèves d'habitude pour cette enseigne)
//   2. sinon prix Scanzo d'une AUTRE filiale de la même enseigne
//   3. sinon prix Open Prices (base publique d'Open Food Facts)
// À chaque niveau, on prend le prix le plus récent.
// L'app affiche toujours d'où vient le prix (filiale, « relevé il y a X jours »).
//
// Ce fichier ne touche ni à la page ni au réseau : il reçoit des listes de prix et renvoie un choix.
// C'est voulu : on peut le tester tout seul (voir tests/repli.test.js).

// ⚠️ DEUX RÈGLES PAS ENCORE TRANCHÉES (06_Suivi/questions-ouvertes.md).
// Elles sont réglées ici pour garder EXACTEMENT l'ordre décidé, sans rien inventer.
// Pour changer d'avis plus tard : modifier seulement ces deux lignes.

// Faut-il un prix Open Prices de TA filiale AVANT un prix Scanzo d'une autre filiale ?
// false = non (ordre décidé : 1 → 2 → 3). true = l'insérer entre le niveau 1 et le niveau 2.
const OPEN_PRICES_MEME_FILIALE_AVANT_AUTRE_FILIALE = false;

// Âge maximum d'un prix (en jours) avant de passer au niveau suivant.
// null = pas de limite : un vieux prix reste utilisé, mais son âge est toujours affiché.
const AGE_MAX_JOURS = null;

const ENSEIGNES = ["migros", "coop", "denner", "lidl", "aldi"];

// Nombre de jours entre une date "AAAA-MM-JJ" et aujourd'hui (0 = aujourd'hui).
// On compte en jours du calendrier, pas en heures : un prix d'hier soir a bien « 1 jour ».
function ageEnJours(dateIso, maintenant) {
  const [a, m, j] = dateIso.split("-").map(Number);
  const jourDuPrix = Date.UTC(a, m - 1, j);
  const jourActuel = Date.UTC(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  return Math.round((jourActuel - jourDuPrix) / 86400000);
}

// "aujourd'hui", "hier", "il y a 3 jours"
function texteAge(dateIso, maintenant) {
  const jours = ageEnJours(dateIso, maintenant);
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return "hier";
  return "il y a " + jours + " jours";
}

// Garde les prix assez récents (si un âge maximum est fixé), puis renvoie le plus récent (ou null).
function plusRecent(prix, maintenant) {
  const valables = prix.filter((p) => AGE_MAX_JOURS === null || ageEnJours(p.date, maintenant) <= AGE_MAX_JOURS);
  if (valables.length === 0) return null;
  // Tri par date décroissante. À date égale, l'ordre d'arrivée est gardé (déjà trié par la base).
  return valables.slice().sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : 0))[0];
}

// Open Prices écrit l'enseigne comme sur OpenStreetMap (« Migros », « Aldi Suisse »…).
// On la traduit en code Scanzo, ou null si ce n'est pas une des 5 enseignes.
// Volontairement strict : « Coop Pronto » ou « Migrolino » sont d'autres magasins, avec d'autres prix.
function enseigneDepuisOsm(marque) {
  if (!marque) return null;
  const nom = marque.trim().toLowerCase();
  if (nom === "aldi suisse") return "aldi";
  return ENSEIGNES.includes(nom) ? nom : null;
}

// Le cœur du repli, pour UNE enseigne.
//   enseigne     : "migros", "coop"…
//   prixScanzo   : [{ prix, date, enAction, magasin: { id, enseigne, nom, ville, osm_id } }]
//   prixOpen     : [{ prix, date, enAction, enseigne, osmId, lieu }]
//   maFiliale    : la filiale de référence pour cette enseigne ({ id, osm_id }) ou null
// Renvoie { niveau, prix } ou null si aucun prix.
//   niveau = "ma-filiale" | "autre-filiale" | "open-prices-ma-filiale" | "open-prices"
function choisirPrix(enseigne, prixScanzo, prixOpen, maFiliale, maintenant) {
  const scanzo = prixScanzo.filter((p) => p.magasin && p.magasin.enseigne === enseigne);
  const open = prixOpen.filter((p) => p.enseigne === enseigne);

  const memeFiliale = (p) => maFiliale && p.magasin.id === maFiliale.id;
  // Une filiale Scanzo et un lieu Open Prices sont « le même magasin » s'ils ont le même identifiant OpenStreetMap.
  const openMemeFiliale = (p) => maFiliale && maFiliale.osm_id != null && String(p.osmId) === String(maFiliale.osm_id);

  // Les niveaux, dans l'ordre où on les essaie.
  const niveaux = [["ma-filiale", scanzo.filter(memeFiliale)]];
  if (OPEN_PRICES_MEME_FILIALE_AVANT_AUTRE_FILIALE) {
    niveaux.push(["open-prices-ma-filiale", open.filter(openMemeFiliale)]);
  }
  niveaux.push(["autre-filiale", scanzo.filter((p) => !memeFiliale(p))]);
  // Dernier recours : Open Prices. On préfère quand même un prix de ta filiale s'il y en a un.
  niveaux.push(["open-prices-ma-filiale", open.filter(openMemeFiliale)]);
  niveaux.push(["open-prices", open]);

  for (const [niveau, candidats] of niveaux) {
    const choisi = plusRecent(candidats, maintenant);
    if (choisi) return { niveau: niveau, prix: choisi };
  }
  return null;
}

// Pour tester avec Node (tests/repli.test.js). Dans le navigateur, « module » n'existe pas : rien ne se passe.
if (typeof module !== "undefined") {
  module.exports = { ageEnJours, texteAge, enseigneDepuisOsm, choisirPrix, ENSEIGNES };
}
