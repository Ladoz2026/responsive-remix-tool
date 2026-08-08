-- =====================================================================
-- 003_seed_referentiels.sql  —  SeLoger CI
-- Projet Supabase : immobilier
-- 100 % ADDITIF ET IDEMPOTENT
--   * aucune table créée, modifiée ou supprimée
--   * aucune donnée existante modifiée ou supprimée
--   * réexécutable sans effet de bord (insertion uniquement si le code
--     n'existe pas déjà, via NOT EXISTS — fonctionne même sans contrainte
--     UNIQUE sur la colonne code)
--
-- Tables alimentées (schéma réel constaté) :
--   property_categories (id, code, name_fr, name_en, description, icon, sort_order, is_active)
--   property_types      (+ category_code -> property_categories.code)
--   listing_types       (id, code, name_fr, name_en, description, icon, sort_order, is_active)
--   amenity_categories  (id, code, name_fr, name_en, icon, sort_order, is_active)
--   amenities           (+ category_code -> amenity_categories.code)
--
-- Les codes correspondent aux colonnes de properties :
--   properties.category_code, properties.property_type_code, properties.listing_type_code
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. CATÉGORIES DE BIENS  (property_categories)
-- ---------------------------------------------------------------------
WITH v(code, name_fr, name_en, description, icon, sort_order) AS (
  VALUES
    ('residentiel', 'Résidentiel',  'Residential', 'Logements destinés à l''habitation : appartements, villas, maisons, studios.', 'home',      1),
    ('commercial',  'Commercial',   'Commercial',  'Locaux à usage commercial : boutiques, magasins, entrepôts, restaurants.',     'store',     2),
    ('bureaux',     'Bureaux',      'Offices',     'Espaces de travail : bureaux, plateaux, open spaces, coworking.',             'briefcase', 3),
    ('terrain',     'Terrains',     'Land',        'Terrains nus, lotissements et parcelles constructibles ou agricoles.',        'map',       4),
    ('industriel',  'Industriel',   'Industrial',  'Entrepôts, hangars, usines et locaux d''activité industrielle.',              'factory',   5),
    ('hotellerie',  'Hôtellerie',   'Hospitality', 'Hôtels, résidences meublées et hébergements touristiques.',                   'bed',       6)
)
INSERT INTO public.property_categories (code, name_fr, name_en, description, icon, sort_order, is_active)
SELECT v.code, v.name_fr, v.name_en, v.description, v.icon, v.sort_order, true
FROM v
WHERE NOT EXISTS (
  SELECT 1 FROM public.property_categories pc WHERE pc.code = v.code
);

