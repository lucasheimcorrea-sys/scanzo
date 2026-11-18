// Scanzo — les prix d'un produit : enregistrer le produit, ajouter un prix, voir les prix connus.
//
// Les tables Supabase utilisées :
//   produits (ean, nom, marque, quantite)
//   magasins (id, enseigne, nom, ville…)  → une ligne par filiale, lecture seule depuis l'app
//   prix     (id, ean, magasin_id, prix, date_releve, en_action, utilisateur…)
// Les règles RLS de la base décident qui a le droit de faire quoi : ici on se contente
// d'afficher les boutons qui ont du sens (ex. « Supprimer » seulement sur ses propres prix).

const sectionPrix = document.getElementById("section-prix");
const listePrix = document.getElementById("liste-prix");
const messageListe = document.getElementById("message-liste");
const prixPasConnecte = document.getElementById("prix-pas-connecte");
const formPrix = document.getElementById("form-prix");
const titreFormPrix = document.getElementById("titre-form-prix");
const blocNomProduit = document.getElementById("bloc-nom-produit");
const champNomProduit = document.getElementById("champ-nom-produit");
const champFiliale = document.getElementById("champ-filiale");
const champPrix = document.getElementById("champ-prix");
const champDate = document.getElementById("champ-date");
const champAction = document.getElementById("champ-action");
const boutonEnregistrerPrix = document.getElementById("bouton-enregistrer-prix");
const boutonAnnulerCorrection = document.getElementById("bouton-annuler-correction");
const messagePrix = document.getElementById("message-prix");
const listeComparaison = document.getElementById("comparaison");

// Les noms affichés des enseignes (dans la base, elles sont en minuscules).
const NOMS_ENSEIGNES = {
  migros: "Migros",
  coop: "Coop",
  denner: "Denner",
  lidl: "Lidl",
  aldi: "Aldi",
};

// Où en est la section : quel produit, quelles filiales, quel prix est en cours de correction.
let eanActuel = null;
let produitActuel = null;     // { nom, marque, quantite } ou null si le produit est inconnu partout
let filiales = [];            // toutes les filiales de la table « magasins »
let prixEnCorrection = null;  // l'id du prix qu'on corrige, ou null si on en ajoute un nouveau

// --- Petits outils ---

// La date du jour au format de la base (AAAA-MM-JJ), selon l'heure du téléphone.
// (toISOString() donnerait la date en heure de Londres : faux entre minuit et 1 h en Suisse.)
function aujourdhui() {
  const d = new Date();
  const mois = String(d.getMonth() + 1).padStart(2, "0");
  const jour = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + mois + "-" + jour;
}

// "2026-11-18" → "18.11.2026" (format suisse).
function dateSuisse(dateIso) {
  const [annee, mois, jour] = dateIso.split("-");
  return jour + "." + mois + "." + annee;
}

// 2.4 → "2.40"
function formaterPrix(montant) {
  return Number(montant).toFixed(2);
}

function nomFiliale(magasin) {
  if (!magasin) return "Filiale inconnue";
  const enseigne = NOMS_ENSEIGNES[magasin.enseigne] || magasin.enseigne;
  const nom = magasin.nom || enseigne;
  // Le nom de la filiale contient souvent déjà l'enseigne : on évite « Migros Migros Métropole ».
  const complet = nom.toLowerCase().includes(magasin.enseigne) ? nom : enseigne + " " + nom;
  return magasin.ville ? complet + " (" + magasin.ville + ")" : complet;
}

