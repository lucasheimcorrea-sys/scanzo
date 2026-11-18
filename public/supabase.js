// Scanzo — connexion à notre base Supabase.
//
// La bibliothèque supabase-js (chargée dans index.html) fournit l'objet global « supabase ».
// On crée ici UN client, partagé par tous les autres fichiers (connexion.js, app.js…).
//
// La clé ci-dessous est la clé PUBLIQUE (« publishable ») : elle est faite pour être visible
// dans le navigateur. Ce qui protège les données, ce sont les règles RLS de la base
// (tout le monde lit ; seuls les connectés écrivent ; chacun ne modifie que ses prix).
// La clé secrète (sb_secret_… / service_role) ne doit JAMAIS apparaître ici.

const SUPABASE_URL = "https://yjdbtjidsncammlsciyp.supabase.co";
const SUPABASE_CLE_PUBLIQUE = "sb_publishable_rjuzC_nGbgPy-VQduKRrWg_5l0PTynB";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_CLE_PUBLIQUE, {
  auth: {
    // Garde la session dans le navigateur : on reste connecté en rouvrant l'app.
    persistSession: true,
    // Quand on revient par le lien magique, la session est dans l'adresse (#access_token=…) :
    // supabase-js la lit et nettoie l'adresse tout seul.
    detectSessionInUrl: true,
    // « implicit » (et pas « pkce ») : le lien marche même s'il s'ouvre dans un autre navigateur
    // que celui où on l'a demandé (ex. depuis l'app Gmail sur iPhone).
    flowType: "implicit",
  },
});