-- ---------------------------------------------------------------------
-- 2. TYPES DE BIENS  (property_types)  — rattachés à une catégorie
-- ---------------------------------------------------------------------
WITH v(code, name_fr, name_en, description, icon, category_code, sort_order) AS (
  VALUES
    -- Résidentiel
    ('appartement',      'Appartement',           'Apartment',        'Logement situé dans un immeuble collectif.',                        'building',   'residentiel',  1),
    ('villa',            'Villa',                 'Villa',            'Maison individuelle avec cour ou jardin.',                          'home',       'residentiel',  2),
    ('maison',           'Maison',                'House',            'Maison d''habitation individuelle ou mitoyenne.',                   'home',       'residentiel',  3),
    ('studio',           'Studio',                'Studio',           'Logement d''une pièce principale avec coin cuisine.',               'square',     'residentiel',  4),
    ('duplex',           'Duplex',                'Duplex',           'Logement réparti sur deux niveaux.',                                'layers',     'residentiel',  5),
    ('triplex',          'Triplex',               'Triplex',          'Logement réparti sur trois niveaux.',                               'layers',     'residentiel',  6),
    ('penthouse',        'Penthouse',             'Penthouse',        'Appartement de standing au dernier étage.',                         'crown',      'residentiel',  7),
    ('chambre',          'Chambre',               'Room',             'Chambre indépendante ou en colocation.',                            'bed',        'residentiel',  8),
    ('residence_meublee','Résidence meublée',     'Furnished residence','Logement meublé en location courte ou moyenne durée.',            'sofa',       'residentiel',  9),
    ('immeuble',         'Immeuble',              'Building',         'Immeuble entier de plusieurs logements.',                           'building-2', 'residentiel', 10),
    -- Commercial
    ('boutique',         'Boutique',              'Shop',             'Local commercial en pied d''immeuble ou en centre commercial.',     'store',      'commercial',  20),
    ('magasin',          'Magasin',               'Store',            'Surface de vente de moyenne ou grande taille.',                     'shopping-bag','commercial', 21),
    ('restaurant',       'Restaurant / Maquis',   'Restaurant',       'Local équipé pour la restauration.',                                'utensils',   'commercial',  22),
    ('local_commercial', 'Local commercial',      'Commercial unit',  'Local polyvalent à usage commercial.',                              'store',      'commercial',  23),
    -- Bureaux
    ('bureau',           'Bureau',                'Office',           'Espace de travail cloisonné ou individuel.',                        'briefcase',  'bureaux',     30),
    ('plateau_bureau',   'Plateau de bureaux',    'Office floor',     'Plateau nu ou aménagé sur un ou plusieurs étages.',                 'layout',     'bureaux',     31),
    ('coworking',        'Espace de coworking',   'Coworking space',  'Poste ou bureau partagé en espace collaboratif.',                   'users',      'bureaux',     32),
    -- Terrain
    ('terrain_nu',       'Terrain nu',            'Bare land',        'Parcelle non bâtie.',                                               'map',        'terrain',     40),
    ('terrain_batir',    'Terrain à bâtir',       'Building land',    'Parcelle viabilisée et constructible.',                             'map-pin',    'terrain',     41),
    ('terrain_agricole', 'Terrain agricole',      'Agricultural land','Parcelle destinée à l''exploitation agricole.',                     'sprout',     'terrain',     42),
    ('lotissement',      'Lotissement',           'Subdivision',      'Ensemble de parcelles loties.',                                     'grid',       'terrain',     43),
    -- Industriel
    ('entrepot',         'Entrepôt',              'Warehouse',        'Bâtiment de stockage.',                                             'warehouse',  'industriel',  50),
    ('hangar',           'Hangar',                'Hangar',           'Structure couverte de stockage ou d''activité.',                    'warehouse',  'industriel',  51),
    ('usine',            'Usine',                 'Factory',          'Site de production industrielle.',                                  'factory',    'industriel',  52),
    -- Hôtellerie
    ('hotel',            'Hôtel',                 'Hotel',            'Établissement hôtelier.',                                           'bed',        'hotellerie',  60),
    ('residence_hoteliere','Résidence hôtelière', 'Aparthotel',       'Résidence de services avec prestations hôtelières.',                'bed-double', 'hotellerie',  61)
)
INSERT INTO public.property_types (code, name_fr, name_en, description, icon, category_code, sort_order, is_active)
SELECT v.code, v.name_fr, v.name_en, v.description, v.icon, v.category_code, v.sort_order, true
FROM v
WHERE NOT EXISTS (
  SELECT 1 FROM public.property_types pt WHERE pt.code = v.code
);

-- ---------------------------------------------------------------------
-- 3. TYPES DE TRANSACTION  (listing_types)
-- ---------------------------------------------------------------------
WITH v(code, name_fr, name_en, description, icon, sort_order) AS (
  VALUES
    ('vente',            'Vente',                 'For sale',         'Bien proposé à la vente.',                                          'tag',        1),
    ('location',         'Location',              'For rent',         'Bien proposé à la location longue durée.',                          'key',        2),
    ('location_meublee', 'Location meublée',      'Furnished rental', 'Bien meublé proposé en location.',                                  'sofa',       3),
    ('location_courte',  'Location courte durée', 'Short stay',       'Location journalière ou hebdomadaire (séjour, vacances).',          'calendar',   4),
    ('bail_commercial',  'Bail commercial',       'Commercial lease', 'Location à usage professionnel ou commercial.',                     'briefcase',  5),
    ('viager',           'Viager',                'Life annuity',     'Vente en viager.',                                                  'hourglass',  6)
)
INSERT INTO public.listing_types (code, name_fr, name_en, description, icon, sort_order, is_active)
SELECT v.code, v.name_fr, v.name_en, v.description, v.icon, v.sort_order, true
FROM v
WHERE NOT EXISTS (
  SELECT 1 FROM public.listing_types lt WHERE lt.code = v.code
);

