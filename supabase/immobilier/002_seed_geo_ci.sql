-- =====================================================================
-- OPTIONNEL — Amorçage du référentiel géographique (Côte d'Ivoire)
-- N'insère QUE dans les nouvelles tables cities / communes / districts.
-- Aucune donnée existante n'est touchée. Idempotent (ON CONFLICT DO NOTHING).
-- N'exécute ce fichier que si tu veux ces données de départ.
-- =====================================================================

INSERT INTO public.cities (code, name, slug, region, sort_order) VALUES
  ('abidjan',     'Abidjan',      'abidjan',      'Lagunes',            1),
  ('yamoussoukro','Yamoussoukro', 'yamoussoukro', 'Lacs',               2),
  ('bouake',      'Bouaké',       'bouake',       'Vallée du Bandama',  3),
  ('san-pedro',   'San-Pédro',    'san-pedro',    'Bas-Sassandra',      4),
  ('daloa',       'Daloa',        'daloa',        'Haut-Sassandra',     5),
  ('korhogo',     'Korhogo',      'korhogo',      'Savanes',            6),
  ('grand-bassam','Grand-Bassam', 'grand-bassam', 'Sud-Comoé',          7),
  ('assinie',     'Assinie',      'assinie',      'Sud-Comoé',          8)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.communes (city_id, code, name, slug, sort_order)
SELECT c.id, v.code, v.name, v.slug, v.sort_order
FROM public.cities c
JOIN (VALUES
  ('abidjan-abobo',        'Abobo',          'abobo',           1),
  ('abidjan-adjame',       'Adjamé',         'adjame',          2),
  ('abidjan-anyama',       'Anyama',         'anyama',          3),
  ('abidjan-attecoube',    'Attécoubé',      'attecoube',       4),
  ('abidjan-bingerville',  'Bingerville',    'bingerville',     5),
  ('abidjan-cocody',       'Cocody',         'cocody',          6),
  ('abidjan-koumassi',     'Koumassi',       'koumassi',        7),
  ('abidjan-marcory',      'Marcory',        'marcory',         8),
  ('abidjan-plateau',      'Plateau',        'plateau',         9),
  ('abidjan-port-bouet',   'Port-Bouët',     'port-bouet',     10),
  ('abidjan-songon',       'Songon',         'songon',         11),
  ('abidjan-treichville',  'Treichville',    'treichville',    12),
  ('abidjan-yopougon',     'Yopougon',       'yopougon',       13)
) AS v(code, name, slug, sort_order) ON true
WHERE c.code = 'abidjan'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.districts (commune_id, code, name, slug, sort_order)
SELECT cm.id, v.code, v.name, v.slug, v.sort_order
FROM public.communes cm
JOIN (VALUES
  ('cocody',   'cocody-riviera',      'Riviera',        'riviera',        1),
  ('cocody',   'cocody-angre',        'Angré',          'angre',          2),
  ('cocody',   'cocody-deux-plateaux','Deux Plateaux',  'deux-plateaux',  3),
  ('cocody',   'cocody-danga',        'Danga',          'danga',          4),
  ('marcory',  'marcory-zone-4',      'Zone 4',         'zone-4',         1),
  ('marcory',  'marcory-biétry',      'Biétry',         'bietry',         2),
  ('yopougon', 'yopougon-niangon',    'Niangon',        'niangon',        1),
  ('yopougon', 'yopougon-selmer',     'Selmer',         'selmer',         2),
  ('plateau',  'plateau-centre',      'Plateau Centre', 'plateau-centre', 1)
) AS v(commune_slug, code, name, slug, sort_order) ON v.commune_slug = cm.slug
ON CONFLICT (code) DO NOTHING;
