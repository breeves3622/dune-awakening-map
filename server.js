import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DEFAULT_MARKERS } from "./defaults.js";
import { getMapData } from "./node-manager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const OFFLINE_MODE = process.env.OFFLINE_MODE === "true";

// Ensure data and tiles directories exist
const DATA_DIR = path.join(__dirname, "data");
const TILES_DIR = path.join(__dirname, "tiles");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(TILES_DIR)) fs.mkdirSync(TILES_DIR, { recursive: true });

const CUSTOM_MARKERS_FILE = path.join(DATA_DIR, "custom-markers.json");
if (!fs.existsSync(CUSTOM_MARKERS_FILE)) {
  fs.writeFileSync(CUSTOM_MARKERS_FILE, JSON.stringify([], null, 2), "utf8");
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Dune: Awakening Maps Configuration
const MAPS = {
  survival_1: {
    id: "survival_1",
    title: "Hagga Basin",
    description: "The primary survival expanse of Arrakis.",
    cdnTileHash: "survival_1-0c70ddebb3e41cf49915b22e103e94ed",
    minNativeZoom: 0,
    maxNativeZoom: 4,
    minZoom: -2,
    maxZoom: 6,
    tileSize: 512,
    bounds: [
      [-457599, -457599],
      [355199, 355199],
    ],
    transformation: [
      0.0006299212598425197, 288.251968503937, 0.0006299212598425197,
      288.251968503937,
    ],
    defaultCenter: [-50000, -50000],
    defaultZoom: 1,
  },
  deepdesert_1: {
    id: "deepdesert_1",
    title: "The Deep Desert",
    description: "Vast, shifting dunes filled with spice blows and massive sandworms.",
    cdnTileHash: "deepdesert_1-ce84793aea1d9e14e5898d7d10beb670",
    minNativeZoom: 0,
    maxNativeZoom: 4,
    minZoom: -2,
    maxZoom: 6,
    tileSize: 512,
    bounds: [
      [-1270399, -1270399],
      [1167999, 1167999],
    ],
    transformation: [
      0.0002099737532808399, 266.750656167979, 0.0002099737532808399,
      266.750656167979,
    ],
    defaultCenter: [0, 0],
    defaultZoom: 1,
  },
  sh_arrakeen: {
    id: "sh_arrakeen",
    title: "Arrakeen",
    description: "The ancient capital city and seat of regional trade.",
    cdnTileHash: "sh_arrakeen-6f4b617ae1c10fa1925b5761c828395d",
    minNativeZoom: 0,
    maxNativeZoom: 4,
    minZoom: -2,
    maxZoom: 6,
    tileSize: 512,
    bounds: [
      [-14949, -31649],
      [37449, 20749],
    ],
    transformation: [
      0.009770992366412214, 309.2519083969466, 0.009770992366412214,
      146.0763358778626,
    ],
    defaultCenter: [11250, -5450],
    defaultZoom: 1,
  },
  sh_harkovillage: {
    id: "sh_harkovillage",
    title: "Harko Village",
    description: "Fortified outpost stronghold under House Harkonnen oversight.",
    cdnTileHash: "sh_harkovillage-ac277d707305f7985f0664324dc32322",
    minNativeZoom: 0,
    maxNativeZoom: 3,
    minZoom: -2,
    maxZoom: 6,
    tileSize: 512,
    bounds: [
      [-22599, -27199],
      [73399, 68799],
    ],
    transformation: [
      0.005333333333333333, 145.06666666666666, 0.005333333333333333,
      120.53333333333333,
    ],
    defaultCenter: [25400, 20800],
    defaultZoom: 1,
  },
  cb_overland_m_01: {
    id: "cb_overland_m_01",
    title: "Wreck of the Tyche",
    description: "High-value crashed starship salvage zone.",
    cdnTileHash: "cb_overland_m_01-02d119041f528e8884cdc20c4465b2f1",
    minNativeZoom: 0,
    maxNativeZoom: 4,
    minZoom: -2,
    maxZoom: 6,
    tileSize: 512,
    bounds: [
      [-25249, -25249],
      [25249, 25249],
    ],
    transformation: [0.010138613861386139, 256, 0.010138613861386139, 256],
    defaultCenter: [0, 0],
    defaultZoom: 1,
  },
  cb_overland_s_04: {
    id: "cb_overland_s_04",
    title: "Blushing Cavern",
    description: "Subterranean cavern network and smuggler refuge.",
    cdnTileHash: "cb_overland_s_04-e6cf92f8f1f0d00937b881036a6594a4",
    minNativeZoom: 0,
    maxNativeZoom: 4,
    minZoom: -2,
    maxZoom: 6,
    tileSize: 512,
    bounds: [
      [-25249, -25249],
      [25249, 25249],
    ],
    transformation: [0.010138613861386139, 256, 0.010138613861386139, 256],
    defaultCenter: [0, 0],
    defaultZoom: 1,
  },
};

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", app: "dune-awakening-map", uptime: process.uptime() });
});

// API: Get all maps
app.get("/api/maps", (req, res) => {
  res.json(Object.values(MAPS));
});

