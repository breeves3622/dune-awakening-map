import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Encoder } from "cbor-x";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const encoder = new Encoder({ useRecords: true, pack: true });

export const MAP_NODES_CONFIG = {
  survival_1: "survival_1.ff4c878505a33bc09bc2b0c17b39cefd.raw",
  sh_arrakeen: "sh_arrakeen.f8775266f3cf9d26136933b8a0d297a2.raw",
  sh_harkovillage: "sh_harkovillage.c3f8ca3b8e982662dff26d5b750bbdec.raw",
  deepdesert_1: "deepdesert_1.cd26a8b80e48898f4c6c0da3c95f465a.raw",
  cb_overland_s_04: "cb_overland_s_04.87d20bab845088a6f012426d7364a33e.raw",
  cb_overland_m_01: "cb_overland_m_01.24045e324dc6001aa3380c58b6b7a26e.raw",
  cb_overland_s_06: "cb_overland_s_06.30bed31577953971df064d961585a130.raw",
  cb_overland_s_07: "cb_overland_s_07.4c43175fa55c6b1a6be336bf624240dc.raw",
  cb_overland_s_08: "cb_overland_s_08.b73f688c6b9b6e6f8dc7af060fb72c86.raw",
  cb_story_banditfortress01: "cb_story_banditfortress01.066ef3f648b1447cac63238749498bef.raw",
  overmap: "overmap.da6dc7787e24606cfafcd38a1f5f2fda.raw"
};

