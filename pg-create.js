/* ------------------------------------------------------
   GITHUB SETTINGS
------------------------------------------------------ */
const base = "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/refs/heads/main/db/";

const files = {
  specie: "speci.csv",
  classe: "classi.csv",
  multiverso: "multiversi-pg.csv",
  livello: "livelli.csv",
  grado: "gradi.csv",
  stats: "statistiche_primarie.csv",
  pg: "pg-database.csv"
};

/* ------------------------------------------------------
   GLOBAL DATA
------------------------------------------------------ */
let specieData = [];
let classeData = [];
let multiversoData = [];
let livelloData = [];
let gradoData = [];
let statsPrimarie = [];
let pgDatabase = [];

let puntiDisponibili = 0;
let valoriStats = {}; 


/* ------------------------------------------------------
   CSV PARSER
------------------------------------------------------ */
async function loadCSV(url) {
  const response = await fetch(url);
  const txt = await response.text();
  return txt
    .split("\n")
    .map(r => r.trim())
    .filter(r => r.length > 0)
    .map(r => r.split(";"));
}

/* ------------------------------------------------------
   INIT
------------------------------------------------------ */
async function init() {
  specieData = await loadCSV(base + files.specie);
  classeData = await loadCSV(base + files.classe);
  multiversoData = await loadCSV(base + files.multiverso);
  livelloData = await loadCSV(base + files.livello);
  gradoData = await loadCSV(base + files.grado);
  statsPrimarie = await loadCSV(base + files.stats);
  pgDatabase = await loadCSV(base + files.pg);

  fillSelect("specie", specieData);
  fillSelect("classe", classeData);
  fillSelect("multiverso", multiversoData);
  fillSelect("livello", livelloData);
  fillSelect("grado", gradoData);

  setupStats();
  updatePreview();
}

/* ------------------------------------------------------
   SELECT BUILDER
------------------------------------------------------ */
function fillSelect(id, data) {
  const select = document.getElementById(id);
  select.innerHTML = "";

  data.slice(1).forEach(row => {
    const opt = document.createElement("option");
    opt.value = row[0];
    opt.textContent = row[1]; 
    select.appendChild(opt);
  });

  select.addEventListener("change", updatePreview);
}

/* ------------------------------------------------------
   SETUP STATS
------------------------------------------------------ */
function setupStats() {
  const container = document.getElementById("statContainer");
  container.innerHTML = "";
  valoriStats = {};

  statsPrimarie.slice(1).forEach(stat => {
    const nome = stat[1];
    valoriStats[nome] = 8; 

    const card = document.createElement("div");
    card.className = "stat-card";

    card.innerHTML = `
      <h3>${nome}</h3>
      <p>Valore: <b id="val-${nome}">8</b></p>
      <p>Mod: <b id="mod-${nome}">-1</b></p>

      <div class="stat-controls">
        <button class="add" onclick="addStat('${nome}')">+</button>
        <button class="remove" onclick="removeStat('${nome}')">-</button>
      </div>
    `;

    container.appendChild(card);
  });

  updatePreview();
}

/* ------------------------------------------------------
   ADD / REMOVE STATS
------------------------------------------------------ */
function addStat(stat) {
  if (puntiDisponibili <= 0) return;
  valoriStats[stat]++;
  puntiDisponibili--;
  updateStatsUI(stat);
}

function removeStat(stat) {
  if (valoriStats[stat] <= 1) return;
  valoriStats[stat]--;
  puntiDisponibili++;
  updateStatsUI(stat);
}

function updateStatsUI(stat) {
  const val = valoriStats[stat];
  const mod = Math.floor((val - 10) / 2);

  document.getElementById("val-" + stat).textContent = val;
  document.getElementById("mod-" + stat).textContent = mod;
  document.getElementById("puntiDispo").textContent = puntiDisponibili;

  updatePreview();
}

/* ------------------------------------------------------
   PREVIEW STYLE CARTA
------------------------------------------------------ */
function updatePreview() {
  const nome = document.getElementById("pgName").value || "—";

  const specieID = document.getElementById("specie").value;
  const classeID = document.getElementById("classe").value;
  const multivID = document.getElementById("multiverso").value;
  const lvlID = document.getElementById("livello").value;
  const gradoID = document.getElementById("grado").value;

  // PUNTI DISPONIBILI DAL GRADO
  const gRow = gradoData.find(r => r[0] == gradoID);
  puntiDisponibili = parseInt(gRow[3]);
  document.getElementById("puntiDispo").textContent = puntiDisponibili;

  /* --- PREVIEW INFO --- */
  let html = `
    <div class="preview-row">
      <div class="preview-label">Nome</div>
      <div>${nome}</div>
    </div>

    <div class="preview-row">
      <div class="preview-label">👤 Specie</div>
      <div>${document.getElementById("specie").selectedOptions[0].textContent}</div>
    </div>

    <div class="preview-row">
      <div class="preview-label">🧱 Classe</div>
      <div>${document.getElementById("classe").selectedOptions[0].textContent}</div>
    </div>

    <div class="preview-row">
      <div class="preview-label">🌌 Multiverso</div>
      <div>${document.getElementById("multiverso").selectedOptions[0].textContent}</div>
    </div>

    <div class="preview-row">
      <div class="preview-label">🔢 Livello</div>
      <div>${document.getElementById("livello").selectedOptions[0].textContent}</div>
    </div>

    <div class="preview-row">
      <div class="preview-label">🎖️ Grado</div>
      <div>${document.getElementById("grado").selectedOptions[0].textContent}</div>
    </div>

    <h3 style="margin-top:20px;color:var(--lego-blue)">Statistiche</h3>
  `;

  /* --- ICONS FOR STATS --- */
  const icone = {
    "Forza": "💪",
    "Destrezza": "🎯",
    "Costituzione": "🛡️",
    "Intelligenza": "🧠",
    "Saggezza": "👁️",
    "Carisma": "😎"
  };

  for (const stat in valoriStats) {
    const val = valoriStats[stat];
    const mod = Math.floor((val - 10) / 2);
    const modText = mod >= 0 ? "+" + mod : mod;

    html += `
      <div class="stat-line">
        <div><span class="stat-icon">${icone[stat]}</span>${stat}: <b>${val}</b></div>
        <div class="stat-mod">${modText}</div>
      </div>
    `;
  }

  document.getElementById("preview").innerHTML = html;
}

/* ------------------------------------------------------
   SAVE / DOWNLOAD PG DATABASE
------------------------------------------------------ */
function downloadCSV() {
  const nome = document.getElementById("pgName").value.trim();
  if (!nome) {
    alert("Il nome non può essere vuoto.");
    return;
  }

  const nuovoID = "PG" + (pgDatabase.length);

  const row = [
    nuovoID,
    nome,
    document.getElementById("specie").value,
    document.getElementById("classe").value,
    document.getElementById("multiverso").value,
    document.getElementById("livello").value,
    document.getElementById("grado").value,
    ...Object.values(valoriStats)
  ];

  pgDatabase.push(row);

  const csv = pgDatabase.map(r => r.join(";")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "pg-database.csv";
  a.click();
}

/* ------------------------------------------------------
   LOGOUT
------------------------------------------------------ */
function logout() {
  localStorage.removeItem("legoUser");
  window.location.href = "index.html";
}

/* ------------------------------------------------------
   START
------------------------------------------------------ */
init();
