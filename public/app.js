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
  afficherMessage("Code-barres lu !");
  boutonScanner.textContent = "Scanner un autre produit";

  // Petite vibration de confirmation (marche sur Android, ignorée sur iPhone).
  if (navigator.vibrate) navigator.vibrate(100);
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