// La dernière filiale utilisée est gardée sur le téléphone, pour ne pas la rechoisir à chaque fois.
// try/catch : en navigation privée, le stockage peut être refusé ; ce n'est pas grave.
function lireDerniereFiliale() {
  try { return localStorage.getItem("scanzo-derniere-filiale"); } catch (e) { return null; }
}
function garderDerniereFiliale(id) {
  try {
    localStorage.setItem("scanzo-derniere-filiale", String(id));
    // On retient aussi « ta » filiale pour chaque enseigne : c'est le niveau 1 du repli (repli.js).
    const filiale = filiales.find((f) => String(f.id) === String(id));
    if (filiale) {
      const mesFiliales = lireMesFiliales();
      mesFiliales[filiale.enseigne] = filiale.id;
      localStorage.setItem("scanzo-mes-filiales", JSON.stringify(mesFiliales));
    }
  } catch (e) { /* tant pis */ }
}

// { migros: 12, coop: 7 } = l'id de ta filiale habituelle pour chaque enseigne.
function lireMesFiliales() {
  try { return JSON.parse(localStorage.getItem("scanzo-mes-filiales")) || {}; } catch (e) { return {}; }
}

// --- Les filiales (chargées une seule fois) ---

async function chargerFiliales() {
  const { data, error } = await sb
    .from("magasins")
    .select("id, enseigne, nom, ville, osm_id")
    .order("enseigne")
    .order("nom");

  if (error) {
    console.warn("Filiales illisibles :", error);
    return;
  }
  filiales = data;
  remplirListeFiliales();
}

// Remplit le menu déroulant, avec un groupe par enseigne (<optgroup>).
function remplirListeFiliales() {
  champFiliale.textContent = ""; // vide le menu

  const choixVide = document.createElement("option");
  choixVide.value = "";
  choixVide.textContent = filiales.length ? "Choisis la filiale…" : "Aucune filiale dans la base pour l'instant";
  champFiliale.appendChild(choixVide);

  for (const code of Object.keys(NOMS_ENSEIGNES)) {
    const filialesEnseigne = filiales.filter((f) => f.enseigne === code);
    if (filialesEnseigne.length === 0) continue;

    const groupe = document.createElement("optgroup");
    groupe.label = NOMS_ENSEIGNES[code];
    for (const f of filialesEnseigne) {
      const option = document.createElement("option");
      option.value = f.id;
      option.textContent = f.nom + (f.ville ? " (" + f.ville + ")" : "");
      groupe.appendChild(option);
    }
    champFiliale.appendChild(groupe);
  }

  const derniere = lireDerniereFiliale();
  if (derniere && filiales.some((f) => String(f.id) === derniere)) champFiliale.value = derniere;
}

// --- Ouvrir / fermer la section pour un produit ---

// Appelée par app.js après un scan. produit = { nom, marque, quantite } ou null si inconnu.
function ouvrirSectionPrix(ean, produit) {
  eanActuel = ean;
  produitActuel = produit;
  sectionPrix.hidden = false;
  reinitialiserFormulaire();
  afficherFormulaireSelonConnexion();

  // Si on est connecté et que le produit est connu, on l'enregistre tout de suite dans Scanzo.
  if (utilisateurActuel && produitActuel) enregistrerProduit();

  chargerPrix();
}

function fermerSectionPrix() {
  eanActuel = null;
  produitActuel = null;
  sectionPrix.hidden = true;
  listePrix.textContent = "";
}

function afficherFormulaireSelonConnexion() {
  const connecte = utilisateurActuel !== null;
  formPrix.hidden = !connecte;
  prixPasConnecte.hidden = connecte;
  // Produit inconnu partout : on demande son nom pour pouvoir l'ajouter.
  blocNomProduit.hidden = produitActuel !== null;
  champNomProduit.required = produitActuel === null;
}

// Quand on se connecte ou se déconnecte, on met la section à jour
// (formulaire visible ou non, boutons « Corriger / Supprimer » sur ses propres prix).
quandConnexionChange(() => {
  if (!eanActuel) return;
  afficherFormulaireSelonConnexion();
  if (utilisateurActuel && produitActuel) enregistrerProduit();
  chargerPrix();
});

// --- Enregistrer le produit dans la table « produits » ---

