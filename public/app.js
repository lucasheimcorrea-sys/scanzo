// Scanzo — étape 2 : ouvrir la caméra et lire un code-barres EAN.
//
// Le principe :
// 1. On demande la caméra arrière au navigateur (getUserMedia).
// 2. On affiche son image dans la balise <video>.
// 3. Plusieurs fois par seconde, on demande à BarcodeDetector s'il voit un code-barres.
// 4. Dès qu'il en trouve un, on coupe la caméra et on affiche le code.

const video = document.getElementById("video");
const zoneCamera = document.getElementById("zone-camera");
const message = document.getElementById("message");
const resultat = document.getElementById("resultat");
const codeEan = document.getElementById("code-ean");
const boutonScanner = document.getElementById("bouton-scanner");
const boutonAnnuler = document.getElementById("bouton-annuler");
const ficheProduit = document.getElementById("fiche-produit");
const produitPhoto = document.getElementById("produit-photo");
const produitNom = document.getElementById("produit-nom");
const produitMarque = document.getElementById("produit-marque");

// Les formats de codes-barres des produits de supermarché.
// EAN-13 est le plus courant en Suisse ; EAN-8 pour les petits emballages ; UPC pour les produits américains.
const detecteur = new BarcodeDetector({
  formats: ["ean_13", "ean_8", "upc_a", "upc_e"],
});

let fluxCamera = null; // le flux vidéo en cours (null = caméra éteinte)

async function demarrerScan() {
  // La caméra n'est accessible qu'en HTTPS (ou sur localhost) : on le vérifie pour donner un message clair.
  if (!window.isSecureContext || !navigator.mediaDevices) {
    afficherMessage("La caméra a besoin d'une adresse en https://.");
    return;
  }

  resultat.hidden = true;
  viderFiche();
  afficherMessage("Ouverture de la caméra…");

  try {
    fluxCamera = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "environment", // caméra arrière
        width: { ideal: 1280 },    // une image assez nette aide à lire les fines barres
        height: { ideal: 720 },
      },
    });
  } catch (erreur) {
    // NotAllowedError = l'utilisateur a refusé la permission.
    if (erreur.name === "NotAllowedError") {
      afficherMessage("Accès à la caméra refusé. Autorise-le dans les réglages du navigateur.");
    } else {
      afficherMessage("Impossible d'ouvrir la caméra (" + erreur.name + ").");
    }
    return;
  }

  video.srcObject = fluxCamera;
  await video.play();

  zoneCamera.hidden = false;
  boutonScanner.hidden = true;
  boutonAnnuler.hidden = false;
  afficherMessage("Vise le code-barres (à 15-20 cm environ).");

  chercherCode();
}

// Regarde l'image actuelle de la vidéo. Si aucun code n'est trouvé, recommence à l'image suivante.
async function chercherCode() {
  if (!fluxCamera) return; // la caméra a été coupée entre-temps

  try {
    const codes = await detecteur.detect(video);
    if (codes.length > 0) {
      codeTrouve(codes[0].rawValue);
      return;
    }
  } catch (erreur) {
    // Une image ratée n'est pas grave : on essaie simplement la suivante.
    console.warn("Détection impossible sur cette image :", erreur);
  }

  requestAnimationFrame(chercherCode);
}

function codeTrouve(code) {
  arreterCamera();
  codeEan.textContent = code;
  resultat.hidden = false;
  boutonScanner.textContent = "Scanner un autre produit";

  // Petite vibration de confirmation (marche sur Android, ignorée sur iPhone).
  if (navigator.vibrate) navigator.vibrate(100);

  chercherProduit(code);
}

// Demande à Open Food Facts le nom, la marque et la photo du produit.
// On ne demande que les champs utiles ("fields=") : la réponse est plus petite, donc plus rapide.
async function chercherProduit(code) {
  afficherMessage("Recherche du produit…");

  const adresse =
    "https://world.openfoodfacts.org/api/v2/product/" + encodeURIComponent(code) +
    ".json?fields=product_name,product_name_fr,brands,image_front_url";

  let reponse;
  try {
    reponse = await fetch(adresse);
  } catch (erreur) {
    // fetch échoue seulement si le réseau ne répond pas (pas de connexion, par exemple).
    afficherMessage("Pas de connexion : impossible de chercher le produit.");
    return;
  }

  // Attention : pour un produit inconnu, Open Food Facts répond avec une erreur 404,
  // mais le contenu reste lisible et contient "status": 0. On lit donc toujours la réponse.
  let donnees = null;
  try {
    donnees = await reponse.json();
  } catch (erreur) {
    // Réponse illisible : on la traite comme un produit introuvable.
  }

  if (!donnees || donnees.status !== 1) {
    afficherMessage("Produit inconnu d'Open Food Facts. Le code est bien lu, mais ce produit n'est pas encore dans la base.");
    return;
  }

  afficherProduit(donnees.product);
}

function afficherProduit(produit) {
  // On préfère le nom en français ; sinon, le nom général.
  produitNom.textContent = produit.product_name_fr || produit.product_name || "Nom inconnu";
  produitMarque.textContent = produit.brands || "Marque inconnue";

  if (produit.image_front_url) {
    produitPhoto.src = produit.image_front_url;
    produitPhoto.alt = "Photo du produit";
    produitPhoto.hidden = false;
  }

  ficheProduit.hidden = false;
  afficherMessage("Produit trouvé !");
}

// Efface la fiche du produit précédent avant un nouveau scan.
function viderFiche() {
  ficheProduit.hidden = true;
  produitPhoto.hidden = true;
  produitPhoto.removeAttribute("src");
  produitNom.textContent = "";
  produitMarque.textContent = "";
}

function arreterCamera() {
  if (fluxCamera) {
    // Couper chaque piste éteint vraiment la caméra (le voyant vert disparaît).
    fluxCamera.getTracks().forEach((piste) => piste.stop());
    fluxCamera = null;
  }
  video.srcObject = null;
  zoneCamera.hidden = true;
  boutonScanner.hidden = false;
  boutonAnnuler.hidden = true;
}

function afficherMessage(texte) {
  message.textContent = texte;
}

boutonScanner.addEventListener("click", demarrerScan);

boutonAnnuler.addEventListener("click", () => {
  arreterCamera();
  afficherMessage("Scan annulé.");
});

// Si on quitte l'app (autre onglet, écran verrouillé), on coupe la caméra pour ne pas la laisser allumée.
document.addEventListener("visibilitychange", () => {
  if (document.hidden && fluxCamera) {
    arreterCamera();
    afficherMessage("Scan interrompu.");
  }
});
