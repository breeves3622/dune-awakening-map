// Category colors and icons
const CATEGORY_META = {
  "Spice Blows": { color: "#f59e0b", icon: "✦" },
  "Bunkers & Labs": { color: "#3b82f6", icon: "⚲" },
  "Crashed Ships": { color: "#ef4444", icon: "▲" },
  "Water & Extraction": { color: "#06b6d4", icon: "💧" },
  "Caves & POIs": { color: "#10b981", icon: "⛰" },
  "Vendors & Trainers": { color: "#8b5cf6", icon: "⚔" },
  "Fast Travel & Landmarks": { color: "#ec4899", icon: "◉" },
  "Custom Pins": { color: "#eab308", icon: "★" },
};

class DuneMapApp {
  constructor() {
    this.maps = [];
    this.currentMapConfig = null;
    this.leafletMap = null;
    this.tileLayer = null;
    this.markerLayerGroup = null;
    this.markersData = [];
    this.activeCategories = new Set(Object.keys(CATEGORY_META));
    this.searchQuery = "";
    this.discoveredIds = new Set(
      JSON.parse(localStorage.getItem("dune_discovered_markers") || "[]")
    );

    this.initElements();
    this.bindEvents();
    this.loadMaps();
  }

  initElements() {
    this.sidebar = document.getElementById("sidebar");
    this.sidebarOverlay = document.getElementById("sidebar-overlay");
    this.sidebarToggle = document.getElementById("sidebar-toggle");

    this.mapSelect = document.getElementById("map-select");
    this.searchInput = document.getElementById("search-input");
    this.clearSearchBtn = document.getElementById("clear-search");
    this.categoriesList = document.getElementById("categories-list");
    this.selectAllBtn = document.getElementById("select-all-btn");
    this.deselectAllBtn = document.getElementById("deselect-all-btn");

    this.cursorCoords = document.getElementById("cursor-coords");
    this.mobileCoordsChip = document.getElementById("mobile-coords-chip");
    this.mobileCurrentMap = document.getElementById("mobile-current-map");

    this.gotoX = document.getElementById("goto-x");
    this.gotoY = document.getElementById("goto-y");
    this.gotoBtn = document.getElementById("goto-btn");

    this.discoveryPercent = document.getElementById("discovery-percent");
    this.discoveryProgressFill = document.getElementById("discovery-progress-fill");
    this.discoveryCount = document.getElementById("discovery-count");
    this.resetDiscoveriesBtn = document.getElementById("reset-discoveries-btn");

    this.addPinBtn = document.getElementById("add-pin-btn");
    this.markerModal = document.getElementById("marker-modal");
    this.closeModalBtn = document.getElementById("close-modal-btn");
    this.cancelModalBtn = document.getElementById("cancel-modal-btn");
    this.markerForm = document.getElementById("marker-form");
    this.modalTitle = document.getElementById("modal-title");
    this.modalCategory = document.getElementById("modal-category");
    this.modalX = document.getElementById("modal-x");
    this.modalY = document.getElementById("modal-y");
    this.modalDesc = document.getElementById("modal-desc");

    // Mobile nav buttons
    this.mobBtnRegions = document.getElementById("mob-btn-regions");
    this.mobBtnFilters = document.getElementById("mob-btn-filters");
    this.mobBtnSearch = document.getElementById("mob-btn-search");
    this.mobBtnAdd = document.getElementById("mob-btn-add");
  }