// upsert + ignoreDuplicates = « insère si l'EAN n'existe pas, sinon ne fais rien ».
// On ne modifie jamais un produit déjà présent (pas d'update), comme décidé.
async function enregistrerProduit() {
  const { error } = await sb.from("produits").upsert(
    {
      ean: eanActuel,
      nom: produitActuel.nom,
      marque: produitActuel.marque || null,
      quantite: produitActuel.quantite || null,
    },
    { onConflict: "ean", ignoreDuplicates: true }
  );
  if (error) console.warn("Produit non enregistré :", error);
  return error;
}

// --- La liste des prix connus ---

async function chargerPrix() {
  const ean = eanActuel;
  messageListe.textContent = "Chargement des prix…";
  listePrix.textContent = "";
  listeComparaison.textContent = "";

  // Les deux sources en même temps (Promise.all) : on n'attend pas l'une pour demander l'autre.
  // « magasins(...) » : Supabase suit le lien prix.magasin_id → magasins.id et renvoie la filiale avec le prix.
  const [reponseScanzo, prixOpen] = await Promise.all([
    sb
      .from("prix")
      .select("id, prix, date_releve, en_action, utilisateur, magasin_id, magasins(id, enseigne, nom, ville, osm_id)")
      .eq("ean", ean)
      .order("date_releve", { ascending: false })
      .order("created_at", { ascending: false }),
    chargerOpenPrices(ean),
  ]);

  if (ean !== eanActuel) return; // on a scanné autre chose entre-temps

  const { data, error } = reponseScanzo;
  if (error) {
    messageListe.textContent = "Impossible de charger les prix (" + error.message + ").";
    return;
  }

  afficherComparaison(data, prixOpen);
  messageListe.textContent = data.length === 0 ? "Aucun prix relevé dans Scanzo pour ce produit." : "";
  afficherListePrix(data);
}

// --- Open Prices : prix publics (lecture seule, sans compte) ---

// Renvoie les prix suisses en CHF du produit, au format attendu par repli.js. [] en cas de souci :
// Open Prices est un bonus, son absence ne doit jamais bloquer l'affichage des prix Scanzo.
async function chargerOpenPrices(ean) {
  const adresse =
    "https://prices.openfoodfacts.org/api/v1/prices?product_code=" + encodeURIComponent(ean) +
    "&currency=CHF&order_by=-date&size=100";
  try {
    const reponse = await fetch(adresse);
    if (!reponse.ok) return [];
    const donnees = await reponse.json();
    return donnees.items
      .filter((p) => p.location && p.location.osm_address_country_code === "CH" && p.date)
      .map((p) => ({
        prix: p.price,
        date: p.date,
        enAction: p.price_is_discounted === true,
        enseigne: enseigneDepuisOsm(p.location.osm_brand),
        osmId: p.location.osm_id,
        lieu: (p.location.osm_name || "Magasin") + (p.location.osm_address_city ? " (" + p.location.osm_address_city + ")" : ""),
      }))
      .filter((p) => p.enseigne !== null);
  } catch (erreur) {
    console.warn("Open Prices injoignable :", erreur);
    return [];
  }
}

// --- La comparaison : un prix par enseigne, choisi par la logique de repli (repli.js) ---

function afficherComparaison(lignesScanzo, prixOpen) {
  listeComparaison.textContent = "";
  const maintenant = new Date();
  const mesFiliales = lireMesFiliales();

  // On met les prix Scanzo au même format que ceux d'Open Prices.
  const prixScanzo = lignesScanzo.map((l) => ({
    prix: l.prix,
    date: l.date_releve,
    enAction: l.en_action,
    magasin: l.magasins,
  }));

  for (const enseigne of ENSEIGNES) {
    const maFiliale = filiales.find((f) => f.id === mesFiliales[enseigne]) || null;
    const choix = choisirPrix(enseigne, prixScanzo, prixOpen, maFiliale, maintenant);

    const element = document.createElement("li");
    element.className = "ligne-comparaison";

    const nom = document.createElement("span");
    nom.className = "enseigne";
    nom.textContent = NOMS_ENSEIGNES[enseigne];

    const montant = document.createElement("strong");
    const origine = document.createElement("div");
    origine.className = "details-prix";

    if (choix) {
      const p = choix.prix;
      montant.textContent = formaterPrix(p.prix) + " CHF";
      origine.textContent = texteOrigine(choix) + " · relevé " + texteAge(p.date, maintenant) + (p.enAction ? " · en action" : "");
    } else {
      montant.textContent = "—";
      origine.textContent = "pas encore de prix";
    }

    const gauche = document.createElement("div");
    gauche.append(nom, origine);
    element.append(gauche, montant);
    listeComparaison.appendChild(element);
  }
}

