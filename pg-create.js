// ======================================
// CONFIG
// ======================================
const BASE_PATH = "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/refs/heads/main/db/";

// CSV FILES
const CSV_GRADI = BASE_PATH + "gradi.csv";
const CSV_CLASSI = BASE_PATH + "classi.csv";
const CSV_SPECIE = BASE_PATH + "speci.csv";
const CSV_LIVELLI = BASE_PATH + "livelli.csv";
const CSV_MULTIVERSI = BASE_PATH + "multiversi-pg.csv";
const CSV_STAT_PRIMARIE = BASE_PATH + "statistiche_primarie.csv";
const CSV_STAT_SECONDARIE = BASE_PATH + "statistiche_secondarie.csv";

// ======================================
// GLOBAL DATA LOADED FROM CSV
// ======================================
let gradi = [];
let classi = [];
let specie = [];
let livelli = [];
let multiversi = [];
let statPrimarie = [];
let statSecondarie = [];

// ======================================
// LOAD CSV (generic)
// ======================================
async function loadCSV(url) {
    const response = await fetch(url);
    const text = await response.text();

    return text
        .trim()
        .split("\n")
        .slice(1) // skip headers
        .map(row => row.split(";"));
}

// ======================================
// INITIAL LOAD OF ALL CSV
// ======================================
async function init() {
    gradi = await loadCSV(CSV_GRADI);
    classi = await loadCSV(CSV_CLASSI);
    specie = await loadCSV(CSV_SPECIE);
    livelli = await loadCSV(CSV_LIVELLI);
    multiversi = await loadCSV(CSV_MULTIVERSI);
    statPrimarie = await loadCSV(CSV_STAT_PRIMARIE);
    statSecondarie = await loadCSV(CSV_STAT_SECONDARIE);

    populateSelect("pgClasse", classi, 1);
    populateSelect("pgSpecie", specie, 1);
    populateSelect("pgMultiverso", multiversi, 1);
    populateSelect("pgLivello", livelli, 1);
    populateSelect("pgGrado", gradi, 1);

    initializeStats();
}

init();

// ======================================
// POPULATE SELECT
// columnIndex = which column contains the display name
// ======================================
function populateSelect(selectId, data, columnIndex) {
    const select = document.getElementById(selectId);

    data.forEach(row => {
        const opt = document.createElement("option");
        opt.value = row[0];     // ID
        opt.textContent = row[columnIndex];
        select.appendChild(opt);
    });
}

// ======================================
// STAT PRIMARIE LOCAL STATE
// ======================================
let pgStats = {};
let pgMods = {};
let availablePoints = 0;

function initializeStats() {
    statPrimarie.forEach(stat => {
        let short = stat[1]; // NOME
        pgStats[short] = 1;  // stat base
        pgMods[short] = -4;  // (1 - 10) / 2 = -4
    });

    updateStatUI();
    updatePreviewCard();
}

// ======================================
// UPDATE AVAILABLE POINTS FROM GRADO
// ======================================
document.getElementById("pgGrado").addEventListener("change", () => {
    const gradeID = document.getElementById("pgGrado").value;
    const row = gradi.find(g => g[0] === gradeID);

    availablePoints = row ? parseInt(row[3]) : 0;
    updateStatUI();
    updatePreviewCard();
});

// ======================================
// MODIFY PRIMARY STAT
// ======================================
function modifyStat(short, delta) {
    let newValue = pgStats[short] + delta;

    if (newValue < 1) return;

    let spent = Object.values(pgStats).reduce((a, b) => a + (b - 1), 0);

    if (delta > 0 && spent >= availablePoints) return;
    if (newValue > 25) return;

    pgStats[short] = newValue;
    pgMods[short] = Math.floor((newValue - 10) / 2);

    updateStatUI();
    updatePreviewCard();
}

// ======================================
// UPDATE STAT LIST UI
// ======================================
function updateStatUI() {
    statPrimarie.forEach(stat => {
        let short = stat[1];
        document.getElementById(`val-${short}`).textContent = pgStats[short];
        document.getElementById(`mod-${short}`).textContent =
            (pgMods[short] >= 0 ? "+" : "") + pgMods[short];
    });

    // update remaining points
    let spent = Object.values(pgStats).reduce((a, b) => a + (b - 1), 0);
    document.getElementById("remainingPoints").textContent =
        availablePoints - spent;
}

// ======================================
// ICONS
// ======================================
const primaryIcons = {
    "FOR": "💪",
    "DES": "🎯",
    "COS": "🛡️",
    "INT": "🧠",
    "SAG": "👁️",
    "CAR": "💬"
};