  bindEvents() {
    this.mapSelect.addEventListener("change", (e) => this.switchMap(e.target.value));

    this.searchInput.addEventListener("input", (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.clearSearchBtn.style.display = this.searchQuery ? "block" : "none";
      this.renderMarkers();
    });

    this.clearSearchBtn.addEventListener("click", () => {
      this.searchInput.value = "";
      this.searchQuery = "";
      this.clearSearchBtn.style.display = "none";
      this.renderMarkers();
    });

    this.selectAllBtn.addEventListener("click", () => {
      Object.keys(CATEGORY_META).forEach((c) => this.activeCategories.add(c));
      this.renderCategories();
      this.renderMarkers();
    });

    this.deselectAllBtn.addEventListener("click", () => {
      this.activeCategories.clear();
      this.renderCategories();
      this.renderMarkers();
    });

    this.resetDiscoveriesBtn.addEventListener("click", () => {
      if (confirm("Reset all marked discoveries for this map?")) {
        this.discoveredIds.clear();
        this.saveDiscoveries();
        this.renderMarkers();
      }
    });

    this.gotoBtn.addEventListener("click", () => {
      const x = parseFloat(this.gotoX.value);
      const y = parseFloat(this.gotoY.value);
      if (!isNaN(x) && !isNaN(y) && this.leafletMap) {
        this.leafletMap.setView([y, x], Math.max(this.leafletMap.getZoom(), 2));
      }
    });

    // Custom Pin Modal
    this.addPinBtn.addEventListener("click", () => {
      const center = this.leafletMap ? this.leafletMap.getCenter() : { lat: 0, lng: 0 };
      this.openModal(Math.round(center.lng), Math.round(center.lat));
    });

    this.closeModalBtn.addEventListener("click", () => this.closeModal());
    this.cancelModalBtn.addEventListener("click", () => this.closeModal());

    this.markerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveCustomPin();
    });

    // Sidebar controls & Drawer for mobile
    this.sidebarToggle.addEventListener("click", () => this.closeSidebar());
    this.sidebarOverlay.addEventListener("click", () => this.closeSidebar());

    // Mobile nav actions
    this.mobBtnRegions?.addEventListener("click", () => {
      this.openSidebar();
      this.mapSelect.focus();
    });

    this.mobBtnFilters?.addEventListener("click", () => {
      this.openSidebar();
      this.categoriesList.scrollIntoView({ behavior: "smooth" });
    });

    this.mobBtnSearch?.addEventListener("click", () => {
      this.openSidebar();
      this.searchInput.focus();
    });

    this.mobBtnAdd?.addEventListener("click", () => {
      const center = this.leafletMap ? this.leafletMap.getCenter() : { lat: 0, lng: 0 };
      this.openModal(Math.round(center.lng), Math.round(center.lat));
    });
  }

  openSidebar() {
    this.sidebar.classList.add("open");
    this.sidebarOverlay.classList.add("active");
  }

  closeSidebar() {
    this.sidebar.classList.remove("open");
    this.sidebarOverlay.classList.remove("active");
  }

  async loadMaps() {
    try {
      const res = await fetch("/api/maps");
      this.maps = await res.json();

      this.mapSelect.innerHTML = this.maps
        .map((m) => `<option value="${m.id}">${m.title}</option>`)
        .join("");

      if (this.maps.length > 0) {
        this.switchMap(this.maps[0].id);
      }
    } catch (err) {
      console.error("Failed to load maps:", err);
    }
  }

  switchMap(mapId) {
    const config = this.maps.find((m) => m.id === mapId);
    if (!config) return;
    this.currentMapConfig = config;

    if (this.mobileCurrentMap) {
      this.mobileCurrentMap.textContent = config.title;
    }

    if (this.leafletMap) {
      this.leafletMap.remove();
      this.leafletMap = null;
    }

    const t = config.transformation;
    const crs = L.extend({}, L.CRS.Simple, {
      transformation: new L.Transformation(t[0], t[1], t[2], t[3]),
    });

    this.leafletMap = L.map("map", {
      crs: crs,
      minZoom: config.minZoom || -2,
      maxZoom: config.maxZoom || 6,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      attributionControl: false,
    });

    // Use local tile caching endpoint
    const tileUrl = `/api/tiles/${config.id}/{z}/{y}/{x}.webp`;

    this.tileLayer = L.tileLayer(tileUrl, {
      minNativeZoom: config.minNativeZoom,
      maxNativeZoom: config.maxNativeZoom,
      bounds: config.bounds,
      tileSize: config.tileSize,
      noWrap: true,
    }).addTo(this.leafletMap);

    // Create fresh marker layer group for this map instance
    this.markerLayerGroup = L.layerGroup().addTo(this.leafletMap);
    this.leafletMap.fitBounds(config.bounds);

    // Update coordinates display on move / touch
    const updateCoords = (e) => {
      const x = Math.round(e.latlng.lng);
      const y = Math.round(e.latlng.lat);
      const str = `X: ${x.toLocaleString()} | Y: ${y.toLocaleString()}`;
      if (this.cursorCoords) this.cursorCoords.textContent = str;
      if (this.mobileCoordsChip) this.mobileCoordsChip.textContent = str;
    };

    this.leafletMap.on("mousemove", updateCoords);
    this.leafletMap.on("click", updateCoords);

    // Right-click or long-press to place pin
    this.leafletMap.on("contextmenu", (e) => {
      this.openModal(Math.round(e.latlng.lng), Math.round(e.latlng.lat));
    });

    this.loadMarkers(mapId);
  }

  async loadMarkers(mapId) {
    try {
      const res = await fetch(`/api/markers/${mapId}`);
      this.markersData = await res.json();

      // Ensure any category found in markers is known
      this.markersData.forEach((m) => {
        const cat = m.category || "Custom Pins";
        if (!CATEGORY_META[cat]) {
          CATEGORY_META[cat] = { color: "#a855f7", icon: "•" };
        }
        this.activeCategories.add(cat);
      });

      this.renderCategories();
      this.renderMarkers();
    } catch (err) {
      console.error("Error loading markers:", err);
    }
  }

  renderCategories() {
    const counts = {};
    Object.keys(CATEGORY_META).forEach((c) => (counts[c] = 0));

    this.markersData.forEach((m) => {
      const cat = m.category || "Custom Pins";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    this.categoriesList.innerHTML = Object.entries(CATEGORY_META)
      .map(([cat, meta]) => {
        const count = counts[cat] || 0;
        const isActive = this.activeCategories.has(cat);
        return `
          <div class="category-item ${isActive ? "" : "disabled"}" data-category="${cat}">
            <div class="category-left">
              <span class="category-dot" style="background-color: ${meta.color}"></span>
              <span class="category-name">${cat}</span>
            </div>
            <span class="category-count">${count}</span>
          </div>
        `;
      })
      .join("");

    this.categoriesList.querySelectorAll(".category-item").forEach((el) => {
      el.addEventListener("click", () => {
        const cat = el.dataset.category;
        if (this.activeCategories.has(cat)) {
          this.activeCategories.delete(cat);
        } else {
          this.activeCategories.add(cat);
        }
        this.renderCategories();
        this.renderMarkers();
      });
    });
  }

  renderMarkers() {
    if (!this.markerLayerGroup || !this.leafletMap) return;
    this.markerLayerGroup.clearLayers();

    let totalVisible = 0;
    let totalDiscovered = 0;

    const filtered = this.markersData.filter((m) => {
      const cat = m.category || "Custom Pins";
      if (!this.activeCategories.has(cat)) return false;

      if (this.searchQuery) {
        const titleMatch = (m.title || "").toLowerCase().includes(this.searchQuery);
        const descMatch = (m.description || "").toLowerCase().includes(this.searchQuery);
        const catMatch = cat.toLowerCase().includes(this.searchQuery);
        if (!titleMatch && !descMatch && !catMatch) return false;
      }
      return true;
    });

    filtered.forEach((item) => {
      totalVisible++;
      const isDiscovered = this.discoveredIds.has(item.id);
      if (isDiscovered) totalDiscovered++;

      const meta = CATEGORY_META[item.category] || CATEGORY_META["Custom Pins"];
      const iconHtml = `
        <div class="dune-pin ${isDiscovered ? "discovered" : ""}" style="border-color: ${meta.color}; box-shadow: 0 0 8px ${meta.color}88">
          <span style="color: ${meta.color}">${meta.icon}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-leaflet-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      // item.y = Latitude, item.x = Longitude in Leaflet Flat CRS
      const marker = L.marker([Number(item.y), Number(item.x)], { icon: customIcon });

      const popupContent = `
        <div class="popup-container">
          <div class="popup-cat" style="color: ${meta.color}">${item.category}</div>
          <div class="popup-title">${item.title}</div>
          ${item.description ? `<div class="popup-desc">${item.description}</div>` : ""}
          <div class="popup-coords">Coordinates: X: ${Math.round(item.x).toLocaleString()}, Y: ${Math.round(item.y).toLocaleString()}</div>
          <div class="popup-actions">
            <button class="btn-discover ${isDiscovered ? "active" : ""}" onclick="window.duneApp.toggleDiscovered('${item.id}')">
              ${isDiscovered ? "✓ Discovered" : "Mark Discovered"}
            </button>
            ${item.isCustom ? `<button class="btn-delete" onclick="window.duneApp.deleteCustomPin('${item.id}')">Delete</button>` : ""}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });
      this.markerLayerGroup.addLayer(marker);
    });

    // Update Progress Bar
    const percent = totalVisible > 0 ? Math.round((totalDiscovered / totalVisible) * 100) : 0;
    this.discoveryPercent.textContent = `${percent}%`;
    this.discoveryProgressFill.style.width = `${percent}%`;
    this.discoveryCount.textContent = `${totalDiscovered} / ${totalVisible} Discovered`;
  }

  toggleDiscovered(id) {
    if (this.discoveredIds.has(id)) {
      this.discoveredIds.delete(id);
    } else {
      this.discoveredIds.add(id);
    }
    this.saveDiscoveries();
    this.renderMarkers();
  }

  saveDiscoveries() {
    localStorage.setItem("dune_discovered_markers", JSON.stringify([...this.discoveredIds]));
  }

  openModal(x, y) {
    this.modalX.value = x;
    this.modalY.value = y;
    this.modalTitle.value = "";
    this.modalDesc.value = "";
    this.markerModal.style.display = "flex";
    this.modalTitle.focus();
  }

  closeModal() {
    this.markerModal.style.display = "none";
  }

  async saveCustomPin() {
    const newMarker = {
      mapId: this.currentMapConfig.id,
      title: this.modalTitle.value,
      category: this.modalCategory.value,
      x: parseFloat(this.modalX.value),
      y: parseFloat(this.modalY.value),
      description: this.modalDesc.value,
    };

    try {
      const res = await fetch("/api/markers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMarker),
      });

      if (res.ok) {
        this.closeModal();
        await this.loadMarkers(this.currentMapConfig.id);
      }
    } catch (err) {
      alert("Failed to save marker: " + err.message);
    }
  }

  async deleteCustomPin(id) {
    if (!confirm("Are you sure you want to delete this custom marker?")) return;
    try {
      const res = await fetch(`/api/markers/${id}`, { method: "DELETE" });
      if (res.ok) {
        this.discoveredIds.delete(id);
        this.saveDiscoveries();
        await this.loadMarkers(this.currentMapConfig.id);
      }
    } catch (err) {
      alert("Failed to delete marker: " + err.message);
    }
  }
}

// Instantiate and expose globally for popup click handlers
window.addEventListener("DOMContentLoaded", () => {
  window.duneApp = new DuneMapApp();
});