// D'où vient le prix affiché, en clair.
function texteOrigine(choix) {
  switch (choix.niveau) {
    case "ma-filiale":
      return nomFiliale(choix.prix.magasin) + " · ta filiale";
    case "autre-filiale":
      return nomFiliale(choix.prix.magasin);
    default:
      return "Open Prices : " + choix.prix.lieu;
  }
}

function afficherListePrix(lignes) {
  listePrix.textContent = "";

  for (const ligne of lignes) {
    const element = document.createElement("li");
    element.className = "ligne-prix";

    // On construit avec textContent (et pas innerHTML) : un texte tapé par quelqu'un
    // ne peut jamais devenir du code dans la page.
    const texte = document.createElement("div");
    const montant = document.createElement("strong");
    montant.textContent = formaterPrix(ligne.prix) + " CHF";
    texte.appendChild(montant);
    texte.append(" · " + nomFiliale(ligne.magasins));

    const details = document.createElement("div");
    details.className = "details-prix";
    details.textContent = "relevé le " + dateSuisse(ligne.date_releve) + (ligne.en_action ? " · en action" : "");
    texte.appendChild(details);
    element.appendChild(texte);

    // Ses propres prix : on peut les corriger ou les supprimer.
    if (utilisateurActuel && ligne.utilisateur === utilisateurActuel.id) {
      const actions = document.createElement("div");
      actions.className = "actions-prix";

      const boutonCorriger = document.createElement("button");
      boutonCorriger.type = "button";
      boutonCorriger.className = "petit secondaire";
      boutonCorriger.textContent = "Corriger";
      boutonCorriger.addEventListener("click", () => commencerCorrection(ligne));

      const boutonSupprimer = document.createElement("button");
      boutonSupprimer.type = "button";
      boutonSupprimer.className = "petit secondaire";
      boutonSupprimer.textContent = "Supprimer";
      boutonSupprimer.addEventListener("click", () => supprimerPrix(ligne));

      actions.append(boutonCorriger, boutonSupprimer);
      element.appendChild(actions);
    }

    listePrix.appendChild(element);
  }
}

// --- Ajouter / corriger un prix ---

function reinitialiserFormulaire() {
  prixEnCorrection = null;
  titreFormPrix.textContent = "Ajouter un prix";
  boutonEnregistrerPrix.textContent = "Ajouter ce prix";
  boutonAnnulerCorrection.hidden = true;
  champNomProduit.value = "";
  champPrix.value = "";
  champDate.value = aujourdhui();
  champDate.max = aujourdhui(); // pas de prix relevé dans le futur
  champAction.checked = false;
  messagePrix.textContent = "";
  const derniere = lireDerniereFiliale();
  champFiliale.value = derniere && filiales.some((f) => String(f.id) === derniere) ? derniere : "";
}

function commencerCorrection(ligne) {
  prixEnCorrection = ligne.id;
  titreFormPrix.textContent = "Corriger ton prix";
  boutonEnregistrerPrix.textContent = "Enregistrer la correction";
  boutonAnnulerCorrection.hidden = false;
  champFiliale.value = String(ligne.magasin_id);
  champPrix.value = formaterPrix(ligne.prix);
  champDate.value = ligne.date_releve;
  champAction.checked = ligne.en_action;
  messagePrix.textContent = "";
  formPrix.scrollIntoView({ behavior: "smooth", block: "start" });
}

