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
    this.syncDiscoveries();
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
    this.exportPinsBtn = document.getElementById("export-pins-btn");
    this.importPinsInput = document.getElementById("import-pins-input");

    this.markerModal = document.getElementById("marker-modal");
    this.modalHeading = document.getElementById("modal-heading");
    this.modalPinId = document.getElementById("modal-pin-id");
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
      this.markersData = [];
      this.renderMarkers();
    });

    this.resetDiscoveriesBtn.addEventListener("click", () => {
      if (confirm("Reset all marked discoveries for this map across your devices?")) {
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

    // Export & Import Pin Backups
    this.exportPinsBtn?.addEventListener("click", () => {
      window.location.href = "/api/pins/export";
    });

    this.importPinsInput?.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const res = await fetch("/api/pins/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });
        const result = await res.json();
        if (result.success) {
          alert(`Successfully imported ${result.imported} custom pins!`);
          this.activeTypes.add("custom_pins");
          await this.loadMarkers();
        } else {
          alert("Import failed: " + (result.error || "Unknown error"));
        }
      } catch (err) {
        alert("Invalid backup file: " + err.message);
      } finally {
        e.target.value = "";
      }
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

  async syncDiscoveries() {
    try {
      const local = JSON.parse(localStorage.getItem("dune_discovered_markers") || "[]");
      const res = await fetch("/api/discoveries");
      if (res.ok) {
        const remote = await res.json();
        const merged = Array.from(new Set([...local, ...remote]));
        this.discoveredIds = new Set(merged);
        localStorage.setItem("dune_discovered_markers", JSON.stringify(merged));
        if (merged.length > remote.length) {
          fetch("/api/discoveries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: merged }),
          }).catch(() => {});
        }
        this.renderMarkers();
      }
    } catch (e) {
      console.warn("Could not sync discoveries:", e);
    }
  }

  saveDiscoveries() {
    const ids = [...this.discoveredIds];
    localStorage.setItem("dune_discovered_markers", JSON.stringify(ids));
    fetch("/api/discoveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }).catch(() => {});
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

    await this.loadTaxonomy(mapId);
    await this.loadMarkers();
  }

  async loadTaxonomy(mapId) {
    try {
      const res = await fetch(`/api/taxonomy/${mapId}`);
      this.taxonomy = await res.json();

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
                <span class="resource-count">${t.count ? t.count.toLocaleString() : "•"}</span>
              </label>
            `;
          })
          .join("");

        const allCatActive = cat.types.every((t) => this.activeTypes.has(t.type));
        const someCatActive = cat.types.some((t) => this.activeTypes.has(t.type));
        const isCollapsed = !someCatActive;

        return `
          <div class="category-group ${isCollapsed ? "collapsed" : ""}" data-cat-idx="${catIdx}">
            <div class="category-group-header">
              <span class="group-title">${cat.name}</span>
              <div class="group-header-right">
                <button type="button" class="group-toggle-btn ${someCatActive ? "active" : ""}" data-cat-idx="${catIdx}">
                  ${allCatActive ? "None" : "All"}
                </button>
                <span class="group-count">${cat.totalCount ? cat.totalCount.toLocaleString() : ""}</span>
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

    // Toggle accordions on header click (excluding toggle button)
    this.categoriesList.querySelectorAll(".category-group-header").forEach((header) => {
      header.addEventListener("click", (e) => {
        if (e.target.closest(".group-toggle-btn")) return;
        const group = header.closest(".category-group");
        group.classList.toggle("collapsed");
      });
    });

    // Group toggle buttons (All / None for a specific group)
    this.categoriesList.querySelectorAll(".group-toggle-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const catIdx = parseInt(btn.dataset.catIdx, 10);
        const cat = this.taxonomy.categories[catIdx];
        if (!cat) return;

        const allActive = cat.types.every((t) => this.activeTypes.has(t.type));
        cat.types.forEach((t) => {
          if (allActive) {
            this.activeTypes.delete(t.type);
          } else {
            this.activeTypes.add(t.type);
          }
        });

        this.renderTaxonomy();
        this.loadMarkers();
      });
    });

    // Individual checkbox changes
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

    if (this.activeTypes.size === 0) {
      this.markersData = [];
      this.renderMarkers();
      return;
    }

    try {
      const typeList = Array.from(this.activeTypes).join(",");
      const url = `/api/markers/${this.currentMapConfig.id}?types=${encodeURIComponent(typeList)}`;
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

    if (this.activeTypes.size === 0 && (!this.markersData || this.markersData.filter(m => m.isCustom).length === 0)) {
      this.discoveryPercent.textContent = "0%";
      this.discoveryProgressFill.style.width = "0%";
      this.discoveryCount.textContent = "0 / 0 Discovered";
      return;
    }

    let totalVisible = 0;
    let totalDiscovered = 0;

    const filtered = this.markersData.filter((m) => {
      if (m.type && !this.activeTypes.has(m.type) && !m.isCustom) {
        return false;
      }

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
            ${item.isCustom ? `
              <button class="btn-edit" onclick="window.duneApp.editCustomPin('${item.id}')">Edit</button>
              <button class="btn-delete" onclick="window.duneApp.deleteCustomPin('${item.id}')">Delete</button>
            ` : ""}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });
      this.markerLayerGroup.addLayer(marker);
    });

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

  openModal(x, y) {
    if (this.modalPinId) this.modalPinId.value = "";
    if (this.modalHeading) this.modalHeading.textContent = "New Marker";
    this.modalX.value = x;
    this.modalY.value = y;
    this.modalTitle.value = "";
    this.modalDesc.value = "";
    this.markerModal.style.display = "flex";
    this.modalTitle.focus();
  }

  editCustomPin(id) {
    const pin = this.markersData.find((m) => m.id === id);
    if (!pin) return;
    if (this.modalPinId) this.modalPinId.value = pin.id;
    if (this.modalHeading) this.modalHeading.textContent = "Edit Marker";
    this.modalTitle.value = pin.title || "";
    this.modalCategory.value = pin.category || "Custom Pins";
    this.modalX.value = pin.x;
    this.modalY.value = pin.y;
    this.modalDesc.value = pin.description || "";
    this.markerModal.style.display = "flex";
    this.modalTitle.focus();
  }

  closeModal() {
    this.markerModal.style.display = "none";
  }

  async saveCustomPin() {
    const newMarker = {
      id: this.modalPinId?.value || undefined,
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
        this.activeTypes.add("custom_pins");
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
