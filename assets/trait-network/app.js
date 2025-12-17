/* ============================================================
   Trait Lemma Network, static web app for GitHub Pages
   Uses Cytoscape.js with preset layout (x,y are precomputed in R)
   Fixes: sanitize preset positions to avoid NaN/outlier collapse
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

// ----------------------------
// Utilities
// ----------------------------
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function fmtNumber(x, digits = 3) {
  if (x === null || x === undefined || Number.isNaN(x)) return "NA";
  const n = Number(x);
  if (!Number.isFinite(n)) return "NA";
  return n.toFixed(digits);
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

function setStats(html) {
  statsBox.innerHTML = html;
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

// ----------------------------
// Critical fix: sanitize preset positions
// - Fill missing/NaN coords with jitter near center
// - Normalize all coords into a stable box to prevent outliers ruining fit()
// ----------------------------
function sanitizePresetPositions(elements) {
  const nodes = elements?.nodes || [];
  if (!Array.isArray(nodes) || nodes.length === 0) return elements;

  const xs = [];
  const ys = [];

  for (const n of nodes) {
    const p = n.position || {};
    const x = Number(p.x);
    const y = Number(p.y);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      xs.push(x);
      ys.push(y);
    }
  }

  // If too few valid points, do not attempt normalization
  // (Fallback: Cytoscape can later apply a force layout if needed)
  if (xs.length < Math.max(10, nodes.length * 0.1)) {
    return elements;
  }

  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);

  const cx = (xMin + xMax) / 2;
  const cy = (yMin + yMax) / 2;

  const spanX = Math.max(xMax - xMin, 1e-9);
  const spanY = Math.max(yMax - yMin, 1e-9);

  // Map the larger span to roughly 2000 units
  const scale = 2000 / Math.max(spanX, spanY);

  for (const n of nodes) {
    const p = n.position || {};
    let x = Number(p.x);
    let y = Number(p.y);

    // Repair missing/invalid coords
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      x = cx + (Math.random() - 0.5) * 20;
      y = cy + (Math.random() - 0.5) * 20;
    }

    // Normalize
    n.position = {
      x: (x - cx) * scale,
      y: (y - cy) * scale
    };
  }

  return elements;
}

// ----------------------------
// Tooltip
// ----------------------------
function showTooltip(html, clientX, clientY) {
  tooltipEl.innerHTML = html;
  tooltipEl.classList.remove("hidden");

  const rect = cyContainer.getBoundingClientRect();
  const padding = 12;

  const left = clamp(clientX - rect.left + 14, padding, rect.width - 340);
  const top = clamp(clientY - rect.top + 14, padding, rect.height - 120);

  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
}

function hideTooltip() {
  tooltipEl.classList.add("hidden");
}

// ----------------------------
// Filters
// ----------------------------
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

function applyFilters() {
  if (!cy) return;

  // Nodes: FACT filter
  cy.nodes().forEach(n => {
    const f = n.data("fact") || "None";
    const visible = allFactSelected.has(f);
    n.style("display", visible ? "element" : "none");
  });

  // Edges: Jaccard threshold + endpoints visible
  cy.edges().forEach(e => {
    const w = Number(e.data("jaccard"));
    const s = e.source();
    const t = e.target();
    const endpointsVisible = (s.style("display") !== "none") && (t.style("display") !== "none");
    const pass = Number.isFinite(w) && (w >= currentJaccardThreshold) && endpointsVisible;
    e.style("display", pass ? "element" : "none");
  });

  // Fade isolates (optional)
  cy.nodes().forEach(n => {
    const isVisible = n.style("display") !== "none";
    if (!isVisible) return;
    const hasVisibleEdge = n.connectedEdges().some(e => e.style("display") !== "none");
    n.style("opacity", hasVisibleEdge ? 1.0 : 0.25);
  });

  updateStats();
}

function updateStats() {
  if (!cy) return;

  const visibleNodes = cy.nodes().filter(n => n.style("display") !== "none").length;
  const visibleEdges = cy.edges().filter(e => e.style("display") !== "none").length;

  const html = `
    <div><b>Visible nodes:</b> ${visibleNodes}</div>
    <div><b>Visible edges:</b> ${visibleEdges}</div>
    <div><b>Jaccard threshold:</b> ${fmtNumber(currentJaccardThreshold, 2)}</div>
    <div class="hint" style="margin-top:8px;">
      Tip: Lower the threshold if the graph looks sparse.
    </div>
  `;
  setStats(html);
}

// ----------------------------
// Highlight helpers
// ----------------------------
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

// ----------------------------
// Detail panel
// ----------------------------
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

  const dimProfile = meta?.dim_profile || [];
  const dimSorted = [...dimProfile]
    .filter(d => d && d.relevance !== null && d.relevance !== undefined && !Number.isNaN(d.relevance))
    .sort((a, b) => (Number(b.relevance) || -Infinity) - (Number(a.relevance) || -Infinity));

  const topDims = dimSorted.slice(0, 12);

  let barsHtml = "";
  if (topDims.length > 0) {
    const maxRel = Math.max(...topDims.map(d => Number(d.relevance) || 0), 1e-9);
    barsHtml = `
      <div class="section-title">Top dimensions by relevance</div>
      <div class="bars">
        ${topDims.map(d => {
          const rel = Number(d.relevance) || 0;
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

// ----------------------------
// Search and navigation
// ----------------------------
function clearSelection() {
  clearHighlights();
  selectedNodeId = null;
  renderDetail(null, null);
}

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

  const visibleEles = cy.elements().filter(e => e.style("display") !== "none");
  if (visibleEles.length === 0) return;

  cy.stop();
  cy.animate(
    { fit: { eles: visibleEles, padding: 50 } },
    { duration: 350 }
  );

  renderDetail(null, null);
}

// ----------------------------
// Cytoscape styles
// ----------------------------
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
        "curve-style": "straight",
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

// ----------------------------
// Load data
// ----------------------------
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

// ----------------------------
// Init Cytoscape
// ----------------------------
function initCy(networkJson) {
  cy = cytoscape({
    container: cyContainer,
    elements: networkJson,
    layout: { name: "preset" },
    style: buildCyStyle(),
    wheelSensitivity: 0.12,
    pixelRatio: 1
  });

  // Tooltip: node hover
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

    const r = evt.originalEvent;
    if (r && typeof r.clientX === "number") {
      showTooltip(html, r.clientX, r.clientY);
    } else {
      const rect = cyContainer.getBoundingClientRect();
      showTooltip(html, rect.left + rect.width * 0.5, rect.top + rect.height * 0.2);
    }
  });

  cy.on("mousemove", "node", (evt) => {
    const r = evt.originalEvent;
    if (!r) return;
    const rect = cyContainer.getBoundingClientRect();
    tooltipEl.style.left = `${clamp(r.clientX - rect.left + 14, 12, rect.width - 340)}px`;
    tooltipEl.style.top = `${clamp(r.clientY - rect.top + 14, 12, rect.height - 120)}px`;
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

  // Click background: hide tooltip
  cy.on("tap", (evt) => {
    if (evt.target === cy) hideTooltip();
  });

  // Initial fit
  setTimeout(() => {
    resetView();
  }, 80);
}

// ----------------------------
// UI wiring
// ----------------------------
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

// ----------------------------
// Boot
// ----------------------------
(async function main() {
  try {
    initUI();

    const { networkJson, metaJson, indexJson } = await loadAllData();

    // Fix positions BEFORE Cytoscape init
    sanitizePresetPositions(networkJson);
    if (networkJson && Array.isArray(networkJson.edges)) {
  networkJson.edges = networkJson.edges.filter(e => {
    const d = e.data || {};
    return d.source && d.target && d.source !== d.target;
  });
}

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
