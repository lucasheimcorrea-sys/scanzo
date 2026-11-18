// Scanzo — connexion par email avec un « lien magique ».
//
// Le principe :
// 1. On tape son email, Supabase envoie un mail avec un lien (pas de mot de passe à retenir).
// 2. On clique le lien : il ramène sur Scanzo avec un jeton dans l'adresse.
// 3. supabase-js lit ce jeton, ouvre la session et la garde dans le navigateur.
// Tout le reste de l'app demande « qui est connecté ? » via utilisateurActuel.

const zoneDeconnecte = document.getElementById("compte-deconnecte");
const zoneConnecte = document.getElementById("compte-connecte");
const formConnexion = document.getElementById("form-connexion");
const champEmail = document.getElementById("champ-email");
const boutonLien = document.getElementById("bouton-lien");
const messageCompte = document.getElementById("message-compte");
const emailConnecte = document.getElementById("email-connecte");
const boutonDeconnexion = document.getElementById("bouton-deconnexion");

let utilisateurActuel = null; // null = personne n'est connecté

// D'autres fichiers (app.js) veulent savoir quand on se connecte ou se déconnecte :
// ils s'inscrivent avec quandConnexionChange(fonction).
const ecouteursConnexion = [];
function quandConnexionChange(fonction) {
  ecouteursConnexion.push(fonction);
}

function afficherCompte() {
  const connecte = utilisateurActuel !== null;
  zoneDeconnecte.hidden = connecte;
  zoneConnecte.hidden = !connecte;
  emailConnecte.textContent = connecte ? utilisateurActuel.email : "";
}

// Supabase prévient à chaque changement : ouverture de l'app avec une session gardée,
// retour par le lien magique, déconnexion, renouvellement automatique du jeton…
sb.auth.onAuthStateChange((evenement, session) => {
  utilisateurActuel = session ? session.user : null;
  afficherCompte();
  if (evenement === "SIGNED_IN") messageCompte.textContent = "";

  // setTimeout : la doc Supabase conseille de ne pas lancer d'autres requêtes
  // directement à l'intérieur de ce callback (risque de blocage).
  setTimeout(() => ecouteursConnexion.forEach((f) => f(utilisateurActuel)), 0);
});

formConnexion.addEventListener("submit", async (evenement) => {
  evenement.preventDefault(); // sinon le formulaire recharge la page

  const email = champEmail.value.trim();
  if (!email) return;

  boutonLien.disabled = true;
  messageCompte.textContent = "Envoi du lien…";

  const { error } = await sb.auth.signInWithOtp({
    email: email,
    options: {
      // Le lien ramène à la page actuelle (utile pour les adresses de test Netlify).
      // Cette adresse doit être autorisée dans Supabase > Authentication > URL Configuration.
      emailRedirectTo: window.location.origin + window.location.pathname,
    },
  });

  boutonLien.disabled = false;

  if (error) {
    // Cas fréquent : trop de mails envoyés en peu de temps (limite de Supabase).
    if (error.status === 429) {
      messageCompte.textContent = "Trop de demandes : attends quelques minutes avant de redemander un lien.";
    } else {
      messageCompte.textContent = "Impossible d'envoyer le lien (" + error.message + ").";
    }
    return;
  }

  messageCompte.textContent = "C'est parti ! Ouvre le mail reçu à " + email + " et touche le lien.";
});

boutonDeconnexion.addEventListener("click", async () => {
  await sb.auth.signOut();
  messageCompte.textContent = "Tu es déconnecté.";
});

// Si le lien magique est périmé ou déjà utilisé, Supabase revient avec une erreur dans l'adresse
// (#error=…&error_description=…). On l'affiche en clair, puis on nettoie l'adresse.
(function lireErreurDuLien() {
  const parametres = new URLSearchParams(window.location.hash.slice(1));
  if (!parametres.get("error")) return;

  if (parametres.get("error_code") === "otp_expired") {
    messageCompte.textContent = "Ce lien a expiré ou a déjà servi. Redemande un lien.";
  } else {
    messageCompte.textContent = "Connexion impossible : " + (parametres.get("error_description") || parametres.get("error"));
  }
  history.replaceState(null, "", window.location.pathname);
})();