// Rich taxonomy mapping types into clean categories and UI presentation
export const TYPE_DEFINITIONS = {
  // Bunkers & Outposts
  ecolab: { cat: "Bunkers & Outposts", label: "Imperial Testing Station", icon: "⚲", color: "#3b82f6", defaultOn: true },
  enemycamp: { cat: "Bunkers & Outposts", label: "Enemy Camp", icon: "⚔", color: "#ef4444", defaultOn: false },
  enemyoutpost: { cat: "Bunkers & Outposts", label: "Enemy Outpost", icon: "⚑", color: "#f97316", defaultOn: false },
  enemylaboroutpost: { cat: "Bunkers & Outposts", label: "Labor Outpost", icon: "⚒", color: "#eab308", defaultOn: false },
  secret_door: { cat: "Bunkers & Outposts", label: "Secret Door / Hatch", icon: "🗝", color: "#a855f7", defaultOn: true },
  controlpointhousetseida: { cat: "Bunkers & Outposts", label: "House Control Point", icon: "🏰", color: "#6366f1", defaultOn: true },

  // Caves & Sietches
  cave: { cat: "Caves & Exploration", label: "Cave", icon: "⛰", color: "#10b981", defaultOn: true },
  sietch: { cat: "Caves & Exploration", label: "Fremen Sietch", icon: "⛺", color: "#14b8a6", defaultOn: true },
  explorationpointofinterest: { cat: "Caves & Exploration", label: "Point of Interest", icon: "★", color: "#06b6d4", defaultOn: true },
  exploration: { cat: "Caves & Exploration", label: "Exploration Site", icon: "🧭", color: "#0ea5e9", defaultOn: true },
  intel_point: { cat: "Caves & Exploration", label: "Intel Beacon", icon: "📡", color: "#38bdf8", defaultOn: false },

  // Spice Deposits
  spice_field_large: { cat: "Spice Deposits", label: "Large Spice Field", icon: "✦", color: "#f59e0b", defaultOn: true },
  spice_field_medium: { cat: "Spice Deposits", label: "Medium Spice Field", icon: "✦", color: "#fbbf24", defaultOn: true },
  spice_field_small: { cat: "Spice Deposits", label: "Small Spice Field", icon: "✧", color: "#fde047", defaultOn: false },
  flour_sand_field: { cat: "Spice Deposits", label: "Flour Sand Blow", icon: "◬", color: "#d97706", defaultOn: false },

  // Crashed Ships & Wrecks
  shipwreck: { cat: "Wrecks & Crashed Ships", label: "Major Shipwreck", icon: "▲", color: "#ef4444", defaultOn: true },
  small_shipwreck: { cat: "Wrecks & Crashed Ships", label: "Small Shipwreck", icon: "▵", color: "#f87171", defaultOn: false },
  wreck: { cat: "Wrecks & Crashed Ships", label: "Fuselage Wreckage", icon: "◬", color: "#fb7185", defaultOn: false },

  // Water & Facilities
  water_tank: { cat: "Water & Facilities", label: "Water Reservoir Tank", icon: "💧", color: "#06b6d4", defaultOn: true },
  refinery: { cat: "Water & Facilities", label: "Resource Refinery", icon: "🏭", color: "#f59e0b", defaultOn: false },
  tradingpost: { cat: "Water & Facilities", label: "Trading Post", icon: "⚖", color: "#fbbf24", defaultOn: true },
  taxiservice: { cat: "Water & Facilities", label: "Ornithopter Taxi", icon: "✈", color: "#38bdf8", defaultOn: true },
  sandbike: { cat: "Water & Facilities", label: "Sandbike Depot", icon: "🏍", color: "#eab308", defaultOn: false },
  buggy: { cat: "Water & Facilities", label: "Buggy Garage", icon: "🚙", color: "#f97316", defaultOn: false },

  // Trainers & Representatives
  trainersswordmaster: { cat: "Trainers & Guilds", label: "Swordmaster Trainer", icon: "⚔", color: "#8b5cf6", defaultOn: true },
  trainersbenegesserit: { cat: "Trainers & Guilds", label: "Bene Gesserit Trainer", icon: "👁", color: "#a855f7", defaultOn: true },
  trainersmentat: { cat: "Trainers & Guilds", label: "Mentat Trainer", icon: "🧠", color: "#c084fc", defaultOn: true },
  trainersplanetologist: { cat: "Trainers & Guilds", label: "Planetologist Trainer", icon: "🌱", color: "#34d399", defaultOn: true },
  trainerstrooper: { cat: "Trainers & Guilds", label: "Trooper Trainer", icon: "🛡", color: "#60a5fa", defaultOn: true },
  weaponsvendor: { cat: "Trainers & Guilds", label: "Weapons Vendor", icon: "🗡", color: "#f43f5e", defaultOn: true },
  spicevendor: { cat: "Trainers & Guilds", label: "Spice Vendor", icon: "◈", color: "#f59e0b", defaultOn: true },
  resourcevendor: { cat: "Trainers & Guilds", label: "Resource Vendor", icon: "📦", color: "#fb923c", defaultOn: true },
  barkeepvendor: { cat: "Trainers & Guilds", label: "Barkeep Vendor", icon: "🍺", color: "#a3e635", defaultOn: true },

  // Loot & Gear
  treasure_loot_container: { cat: "Loot & Equipment", label: "Treasure Container", icon: "👑", color: "#eab308", defaultOn: false },
  ultra_rare: { cat: "Loot & Equipment", label: "Ultra Rare Cache", icon: "💎", color: "#ec4899", defaultOn: false },
  small_ultra_rare: { cat: "Loot & Equipment", label: "Small Ultra Rare Cache", icon: "💎", color: "#f472b6", defaultOn: false },
  rare: { cat: "Loot & Equipment", label: "Rare Crate", icon: "💠", color: "#8b5cf6", defaultOn: false },
  weapon: { cat: "Loot & Equipment", label: "Weapon Locker", icon: "🔫", color: "#f43f5e", defaultOn: false },
  ammo: { cat: "Loot & Equipment", label: "Ammunition Crate", icon: "⌖", color: "#fb923c", defaultOn: false },
  medical: { cat: "Loot & Equipment", label: "Medical Stash", icon: "✚", color: "#22c55e", defaultOn: false },
  fuel_cells: { cat: "Loot & Equipment", label: "Fuel Cells", icon: "⚡", color: "#eab308", defaultOn: false },
  fuel: { cat: "Loot & Equipment", label: "Fuel Drum", icon: "⛽", color: "#f59e0b", defaultOn: false },
  corpse: { cat: "Loot & Equipment", label: "Lootable Corpse", icon: "💀", color: "#71717a", defaultOn: false },
  scrap_metal: { cat: "Loot & Equipment", label: "Scrap Metal Pile", icon: "⚙", color: "#94a3b8", defaultOn: false },
  scrap_electronics: { cat: "Loot & Equipment", label: "Scrap Electronics", icon: "💾", color: "#38bdf8", defaultOn: false },

  // Ores & Minerals
  azurite: { cat: "Ores & Minerals", label: "Copper Ore (Azurite)", icon: "⛏", color: "#f97316", defaultOn: false },
  bauxite: { cat: "Ores & Minerals", label: "Aluminum Ore (Bauxite)", icon: "⛏", color: "#cbd5e1", defaultOn: false },
  magnetite: { cat: "Ores & Minerals", label: "Iron Ore (Magnetite)", icon: "⛏", color: "#64748b", defaultOn: false },
  dolomite: { cat: "Ores & Minerals", label: "Dolomite Deposit", icon: "⛏", color: "#fdba74", defaultOn: false },
  basalt: { cat: "Ores & Minerals", label: "Basalt Quarry", icon: "⛏", color: "#475569", defaultOn: false },
  rhyolite: { cat: "Ores & Minerals", label: "Rhyolite Deposit", icon: "⛏", color: "#a1a1aa", defaultOn: false },
  erythrite: { cat: "Ores & Minerals", label: "Cobalt Ore (Erythrite)", icon: "⛏", color: "#0ea5e9", defaultOn: false },
  jasmium: { cat: "Ores & Minerals", label: "Jasmium Crystal", icon: "⛏", color: "#c084fc", defaultOn: false },
  stravidium: { cat: "Ores & Minerals", label: "Stravidium Vein", icon: "⛏", color: "#e879f9", defaultOn: false },
  titanium: { cat: "Ores & Minerals", label: "Titanium Vein", icon: "⛏", color: "#f1f5f9", defaultOn: false },

  // Flora
  fiber_plant: { cat: "Flora & Organics", label: "Plant Fiber", icon: "🌿", color: "#84cc16", defaultOn: false },
  primrose_field: { cat: "Flora & Organics", label: "Primrose Field", icon: "🌸", color: "#f472b6", defaultOn: false },
  agave_seeds: { cat: "Flora & Organics", label: "Agave Seeds", icon: "🌾", color: "#bef264", defaultOn: false }
};