// Helper: Read custom markers
function readCustomMarkers() {
  try {
    const raw = fs.readFileSync(CUSTOM_MARKERS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Helper: Read default markers
function readDefaultMarkers(mapId) {
  const defaultFile = path.join(DATA_DIR, "default-markers.json");
  if (!fs.existsSync(defaultFile)) {
    try {
      fs.writeFileSync(defaultFile, JSON.stringify(DEFAULT_MARKERS, null, 2), "utf8");
    } catch (e) {
      console.error("Could not write default-markers.json:", e.message);
    }
    return DEFAULT_MARKERS.filter((m) => m.mapId === mapId);
  }
  try {
    const raw = fs.readFileSync(defaultFile, "utf8");
    const all = JSON.parse(raw);
    if (!Array.isArray(all) || all.length === 0) {
      return DEFAULT_MARKERS.filter((m) => m.mapId === mapId);
    }
    return all.filter((m) => m.mapId === mapId);
  } catch {
    return DEFAULT_MARKERS.filter((m) => m.mapId === mapId);
  }
}

// API: Get taxonomy (categories and resource types with counts)
app.get("/api/taxonomy/:mapId", async (req, res) => {
  const { mapId } = req.params;
  try {
    const mapData = await getMapData(mapId);
    if (mapData) {
      return res.json({ categories: mapData.categories, types: mapData.types });
    }
  } catch (err) {
    console.error(`Error loading taxonomy for ${mapId}:`, err.message);
  }
  res.json({ categories: [], types: {} });
});

// API: Get markers for a map (supports type filtering or default POIs)
app.get("/api/markers/:mapId", async (req, res) => {
  const { mapId } = req.params;
  const hasTypesParam = "types" in req.query;
  const requestedTypes = hasTypesParam
    ? req.query.types.split(",").map((s) => s.trim()).filter(Boolean)
    : null;
  const custom = readCustomMarkers().filter((m) => m.mapId === mapId);

  try {
    const mapData = await getMapData(mapId);
    if (mapData && mapData.markers && mapData.markers.length > 0) {
      let markers = [];
      if (hasTypesParam) {
        if (requestedTypes.length > 0) {
          const typeSet = new Set(requestedTypes);
          markers = mapData.markers.filter((m) => typeSet.has(m.type));
        } else {
          // User explicitly deselected all types
          markers = [];
        }
      } else {
        // Initial load without filter param -> only defaultOn markers
        markers = mapData.markers.filter((m) => m.defaultOn);
      }

      const includeCustom = !hasTypesParam || requestedTypes.includes("custom_pins") || requestedTypes.length > 0;
      return res.json([...markers, ...(includeCustom ? custom : [])]);
    }
  } catch (err) {
    console.error(`Error loading rich map nodes for ${mapId}:`, err.message);
  }

  // Fallback to static defaults
  if (hasTypesParam && requestedTypes.length === 0) {
    return res.json([]);
  }
  const defaults = readDefaultMarkers(mapId);
  res.json([...defaults, ...custom]);
});

// API: Add a custom marker
app.post("/api/markers", (req, res) => {
  const { mapId, title, description, category, x, y } = req.body;
  if (!mapId || !title || x === undefined || y === undefined) {
    return res.status(400).json({ error: "Missing required marker fields (mapId, title, x, y)" });
  }

  const newMarker = {
    id: "custom_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    mapId,
    title: String(title).trim(),
    description: description ? String(description).trim() : "",
    category: category || "Custom Pins",
    x: Number(x),
    y: Number(y),
    createdAt: new Date().toISOString(),
    isCustom: true,
  };

  const markers = readCustomMarkers();
  markers.push(newMarker);
  fs.writeFileSync(CUSTOM_MARKERS_FILE, JSON.stringify(markers, null, 2), "utf8");

  res.status(201).json(newMarker);
});

// API: Delete a custom marker
app.delete("/api/markers/:id", (req, res) => {
  const { id } = req.params;
  let markers = readCustomMarkers();
  const initialLength = markers.length;
  markers = markers.filter((m) => m.id !== id);

  if (markers.length === initialLength) {
    return res.status(404).json({ error: "Marker not found or is a system default" });
  }

  fs.writeFileSync(CUSTOM_MARKERS_FILE, JSON.stringify(markers, null, 2), "utf8");
  res.json({ success: true, id });
});

// API: Tile proxy with automatic local caching
app.get("/api/tiles/:mapId/:z/:y/:x.webp", async (req, res) => {
  const { mapId, z, y, x } = req.params;
  const mapConfig = MAPS[mapId];

  if (!mapConfig) {
    return res.status(404).send("Map not found");
  }

  const localTilePath = path.join(TILES_DIR, mapId, z, y, `${x}.webp`);

  // 1. If tile exists locally on disk, serve it immediately
  if (fs.existsSync(localTilePath)) {
    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return fs.createReadStream(localTilePath).pipe(res);
  }

  // 2. If running offline mode and tile doesn't exist, return 404
  if (OFFLINE_MODE) {
    return res.status(404).send("Tile not cached locally and OFFLINE_MODE is enabled");
  }

  // 3. Otherwise fetch from upstream CDN and cache to disk
  const remoteUrl = `https://cdn.th.gl/dune-awakening/map-tiles/${mapConfig.cdnTileHash}/${z}/${y}/${x}.webp`;

  try {
    const upstreamRes = await fetch(remoteUrl);
    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send("Upstream tile not found");
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to disk asynchronously
    fs.mkdir(path.dirname(localTilePath), { recursive: true }, (err) => {
      if (!err) {
        fs.writeFile(localTilePath, buffer, () => {});
      }
    });

    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(buffer);
  } catch (err) {
    console.error(`Error caching tile ${remoteUrl}:`, err.message);
    res.status(502).send("Error fetching upstream tile");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Dune: Awakening Map] Running at http://0.0.0.0:${PORT}`);
  console.log(`[Dune: Awakening Map] Tile Caching Directory: ${TILES_DIR}`);
  console.log(`[Dune: Awakening Map] Data Directory: ${DATA_DIR}`);
});
