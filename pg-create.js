// Percorsi dei CSV
const BASE_URL = "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/";

const FILES = {
  specie: "speci.csv",
  classi: "classi.csv",
  gradi: "gradi.csv",
  livelli: "livelli.csv",
  multiversi: "multiversi-pg.csv"
};

// lista stats
const stats = ["for", "des", "cos", "int", "sag", "car"];

// valori iniziali = 1
let statValues = {
  for: 1,
  des: 1,
  cos: 1,
  int: 1,
  sag: 1,
  car: 1
};

// dati CSV
let specieData = [];
let classiData = [];
let gradiData = [];
let livelliData = [];
let multiversiData = [];

// punti del grado
let puntiTotali = 0;
let puntiRestanti = 0;


//-----------------------------
// 🟡 CARICA CSV
//-----------------------------
async function loadCSV(name) {
  const res = await fetch(BASE_URL + name);
  const text = await res.text();
  return text.trim().split("\n").map(r => r.split(";"));
}

function fillSelect(id, data) {
  const sel = document.getElementById(id);
  sel.innerHTML = "";

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] || !row[1]) continue;
    const opt = document.createElement("option");
    opt.value = row[0];
    opt.textContent = row[1];
    sel.appendChild(opt);
  }
}


//-----------------------------
// 🟡 CALCOLO PUNTI DISPONIBILI
//-----------------------------
function aggiornaPuntiDaGrado() {
  const gradoId = document.getElementById("grado").value;
  const row = gradiData.find(r => r[0] === gradoId);

  puntiTotali = row ? parseInt(row[3]) || 0 : 0;

  let spent = 0;
  for (const s of stats) {
    spent += Math.max(0, statValues[s] - 1);
  }

  puntiRestanti = Math.max(0, puntiTotali - spent);
  document.getElementById("puntiDispo").textContent = puntiRestanti;
}


//-----------------------------
// 🟡 MODIFICA STAT
//-----------------------------
function modificaStat(stat, delta) {
  let current = statValues[stat];

  if (delta > 0) {
    if (puntiRestanti <= 0) return;
    if (current >= 18) return;
    current++;
    statValues[stat] = current;
    puntiRestanti--;
  } else {
    if (current <= 1) return;
    current--;
    statValues[stat] = current;
    if (current >= 1) puntiRestanti++;
  }

  document.getElementById("stat-" + stat).value = current;
  document.getElementById("puntiDispo").textContent = puntiRestanti;
  aggiornaTutto();
}


//-----------------------------
// 🟡 CALCOLO MODIFICATORI TOTALI
//-----------------------------
function calculateTotalModifiers() {
  const base = v => Math.floor((v - 10) / 2);

  const specieId = document.getElementById("specie").value;
  const specieRow = specieData.find(r => r[0] === specieId);
  const specieMods = specieRow ? {
    for: parseInt(specieRow[5]) || 0,
    des: parseInt(specieRow[6]) || 0,
    cos: parseInt(specieRow[7]) || 0,
    int: parseInt(specieRow[8]) || 0,
    sag: parseInt(specieRow[9]) || 0,
    car: parseInt(specieRow[10]) || 0
  } : { for:0,des:0,cos:0,int:0,sag:0,car:0 };

  const classeId = document.getElementById("classe").value;
  const classeRow = classiData.find(r => r[0] === classeId);
  const classeMods = classeRow ? {
    for: parseInt(classeRow[10]) || 0,
    des: parseInt(classeRow[11]) || 0,
    cos: parseInt(classeRow[12]) || 0,
    int: parseInt(classeRow[13]) || 0,
    sag: parseInt(classeRow[14]) || 0,
    car: parseInt(classeRow[15]) || 0
  } : { for:0,des:0,cos:0,int:0,sag:0,car:0 };

  const totals = {};

  for (const s of stats) {
    totals[s] = base(statValues[s]) + specieMods[s] + classeMods[s];
    const el = document.getElementById("mod-" + s);
    if (el) el.textContent = totals[s] >= 0 ? "+" + totals[s] : totals[s];
  }

  return totals;
}


