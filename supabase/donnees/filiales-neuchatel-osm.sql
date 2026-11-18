-- Filiales du canton de Neuchâtel, tirées d'OpenStreetMap (© contributeurs OpenStreetMap, licence ODbL).
-- Généré par outils/filiales-osm.py. À coller dans Supabase > SQL Editor.
-- « on conflict do nothing » : relancer ce fichier n'ajoute pas de doublon (osm_id est unique).
-- osm_id = identifiant OpenStreetMap, le même qu'utilise Open Prices : il relie nos filiales à leurs prix.

insert into magasins (enseigne, nom, adresse, npa, ville, osm_id) values
  ('aldi', 'Aldi Le Locle', null, '2400', 'Le Locle', '5696333523'),
  ('aldi', 'Aldi Neuchâtel, Rue Saint-Honoré', null, '2000', 'Neuchâtel', '538425501'),
  ('aldi', 'Aldi Neuchâtel, Rue des Draizes', null, '2000', 'Neuchâtel', '1665639756'),
  ('coop', 'Coop Boudry, Rue Oscar-Huguenin', null, '2017', 'Boudry', '39071930'),
  ('coop', 'Coop Couvet, Prés-de-la-Porte 1', 'Prés-de-la-Porte 1', '2108', 'Couvet', '161294093'),
  ('coop', 'Coop Fontainemelon, Avenue Robert 12', 'Avenue Robert 12', '2052', 'Fontainemelon', '1373684699'),
  ('coop', 'Coop La Chaux-de-Fonds, Avenue Léopold-Robert 151', 'Avenue Léopold-Robert 151', '2300', 'La Chaux-de-Fonds', '9861379435'),
  ('coop', 'Coop La Chaux-de-Fonds, Boulevard des Eplatures 20', 'Boulevard des Eplatures 20', '2300', 'La Chaux-de-Fonds', '7017965223'),
  ('coop', 'Coop La Chaux-de-Fonds, Rue Fritz-Courvoisier 22', 'Rue Fritz-Courvoisier 22', '2303', 'La Chaux-de-Fonds', '107779868'),
  ('coop', 'Coop La Chaux-de-Fonds, Rue des Rosiers', null, '2300', 'La Chaux-de-Fonds', '418006107'),
  ('coop', 'Coop Le Landeron, Rue du Lac 26', 'Rue du Lac 26', '2525', 'Le Landeron', '4776291937'),
  ('coop', 'Coop Le Locle, Rue de la Banque 2', 'Rue de la Banque 2', '2400', 'Le Locle', '385419846'),
  ('coop', 'Coop Milvignes, Chemin des Sources', null, '2013', 'Milvignes', '35586264'),
  ('coop', 'Coop Neuchâtel, Place de la Gare', null, '2000', 'Neuchâtel', '577374846'),
  ('coop', 'Coop Neuchâtel, Rue de la Treille', null, '2000', 'Neuchâtel', '423833253'),
  ('coop', 'Coop Neuchâtel, Rue des Poudrières 137', 'Rue des Poudrières 137', '2000', 'Neuchâtel', '4900329304'),
  ('coop', 'Coop Val-de-Travers, Rue du Temple', null, '2114', 'Val-de-Travers', '3809088143'),
  ('denner', 'Denner Areuse, Route du Vignoble 25', 'Route du Vignoble 25', '2015', 'Areuse', '8911207632'),
  ('denner', 'Denner Cernier, Route de Neuchâtel 3', 'Route de Neuchâtel 3', '2053', 'Cernier', '195295344'),
  ('denner', 'Denner La Chaux-de-Fonds, Place de la Gare', 'Place de la Gare', '2300', 'La Chaux-de-Fonds', '439155329'),
  ('denner', 'Denner La Chaux-de-Fonds, Rue Daniel-Jean Richard 23', 'Rue Daniel-Jean Richard 23', '2300', 'La Chaux-de-Fonds', '9056954858'),
  ('denner', 'Denner La Chaux-de-Fonds, Rue de la Charrière 65', 'Rue de la Charrière 65', '2300', 'La Chaux-de-Fonds', '9124792211'),
  ('denner', 'Denner La Chaux-de-Fonds, Rue du Bois-Noir', null, '2301', 'La Chaux-de-Fonds', '1844478113'),
  ('denner', 'Denner Le Locle, Rue Bournot 31', 'Rue Bournot 31', '2400', 'Le Locle', '6172568945'),
  ('denner', 'Denner Neuchâtel', null, '2034', 'Neuchâtel', '12073510982'),
  ('denner', 'Denner Neuchâtel (2)', null, '2000', 'Neuchâtel', '990202156'),
  ('denner', 'Denner Neuchâtel, Rue du Plan', null, '2042', 'Neuchâtel', '6498475372'),
  ('denner', 'Denner Peseux, Rue Jämes Paris 6', 'Rue Jämes Paris 6', '2034', 'Peseux', '428149086'),
  ('denner', 'Denner Val-de-Travers, Rue du Château', null, '2114', 'Val-de-Travers', '9421298869'),
  ('lidl', 'Lidl Bevaix, Chemin des Maladières 18', 'Chemin des Maladières 18', '2022', 'Bevaix', '305610593'),
  ('lidl', 'Lidl La Chaux-de-Fonds, Rue du Cygne', null, '2300', 'La Chaux-de-Fonds', '6988275952'),
  ('lidl', 'Lidl Neuchâtel, Rue de l''Ecluse 30 - 38', 'Rue de l''Ecluse 30 - 38', '2000', 'Neuchâtel', '4904632669'),
  ('migros', 'Migros Boudry, Avenue du Collège 37', 'Avenue du Collège 37', '2017', 'Boudry', '1125498959'),
  ('migros', 'Migros Cernier, Rue de Comble-Emine 5', 'Rue de Comble-Emine 5', '2053', 'Cernier', '161457635'),
  ('migros', 'Migros Cortaillod, Chemin de Ronzi', null, '2016', 'Cortaillod', '1054471303'),
  ('migros', 'Migros La Chaux-de-Fonds, Rue de la Charrière 71', 'Rue de la Charrière 71', '2300', 'La Chaux-de-Fonds', '9124792210'),
  ('migros', 'Migros La Chaux-de-Fonds, Rue du Bois-Noir', null, '2301', 'La Chaux-de-Fonds', '1844478116'),
  ('migros', 'Migros La Chaux-de-Fonds, Rue du Midi', null, '2300', 'La Chaux-de-Fonds', '4926230015'),
  ('migros', 'Migros La Grande-Béroche, Rue de Combamare 21', 'Rue de Combamare 21', '2025', 'La Grande-Béroche', '1806195326'),
  ('migros', 'Migros Laténa, Route des Grands-Bois', null, '2074', 'Laténa', '10788122180'),
  ('migros', 'Migros Le Landeron, Route de Neuchâtel 46', 'Route de Neuchâtel 46', '2525', 'Le Landeron', '49040845'),
  ('migros', 'Migros Le Locle, Rue Bournot 35', 'Rue Bournot 35', '2400', 'Le Locle', '6172568944'),
  ('migros', 'Migros Milvignes, Chemin de Ronzi 2', 'Chemin de Ronzi 2', '2016', 'Milvignes', '36186481'),
  ('migros', 'Migros Neuchâtel, Avenue des Portes-Rouges', null, '2009', 'Neuchâtel', '883456577'),
  ('migros', 'Migros Neuchâtel, Rue de l''Hôpital', null, '2000', 'Neuchâtel', '365929382'),
  ('migros', 'Migros Neuchâtel, Rue du Plan', null, '2042', 'Neuchâtel', '6498475373'),
  ('migros', 'Migros Peseux, Rue Jämes-Paris 4', 'Rue Jämes-Paris 4', '2034', 'Peseux', '36285608'),
  ('migros', 'Migros Val-de-Travers, Ruelle Lequin', null, '2114', 'Val-de-Travers', '3735882316')
on conflict (osm_id) do nothing;

-- Écartés (petits magasins de quartier, shop=convenience) :
--   Denner La Chaux-de-Fonds, Rue de la Croix-Fédérale 48 [Denner Express, osm_id 309437126]
--   Denner Val-de-Travers, Rue Emer-de-Vattel [Denner, osm_id 3020908454]
--   Coop La Chaux-de-Fonds, Rue du Ravin [Coop, osm_id 14203277245]