const NODES_DIR = path.join(__dirname, "data", "nodes");
if (!fs.existsSync(NODES_DIR)) fs.mkdirSync(NODES_DIR, { recursive: true });

// In-memory cache for parsed nodes per map
const MEMORY_CACHE = new Map();

export async function getMapData(mapId) {
  if (MEMORY_CACHE.has(mapId)) {
    return MEMORY_CACHE.get(mapId);
  }

  const filename = MAP_NODES_CONFIG[mapId];
  if (!filename) return null;

  const localFile = path.join(NODES_DIR, filename);
  let buffer;

  // 1. Check local file on disk
  if (fs.existsSync(localFile)) {
    buffer = fs.readFileSync(localFile);
  } else {
    // 2. Fetch from CDN and cache locally
    const cdnUrl = `https://cdn.th.gl/dune-awakening/nodes/${filename}`;
    try {
      console.log(`[NodeManager] Downloading nodes for ${mapId} from ${cdnUrl}...`);
      const res = await fetch(cdnUrl);
      if (!res.ok) {
        console.error(`[NodeManager] Failed to fetch nodes: HTTP ${res.status}`);
        return null;
      }
      const arrayBuf = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuf);
      fs.writeFileSync(localFile, buffer);
      console.log(`[NodeManager] Cached ${buffer.length} bytes for ${mapId}`);
    } catch (err) {
      console.error(`[NodeManager] Error downloading nodes for ${mapId}:`, err.message);
      return null;
    }
  }

  // 3. Decode CBOR
  let decoded;
  try {
    decoded = encoder.decode(new Uint8Array(buffer));
  } catch (err) {
    console.error(`[NodeManager] Error decoding CBOR for ${mapId}:`, err.message);
    return null;
  }

  // 4. Transform and organize nodes
  const categoriesMap = {};
  const typesMap = {};
  const allMarkers = [];

  for (const group of decoded) {
    const typeKey = group.type;
    const def = TYPE_DEFINITIONS[typeKey] || {
      cat: "Other Points of Interest",
      label: typeKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: "•",
      color: "#94a3b8",
      defaultOn: false,
    };

    const count = group.spawns ? group.spawns.length : 0;
    typesMap[typeKey] = {
      type: typeKey,
      ...def,
      count,
    };

    if (!categoriesMap[def.cat]) {
      categoriesMap[def.cat] = {
        name: def.cat,
        types: [],
        totalCount: 0,
      };
    }
    categoriesMap[def.cat].types.push(typesMap[typeKey]);
    categoriesMap[def.cat].totalCount += count;

    if (group.spawns) {
      for (const sp of group.spawns) {
        if (!sp.p || sp.p.length < 2) continue;
        allMarkers.push({
          id: sp.id || `${typeKey}_${sp.p[0]}_${sp.p[1]}`,
          type: typeKey,
          category: def.cat,
          title: def.label,
          icon: def.icon,
          color: def.color,
          x: sp.p[0],
          y: sp.p[1],
          z: sp.p[2] || 0,
          defaultOn: !!def.defaultOn,
        });
      }
    }
  }

  // Always include Custom Pins in taxonomy
  const customPinsDef = {
    type: "custom_pins",
    cat: "Custom Pins",
    label: "Custom User Pins",
    icon: "★",
    color: "#eab308",
    defaultOn: true,
    count: 0,
  };
  typesMap["custom_pins"] = customPinsDef;
  if (!categoriesMap["Custom Pins"]) {
    categoriesMap["Custom Pins"] = {
      name: "Custom Pins",
      types: [customPinsDef],
      totalCount: 0,
    };
  }

  const result = {
    mapId,
    categories: Object.values(categoriesMap),
    types: typesMap,
    markers: allMarkers,
  };

  MEMORY_CACHE.set(mapId, result);
  return result;
}
