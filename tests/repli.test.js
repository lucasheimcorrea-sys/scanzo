// Tests de la logique de repli (public/repli.js).
// Lancer depuis le dossier du repo :  node --test tests/
// node:test et node:assert sont fournis avec Node : aucune dépendance à installer.

const test = require("node:test");
const assert = require("node:assert");
const { ageEnJours, texteAge, enseigneDepuisOsm, choisirPrix } = require("../public/repli.js");

const maintenant = new Date(2026, 10, 18, 9, 0); // 18.11.2026 à 9 h (les mois commencent à 0)

// Deux filiales Migros et une Coop, comme les filiales TEST.
const migrosA = { id: 1, enseigne: "migros", nom: "TEST Migros A", osm_id: 111 };
const migrosB = { id: 2, enseigne: "migros", nom: "TEST Migros B", osm_id: 222 };
const coopA = { id: 3, enseigne: "coop", nom: "TEST Coop A", osm_id: null };

const scanzo = (magasin, prix, date) => ({ prix, date, enAction: false, magasin });
const open = (enseigne, osmId, prix, date) => ({ prix, date, enAction: false, enseigne, osmId, lieu: "TEST" });

test("âge en jours et texte", () => {
  assert.strictEqual(ageEnJours("2026-11-18", maintenant), 0);
  assert.strictEqual(ageEnJours("2026-11-17", maintenant), 1);
  assert.strictEqual(ageEnJours("2026-10-19", maintenant), 30);
  assert.strictEqual(texteAge("2026-11-18", maintenant), "aujourd'hui");
  assert.strictEqual(texteAge("2026-11-17", maintenant), "hier");
  assert.strictEqual(texteAge("2026-11-15", maintenant), "il y a 3 jours");
});

test("enseigne depuis OpenStreetMap", () => {
  assert.strictEqual(enseigneDepuisOsm("Migros"), "migros");
  assert.strictEqual(enseigneDepuisOsm("Aldi Suisse"), "aldi");
  assert.strictEqual(enseigneDepuisOsm("Coop Pronto"), null);
  assert.strictEqual(enseigneDepuisOsm("Migrolino"), null);
  assert.strictEqual(enseigneDepuisOsm(null), null);
});

test("niveau 1 : le prix de ma filiale gagne, même plus vieux", () => {
  const r = choisirPrix("migros",
    [scanzo(migrosA, 2.4, "2026-11-01"), scanzo(migrosB, 2.2, "2026-11-17")],
    [open("migros", 222, 2.0, "2026-11-18")],
    migrosA, maintenant);
  assert.strictEqual(r.niveau, "ma-filiale");
  assert.strictEqual(r.prix.prix, 2.4);
});

test("niveau 1 : le plus récent de ma filiale", () => {
  const r = choisirPrix("migros",
    [scanzo(migrosA, 2.4, "2026-11-01"), scanzo(migrosA, 2.5, "2026-11-10")], [], migrosA, maintenant);
  assert.strictEqual(r.prix.prix, 2.5);
});

test("niveau 2 : autre filiale de la même enseigne avant Open Prices, même Open Prices de ma filiale", () => {
  const r = choisirPrix("migros",
    [scanzo(migrosB, 2.2, "2026-10-01"), scanzo(coopA, 1.9, "2026-11-18")],
    [open("migros", 111, 2.0, "2026-11-18")],
    migrosA, maintenant);
  assert.strictEqual(r.niveau, "autre-filiale");
  assert.strictEqual(r.prix.prix, 2.2);
});

test("sans filiale de référence : le prix Scanzo le plus récent de l'enseigne", () => {
  const r = choisirPrix("migros",
    [scanzo(migrosA, 2.4, "2026-11-01"), scanzo(migrosB, 2.2, "2026-11-17")], [], null, maintenant);
  assert.strictEqual(r.niveau, "autre-filiale");
  assert.strictEqual(r.prix.prix, 2.2);
});

test("niveau 3 : Open Prices, en préférant ma filiale", () => {
  const prixOpen = [open("migros", 999, 1.8, "2026-11-18"), open("migros", 111, 2.0, "2026-11-01")];
  const r = choisirPrix("migros", [], prixOpen, migrosA, maintenant);
  assert.strictEqual(r.niveau, "open-prices-ma-filiale");
  assert.strictEqual(r.prix.prix, 2.0);

  const r2 = choisirPrix("migros", [], prixOpen, migrosB, maintenant);
  assert.strictEqual(r2.niveau, "open-prices");
  assert.strictEqual(r2.prix.prix, 1.8);
});

test("pas de mélange entre enseignes, et null si aucun prix", () => {
  assert.strictEqual(choisirPrix("denner", [scanzo(migrosA, 2.4, "2026-11-01")], [open("coop", 1, 1, "2026-11-01")], null, maintenant), null);
  const r = choisirPrix("coop", [scanzo(migrosA, 2.4, "2026-11-01")], [open("coop", 5, 1.5, "2026-11-01")], coopA, maintenant);
  assert.strictEqual(r.niveau, "open-prices"); // coopA n'a pas d'osm_id : pas de « ma filiale » côté Open Prices
});
