# Dune: Awakening — Self-Hosted Interactive Map

A full-featured, self-hostable interactive companion map application for **Dune: Awakening**, designed to deliver the rich interactive experience of TH.GL in a lightweight, independent Docker container.

![Arrakis Map](https://img.shields.io/badge/Dune-Awakening-orange?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

---

## 🌟 Features

- **🗺️ Complete Regional Map Support:**
  - **Hagga Basin** (`survival_1`)
  - **The Deep Desert** (`deepdesert_1`)
  - **Arrakeen** (`sh_arrakeen`)
  - **Harko Village** (`sh_harkovillage`)
  - **Wreck of the Tyche** (`cb_overland_m_01`)
  - **Blushing Cavern** (`cb_overland_s_04`)
- **📡 Automatic Tile Caching (Offline Capable):**
  - Tiles are automatically fetched, optimized, and cached to your local `./tiles` volume as you browse.
  - Set `OFFLINE_MODE=true` to run 100% locally with zero internet access once tiles are cached.
- **📍 Rich Marker Categories & Live Filters:**
  - Spice Blows, Bunkers & Labs, Crashed Ships, Water & Extraction, Caves & POIs, Vendors & Trainers, Fast Travel & Landmarks.
  - Live search by title, description, or category.
  - Toggle individual categories or use Select All / None.
- **📌 Interactive Custom Pins:**
  - Right-click anywhere on the map or click **Add Custom Marker** to drop pins.
  - Custom pins are stored in `./data/custom-markers.json` and persist across container restarts.
- **🧭 In-Game Unreal Coordinates HUD:**
  - Displays real-time game coordinates ($X, Y$) matching in-game position format.
  - Includes a "Go To Coordinates" navigator to jump directly to any $(X, Y)$ location.
- **✅ Discovery Progress Tracker:**
  - Mark locations as discovered with progress tracking (stored in browser local storage).
  - Reset or track your exploration across each sector.

---

## 🚀 Quick Start (Docker Compose)

### 1. Clone the repository
```bash
git clone https://github.com/breeves3622/dune-awakening-map.git
cd dune-awakening-map
```

### 2. Start the stack
```bash
docker compose up -d
```

### 3. Open in your browser
Navigate to:
```text
http://localhost:8095
```
*(or `http://<your-server-ip>:8095`)*

---

## 📦 Portainer Stack Deployment

You can deploy this application directly as a Portainer Stack:

1. In Portainer, go to **Stacks** ➔ **Add stack**.
2. Name the stack: `dune-awakening-map`.
3. Choose **Repository** or paste the Compose YAML directly into the **Web editor**:

```yaml
services:
  dune-map:
    image: node:20-alpine
    container_name: dune-awakening-map
    restart: unless-stopped
    ports:
      - "8095:8080"
    volumes:
      - dune_map_data:/app/data
      - dune_map_tiles:/app/tiles
    working_dir: /app
    environment:
      - PORT=8080
      - NODE_ENV=production
      - OFFLINE_MODE=false
    command: >
      sh -c "apk add --no-cache git &&
             rm -rf /tmp/dune-repo &&
             git clone https://github.com/breeves3622/dune-awakening-map.git /tmp/dune-repo &&
             cp -r /tmp/dune-repo/* /app/ &&
             npm install --omit=dev &&
             node server.js"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

volumes:
  dune_map_data:
  dune_map_tiles:
```

4. Click **Deploy the stack**.

---

## ⚙️ Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `8080` | Port the internal HTTP server listens on inside the container |
| `MAP_PORT` | `8095` | Host port mapped via `docker-compose.yml` (change if 8095 is in use) |
| `OFFLINE_MODE` | `false` | When `true`, only serves locally cached tiles and never reaches out to upstream CDNs |
| `NODE_ENV` | `production` | Node.js environment mode |

---

## 📂 Persistent Storage

| Host Path | Container Path | Purpose |
| :--- | :--- | :--- |
| `./data` | `/app/data` | Stores custom markers (`custom-markers.json`) and defaults |
| `./tiles` | `/app/tiles` | Stores downloaded webp map tiles for offline caching |

---

## 🛠️ Local Development (Without Docker)

Prerequisites: Node.js 18+

```bash
npm install
npm run dev
```

Visit `http://localhost:8080`.

---

## 📜 License

MIT License. Map tile data and game trademarks belong to Funcom / The Hidden Gaming Lair.
