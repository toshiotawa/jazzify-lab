-- CodeRun maps: move object placement into survival_run_maps.map_data.
BEGIN;

UPDATE public.survival_run_maps
SET
  map_data = map_data
    || '{
      "layoutVersion": 1,
      "viewWidth": 960,
      "viewHeight": 528,
      "tileSize": 48,
      "worldTilesWide": 168,
      "worldTilesHigh": 11,
      "groundRow": 9,
      "spawn": {"c": 2, "r": 9},
      "goalColumn": 160,
      "goalOffsetX": 18,
      "pits": [{"c0":26,"c1":28},{"c0":60,"c1":63},{"c0":96,"c1":98},{"c0":128,"c1":129}],
      "solids": [
        {"kind":"block","c":9,"r":6},
        {"kind":"brick","row":8,"c0":21,"c1":23},
        {"kind":"platform","row":7,"c0":32,"c1":35},
        {"kind":"block","c":38,"r":6},
        {"kind":"block","c":39,"r":6},
        {"kind":"brick","col":47,"r0":8,"r1":8},
        {"kind":"brick","col":48,"r0":7,"r1":8},
        {"kind":"brick","col":49,"r0":6,"r1":8},
        {"kind":"brick","col":50,"r0":5,"r1":8},
        {"kind":"platform","row":7,"c0":61,"c1":62},
        {"kind":"block","c":70,"r":6},
        {"kind":"block","c":71,"r":6},
        {"kind":"block","c":84,"r":6},
        {"kind":"platform","row":7,"c0":88,"c1":88},
        {"kind":"platform","row":6,"c0":90,"c1":90},
        {"kind":"platform","row":5,"c0":92,"c1":92},
        {"kind":"platform","row":7,"c0":97,"c1":97},
        {"kind":"platform","row":7,"c0":106,"c1":106},
        {"kind":"platform","row":6,"c0":108,"c1":108},
        {"kind":"block","c":112,"r":6},
        {"kind":"block","c":113,"r":6},
        {"kind":"block","c":114,"r":6},
        {"kind":"block","c":136,"r":6},
        {"kind":"brick","col":148,"r0":8,"r1":8},
        {"kind":"brick","col":149,"r0":7,"r1":8},
        {"kind":"brick","col":150,"r0":6,"r1":8},
        {"kind":"brick","col":151,"r0":5,"r1":8},
        {"kind":"brick","col":152,"r0":4,"r1":8}
      ],
      "spikes": [{"c":75},{"c":76},{"c":120},{"c":121}],
      "enemies": [
        {"c":17},{"c":33,"r":7},{"c":42},{"c":66},{"c":72},{"c":86},{"c":90},
        {"c":104},{"c":110},{"c":118},{"c":134},{"c":140}
      ]
    }'::jsonb,
  updated_at = now()
WHERE id = 'night_city_run_01';

UPDATE public.survival_run_maps
SET
  map_data = map_data
    || '{
      "layoutVersion": 1,
      "viewWidth": 960,
      "viewHeight": 528,
      "tileSize": 48,
      "worldTilesWide": 168,
      "worldTilesHigh": 11,
      "groundRow": 9,
      "spawn": {"c": 2, "r": 9},
      "goalColumn": 160,
      "goalOffsetX": 18,
      "pits": [{"c0":22,"c1":24},{"c0":54,"c1":56},{"c0":92,"c1":94},{"c0":132,"c1":133}],
      "solids": [
        {"kind":"block","c":8,"r":6},
        {"kind":"platform","row":7,"c0":28,"c1":31},
        {"kind":"brick","row":8,"c0":40,"c1":42},
        {"kind":"brick","col":46,"r0":8,"r1":8},
        {"kind":"brick","col":47,"r0":7,"r1":8},
        {"kind":"brick","col":48,"r0":6,"r1":8},
        {"kind":"brick","col":49,"r0":5,"r1":8},
        {"kind":"platform","row":7,"c0":62,"c1":63},
        {"kind":"block","c":67,"r":6},
        {"kind":"block","c":68,"r":6},
        {"kind":"platform","row":7,"c0":84,"c1":86},
        {"kind":"platform","row":6,"c0":88,"c1":89},
        {"kind":"block","c":98,"r":6},
        {"kind":"block","c":99,"r":6},
        {"kind":"platform","row":7,"c0":110,"c1":111},
        {"kind":"platform","row":6,"c0":113,"c1":114},
        {"kind":"block","c":140,"r":6},
        {"kind":"brick","col":152,"r0":8,"r1":8},
        {"kind":"brick","col":153,"r0":7,"r1":8},
        {"kind":"brick","col":154,"r0":6,"r1":8},
        {"kind":"brick","col":155,"r0":5,"r1":8},
        {"kind":"brick","col":156,"r0":4,"r1":8}
      ],
      "spikes": [{"c":71},{"c":72},{"c":122},{"c":123}],
      "enemies": [
        {"c":14},{"c":19},{"c":29,"r":7},{"c":50},{"c":52},{"c":74},{"c":80},
        {"c":85,"r":7},{"c":90},{"c":105},{"c":112,"r":6},{"c":128},{"c":138},{"c":148},{"c":154}
      ]
    }'::jsonb,
  updated_at = now()