const secondaryIcons = {
    "Punti Vita Massimi (PV Max)": "❤️",
    "Punti Energia Massimi (PE Max)": "🔵",
    "Punti Stamina Massimi (PS Max)": "💨",
    "Classe Armatura (CA)": "🛡️",
    "Iniziativa": "⚡",
    "Bonus Attacco Fisico": "👊",
    "Bonus Attacco Perforante": "🎯",
    "Bonus Attacco Magico": "🔮",
    "Bonus Stregonerie": "✨",
    "Tiro Salvezza Magico (TS Magico)": "🔮",
    "Tiro Salvezza Fisico (TS Fisico)": "🛡️",
    "Velocità (Movimento Base)": "🦶",
    "Capacità di Trasporto": "🎒",
    "Percezione Passiva": "👁️"
};

// ======================================
// CALCOLA STAT SECONDARIE
// ======================================
function calculateSecondaryStats() {
    const cls = classi.find(c => c[0] === document.getElementById("pgClasse").value);
    const lv = parseInt(document.getElementById("pgLivello").value || 1);

    const PVCLASSE = parseInt(cls?.[3] || 0);
    const PECLASSE = parseInt(cls?.[4] || 0);
    const PSCLASSE = parseInt(cls?.[5] || 0);
    const VELCLASSE = parseInt(cls?.[6] || 0);

    return [
        { name: "Punti Vita Massimi (PV Max)", value: PVCLASSE + lv * (2 + pgMods["COS"]) },
        { name: "Punti Energia Massimi (PE Max)", value: PECLASSE + lv * (2 + pgMods["INT"]) },
        { name: "Punti Stamina Massimi (PS Max)", value: PSCLASSE + (pgMods["COS"] + pgMods["FOR"]) + lv },
        { name: "Classe Armatura (CA)", value: 10 + pgMods["DES"] },
        { name: "Iniziativa", value: pgMods["DES"] },
        { name: "Bonus Attacco Fisico", value: pgMods["FOR"] },
        { name: "Bonus Attacco Perforante", value: pgMods["DES"] },
        { name: "Bonus Attacco Magico", value: pgMods["INT"] },
        { name: "Bonus Stregonerie", value: pgMods["SAG"] },
        { name: "Tiro Salvezza Magico (TS Magico)", value: pgMods["SAG"] },
        { name: "Tiro Salvezza Fisico (TS Fisico)", value: pgMods["COS"] },
        { name: "Velocità (Movimento Base)", value: VELCLASSE },
        { name: "Capacità di Trasporto", value: pgStats["FOR"] * 5 },
        { name: "Percezione Passiva", value: 10 + pgMods["SAG"] }
    ];
}

// ======================================
// UPDATE PREVIEW CARD FULL
// ======================================
function updatePreviewCard() {

    const card = document.getElementById("previewCard");
    card.innerHTML = "";

    const name = document.getElementById("pgName").value || "NUOVO PERSONAGGIO";

    const speciesName =
        specie.find(s => s[0] === document.getElementById("pgSpecie").value)?.[1] || "?";

    const className =
        classi.find(c => c[0] === document.getElementById("pgClasse").value)?.[1] || "?";

    const multiversoName =
        multiversi.find(m => m[0] === document.getElementById("pgMultiverso").value)?.[1] || "?";

    const lv = document.getElementById("pgLivello").value || "?";

    // HEADER
    const header = document.createElement("div");
    header.classList.add("preview-header");
    header.innerHTML = `
        <h2>${name}</h2>
        <p>${speciesName} • ${className} • ${multiversoName} • Lv ${lv}</p>
    `;

    card.appendChild(header);

    // PRIMARY STATS BLOCK
    let primHTML = "";
    statPrimarie.forEach(stat => {
        let short = stat[1];
        primHTML += `
            <div class="preview-stat">
                <span class="icon">${primaryIcons[short]}</span>
                <span>${short}: ${pgStats[short]}</span>
                <span class="mod">(${pgMods[short] >= 0 ? "+" : ""}${pgMods[short]})</span>
            </div>
        `;
    });

    const primBlock = document.createElement("div");
    primBlock.classList.add("preview-block");
    primBlock.innerHTML = `<h3>Statistiche Primarie</h3>${primHTML}`;
    card.appendChild(primBlock);

    // SECONDARY STATS BLOCK
    const sec = calculateSecondaryStats();
    let secHTML = "";

    sec.forEach(stat => {
        secHTML += `
            <div class="preview-stat secondary">
                <span class="icon">${secondaryIcons[stat.name]}</span>
                <span>${stat.name}: <strong>${stat.value}</strong></span>
            </div>
        `;
    });

    const secBlock = document.createElement("div");
    secBlock.classList.add("preview-block");
    secBlock.innerHTML = `<h3>Statistiche Secondarie</h3>${secHTML}`;
    card.appendChild(secBlock);
}
