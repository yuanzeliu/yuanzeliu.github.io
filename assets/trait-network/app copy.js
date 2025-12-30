/* =====================================================================
   Human Trait Network Web App (static) — WORD ONLY

   Goals (match your first UI feel):
   (1) Larger nodes
   (2) Thinner edges
   (3) Stronger focus on search (fit neighborhood + zoom)
   (4) Selecting a node should NOT make other nodes "disappear"
       (we only lightly fade non-neighborhood elements)
   (5) Avoid "collapsed blob" by using conservative preset rescaling
       (no tanh compression)

   ===================================================================== */

window.APP_VERSION = "v18-word-only-valence-2025-12-29";
console.log("APP_VERSION:", window.APP_VERSION);

// ----------------------------
// Dataset paths (WORD ONLY)
// ----------------------------
const DATASET = {
  label: "Word",
  elements: "./data/network_elements_top20_word.json",
  meta: "./data/word_meta_top20_word.json",
  index: "./data/words_index_top20_word.json",
  searchPlaceholder: "Search word, for example honest",
  metaLabel: "Word level metadata",
};

// ----------------------------
// FACT palette
// ----------------------------
const FACT_LEVELS = ["Fitness", "Agency", "Communion", "Traditionalism"];
const FACT_PALETTE = {
  Fitness: "#21918c",
  Agency: "#F1C202",
  Communion: "#E86B4B",
  Traditionalism: "#5ec962",
};
const UNCATEGORIZED = "Uncategorized";
const UNCATEGORIZED_COLOR = "#9aa3ad";

// ----------------------------
// Visual tuning (to match your first UI)
// ----------------------------
// Node size (bigger than current)
const NODE_SIZE_MULT = 3.0;
const NODE_SIZE_MIN = 9.5;

// Edge default (thinner + lighter)
const EDGE_WIDTH = 0.55;
const EDGE_OPACITY = 0.22;

// Fade strength (do NOT disappear)
const FADE_NODE_OPACITY = 0.22;
const FADE_EDGE_OPACITY = 0.08;

// Highlight style
const HIGHLIGHT_EDGE_WIDTH = 1.6;
const HIGHLIGHT_EDGE_OPACITY = 0.92;
const HIGHLIGHT_EDGE_COLOR = "rgba(120,190,255,0.90)";

// ----------------------------
// DOM
// ----------------------------
const elCy = document.getElementById("cy");
const elLoading = document.getElementById("loading");
const elTooltip = document.getElementById("tooltip");
const elDetailBox = document.getElementById("detailBox");
const elStatsBox = document.getElementById("statsBox");

const elSearchInput = document.getElementById("searchInput");
const elSearchBtn = document.getElementById("searchBtn");
const elResetViewBtn = document.getElementById("resetViewBtn");
const elClearSelectionBtn = document.getElementById("clearSelectionBtn");

const elJaccardSlider = document.getElementById("jaccardSlider");
const elJaccardValue = document.getElementById("jaccardValue");
const elFactCheckboxes = document.getElementById("factCheckboxes");

// Edge weight controls
const elEdgeWeightedToggle = document.getElementById("edgeWeightedToggle");

// Valence shading control (optional; if enabled, node brightness reflects valence)
const elValenceShadingToggle = document.getElementById("valenceShadingToggle");

// This datalist id should exist in HTML: <datalist id="nodeSuggestions"></datalist>
const elSuggestions = document.getElementById("nodeSuggestions");

// ----------------------------
// State
// ----------------------------
let cy = null;
let metaById = new Map();
let indexList = [];
let lastSelectedId = null;

// Edge weight state
let edgeWeightedEnabled = false; // show edge weights (opacity)

// Valence shading state
let valenceShadingEnabled = false;
let valenceDomain = { min: -1, max: 1 }; // computed after meta loads

