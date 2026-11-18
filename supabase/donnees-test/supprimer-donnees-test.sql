-- Supprime TOUT ce qui est marqué TEST : d'abord les prix relevés dans les filiales TEST,
-- puis les filiales elles-mêmes (dans cet ordre, sinon la base refuse : un prix pointe vers une filiale).
-- Ne touche à aucune autre donnée.

delete from prix
where magasin_id in (select id from magasins where nom like 'TEST %' and ville = 'TEST');

delete from magasins
where nom like 'TEST %' and ville = 'TEST';