-- ---------------------------------------------------------------------
-- 4. CATÉGORIES D'ÉQUIPEMENTS  (amenity_categories)
-- ---------------------------------------------------------------------
WITH v(code, name_fr, name_en, icon, sort_order) AS (
  VALUES
    ('interieur',   'Intérieur',            'Interior',      'sofa',        1),
    ('exterieur',   'Extérieur',            'Exterior',      'trees',       2),
    ('confort',     'Confort',              'Comfort',       'thermometer', 3),
    ('securite',    'Sécurité',             'Security',      'shield',      4),
    ('services',    'Services',             'Services',      'concierge-bell', 5),
    ('stationnement','Stationnement',       'Parking',       'car',         6),
    ('proximite',   'À proximité',          'Nearby',        'map-pin',     7)
)
INSERT INTO public.amenity_categories (code, name_fr, name_en, icon, sort_order, is_active)
SELECT v.code, v.name_fr, v.name_en, v.icon, v.sort_order, true
FROM v
WHERE NOT EXISTS (
  SELECT 1 FROM public.amenity_categories ac WHERE ac.code = v.code
);

-- ---------------------------------------------------------------------
-- 5. ÉQUIPEMENTS  (amenities)
-- ---------------------------------------------------------------------
WITH v(code, name_fr, name_en, description, icon, category_code, sort_order) AS (
  VALUES
    -- Intérieur
    ('cuisine_equipee',   'Cuisine équipée',      'Fitted kitchen',   'Cuisine avec équipements intégrés.',              'chef-hat',    'interieur',    1),
    ('meuble',            'Meublé',               'Furnished',        'Bien livré entièrement meublé.',                  'sofa',        'interieur',    2),
    ('dressing',          'Dressing',             'Walk-in closet',   'Espace de rangement dédié.',                      'shirt',       'interieur',    3),
    ('buanderie',         'Buanderie',            'Laundry room',     'Pièce dédiée au linge.',                          'washing-machine','interieur', 4),
    ('carrelage',         'Carrelage',            'Tiled floors',     'Sols carrelés.',                                  'grid',        'interieur',    5),
    ('faux_plafond',      'Faux plafond',         'False ceiling',    'Faux plafond décoratif.',                         'layers',      'interieur',    6),
    ('suite_parentale',   'Suite parentale',      'Master suite',     'Chambre principale avec salle d''eau privative.', 'bed-double',  'interieur',    7),
    -- Extérieur
    ('piscine',           'Piscine',              'Swimming pool',    'Piscine privative ou collective.',                'waves',       'exterieur',   10),
    ('jardin',            'Jardin',               'Garden',           'Espace vert privatif.',                           'trees',       'exterieur',   11),
    ('terrasse',          'Terrasse',             'Terrace',          'Terrasse aménagée.',                              'sun',         'exterieur',   12),
    ('balcon',            'Balcon',               'Balcony',          'Balcon extérieur.',                               'square',      'exterieur',   13),
    ('cour',              'Cour',                 'Courtyard',        'Cour intérieure ou extérieure.',                  'square',      'exterieur',   14),
    ('barbecue',          'Espace barbecue',      'Barbecue area',    'Coin barbecue aménagé.',                          'flame',       'exterieur',   15),
    -- Confort
    ('climatisation',     'Climatisation',        'Air conditioning', 'Climatisation installée.',                        'snowflake',   'confort',     20),
    ('ventilateurs',      'Ventilateurs',         'Ceiling fans',     'Ventilateurs de plafond.',                        'fan',         'confort',     21),
    ('chauffe_eau',       'Chauffe-eau',          'Water heater',     'Eau chaude sanitaire.',                           'thermometer', 'confort',     22),
    ('ascenseur',         'Ascenseur',            'Elevator',         'Immeuble équipé d''un ascenseur.',                'move-vertical','confort',    23),
    ('groupe_electrogene','Groupe électrogène',   'Backup generator', 'Alimentation de secours en cas de coupure.',      'zap',         'confort',     24),
    ('chateau_eau',       'Château d''eau / citerne','Water tank',    'Réserve d''eau autonome.',                        'droplets',    'confort',     25),
    ('internet_fibre',    'Internet fibre',       'Fiber internet',   'Raccordement fibre optique disponible.',          'wifi',        'confort',     26),
    -- Sécurité
    ('gardiennage',       'Gardiennage 24/7',     '24/7 security',    'Présence d''un gardien ou vigile.',               'shield',      'securite',    30),
    ('videosurveillance', 'Vidéosurveillance',    'CCTV',             'Caméras de surveillance installées.',             'cctv',        'securite',    31),
    ('portail_automatique','Portail automatique', 'Automatic gate',   'Portail motorisé.',                               'door-open',   'securite',    32),
    ('cloture',           'Clôture / mur',        'Fenced',           'Terrain ou villa clôturé.',                       'fence',       'securite',    33),
    ('interphone',        'Interphone',           'Intercom',         'Interphone ou visiophone.',                       'phone',       'securite',    34),
    ('residence_securisee','Résidence sécurisée', 'Gated community',  'Résidence fermée avec contrôle d''accès.',        'lock',        'securite',    35),
    -- Services
    ('menage',            'Service de ménage',    'Cleaning service', 'Ménage inclus ou disponible.',                    'sparkles',    'services',    40),
    ('conciergerie',      'Conciergerie',         'Concierge',        'Service de conciergerie.',                        'concierge-bell','services',  41),
    ('salle_sport',       'Salle de sport',       'Gym',              'Salle de fitness dans la résidence.',             'dumbbell',    'services',    42),
    ('espace_enfants',    'Espace enfants',       'Kids area',        'Aire de jeux pour enfants.',                      'baby',        'services',    43),
    ('local_poubelle',    'Local poubelles',      'Waste room',       'Gestion des déchets organisée.',                  'trash-2',     'services',    44),
    -- Stationnement
    ('garage',            'Garage',               'Garage',           'Garage fermé.',                                   'car',         'stationnement',50),
    ('parking_prive',     'Parking privé',        'Private parking',  'Place de parking réservée.',                      'car',         'stationnement',51),
    ('parking_visiteur',  'Parking visiteurs',    'Visitor parking',  'Places dédiées aux visiteurs.',                   'car-front',   'stationnement',52),
    ('abri_voiture',      'Abri voiture',         'Carport',          'Emplacement couvert.',                            'car',         'stationnement',53),
    -- Proximité
    ('proche_ecole',      'Proche école',         'Near school',      'Établissements scolaires à proximité.',           'graduation-cap','proximite',  60),
    ('proche_commerces',  'Proche commerces',     'Near shops',       'Commerces et supermarchés à proximité.',          'shopping-cart','proximite',   61),
    ('proche_transport',  'Proche transports',    'Near transport',   'Transports en commun accessibles.',               'bus',         'proximite',   62),
    ('proche_hopital',    'Proche hôpital',       'Near hospital',    'Centre de santé à proximité.',                    'cross',       'proximite',   63),
    ('proche_plage',      'Proche plage',         'Near beach',       'Accès rapide à la plage.',                        'waves',       'proximite',   64),
    ('bord_route',        'Bord de route bitumée','On paved road',    'Accès direct depuis une voie bitumée.',           'route',       'proximite',   65)
)
INSERT INTO public.amenities (code, name_fr, name_en, description, icon, category_code, sort_order, is_active)
SELECT v.code, v.name_fr, v.name_en, v.description, v.icon, v.category_code, v.sort_order, true
FROM v
WHERE NOT EXISTS (
  SELECT 1 FROM public.amenities a WHERE a.code = v.code
);

COMMIT;

-- ---------------------------------------------------------------------
-- Vérification (lecture seule)
-- ---------------------------------------------------------------------
-- SELECT 'property_categories' AS table, count(*) FROM public.property_categories
-- UNION ALL SELECT 'property_types',      count(*) FROM public.property_types
-- UNION ALL SELECT 'listing_types',       count(*) FROM public.listing_types
-- UNION ALL SELECT 'amenity_categories',  count(*) FROM public.amenity_categories
-- UNION ALL SELECT 'amenities',           count(*) FROM public.amenities;