// ----------------------------
// Helpers
// ----------------------------
function withCacheBust(url) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(window.APP_VERSION)}&t=${Date.now()}`;
}

function asNumberMaybe(x) {
  if (x === null || x === undefined) return null;
  if (x === "NA") return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ----------------------------
// Valence -> brightness
// ----------------------------
function computeValenceDomainFromMeta() {
  let min = Infinity;
  let max = -Infinity;

  metaById.forEach((m) => {
    const v = asNumberMaybe(m?.valence);
    if (v === null) return;
    if (v < min) min = v;
    if (v > max) max = v;
  });

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: -1, max: 1 };
  }
  if (min === max) {
    return { min: min - 1, max: max + 1 };
  }
  return { min, max };
}

function valenceToSigned(v) {
  const x = asNumberMaybe(v);
  if (x === null) return null;

  const min = valenceDomain?.min ?? -1;
  const max = valenceDomain?.max ?? 1;
  if (!(max > min)) return 0;

  const norm01 = (x - min) / (max - min); // [0,1]
  const clipped = Math.max(0, Math.min(1, norm01));
  return clipped * 2 - 1; // [-1,1]
}

function hexToRgb(hex) {
  const h = String(hex || "").trim();
  if (!h.startsWith("#") || (h.length !== 7)) return null;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  if (![r, g, b].every(Number.isFinite)) return null;
  return { r, g, b };
}

function rgbToCss({ r, g, b }) {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

// signedValence in [-1,1]; positive -> brighten, negative -> darken
function adjustColorBySignedValence(baseColor, signedValence) {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return baseColor;

  const t = Math.max(-1, Math.min(1, signedValence ?? 0));
  const strength = Math.min(0.6, Math.abs(t) * 0.6);

  if (t >= 0) {
    // Mix towards white
    const out = {
      r: rgb.r * (1 - strength) + 255 * strength,
      g: rgb.g * (1 - strength) + 255 * strength,
      b: rgb.b * (1 - strength) + 255 * strength,
    };
    return rgbToCss(out);
  }

  // Mix towards black
  const out = {
    r: rgb.r * (1 - strength),
    g: rgb.g * (1 - strength),
    b: rgb.b * (1 - strength),
  };
  return rgbToCss(out);
}

function showLoading(msg = "Loading data...") {
  if (!elLoading) return;
  elLoading.textContent = msg;
  elLoading.style.display = "block";
}

function hideLoading() {
  if (!elLoading) return;
  elLoading.style.display = "none";
}

function setTooltip(html, x, y) {
  if (!elTooltip) return;
  elTooltip.innerHTML = html;
  elTooltip.style.left = `${x}px`;
  elTooltip.style.top = `${y}px`;
  elTooltip.classList.remove("hidden");
}

function hideTooltip() {
  if (!elTooltip) return;
  elTooltip.classList.add("hidden");
}

function factSetFromUI() {
  const checked = new Set();
  const inputs = elFactCheckboxes?.querySelectorAll('input[type="checkbox"]') || [];
  inputs.forEach((inp) => {
    if (inp.checked) checked.add(inp.value);
  });
  return checked;
}

function resetFactSelectionToAll() {
  // 1) Reset FACT checkboxes: select all groups
  const inputs = elFactCheckboxes?.querySelectorAll('input[type="checkbox"]') || [];
  inputs.forEach((inp) => {
    inp.checked = true;
  });

  // 2) Reset Jaccard threshold to default (0.40)
  if (elJaccardSlider) elJaccardSlider.value = "0.40";
  if (elJaccardValue) elJaccardValue.textContent = "0.40";
  applyJaccardThreshold();

  // 3) Reset edge-weight (opacity) toggle to OFF
  if (elEdgeWeightedToggle) elEdgeWeightedToggle.checked = false;
  edgeWeightedEnabled = false;
  syncEdgeWeightControlUI();
  updateEdgeWeights();

  // 3.5) Reset valence shading toggle to OFF
  if (elValenceShadingToggle) elValenceShadingToggle.checked = false;
  valenceShadingEnabled = false;
  syncValenceControlUI();

  // 4) Re-apply node filter + colors (and refit)
  applyFactFilterAndColors(true);
}


// Read membership from elements (preferred), fallback to single fact field if needed
function getNodeFactMembership(d) {
  const m = d?.fact_membership;
  if (Array.isArray(m) && m.length > 0) return m.filter((x) => FACT_LEVELS.includes(x));
  if (d?.fact && FACT_LEVELS.includes(d.fact)) return [d.fact];
  return [];
}

function getNodeFactScores(d) {
  const s = d?.fact_scores;
  if (s && typeof s === "object") return s;
  return {};
}

// Decide node display color based on selected FACTs + mean relevance scores
function pickDisplayFactAndColor(nodeData, selectedFactsOnlyFACT) {
  const membership = getNodeFactMembership(nodeData);
  const scores = getNodeFactScores(nodeData);

  const eligible = membership.filter((f) => selectedFactsOnlyFACT.has(f));
  if (eligible.length === 0) {
    return { fact: UNCATEGORIZED, color: UNCATEGORIZED_COLOR, hasEligible: false };
  }

  // Choose highest mean relevance among eligible FACTs
  const scored = eligible
    .map((f) => ({ f, s: asNumberMaybe(scores[f]) }))
    .map((o) => ({ ...o, s: o.s === null ? -Infinity : o.s }))
    .sort((a, b) => (b.s - a.s) || a.f.localeCompare(b.f));

  const best = scored[0]?.f || eligible[0];
  return { fact: best, color: FACT_PALETTE[best] || UNCATEGORIZED_COLOR, hasEligible: true };
}

// ----------------------------
// Conservative preset rescaling (avoid blob)
// - Center by median
// - Only rescale if the spread is obviously too small or too huge
// ----------------------------
function median(arr) {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function rescalePresetPositions(nodes, targetHalfRange = 1100) {
  const xs = [];
  const ys = [];

  nodes.forEach((n) => {
    const p = n?.position;
    const x = asNumberMaybe(p?.x);
    const y = asNumberMaybe(p?.y);
    if (x !== null && y !== null) {
      xs.push(x);
      ys.push(y);
    }
  });

  if (xs.length < 10) return { changed: false, reason: "too_few_positions" };

  const xMed = median(xs);
  const yMed = median(ys);

  // Compute max absolute deviation from center
  let maxAbs = 0;
  for (let i = 0; i < xs.length; i++) {
    const dx = Math.abs(xs[i] - xMed);
    const dy = Math.abs(ys[i] - yMed);
    maxAbs = Math.max(maxAbs, dx, dy);
  }

  // If maxAbs is extremely small, the layout will look like a blob.
  // If extremely large, fit/zoom becomes awkward.
  // Only rescale in those cases.
  const TOO_SMALL = 80;     // below this: likely blob
  const TOO_LARGE = 20000;  // above this: overly huge coords

  let scale = 1;
  let changed = false;

  if (maxAbs < TOO_SMALL) {
    scale = targetHalfRange / Math.max(1, maxAbs);
    changed = true;
  } else if (maxAbs > TOO_LARGE) {
    scale = targetHalfRange / maxAbs;
    changed = true;
  } else {
    // Keep as-is, just re-center
    scale = 1;
  }

  nodes.forEach((n) => {
    const p = n?.position || {};
    const x = asNumberMaybe(p.x);
    const y = asNumberMaybe(p.y);
    if (x === null || y === null) return;
    n.position = {
      x: (x - xMed) * scale,
      y: (y - yMed) * scale,
    };
  });

  return { changed, reason: changed ? "rescaled" : "recenter_only", scale, maxAbs, xMed, yMed };
}

// ----------------------------
// Detail panel helpers
// ----------------------------
function setDetailEmpty() {
  if (!elDetailBox) return;
  elDetailBox.classList.add("empty");
  elDetailBox.innerHTML = `Click a node to view word metadata.`;
}

function fmtScalar(x, digits = 3) {
  const n = asNumberMaybe(x);
  if (n === null) return "NA";
  if (Number.isInteger(n) && Math.abs(n) > 10) return String(n);
  const s = n.toFixed(digits);
  return s.replace(/0+$/, "").replace(/\.$/, "");
}
function fmtFreq(x) {
  const n = asNumberMaybe(x);
  if (n === null) return "NA";

  // Treat exact 0 as 0
  if (n === 0) return "0";

  const absn = Math.abs(n);

  // Use scientific notation for very small numbers
  if (absn < 1e-4) {
    // 2 significant digits is usually enough here; adjust if you want
    return n.toExponential(2);
  }

  // Otherwise show as a regular decimal (up to 6 decimals, trimmed)
  const s = n.toFixed(6);
  return s.replace(/0+$/, "").replace(/\.$/, "");
}

function kvRow(k, v) {
  return `
    <div class="kv">
      <div class="k">${escapeHtml(k)}</div>
      <div class="v">${escapeHtml(v)}</div>
    </div>
  `;
}

function renderDetailHTML(nodeId, nodeData) {
  const meta = metaById.get(nodeId) || {};
  const label = nodeData?.label ?? nodeId;

  const membership = getNodeFactMembership(nodeData);
  const scores = getNodeFactScores(nodeData);

  const topFact =
    nodeData?.fact_top ||
    nodeData?.fact ||
    (membership[0] || UNCATEGORIZED);

  const degree = nodeData?.degree ?? meta?.degree ?? 0;
  const nDims = nodeData?.n_dimensions ?? meta?.n_dimensions ?? 0;

  const dimsListArr = Array.isArray(nodeData?.dimensions)
    ? nodeData.dimensions
    : Array.isArray(meta?.dimensions)
      ? meta.dimensions
      : [];
  const dimsList = dimsListArr.length ? dimsListArr.join(", ") : "NA";

  const dimProfile = Array.isArray(meta?.dim_profile) ? meta.dim_profile : [];
  const topDims = dimProfile
    .filter((d) => d && d.dimension)
    .map((d) => ({
      dimension: d.dimension,
      relevance: asNumberMaybe(d.relevance),
      positivity: asNumberMaybe(d.positivity),
      factor: d.factor ?? d.FACT ?? d.fact ?? null,
    }))
    .filter((d) => d.relevance !== null)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 10);

  const pills = membership.length
    ? membership.map((f) => `<span class="pill">${escapeHtml(f)}</span>`).join("")
    : `<span class="pill">${UNCATEGORIZED}</span>`;

  const scoreBlock = membership.length
    ? `
      <div class="section">
        <div class="section-title">FACT mean relevance (within eligible dimensions)</div>
        ${membership
          .map((f) => {
            const v = asNumberMaybe(scores?.[f]);
            return kvRow(f, v === null ? "NA" : v.toFixed(3));
          })
          .join("")}
      </div>
    `
    : "";

  const topDimsHTML = topDims.length
    ? topDims
        .map((d) => {
          const w = Math.max(0, Math.min(100, (d.relevance ?? 0) * 100));
          const factor = d.factor ? escapeHtml(d.factor) : "NA";
          const pos = d.positivity === null ? "NA" : d.positivity.toFixed(3);
          const rel = d.relevance === null ? "NA" : d.relevance.toFixed(3);

          return `
            <div class="dim-card">
              <div class="dim-head">
                <div class="dim-name">${escapeHtml(d.dimension)}</div>
                <div class="dim-val">${rel}</div>
              </div>
              <div class="bar"><div class="bar-fill" style="width:${w}%;"></div></div>
              <div class="dim-sub">positivity: ${pos}, factor: ${factor}</div>
            </div>
          `;
        })
        .join("")
    : `<div class="muted">No dimension profile found in meta file.</div>`;

  const dotColor = nodeData?.display_color || nodeData?.color || UNCATEGORIZED_COLOR;

  return `
    <div class="detail-card">
      <div class="detail-head">
        <span class="dot" style="background:${escapeHtml(dotColor)};"></span>
        <div class="detail-title">${escapeHtml(label)}</div>
      </div>

      <div class="section">
        <div class="section-title">FACT membership</div>
        <div class="pill-row">${pills}</div>
      </div>

      <div class="section">
        <div class="section-title">Summary</div>
        ${kvRow("FACT (top)", String(topFact))}
        ${kvRow("Degree", String(degree))}
        ${kvRow("#Dimensions", String(nDims))}
        ${kvRow("Node id", String(nodeId))}
      </div>

      ${scoreBlock}

      <div class="section">
        <div class="section-title">${escapeHtml(DATASET.metaLabel)}</div>
        ${kvRow("probability", fmtScalar(meta?.probability, 6))}
        ${kvRow("origination", fmtScalar(meta?.origination, 0))}
        ${kvRow("freq2000", fmtFreq(meta?.freq2000))}
        ${kvRow("polysemy", fmtScalar(meta?.polysemy, 0))}
        ${kvRow("valence", fmtScalar(meta?.valence, 3))}
        ${kvRow("arousal", fmtScalar(meta?.arousal, 3))}
      </div>

      <div class="section">
        <div class="section-title">Dimensions list</div>
        <div class="text">${escapeHtml(dimsList)}</div>
      </div>

      <div class="section">
        <div class="section-title">Top dimensions by relevance</div>
        ${topDimsHTML}
      </div>
    </div>
  `;
}

function setDetailForNode(node) {
  if (!elDetailBox) return;
  elDetailBox.classList.remove("empty");
  elDetailBox.innerHTML = renderDetailHTML(node.id(), node.data());
}

// ----------------------------
// Cytoscape build
// ----------------------------
function buildCytoscape(elements) {
  if (cy) {
    try { cy.destroy(); } catch (_) {}
    cy = null;
  }

  const style = [
    {
      selector: "node",
      style: {
        "background-color": "data(display_color)",
        width: "data(size)",
        height: "data(size)",
        "border-width": 0.6,
        "border-color": "rgba(200,210,220,0.35)",
        "overlay-opacity": 0,
        label: "",
        opacity: 0.95,
      },
    },
    {
      selector: "edge",
      style: {
        width: EDGE_WIDTH,
        "line-color": "rgba(255,255,255,0.16)",
        opacity: EDGE_OPACITY,
        "curve-style": "bezier",
      },
    },
    { selector: "node.hidden", style: { display: "none" } },
    { selector: "edge.hidden", style: { display: "none" } },

    // Selection
    {
      selector: "node.selected",
      style: {
        "border-width": 2.2,
        "border-color": "rgba(230,240,255,0.95)",
        opacity: 1,
      },
    },
    {
      selector: "edge.highlight",
      style: {
        width: HIGHLIGHT_EDGE_WIDTH,
        opacity: HIGHLIGHT_EDGE_OPACITY,
        "line-color": HIGHLIGHT_EDGE_COLOR,
      },
    },

{
  selector: "edge.weighted",
  style: {
    opacity: "data(weight_opacity)",
  },
},
{
  selector: "edge.highlight.weighted",
  style: {
    opacity: "data(weight_opacity)",
    width: HIGHLIGHT_EDGE_WIDTH,
    "line-color": HIGHLIGHT_EDGE_COLOR,
  },
},

    // Gentle fading (do not disappear)
    { selector: "node.faded", style: { opacity: FADE_NODE_OPACITY } },
    { selector: "edge.faded", style: { opacity: FADE_EDGE_OPACITY } },
  ];

  cy = cytoscape({
    container: elCy,
    elements,
    style,
    layout: { name: "preset" },
    wheelSensitivity: 0.15,
    minZoom: 0.03,
    maxZoom: 6,
    boxSelectionEnabled: false,
    autoungrabify: true, // prevent dragging
  });

  cy.ready(() => {
    // Lock positions (ensure no dragging)
    cy.nodes().lock();

    // Fit nicely
    cy.fit(cy.elements(":visible"), 70);
    cy.resize();

    updateEdgeWeights();
    updateStats();
  });

  cy.on("mouseover", "node", (evt) => {
    const n = evt.target;
    const pos = evt.renderedPosition || { x: 0, y: 0 };
    setTooltip(
      `<div style="font-weight:800;">${escapeHtml(n.data("label") || n.id())}</div>`,
      pos.x + 12,
      pos.y + 12
    );
  });
  cy.on("mouseout", "node", () => hideTooltip());

  cy.on("tap", "node", (evt) => selectNode(evt.target));
  cy.on("tap", (evt) => {
    if (evt.target === cy) clearSelection();
  });
}

// ----------------------------
// Selection highlighting
// ----------------------------
function selectNode(node) {
  if (!cy) return;
  lastSelectedId = node.id();

  // Reset
  cy.elements().removeClass("faded highlight selected");

  node.addClass("selected");

  // Neighborhood emphasis (but do not hide others)
  const neigh = node.closedNeighborhood();
  const others = cy.elements().difference(neigh);

  others.addClass("faded");
  neigh.removeClass("faded");

  // Highlight only edges connected to the node
  cy.edges().removeClass("highlight");
  node.connectedEdges().addClass("highlight").removeClass("faded");

  setDetailForNode(node);
  updateEdgeWeights();
}

function clearSelection() {
  if (!cy) return;
  lastSelectedId = null;
  cy.elements().removeClass("faded highlight selected");
  setDetailEmpty();
  updateEdgeWeights();
}

// ----------------------------
// Filters
// ----------------------------
function applyJaccardThreshold() {
  if (!cy) return;

  const thr = Number(elJaccardSlider?.value ?? 0.4);
  if (elJaccardValue) elJaccardValue.textContent = thr.toFixed(2);

  // Show/hide edges by threshold only
  cy.edges().forEach((e) => {
    const j = asNumberMaybe(e.data("jaccard"));
    const show = j !== null && j >= thr;
    e.data("_hiddenByJaccard", !show);
    e.toggleClass("hidden", !show);
  });

  updateEdgeWeights();
  updateStats();
}

// FACT filter controls visibility of nodes (and edges attached to hidden nodes)

function applyFactFilterAndColors(refit = false) {
  if (!cy) return;

  const selectedFacts = factSetFromUI();
  const showUncat = selectedFacts.has(UNCATEGORIZED);
  const selectedOnlyFACT = new Set([...selectedFacts].filter((x) => FACT_LEVELS.includes(x)));

  cy.nodes().forEach((n) => {
    const d = n.data();

    // Determine visibility based on FACT membership filter
    const membership = getNodeFactMembership(d);
    const hasMembership = membership.length > 0;
    const intersects = membership.some((f) => selectedFacts.has(f));

    // IMPORTANT: must be 'let' because valence shading may override visibility (hide NA valence)
    let visible = hasMembership ? intersects : showUncat;

    // Pick FACT-driven display group + base color
    const pick = pickDisplayFactAndColor(d, selectedOnlyFACT);
    n.data("display_fact", pick.fact);

    // Base color (FACT) -> optionally adjust brightness by valence
    let c = pick.color;

    if (valenceShadingEnabled) {
      const meta = metaById.get(n.id()) || {};
      const valenceRaw = meta?.valence;

      // Convert valence to signed [-1, 1] (supports either [-1,1] or [0,1] inputs)
      const vSigned = valenceToSigned(valenceRaw);

      // If valence is NA, hide node (per requirement)
      if (vSigned === null) {
        visible = false;
      } else {
        c = adjustColorBySignedValence(c, vSigned);
      }
    }

    n.data("display_color", c);
    n.toggleClass("hidden", !visible);
  });

  // Hide edges if either endpoint is hidden OR edge is below Jaccard threshold
  cy.edges().forEach((e) => {
    const hiddenByNode = e.source().hasClass("hidden") || e.target().hasClass("hidden");
    const hiddenByJaccard = e.data("_hiddenByJaccard") === true;
    e.toggleClass("hidden", hiddenByNode || hiddenByJaccard);
  });

  // Keep selection highlight consistent
  if (lastSelectedId) {
    const n = cy.getElementById(lastSelectedId);
    if (n && n.nonempty() && !n.hasClass("hidden")) selectNode(n);
    else clearSelection();
  }

  updateStats();

  // Update edge opacity weights after visibility changes
  updateEdgeWeights();

  if (refit) {
    try {
      cy.fit(cy.elements(":visible"), 60);
      cy.resize();
    } catch (_) {}
  }
}

function updateStats() {
  if (!cy || !elStatsBox) return;

  const totalNodes = cy.nodes().length;
  const totalEdges = cy.edges().length;

  const visibleNodes = cy.nodes().filter((n) => !n.hasClass("hidden")).length;
  const visibleEdges = cy.edges().filter((e) => !e.hasClass("hidden")).length;

  const thr = Number(elJaccardSlider?.value ?? 0.4);

  elStatsBox.innerHTML = `
    <div><b>Mode:</b> ${escapeHtml(DATASET.label)}</div>
    <div><b>Nodes:</b> ${visibleNodes} / ${totalNodes}</div>
    <div><b>Edges:</b> ${visibleEdges} / ${totalEdges}</div>
    <div><b>Jaccard threshold:</b> ${thr.toFixed(2)}</div>
  `;
}

// ----------------------------
// Edge weight controls
// ----------------------------
function syncEdgeWeightControlUI() {
  // Hide deprecated control if it still exists in HTML
  const deprecated = document.getElementById("edgeWeightsSelectedOnlyToggle");
  if (deprecated) {
    const row = deprecated.closest(".checkbox-row") || deprecated.parentElement;
    if (row) row.style.display = "none";
  }

  // Read current state from the checkbox
  if (elEdgeWeightedToggle) {
    edgeWeightedEnabled = !!elEdgeWeightedToggle.checked;
  }

  // Match typography to FACT checkbox labels for visual consistency
  try {
    const factLabel = elFactCheckboxes?.querySelector("label");
    const edgeLabel =
      document.querySelector('label[for="edgeWeightedToggle"]') ||
      document.querySelector('label[for="edgeWeightsToggle"]') ||
      elEdgeWeightedToggle?.closest("label");
    if (factLabel && edgeLabel) {
      const s = window.getComputedStyle(factLabel);
      edgeLabel.style.fontSize = s.fontSize;
      edgeLabel.style.fontWeight = s.fontWeight;
      edgeLabel.style.lineHeight = s.lineHeight;
      edgeLabel.style.letterSpacing = s.letterSpacing;
    }
  } catch (_) {}
}

function syncValenceControlUI() {
  // If the HTML doesn't include this checkbox, we just disable the feature.
  if (!elValenceShadingToggle) {
    valenceShadingEnabled = false;
    return;
  }

  // Match typography to FACT checkbox labels for visual consistency
  try {
    const factLabel = elFactCheckboxes?.querySelector("label");
    const valLabel = document.querySelector('label[for="valenceShadingToggle"]');
    if (factLabel && valLabel) {
      const s = window.getComputedStyle(factLabel);
      valLabel.style.fontSize = s.fontSize;
      valLabel.style.fontWeight = s.fontWeight;
      valLabel.style.lineHeight = s.lineHeight;
      valLabel.style.letterSpacing = s.letterSpacing;
    }
  } catch (_) {}

  valenceShadingEnabled = !!elValenceShadingToggle.checked;
}



function edgeOpacityFromJaccard(j, thr) {
  const jj = asNumberMaybe(j);
  if (jj === null) return EDGE_OPACITY;

  const t0 = Number.isFinite(thr) ? thr : 0;
  // If thr == 1, treat all visible edges as max
  const denom = 1 - t0;
  const t = denom <= 1e-9 ? 1 : Math.max(0, Math.min(1, (jj - t0) / denom));

  // Keep weights subtle (match your original "thin/light" feel)
  const OP_MIN = 0.10;
  const OP_MAX = 0.55;
  return OP_MIN + t * (OP_MAX - OP_MIN);
}

function updateEdgeWeights() {
  if (!cy) return;

  // Sync UI -> state, and keep label typography consistent
  syncEdgeWeightControlUI();

  // When disabled, revert to default edge opacity
  if (!edgeWeightedEnabled) {
    cy.edges().removeClass("weighted");
    cy.edges().forEach((e) => e.data("weight_opacity", EDGE_OPACITY));
    return;
  }

  // When enabled, set per-edge opacity based on (jaccard - threshold), then enable weighted style
  const thr = Number(elJaccardSlider?.value ?? 0.4);

  cy.edges().forEach((e) => {
    if (e.hasClass("hidden")) return;
    const j = asNumberMaybe(e.data("jaccard"));
    const op = edgeOpacityFromJaccard(j, thr);
    e.data("weight_opacity", op);
  });

  cy.edges().addClass("weighted");
}


// ----------------------------
// Search + datalist
// ----------------------------
function rebuildDatalist() {
  if (!elSuggestions) return;

  elSuggestions.innerHTML = "";
  const max = 8000;

  indexList.slice(0, max).forEach((id) => {
    const opt = document.createElement("option");
    opt.value = id;
    elSuggestions.appendChild(opt);
  });

  // Ensure input is bound to datalist
  if (elSearchInput) elSearchInput.setAttribute("list", "nodeSuggestions");
}

function findNodeByQuery(q) {
  if (!cy) return null;
  const query = (q || "").trim();
  if (!query) return null;

  const lower = query.toLowerCase();

  // Prefer exact match among visible nodes
  const exactVisible = cy.nodes().filter((n) => !n.hasClass("hidden") && String(n.id()).toLowerCase() === lower);
  if (exactVisible.length) return exactVisible[0];

  const byLabelVisible = cy.nodes().filter((n) => !n.hasClass("hidden") && String(n.data("label") || "").toLowerCase() === lower);
  if (byLabelVisible.length) return byLabelVisible[0];

  // fallback to any nodes
  const exactAll = cy.nodes().filter((n) => String(n.id()).toLowerCase() === lower);
  if (exactAll.length) return exactAll[0];

  const containsVisible = cy.nodes().filter((n) => !n.hasClass("hidden") && String(n.id()).toLowerCase().includes(lower));
  if (containsVisible.length) return containsVisible[0];

  return null;
}

function focusOnNode(node) {
  if (!cy || !node) return;

  // Stronger focus: fit neighborhood then zoom a bit
  const neigh = node.closedNeighborhood().filter((ele) => !ele.hasClass("hidden"));

  try {
    // Fit the neighborhood first
    cy.animate(
      { fit: { eles: neigh, padding: 120 } },
      { duration: 260 }
    );

    // Then ensure zoom is not too low
    setTimeout(() => {
      const z = cy.zoom();
      const target = Math.max(1.35, Math.min(2.6, z * 1.15));
      cy.animate(
        { zoom: { level: target, renderedPosition: node.renderedPosition() } },
        { duration: 220 }
      );
    }, 280);
  } catch (_) {}
}

function doSearch() {
  const q = elSearchInput?.value || "";
  const node = findNodeByQuery(q);
  if (!node) return;

  selectNode(node);
  focusOnNode(node);
}

// ----------------------------
// Load dataset
// ----------------------------
async function loadWordNetwork() {
  showLoading(`Loading ${DATASET.label} network...`);
  if (elSearchInput) elSearchInput.placeholder = DATASET.searchPlaceholder;
  setDetailEmpty();

  try {
    const [elementsJson, metaJson, indexJson] = await Promise.all([
      fetch(withCacheBust(DATASET.elements)).then((r) => r.json()),
      fetch(withCacheBust(DATASET.meta)).then((r) => r.json()),
      fetch(withCacheBust(DATASET.index)).then((r) => r.json()),
    ]);

    // meta map
    metaById = new Map();
    if (Array.isArray(metaJson)) {
      metaJson.forEach((row) => {
        if (row?.id) metaById.set(String(row.id), row);
      });
    }

    // compute valence domain for brightness mapping
    valenceDomain = computeValenceDomainFromMeta();

    // index list: accept ["honest", ...] OR [{id:"honest"}, ...]
    indexList = [];
    if (Array.isArray(indexJson)) {
      indexList = indexJson
        .map((x) => {
          if (typeof x === "string") return x;
          if (x && typeof x === "object") return String(x.id ?? x.label ?? x.word ?? "");
          return "";
        })
        .map((s) => String(s).trim())
        .filter(Boolean);
    }
    rebuildDatalist();

    // nodes/edges + remove self-loops
    const nodes = Array.isArray(elementsJson?.nodes) ? elementsJson.nodes : [];
    const edgesRaw = Array.isArray(elementsJson?.edges) ? elementsJson.edges : [];
    const edges = edgesRaw.filter((e) => {
      const s = e?.data?.source;
      const t = e?.data?.target;
      return s && t && s !== t;
    });

    // Fix blob: conservative rescale only when needed
    const posInfo = rescalePresetPositions(nodes, 1200);
    console.log("[word] preset position:", posInfo);

    // Initial colors based on current FACT selection
    const selectedFacts = factSetFromUI();
    const selectedOnlyFACT = new Set([...selectedFacts].filter((x) => FACT_LEVELS.includes(x)));

    const nodesNorm = nodes.map((n) => {
      const d = n.data || {};

      // Compute display fact/color using fact_scores in elements
      const pick = pickDisplayFactAndColor(d, selectedOnlyFACT);
      d.display_fact = pick.fact;
      d.display_color = pick.color;

      // Enlarge nodes
      let sz = Number(d.size);
      if (!Number.isFinite(sz)) sz = 3.2;
      d.size = Math.max(NODE_SIZE_MIN, sz * NODE_SIZE_MULT);

      return { ...n, data: d };
    });

    buildCytoscape({ nodes: nodesNorm, edges });

    applyJaccardThreshold();
    applyFactFilterAndColors(true);

    console.log(
      `[word] loaded from ${DATASET.elements} nodes/edges:`,
      nodesNorm.length,
      edges.length,
      "layout: preset"
    );
  } catch (err) {
    console.error(err);
    if (elDetailBox) {
      elDetailBox.classList.remove("empty");
      elDetailBox.innerHTML = `<div class="detail-card"><b>Failed to load data.</b><div class="muted" style="margin-top:6px;">${escapeHtml(
        err?.message || String(err)
      )}</div></div>`;
    }
  } finally {
    hideLoading();
  }
}

// ----------------------------
// Events
// ----------------------------
function wireEvents() {
  if (elJaccardSlider) {
    elJaccardSlider.addEventListener("input", () => {
      applyJaccardThreshold();
      // Keep nodes visible, only edges filtered; recolor + visibility by FACT
      applyFactFilterAndColors(false);
    });
  }

  if (elFactCheckboxes) {
    elFactCheckboxes.addEventListener("change", () => {
      applyFactFilterAndColors(false);
    });
  }

  if (elEdgeWeightedToggle) {
    elEdgeWeightedToggle.addEventListener("change", () => {
      updateEdgeWeights();
    });
  }

  if (elValenceShadingToggle) {
    elValenceShadingToggle.addEventListener("change", () => {
      valenceShadingEnabled = !!elValenceShadingToggle.checked;
      // Recompute colors + hide NA valence nodes when enabled
      applyFactFilterAndColors(true);
    });
  }

  if (elClearSelectionBtn) {
    elClearSelectionBtn.addEventListener("click", () => resetFactSelectionToAll());
  }

  if (elSearchBtn) elSearchBtn.addEventListener("click", () => doSearch());

  if (elSearchInput) {
    elSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doSearch();
    });
  }

  if (elResetViewBtn) {
    elResetViewBtn.addEventListener("click", () => {
      if (!cy) return;
      clearSelection();
      cy.fit(cy.elements(":visible"), 70);
      cy.resize();
    });
  }
}

// ----------------------------
// Init
// ----------------------------
(function init() {
  wireEvents();

  if (elJaccardValue && elJaccardSlider) {
    elJaccardValue.textContent = Number(elJaccardSlider.value).toFixed(2);
  }

  // Initialize edge weight controls UI/state
  syncEdgeWeightControlUI();

  // Initialize valence shading controls UI/state
  syncValenceControlUI();

  loadWordNetwork();
})();
