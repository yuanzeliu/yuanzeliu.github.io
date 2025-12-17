/* ============================================================
   Trait Lemma Network, static web app for GitHub Pages
   Uses Cytoscape.js with preset layout (x,y are precomputed in R)
   ============================================================ */

const DATA_DIR = "data";
const FILE_NETWORK = `${DATA_DIR}/network_elements_top20.json`;
const FILE_META = `${DATA_DIR}/lemma_meta_top20.json`;
const FILE_INDEX = `${DATA_DIR}/lemmas_index_top20.json`;

// DOM elements
const cyContainer = document.getElementById("cy");
const tooltipEl = document.getElementById("tooltip");
const loadingEl = document.getElementById("loading");

const detailBox = document.getElementById("detailBox");
const statsBox = document.getElementById("statsBox");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resetViewBtn = document.getElementById("resetViewBtn");
const clearSelectionBtn = document.getElementById("clearSelectionBtn");

const slider = document.getElementById("jaccardSlider");
const sliderValue = document.getElementById("jaccardValue");

let cy = null;

// Metadata maps
let lemmaMetaMap = new Map();   // id -> meta object
let lemmaIndex = [];            // list for datalist
let allFactSelected = new Set(["Fitness", "Agency", "Communion", "Traditionalism", "None"]);

// Runtime caches
let selectedNodeId = null;
let currentJaccardThreshold = parseFloat(slider.value);

