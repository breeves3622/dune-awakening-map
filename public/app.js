class DuneMapApp {
  constructor() {
    this.maps = [];
    this.currentMapConfig = null;
    this.leafletMap = null;
    this.tileLayer = null;
    this.markerLayerGroup = null;
    this.markersData = [];
    this.taxonomy = null;
    this.activeTypes = new Set();
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
      if (!this.taxonomy || !this.taxonomy.types) return;
      Object.keys(this.taxonomy.types).forEach((t) => this.activeTypes.add(t));
      this.renderTaxonomy();
      this.loadMarkers();
    });

    this.deselectAllBtn.addEventListener("click", () => {
      this.activeTypes.clear();
      this.renderTaxonomy();
      this.loadMarkers();
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

  async switchMap(mapId) {
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
      preferCanvas: true,
      attributionControl: false,
    });

    const tileUrl = `/api/tiles/${config.id}/{z}/{y}/{x}.webp`;

    this.tileLayer = L.tileLayer(tileUrl, {
      minNativeZoom: config.minNativeZoom,
      maxNativeZoom: config.maxNativeZoom,
      bounds: config.bounds,
      tileSize: config.tileSize,
      noWrap: true,
    }).addTo(this.leafletMap);

    this.markerLayerGroup = L.layerGroup().addTo(this.leafletMap);
    this.leafletMap.fitBounds(config.bounds);

    const updateCoords = (e) => {
      const x = Math.round(e.latlng.lng);
      const y = Math.round(e.latlng.lat);
      const str = `X: ${x.toLocaleString()} | Y: ${y.toLocaleString()}`;
      if (this.cursorCoords) this.cursorCoords.textContent = str;
      if (this.mobileCoordsChip) this.mobileCoordsChip.textContent = str;
    };

    this.leafletMap.on("mousemove", updateCoords);
    this.leafletMap.on("click", updateCoords);

    this.leafletMap.on("contextmenu", (e) => {
      this.openModal(Math.round(e.latlng.lng), Math.round(e.latlng.lat));
    });

    // Load rich taxonomy categories and then markers
    await this.loadTaxonomy(mapId);
    await this.loadMarkers();
  }

  async loadTaxonomy(mapId) {
    try {
      const res = await fetch(`/api/taxonomy/${mapId}`);
      this.taxonomy = await res.json();

      // Set initial active types from defaultOn
      this.activeTypes.clear();
      if (this.taxonomy && this.taxonomy.types) {
        Object.entries(this.taxonomy.types).forEach(([key, val]) => {
          if (val.defaultOn) this.activeTypes.add(key);
        });
      }

      this.renderTaxonomy();
    } catch (err) {
      console.error("Error loading taxonomy:", err);
    }
  }

  renderTaxonomy() {
    if (!this.taxonomy || !this.taxonomy.categories) {
      this.categoriesList.innerHTML = `<div style="padding:10px; color:#999; font-size:12px;">Loading categories...</div>`;
      return;
    }

    this.categoriesList.innerHTML = this.taxonomy.categories
      .map((cat, catIdx) => {
        const typesHtml = cat.types
          .map((t) => {
            const isChecked = this.activeTypes.has(t.type);
            return `
              <label class="resource-row ${isChecked ? "active" : ""}" data-type="${t.type}">
                <div class="resource-left">
                  <input type="checkbox" class="type-checkbox" data-type="${t.type}" ${isChecked ? "checked" : ""} />
                  <span class="resource-icon" style="color:${t.color}">${t.icon}</span>
                  <span class="resource-label">${t.label}</span>
                </div>
                <span class="resource-count">${t.count.toLocaleString()}</span>
              </label>
            `;
          })
          .join("");

        const catActiveCount = cat.types.filter((t) => this.activeTypes.has(t.type)).length;
        const isPartiallyOrFullyActive = catActiveCount > 0;

        return `
          <div class="category-group" data-cat-idx="${catIdx}">
            <div class="category-group-header">
              <span class="group-title">${cat.name}</span>
              <div class="group-header-right">
                <span class="group-count">${cat.totalCount.toLocaleString()}</span>
                <span class="group-toggle-arrow">▾</span>
              </div>
            </div>
            <div class="category-group-body">
              ${typesHtml}
            </div>
          </div>
        `;
      })
      .join("");

    // Toggle accordions on header click
    this.categoriesList.querySelectorAll(".category-group-header").forEach((header) => {
      header.addEventListener("click", () => {
        const group = header.closest(".category-group");
        group.classList.toggle("collapsed");
      });
    });

    // Checkbox changes
    this.categoriesList.querySelectorAll(".type-checkbox").forEach((cb) => {
      cb.addEventListener("change", (e) => {
        const type = e.target.dataset.type;
        if (e.target.checked) {
          this.activeTypes.add(type);
        } else {
          this.activeTypes.delete(type);
        }
        const row = cb.closest(".resource-row");
        if (row) row.classList.toggle("active", e.target.checked);
        this.loadMarkers();
      });
    });
  }

  async loadMarkers() {
    if (!this.currentMapConfig) return;
    try {
      const typeList = Array.from(this.activeTypes).join(",");
      const url = `/api/markers/${this.currentMapConfig.id}${typeList ? `?types=${typeList}` : ""}`;
      const res = await fetch(url);
      this.markersData = await res.json();
      this.renderMarkers();
    } catch (err) {
      console.error("Error loading markers:", err);
    }
  }

  renderMarkers() {
    if (!this.markerLayerGroup || !this.leafletMap) return;
    this.markerLayerGroup.clearLayers();

    let totalVisible = 0;
    let totalDiscovered = 0;

    const filtered = this.markersData.filter((m) => {
      if (this.searchQuery) {
        const titleMatch = (m.title || "").toLowerCase().includes(this.searchQuery);
        const descMatch = (m.description || "").toLowerCase().includes(this.searchQuery);
        const catMatch = (m.category || "").toLowerCase().includes(this.searchQuery);
        if (!titleMatch && !descMatch && !catMatch) return false;
      }
      return true;
    });

    filtered.forEach((item) => {
      totalVisible++;
      const isDiscovered = this.discoveredIds.has(item.id);
      if (isDiscovered) totalDiscovered++;

      const color = item.color || "#f59e0b";
      const iconChar = item.icon || "✦";

      const iconHtml = `
        <div class="dune-pin ${isDiscovered ? "discovered" : ""}" style="border-color: ${color}; box-shadow: 0 0 8px ${color}88">
          <span style="color: ${color}">${iconChar}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-leaflet-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([Number(item.y), Number(item.x)], { icon: customIcon });

      const popupContent = `
        <div class="popup-container">
          <div class="popup-cat" style="color: ${color}">${item.category || "General"}</div>
          <div class="popup-title">${item.title}</div>
          ${item.description ? `<div class="popup-desc">${item.description}</div>` : ""}
          <div class="popup-coords">Coordinates: X: ${Math.round(item.x).toLocaleString()}, Y: ${Math.round(item.y).toLocaleString()}${item.z ? ` | Z: ${Math.round(item.z)}` : ""}</div>
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
    this.discoveryCount.textContent = `${totalDiscovered} / ${totalVisible.toLocaleString()} Discovered`;
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
        await this.loadMarkers();
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
        await this.loadMarkers();
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