WHERE id = 'graveyard_run_02';

UPDATE public.survival_run_maps
SET
  map_data = map_data
    || '{
      "layoutVersion": 1,
      "viewWidth": 960,
      "viewHeight": 528,
      "tileSize": 48,
      "worldTilesWide": 168,
      "worldTilesHigh": 11,
      "groundRow": 9,
      "spawn": {"c": 2, "r": 9},
      "goalColumn": 160,
      "goalOffsetX": 18,
      "pits": [{"c0":30,"c1":31},{"c0":66,"c1":68},{"c0":104,"c1":106},{"c0":144,"c1":145}],
      "solids": [
        {"kind":"platform","row":7,"c0":12,"c1":14},
        {"kind":"platform","row":7,"c0":19,"c1":22},
        {"kind":"platform","row":6,"c0":25,"c1":26},
        {"kind":"block","c":36,"r":6},
        {"kind":"block","c":37,"r":6},
        {"kind":"platform","row":7,"c0":45,"c1":49},
        {"kind":"brick","row":8,"c0":56,"c1":58},
        {"kind":"platform","row":7,"c0":70,"c1":72},
        {"kind":"platform","row":6,"c0":75,"c1":76},
        {"kind":"platform","row":7,"c0":81,"c1":84},
        {"kind":"block","c":94,"r":6},
        {"kind":"block","c":95,"r":6},
        {"kind":"brick","col":99,"r0":8,"r1":8},
        {"kind":"brick","col":100,"r0":7,"r1":8},
        {"kind":"brick","col":101,"r0":6,"r1":8},
        {"kind":"platform","row":7,"c0":109,"c1":111},
        {"kind":"platform","row":6,"c0":114,"c1":116},
        {"kind":"platform","row":7,"c0":122,"c1":126},
        {"kind":"platform","row":7,"c0":136,"c1":138},
        {"kind":"platform","row":6,"c0":140,"c1":141},
        {"kind":"brick","col":152,"r0":8,"r1":8},
        {"kind":"brick","col":153,"r0":7,"r1":8},
        {"kind":"brick","col":154,"r0":6,"r1":8},
        {"kind":"brick","col":155,"r0":5,"r1":8},
        {"kind":"brick","col":156,"r0":4,"r1":8}
      ],
      "spikes": [{"c":20},{"c":21},{"c":46},{"c":47},{"c":48},{"c":82},{"c":83},{"c":123},{"c":124},{"c":125}],
      "enemies": [
        {"c":13,"r":7},{"c":27},{"c":40},{"c":48,"r":7},{"c":60},{"c":75,"r":6},
        {"c":88},{"c":110,"r":7},{"c":116,"r":6},{"c":130},{"c":141,"r":6},{"c":151},{"c":158}
      ]
    }'::jsonb,
  updated_at = now()
WHERE id = 'graveyard_run_03';

COMMIT;