// Utility helpers
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function fmtNumber(x, digits = 3) {
  if (x === null || x === undefined || Number.isNaN(x)) return "NA";
  return Number(x).toFixed(digits);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showLoading(msg) {
  loadingEl.textContent = msg || "Loading data...";
  loadingEl.style.display = "block";
}

function hideLoading() {
  loadingEl.style.display = "none";
}

function setStats(text) {
  statsBox.innerHTML = text;
}

function buildDatalist(items) {
  const datalist = document.getElementById("lemmaSuggestions");
  datalist.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (const s of items) {
    const opt = document.createElement("option");
    opt.value = s;
    frag.appendChild(opt);
  }
  datalist.appendChild(frag);
}

// Tooltip logic
function showTooltip(html, x, y) {
  tooltipEl.innerHTML = html;
  tooltipEl.classList.remove("hidden");

  const rect = cyContainer.getBoundingClientRect();
  const padding = 12;

  const left = clamp(x - rect.left + 14, padding, rect.width - 340);
  const top = clamp(y - rect.top + 14, padding, rect.height - 120);

  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
}

function hideTooltip() {
  tooltipEl.classList.add("hidden");
}

// FACT checkbox handler
function initFactCheckboxes() {
  const box = document.getElementById("factCheckboxes");
  box.addEventListener("change", () => {
    const checked = new Set();
    box.querySelectorAll("input[type='checkbox']").forEach(cb => {
      if (cb.checked) checked.add(cb.value);
    });
    allFactSelected = checked;
    applyFilters();
  });
}

// Apply filters: FACT selection + jaccard threshold
function applyFilters() {
  if (!cy) return;

  // Filter nodes by FACT
  cy.nodes().forEach(n => {
    const f = n.data("fact") || "None";
    const visible = allFactSelected.has(f);
    n.style("display", visible ? "element" : "none");
  });

  // Filter edges by jaccard threshold, also hide edges if either endpoint is hidden
  cy.edges().forEach(e => {
    const w = e.data("jaccard");
    const s = e.source();
    const t = e.target();
    const endpointsVisible = (s.style("display") !== "none") && (t.style("display") !== "none");
    const pass = (w >= currentJaccardThreshold) && endpointsVisible;
    e.style("display", pass ? "element" : "none");
  });

  // Optional: fade nodes with zero visible edges
  cy.nodes().forEach(n => {
    const hasVisibleEdge = n.connectedEdges().some(e => e.style("display") !== "none");
    const isVisible = n.style("display") !== "none";
    if (!isVisible) return;

    n.style("opacity", hasVisibleEdge ? 1.0 : 0.25);
  });

  updateStats();
}

function updateStats() {
  if (!cy) return;

  const visibleNodes = cy.nodes().filter(n => n.style("display") !== "none").length;
  const visibleEdges = cy.edges().filter(e => e.style("display") !== "none").length;

  const text = `
    <div><b>Visible nodes:</b> ${visibleNodes}</div>
    <div><b>Visible edges:</b> ${visibleEdges}</div>
    <div><b>Jaccard threshold:</b> ${fmtNumber(currentJaccardThreshold, 2)}</div>
    <div class="hint" style="margin-top:8px;">
      Tip: If the graph looks sparse, lower the threshold or broaden FACT filters.
    </div>
  `;
  setStats(text);
}

// Highlight helpers
function clearHighlights() {
  if (!cy) return;
  cy.elements().removeClass("dimmed");
  cy.elements().removeClass("highlighted");
  cy.elements().removeClass("selected");
}

function highlightNeighborhood(node) {
  clearHighlights();

  const neighborhood = node.closedNeighborhood();
  cy.elements().addClass("dimmed");
  neighborhood.removeClass("dimmed");

  neighborhood.addClass("highlighted");
  node.addClass("selected");
}

// Detail panel rendering
function renderDetail(meta, nodeData) {
  if (!meta && !nodeData) {
    detailBox.classList.add("empty");
    detailBox.innerHTML = "Click a node to view lemma metadata.";
    return;
  }

  detailBox.classList.remove("empty");

  const id = nodeData?.id || meta?.id || "NA";
  const fact = nodeData?.fact || meta?.fact || "None";
  const degree = nodeData?.degree ?? meta?.degree ?? "NA";
  const nDimensions = nodeData?.n_dimensions ?? meta?.n_dimensions ?? "NA";

  const probability = meta?.probability;
  const origination = meta?.origination;
  const freq2000 = meta?.freq2000;
  const polysemy = meta?.polysemy;
  const valence = meta?.valence;
  const arousal = meta?.arousal;

  // Dimension specific profile: list of {dimension, relevance, positivity, super_dimension}
  const dimProfile = meta?.dim_profile || [];
  const dimSorted = [...dimProfile]
    .filter(d => d && d.relevance !== null && d.relevance !== undefined && !Number.isNaN(d.relevance))
    .sort((a, b) => (b.relevance || -Infinity) - (a.relevance || -Infinity));

  const topDims = dimSorted.slice(0, 12);

  // Build a small "bar list" by relevance
  let barsHtml = "";
  if (topDims.length > 0) {
    const maxRel = Math.max(...topDims.map(d => d.relevance || 0), 1e-9);
    barsHtml = `
      <div class="section-title">Top dimensions by relevance</div>
      <div class="bars">
        ${topDims.map(d => {
          const rel = d.relevance ?? 0;
          const pos = d.positivity;
          const wPct = clamp((rel / maxRel) * 100, 0, 100);
          const label = escapeHtml(d.dimension);
          const relTxt = fmtNumber(rel, 3);
          const posTxt = (pos === null || pos === undefined || Number.isNaN(pos)) ? "NA" : fmtNumber(pos, 3);
          const sdTxt = d.super_dimension ? escapeHtml(d.super_dimension) : "NA";

          return `
            <div class="bar-row">
              <div>
                <div class="bar-label">${label}</div>
                <div class="hint">positivity: ${posTxt}, super: ${sdTxt}</div>
                <div class="bar"><div style="width:${wPct}%"></div></div>
              </div>
              <div class="bar-val">${relTxt}</div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  } else {
    barsHtml = `<div class="section-title">Top dimensions by relevance</div><div class="hint">No dimension profile available.</div>`;
  }

  const dimsList = (nodeData?.dimensions || meta?.dimensions || []);
  const dimsText = Array.isArray(dimsList) ? dimsList.join(", ") : String(dimsList);

  detailBox.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:12px;height:12px;border-radius:999px;background:${escapeHtml(nodeData?.color || "#999")};border:1px solid rgba(255,255,255,0.25);"></div>
      <div style="font-size:14px;"><b>${escapeHtml(id)}</b></div>
    </div>

    <div class="section-title">Summary</div>
    <div class="kv">
      <div class="k">FACT</div><div class="v">${escapeHtml(fact)}</div>
      <div class="k">Degree</div><div class="v">${escapeHtml(degree)}</div>
      <div class="k">#Dimensions</div><div class="v">${escapeHtml(nDimensions)}</div>
    </div>

    <div class="section-title">Lemma level metadata</div>
    <div class="kv">
      <div class="k">probability</div><div class="v">${escapeHtml(fmtNumber(probability, 6))}</div>
      <div class="k">origination</div><div class="v">${escapeHtml(origination ?? "NA")}</div>
      <div class="k">freq2000</div><div class="v">${escapeHtml(fmtNumber(freq2000, 6))}</div>
      <div class="k">polysemy</div><div class="v">${escapeHtml(polysemy ?? "NA")}</div>
      <div class="k">valence</div><div class="v">${escapeHtml(fmtNumber(valence, 3))}</div>
      <div class="k">arousal</div><div class="v">${escapeHtml(fmtNumber(arousal, 3))}</div>
    </div>

    <div class="section-title">Dimensions list</div>
    <div class="hint">${escapeHtml(dimsText || "NA")}</div>

    ${barsHtml}
  `;
}

// Search and navigation
function focusNodeById(id) {
  if (!cy) return;

  const n = cy.getElementById(id);
  if (!n || n.empty()) {
    alert(`Lemma not found in network: ${id}`);
    return;
  }
  if (n.style("display") === "none") {
    alert(`Lemma exists, but is hidden by current filters: ${id}`);
    return;
  }

  selectedNodeId = id;

  cy.stop();
  cy.animate(
    { center: { eles: n }, zoom: 1.2 },
    { duration: 350 }
  );

  highlightNeighborhood(n);

  const meta = lemmaMetaMap.get(id);
  renderDetail(meta, n.data());
}

function resetView() {
  if (!cy) return;
  clearHighlights();
  selectedNodeId = null;
  cy.stop();
  cy.animate(
    { fit: { eles: cy.elements().filter(e => e.style("display") !== "none"), padding: 40 } },
    { duration: 350 }
  );
  renderDetail(null, null);
}

function clearSelection() {
  clearHighlights();
  selectedNodeId = null;
  renderDetail(null, null);
}

// Init Cytoscape styles
function buildCyStyle() {
  return [
    {
      selector: "node",
      style: {
        "background-color": "data(color)",
        "width": "mapData(size, 2, 6, 10, 28)",
        "height": "mapData(size, 2, 6, 10, 28)",
        "border-width": 0.6,
        "border-color": "rgba(255,255,255,0.35)",
        "label": "",
        "opacity": 1
      }
    },
    {
      selector: "edge",
      style: {
        "line-color": "rgba(200,200,200,0.18)",
        "width": "mapData(jaccard, 0, 1, 0.25, 2.2)",
        "curve-style": "bezier",
        "opacity": 0.9
      }
    },
    {
      selector: ".dimmed",
      style: {
        "opacity": 0.10
      }
    },
    {
      selector: "edge.dimmed",
      style: {
        "opacity": 0.05
      }
    },
    {
      selector: ".highlighted",
      style: {
        "opacity": 1.0
      }
    },
    {
      selector: "edge.highlighted",
      style: {
        "opacity": 0.70,
        "line-color": "rgba(138,180,255,0.55)"
      }
    },
    {
      selector: "node.selected",
      style: {
        "border-width": 2.5,
        "border-color": "rgba(138,180,255,0.95)"
      }
    }
  ];
}

// Main load
async function loadAllData() {
  showLoading("Loading network...");
  const netResp = await fetch(FILE_NETWORK);
  const networkJson = await netResp.json();

  showLoading("Loading metadata...");
  const metaResp = await fetch(FILE_META);
  const metaJson = await metaResp.json();

  showLoading("Loading index...");
  const indexResp = await fetch(FILE_INDEX);
  const indexJson = await indexResp.json();

  return { networkJson, metaJson, indexJson };
}

function buildMetaMap(metaJson) {
  // metaJson is an array of objects, each object has an id
  lemmaMetaMap = new Map();
  for (const m of metaJson) {
    if (!m || !m.id) continue;
    lemmaMetaMap.set(m.id, m);
  }
}

function initSearchIndex(indexJson) {
  lemmaIndex = Array.isArray(indexJson) ? indexJson : [];
  const lemmas = lemmaIndex.map(d => d.id).filter(Boolean).sort();
  buildDatalist(lemmas);
}

function initCy(networkJson) {
  cy = cytoscape({
    container: cyContainer,
    elements: networkJson,
    layout: { name: "preset" }, // x,y are given
    style: buildCyStyle(),
    wheelSensitivity: 0.12,
    pixelRatio: 1
  });

  // Tooltip: show on node hover
  cy.on("mouseover", "node", (evt) => {
    const n = evt.target;
    const id = n.id();
    const fact = n.data("fact") || "None";
    const degree = n.data("degree");
    const nDim = n.data("n_dimensions");
    const html = `
      <div><b>${escapeHtml(id)}</b></div>
      <div style="margin-top:4px;color:rgba(255,255,255,0.8);">
        FACT: ${escapeHtml(fact)}<br/>
        degree: ${escapeHtml(degree)}<br/>
        #dimensions: ${escapeHtml(nDim)}
      </div>
      <div style="margin-top:6px;color:rgba(255,255,255,0.6);">
        Click to open details.
      </div>
    `;
    // Use the mouse position from the original event if available
    const r = evt.originalEvent;
    if (r && typeof r.clientX === "number") {
      showTooltip(html, r.clientX, r.clientY);
    } else {
      // Fallback, place tooltip near center
      const rect = cyContainer.getBoundingClientRect();
      showTooltip(html, rect.left + rect.width * 0.5, rect.top + rect.height * 0.2);
    }
  });

  cy.on("mousemove", "node", (evt) => {
    const r = evt.originalEvent;
    if (!r) return;
    tooltipEl.style.left = `${clamp(r.clientX - cyContainer.getBoundingClientRect().left + 14, 12, cyContainer.clientWidth - 340)}px`;
    tooltipEl.style.top = `${clamp(r.clientY - cyContainer.getBoundingClientRect().top + 14, 12, cyContainer.clientHeight - 120)}px`;
  });

  cy.on("mouseout", "node", () => {
    hideTooltip();
  });

  // Click node
  cy.on("tap", "node", (evt) => {
    const n = evt.target;
    const id = n.id();
    selectedNodeId = id;

    highlightNeighborhood(n);

    const meta = lemmaMetaMap.get(id);
    renderDetail(meta, n.data());
  });

  // Click background
  cy.on("tap", (evt) => {
    if (evt.target === cy) {
      hideTooltip();
    }
  });

  // Initial fit
  setTimeout(() => {
    resetView();
  }, 80);
}

// Wire UI events
function initUI() {
  initFactCheckboxes();

  slider.addEventListener("input", () => {
    currentJaccardThreshold = parseFloat(slider.value);
    sliderValue.textContent = currentJaccardThreshold.toFixed(2);
    applyFilters();
  });

  searchBtn.addEventListener("click", () => {
    const q = (searchInput.value || "").trim();
    if (!q) return;
    focusNodeById(q);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = (searchInput.value || "").trim();
      if (!q) return;
      focusNodeById(q);
    }
  });

  resetViewBtn.addEventListener("click", () => {
    resetView();
  });

  clearSelectionBtn.addEventListener("click", () => {
    clearSelection();
  });
}

// Boot
(async function main() {
  try {
    initUI();
    const { networkJson, metaJson, indexJson } = await loadAllData();

    buildMetaMap(metaJson);
    initSearchIndex(indexJson);

    initCy(networkJson);

    hideLoading();
    applyFilters();
  } catch (err) {
    console.error(err);
    showLoading("Failed to load data. Check console for details.");
  }
})();
