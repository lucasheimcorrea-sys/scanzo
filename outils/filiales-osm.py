"""Scanzo : liste des filiales du canton de Neuchâtel tirée d'OpenStreetMap.

Usage (depuis le dossier du repo) :
    python3 outils/filiales-osm.py

Ce que fait le script :
1. Demande à Overpass (le moteur de recherche d'OpenStreetMap) tous les magasins
   Migros, Coop, Denner, Lidl et Aldi du canton de Neuchâtel.
2. Beaucoup n'ont pas d'adresse dans OpenStreetMap : on demande à Nominatim
   (le service d'adresses d'OpenStreetMap) la ville et la rue la plus proche de leurs coordonnées.
   Nominatim impose au plus 1 requête par seconde : le script attend entre chaque.
3. Écrit le SQL à coller dans Supabase : supabase/donnees/filiales-neuchatel-osm.sql

Données : © contributeurs OpenStreetMap, licence ODbL.
Aucune dépendance : uniquement la bibliothèque standard de Python.
"""

import json
import re
import time
import urllib.parse
import urllib.request

AGENT = "scanzo-dev-script"  # Overpass et Nominatim demandent un nom d'application
SORTIE = "supabase/donnees/filiales-neuchatel-osm.sql"

# Les marques telles qu'écrites dans OpenStreetMap → code de l'enseigne dans Scanzo.
ENSEIGNES = {"migros": "migros", "coop": "coop", "denner": "denner", "lidl": "lidl", "aldi": "aldi", "aldi suisse": "aldi"}
NOMS = {"migros": "Migros", "coop": "Coop", "denner": "Denner", "lidl": "Lidl", "aldi": "Aldi"}

REQUETE = """[out:json][timeout:90];
area["ISO3166-2"="CH-NE"]->.ne;
nwr["shop"]["brand"~"^(Migros|Coop|Denner|Lidl|Aldi|Aldi Suisse)$",i](area.ne);
out center tags;"""


def lire_json(url, donnees=None):
    req = urllib.request.Request(url, data=donnees, headers={"User-Agent": AGENT})
    with urllib.request.urlopen(req, timeout=120) as reponse:
        return json.load(reponse)


def magasins_osm():
    # Overpass est souvent saturé : on réessaie en attendant de plus en plus longtemps.
    attente = 15
    for _ in range(5):
        try:
            corps = urllib.parse.urlencode({"data": REQUETE}).encode()
            return lire_json("https://overpass-api.de/api/interpreter", corps)["elements"]
        except Exception as erreur:
            print("Overpass occupé (", erreur, "), nouvel essai dans", attente, "s")
            time.sleep(attente)
            attente *= 2
    raise SystemExit("Overpass ne répond pas, réessaie plus tard.")


def adresse_proche(lat, lon):
    url = "https://nominatim.openstreetmap.org/reverse?" + urllib.parse.urlencode(
        {"format": "jsonv2", "lat": lat, "lon": lon, "zoom": 18, "addressdetails": 1, "accept-language": "fr"}
    )
    time.sleep(1.1)  # règle de Nominatim : 1 requête par seconde au maximum
    try:
        return lire_json(url).get("address", {})
    except Exception:
        return {}


def sql_texte(valeur):
    # 'texte' avec les apostrophes doublées (règle du SQL), ou null.
    return "null" if not valeur else "'" + valeur.replace("'", "''") + "'"


def main():
    filiales, ecartes = [], []

    for e in magasins_osm():
        tags = e.get("tags", {})
        enseigne = ENSEIGNES.get(tags.get("brand", "").strip().lower())
        if not enseigne:
            continue
        lat = e.get("lat") or e["center"]["lat"]
        lon = e.get("lon") or e["center"]["lon"]
        proche = adresse_proche(lat, lon)

        # Adresse : seulement celle écrite dans OpenStreetMap (celle de Nominatim n'est qu'une rue proche).
        adresse = " ".join(x for x in [tags.get("addr:street"), tags.get("addr:housenumber")] if x) or None
        ville = tags.get("addr:city") or proche.get("city") or proche.get("town") or proche.get("village") or proche.get("municipality")
        npa = tags.get("addr:postcode") or proche.get("postcode")

        # Le nom affiché dans l'app : enseigne + ville + rue (pour distinguer deux Migros de la même ville).
        rue = adresse or proche.get("road") or ""
        # « A5 », « N20 » (autoroute) ou le nom de la ville : ça n'aide pas à reconnaître le magasin.
        if re.match(r"^[AN]\d", rue) or rue == ville:
            rue = ""
        nom = NOMS[enseigne] + " " + (ville or "") + (", " + rue if rue else "")

        filiale = {"enseigne": enseigne, "nom": nom.strip(), "adresse": adresse, "npa": npa, "ville": ville,
                   "osm_id": str(e["id"]), "type": tags.get("shop"), "nom_osm": tags.get("name")}
        # Les petits magasins de quartier (shop=convenience : Denner Express…) n'ont pas forcément les mêmes prix.
        (filiales if tags.get("shop") == "supermarket" else ecartes).append(filiale)

    # Deux filiales avec le même nom : on les numérote pour pouvoir les distinguer dans le menu.
    vus = {}
    for f in sorted(filiales, key=lambda f: (f["enseigne"], f["nom"], f["osm_id"])):
        vus[f["nom"]] = vus.get(f["nom"], 0) + 1
        if vus[f["nom"]] > 1:
            f["nom"] += " (" + str(vus[f["nom"]]) + ")"

    lignes = [
        "-- Filiales du canton de Neuchâtel, tirées d'OpenStreetMap (© contributeurs OpenStreetMap, licence ODbL).",
        "-- Généré par outils/filiales-osm.py. À coller dans Supabase > SQL Editor.",
        "-- « on conflict do nothing » : relancer ce fichier n'ajoute pas de doublon (osm_id est unique).",
        "-- osm_id = identifiant OpenStreetMap, le même qu'utilise Open Prices : il relie nos filiales à leurs prix.",
        "",
        "insert into magasins (enseigne, nom, adresse, npa, ville, osm_id) values",
    ]
    valeurs = [
        "  (" + ", ".join(sql_texte(f[c]) for c in ["enseigne", "nom", "adresse", "npa", "ville", "osm_id"]) + ")"
        for f in sorted(filiales, key=lambda f: (f["enseigne"], f["nom"]))
    ]
    lignes.append(",\n".join(valeurs))
    lignes.append("on conflict (osm_id) do nothing;")
    if ecartes:
        lignes.append("")
        lignes.append("-- Écartés (petits magasins de quartier, shop=convenience) :")
        for f in ecartes:
            lignes.append("--   " + f["nom"] + " [" + (f["nom_osm"] or "") + ", osm_id " + f["osm_id"] + "]")

    with open(SORTIE, "w", encoding="utf-8") as fichier:
        fichier.write("\n".join(lignes) + "\n")
    print(len(filiales), "filiales écrites dans", SORTIE, "|", len(ecartes), "écartées")


if __name__ == "__main__":
    main()