boutonAnnulerCorrection.addEventListener("click", reinitialiserFormulaire);

// Lit le prix tapé. Accepte « 2.40 » comme « 2,40 » (clavier suisse). Renvoie null si ce n'est pas un prix valable.
function lirePrixTape() {
  const nombre = Number(champPrix.value.trim().replace(",", "."));
  if (!Number.isFinite(nombre) || nombre <= 0 || nombre >= 10000) return null;
  return Math.round(nombre * 100) / 100; // 2 décimales au maximum
}

formPrix.addEventListener("submit", async (evenement) => {
  evenement.preventDefault();
  if (!utilisateurActuel) return;

  const montant = lirePrixTape();
  if (!champFiliale.value) { messagePrix.textContent = "Choisis la filiale."; return; }
  if (montant === null) { messagePrix.textContent = "Prix invalide : tape par exemple 2.40"; return; }
  if (!champDate.value || champDate.value > aujourdhui()) { messagePrix.textContent = "Date invalide."; return; }

  boutonEnregistrerPrix.disabled = true;
  messagePrix.textContent = "Enregistrement…";
  const erreur = await enregistrerPrix(montant);
  boutonEnregistrerPrix.disabled = false;

  if (erreur) {
    messagePrix.textContent = "Pas enregistré : " + erreur;
    return;
  }

  garderDerniereFiliale(champFiliale.value);
  const etaitUneCorrection = prixEnCorrection !== null;
  reinitialiserFormulaire();
  messagePrix.textContent = etaitUneCorrection ? "Prix corrigé, merci !" : "Prix ajouté, merci !";
  chargerPrix();
});

// Renvoie un message d'erreur, ou null si tout s'est bien passé.
async function enregistrerPrix(montant) {
  // 1. Produit inconnu partout : on le crée d'abord avec le nom tapé.
  if (produitActuel === null) {
    const nom = champNomProduit.value.trim();
    if (!nom) return "indique le nom du produit.";
    produitActuel = { nom: nom, marque: null, quantite: null };
  }

  // 2. Le produit doit exister dans « produits » avant d'y accrocher un prix
  //    (la base vérifie que prix.ean pointe vers un produit existant).
  const erreurProduit = await enregistrerProduit();
  if (erreurProduit) return erreurProduit.message;
  blocNomProduit.hidden = true;

  const valeurs = {
    magasin_id: champFiliale.value,
    prix: montant,
    date_releve: champDate.value,
    en_action: champAction.checked,
  };

  let reponse;
  if (prixEnCorrection === null) {
    // Nouveau prix. « utilisateur » est rempli avec l'id du connecté ;
    // la règle RLS refuse de toute façon un prix au nom de quelqu'un d'autre.
    reponse = await sb.from("prix").insert({ ...valeurs, ean: eanActuel, utilisateur: utilisateurActuel.id });
  } else {
    // Correction : RLS n'autorise la modification que si c'est notre prix.
    // .select() renvoie la ligne modifiée : si la liste est vide, rien n'a été modifié.
    reponse = await sb.from("prix").update(valeurs).eq("id", prixEnCorrection).select("id");
    if (!reponse.error && reponse.data.length === 0) return "ce prix n'est pas à toi.";
  }

  return reponse.error ? reponse.error.message : null;
}

async function supprimerPrix(ligne) {
  const ok = confirm("Supprimer ton prix de " + formaterPrix(ligne.prix) + " CHF chez " + nomFiliale(ligne.magasins) + " ?");
  if (!ok) return;

  const { data, error } = await sb.from("prix").delete().eq("id", ligne.id).select("id");
  if (error || data.length === 0) {
    messageListe.textContent = "Suppression impossible" + (error ? " (" + error.message + ")" : "") + ".";
    return;
  }
  if (prixEnCorrection === ligne.id) reinitialiserFormulaire();
  chargerPrix();
}

chargerFiliales();
