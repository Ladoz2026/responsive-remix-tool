-- =====================================================================
-- SeLoger CI — 002 : amorçage du référentiel géographique (Côte d'Ivoire)
-- Projet Supabase externe : jilihrowleimacfrujgb
--
-- N'insère QUE dans les tables cities / communes / districts créées par 001.
-- 100 % additif : aucun DROP, aucun ALTER, aucun UPDATE/DELETE.
-- Idempotent : ré-exécutable sans doublon (ON CONFLICT DO NOTHING).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Villes principales
-- ---------------------------------------------------------------------
INSERT INTO public.cities (code, name, slug, region, latitude, longitude, sort_order) VALUES
  ('abidjan',      'Abidjan',      'abidjan',      'Lagunes',             5.3600,  -4.0083,  1),
  ('yamoussoukro', 'Yamoussoukro', 'yamoussoukro', 'Lacs',                6.8276,  -5.2893,  2),
  ('bouake',       'Bouaké',       'bouake',       'Vallée du Bandama',   7.6906,  -5.0303,  3),
  ('san-pedro',    'San-Pédro',    'san-pedro',    'Bas-Sassandra',       4.7485,  -6.6363,  4),
  ('daloa',        'Daloa',        'daloa',        'Haut-Sassandra',      6.8770,  -6.4502,  5),
  ('korhogo',      'Korhogo',      'korhogo',      'Savanes',             9.4580,  -5.6294,  6),
  ('man',          'Man',          'man',          'Montagnes',           7.4125,  -7.5539,  7),
  ('gagnoa',       'Gagnoa',       'gagnoa',       'Gôh',                 6.1319,  -5.9506,  8),
  ('abengourou',   'Abengourou',   'abengourou',   'Indénié-Djuablin',    6.7297,  -3.4964,  9),
  ('divo',         'Divo',         'divo',         'Lôh-Djiboua',         5.8394,  -5.3572, 10),
  ('anyama-ville', 'Anyama',       'anyama-ville', 'Lagunes',             5.4947,  -4.0519, 11),
  ('grand-bassam', 'Grand-Bassam', 'grand-bassam', 'Sud-Comoé',           5.2118,  -3.7389, 12),
  ('bonoua',       'Bonoua',       'bonoua',       'Sud-Comoé',           5.2725,  -3.5947, 13),
  ('assinie',      'Assinie',      'assinie',      'Sud-Comoé',           5.1333,  -3.2833, 14),
  ('jacqueville',  'Jacqueville',  'jacqueville',  'Grands-Ponts',        5.2050,  -4.4133, 15),
  ('dabou',        'Dabou',        'dabou',        'Grands-Ponts',        5.3247,  -4.3767, 16),
  ('bingerville-v','Bingerville',  'bingerville-v','Lagunes',             5.3550,  -3.8853, 17),
  ('sassandra',    'Sassandra',    'sassandra',    'Gbôklé',              4.9500,  -6.0833, 18),
  ('odienne',      'Odienné',      'odienne',      'Kabadougou',          9.5060,  -7.5640, 19),
  ('bondoukou',    'Bondoukou',    'bondoukou',    'Gontougo',            8.0402,  -2.8000, 20)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. Les 13 communes du District Autonome d'Abidjan
-- ---------------------------------------------------------------------
INSERT INTO public.communes (city_id, code, name, slug, latitude, longitude, sort_order)
SELECT c.id, v.code, v.name, v.slug, v.latitude, v.longitude, v.sort_order
FROM public.cities c
JOIN (VALUES
  ('abidjan-abobo',       'Abobo',       'abobo',       5.4324, -4.0159,  1),
  ('abidjan-adjame',      'Adjamé',      'adjame',      5.3667, -4.0231,  2),
  ('abidjan-anyama',      'Anyama',      'anyama',      5.4947, -4.0519,  3),
  ('abidjan-attecoube',   'Attécoubé',   'attecoube',   5.3406, -4.0472,  4),
  ('abidjan-bingerville', 'Bingerville', 'bingerville', 5.3550, -3.8853,  5),
  ('abidjan-cocody',      'Cocody',      'cocody',      5.3548, -3.9861,  6),
  ('abidjan-koumassi',    'Koumassi',    'koumassi',    5.2925, -3.9539,  7),
  ('abidjan-marcory',     'Marcory',     'marcory',     5.2939, -3.9906,  8),
  ('abidjan-plateau',     'Plateau',     'plateau',     5.3242, -4.0219,  9),
  ('abidjan-port-bouet',  'Port-Bouët',  'port-bouet',  5.2569, -3.9264, 10),
  ('abidjan-songon',      'Songon',      'songon',      5.3086, -4.2500, 11),
  ('abidjan-treichville', 'Treichville', 'treichville', 5.2939, -4.0111, 12),
  ('abidjan-yopougon',    'Yopougon',    'yopougon',    5.3453, -4.0708, 13)
) AS v(code, name, slug, latitude, longitude, sort_order) ON true
WHERE c.code = 'abidjan'
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3. Quartiers par commune
-- ---------------------------------------------------------------------
INSERT INTO public.districts (commune_id, code, name, slug, sort_order)
SELECT cm.id, v.code, v.name, v.slug, v.sort_order
FROM public.communes cm
JOIN (VALUES
  -- Cocody
  ('cocody',      'cocody-riviera-golf',    'Riviera Golf',       'riviera-golf',     1),
  ('cocody',      'cocody-riviera-palmeraie','Riviera Palmeraie', 'riviera-palmeraie',2),
  ('cocody',      'cocody-riviera-2',       'Riviera 2',          'riviera-2',        3),
  ('cocody',      'cocody-riviera-3',       'Riviera 3',          'riviera-3',        4),
  ('cocody',      'cocody-riviera-4',       'Riviera 4',          'riviera-4',        5),
  ('cocody',      'cocody-angre',           'Angré',              'angre',            6),
  ('cocody',      'cocody-angre-7e-tranche','Angré 7e Tranche',   'angre-7e-tranche', 7),
  ('cocody',      'cocody-deux-plateaux',   'Deux Plateaux',      'deux-plateaux',    8),
  ('cocody',      'cocody-vallon',          'Deux Plateaux Vallon','vallon',          9),
  ('cocody',      'cocody-danga',           'Danga',              'danga',           10),
  ('cocody',      'cocody-mermoz',          'Mermoz',             'mermoz',          11),
  ('cocody',      'cocody-ambassades',      'Cocody Ambassades',  'ambassades',      12),
  ('cocody',      'cocody-blockhauss',      'Blockhauss',         'blockhauss',      13),
  ('cocody',      'cocody-attoban',         'Attoban',            'attoban',         14),
  ('cocody',      'cocody-bonoumin',        'Bonoumin',           'bonoumin',        15),
  ('cocody',      'cocody-faya',            'Faya',               'faya',            16),
  -- Marcory
  ('marcory',     'marcory-zone-4',         'Zone 4',             'zone-4',           1),
  ('marcory',     'marcory-bietry',         'Biétry',             'bietry',           2),
  ('marcory',     'marcory-residentiel',    'Marcory Résidentiel','residentiel',      3),
  ('marcory',     'marcory-anoumabo',       'Anoumabo',           'anoumabo',         4),
  ('marcory',     'marcory-remblais',       'Remblais',           'remblais',         5),
  -- Yopougon
  ('yopougon',    'yopougon-niangon',       'Niangon',            'niangon',          1),
  ('yopougon',    'yopougon-selmer',        'Selmer',             'selmer',           2),
  ('yopougon',    'yopougon-sideci',        'Sideci',             'sideci',           3),
  ('yopougon',    'yopougon-ananeraie',     'Ananeraie',          'ananeraie',        4),
  ('yopougon',    'yopougon-toits-rouges',  'Toits Rouges',       'toits-rouges',     5),
  ('yopougon',    'yopougon-maroc',         'Maroc',              'maroc',            6),
  -- Plateau
  ('plateau',     'plateau-centre',         'Plateau Centre',     'plateau-centre',   1),
  ('plateau',     'plateau-cite-adminis',   'Cité Administrative','cite-administrative',2),
  ('plateau',     'plateau-dokui',          'Plateau Dokui',      'plateau-dokui',    3),
  -- Abobo
  ('abobo',       'abobo-baoule',           'Abobo Baoulé',       'abobo-baoule',     1),
  ('abobo',       'abobo-gare',             'Abobo Gare',         'abobo-gare',       2),
  ('abobo',       'abobo-avocatier',        'Avocatier',          'avocatier',        3),
  ('abobo',       'abobo-anonkoua-koute',   'Anonkoua Kouté',     'anonkoua-koute',   4),
  -- Adjamé
  ('adjame',      'adjame-220-logements',   '220 Logements',      '220-logements',    1),
  ('adjame',      'adjame-williamsville',   'Williamsville',      'williamsville',    2),
  ('adjame',      'adjame-liberte',         'Liberté',            'liberte',          3),
  -- Treichville
  ('treichville', 'treichville-arras',      'Arras',              'arras',            1),
  ('treichville', 'treichville-biafra',     'Biafra',             'biafra',           2),
  ('treichville', 'treichville-zone-3',     'Zone 3',             'zone-3',           3),
  -- Koumassi
  ('koumassi',    'koumassi-remblais',      'Koumassi Remblais',  'koumassi-remblais',1),
  ('koumassi',    'koumassi-sicogi',        'Sicogi',             'sicogi',           2),
  ('koumassi',    'koumassi-campement',     'Campement',          'campement',        3),
  -- Port-Bouët
  ('port-bouet',  'port-bouet-vridi',       'Vridi',              'vridi',            1),
  ('port-bouet',  'port-bouet-gonzagueville','Gonzagueville',     'gonzagueville',    2),
  ('port-bouet',  'port-bouet-adjouffou',   'Adjouffou',          'adjouffou',        3),
  -- Attécoubé
  ('attecoube',   'attecoube-locodjro',     'Locodjro',           'locodjro',         1),
  ('attecoube',   'attecoube-agban',        'Agban',              'agban',            2),
  -- Bingerville
  ('bingerville', 'bingerville-centre',     'Bingerville Centre', 'centre',           1),
  ('bingerville', 'bingerville-adjin',      'Adjin',              'adjin',            2),
  -- Anyama
  ('anyama',      'anyama-centre',          'Anyama Centre',      'centre',           1),
  ('anyama',      'anyama-ahoue',           'Ahouè',              'ahoue',            2),
  -- Songon
  ('songon',      'songon-agban',           'Songon Agban',       'songon-agban',     1),
  ('songon',      'songon-mbrago',          'M''Brago',           'mbrago',           2)
) AS v(commune_slug, code, name, slug, sort_order) ON v.commune_slug = cm.slug
ON CONFLICT (code) DO NOTHING;

-- =====================================================================
-- Fin du script 002.
-- =====================================================================