//-----------------------------
// 🟡 PREVIEW
//-----------------------------
function renderPreview(mods) {
  const nome = document.getElementById("pgName").value || "—";

  const getText = id => {
    const sel = document.getElementById(id);
    if (!sel) return "—";
    return sel.options[sel.selectedIndex]?.text || "—";
  };

  const infoHtml = `
    <div class="stat-line"><span>👤 Nome</span><b>${nome}</b></div>
    <div class="stat-line"><span>🧬 Specie</span><b>${getText("specie")}</b></div>
    <div class="stat-line"><span>⚔️ Classe</span><b>${getText("classe")}</b></div>
    <div class="stat-line"><span>🌌 Multiverso</span><b>${getText("multiverso")}</b></div>
    <div class="stat-line"><span>⭐ Livello</span><b>${getText("livello")}</b></div>
    <div class="stat-line"><span>🏅 Grado</span><b>${getText("grado")}</b></div>
  `;
  document.getElementById("preview-info").innerHTML = infoHtml;

  const icons = {
    for: "💪",
    des: "🎯",
    cos: "🛡️",
    int: "🧠",
    sag: "👁️",
    car: "😎"
  };

  let modsHtml = "";
  for (const s of stats) {
    modsHtml += `
      <div class="mod-box">
        <div class="mod-title">${icons[s]} ${s.toUpperCase()}</div>
        <div class="mod-value">${statValues[s]} (${mods[s] >= 0 ? "+" + mods[s] : mods[s]})</div>
      </div>
    `;
  }

  document.getElementById("preview-mods").innerHTML = modsHtml;
}


//-----------------------------
// 🟡 AGGIORNA TUTTO
//-----------------------------
function aggiornaTutto() {
  aggiornaPuntiDaGrado();
  const mods = calculateTotalModifiers();
  renderPreview(mods);
}


//-----------------------------
// 🟡 INIT
//-----------------------------
async function init() {
  const container = document.getElementById("statContainer");

  stats.forEach(s => {
    const div = document.createElement("div");
    div.className = "stat-card";

    div.innerHTML = `
      <h3>${s.toUpperCase()}</h3>
      <div class="stat-controls">
        <button class="stat-btn" onclick="modificaStat('${s}', -1)">−</button>
        <input id="stat-${s}" type="text" value="1" readonly>
        <button class="stat-btn" onclick="modificaStat('${s}', 1)">+</button>
      </div>
      <div class="stat-mod-label">Mod:</div>
      <div class="stat-mod-value" id="mod-${s}">0</div>
    `;

    container.appendChild(div);
  });

  // carica csv
  [
    specieData,
    classiData,
    gradiData,
    livelliData,
    multiversiData
  ] = await Promise.all([
    loadCSV(FILES.specie),
    loadCSV(FILES.classi),
    loadCSV(FILES.gradi),
    loadCSV(FILES.livelli),
    loadCSV(FILES.multiversi)
  ]);

  fillSelect("specie", specieData);
  fillSelect("classe", classiData);
  fillSelect("grado", gradiData);
  fillSelect("livello", livelliData);
  fillSelect("multiverso", multiversiData);

  ["specie", "classe", "livello", "multiverso", "pgName"].forEach(id => {
    document.getElementById(id).addEventListener("change", aggiornaTutto);
    document.getElementById(id).addEventListener("input", aggiornaTutto);
  });

  document.getElementById("grado").addEventListener("change", () => {
    aggiornaPuntiDaGrado();
    aggiornaTutto();
  });

  aggiornaTutto();
}

window.addEventListener("load", init);


//-----------------------------
// 🟡 SALVA CSV
//-----------------------------
function downloadCSV() {
  const nome = document.getElementById("pgName").value || "PG_senza_nome";

  const row = [
    nome,
    document.getElementById("specie").value,
    document.getElementById("classe").value,
    document.getElementById("multiverso").value,
    document.getElementById("livello").value,
    document.getElementById("grado").value,
    statValues.for,
    statValues.des,
    statValues.cos,
    statValues.int,
    statValues.sag,
    statValues.car
  ];

  const header = [
    "NOME","SPECIE_ID","CLASSE_ID","MULTIVERSO_ID","LIVELLO_ID","GRADO_ID",
    "FOR","DES","COS","INT","SAG","CAR"
  ];

  const csv = header.join(";") + "\n" + row.join(";");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome.replace(/ /g, "_") + "_pg.csv";
  a.click();
  URL.revokeObjectURL(url);
}


//-----------------------------
// 🟡 LOGOUT
//-----------------------------
function logout() {
  localStorage.removeItem("legoUser");
  window.location.href = "index.html";
}
