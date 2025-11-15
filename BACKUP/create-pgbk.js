/* ====== VARIABILI GLOBALI ====== */
let statsBase = {};
let puntiDisponibili = 0;
let specieData = [];
let classeData = [];
let livelloData = [];
let gradoData = [];
let multiversoData = [];
let statPrimarieList = [];

const MAX_STAT = 18;
const MIN_STAT = 1;

/* ====== FUNZIONE GENERICA CSV ====== */
async function loadCSV(url) {
    const res = await fetch(url);
    const text = await res.text();
    const rows = text.trim().split("\n").map(r => r.split(";"));
    return rows;
}

/* ====== INIZIALIZZAZIONE ====== */
async function init() {

    specieData = await loadCSV("db/speci.csv");
    classeData = await loadCSV("db/classi.csv");
    livelloData = await loadCSV("db/livelli.csv");
    gradoData = await loadCSV("db/gradi.csv");
    multiversoData = await loadCSV("db/multiversi-pg.csv");
    statPrimarieList = await loadCSV("db/statistiche_primarie.csv");

    fillSelect("specie", specieData);
    fillSelect("classe", classeData);
    fillSelect("livello", livelloData);
    fillSelect("grado", gradoData);
    fillSelect("multiverso", multiversoData);

    createStatControls();
    updateEverything();
}

function fillSelect(id, data) {
    const sel = document.getElementById(id);
    sel.innerHTML = "";
    for (let i = 1; i < data.length; i++) {
        sel.innerHTML += `<option value="${i}">${data[i][1]}</option>`;
    }
}

/* ====== CREAZIONE CONTROLLI STAT ====== */
function createStatControls() {
    const box = document.getElementById("statContainer");
    box.innerHTML = "";

    statsBase = {};

    statPrimarieList.slice(1).forEach(row => {
        const id = row[0];
        const nome = row[1];

        statsBase[nome] = 1;

        box.innerHTML += `
            <div class="stat-row">
                <span>${nome}</span>
                <div class="stat-controls">
                    <button class="stat-btn" onclick="modifyStat('${nome}', -1)">−</button>
                    <span class="stat-value" id="val-${nome}">1</span>
                    <button class="stat-btn" onclick="modifyStat('${nome}', 1)">+</button>
                </div>
            </div>
        `;
    });
}

/* ====== AGGIUSTAMENTO STAT ====== */
function modifyStat(nome, delta) {
    let newVal = statsBase[nome] + delta;

    if (newVal < MIN_STAT) newVal = MIN_STAT;
    if (newVal > MAX_STAT) newVal = MAX_STAT;

    // controllo budget punti
    const spesi = totalPointsSpent(newVal, nome);
    if (spesi > puntiDisponibili) return;

    statsBase[nome] = newVal;
    document.getElementById("val-" + nome).textContent = newVal;

    updateEverything();
}

function totalPointsSpent(tempValue = null, statName = null) {
    let tot = 0;
    Object.keys(statsBase).forEach(k => {
        let v = (k === statName && tempValue !== null) ? tempValue : statsBase[k];
        tot += (v - 1);
    });
    return tot;
}

/* ====== CALCOLA MOD ====== */
function calcMod(stat) {
    return Math.floor((stat - 10) / 2);
}

/* ====== RECUPERO MOD SPECIE + CLASSE ====== */
function getSpecieMods() {
    const idx = document.getElementById("specie").value;
    const row = specieData[idx];
    return {
        FOR: Number(row[5]),
        DES: Number(row[6]),
        COS: Number(row[7]),
        INT: Number(row[8]),
        SAG: Number(row[9]),
        CAR: Number(row[10])
    };
}

function getClasseMods() {
    const idx = document.getElementById("classe").value;
    const row = classeData[idx];
    return {
        FOR: Number(row[10]),
        DES: Number(row[11]),
        COS: Number(row[12]),
        INT: Number(row[13]),
        SAG: Number(row[14]),
        CAR: Number(row[15])
    };
}

/* ====== UPDATE COMPLETO ====== */
function updateEverything() {

    const gradoId = document.getElementById("grado").value;
    puntiDisponibili = Number(gradoData[gradoId][3]);

    const spesi = totalPointsSpent();
    document.getElementById("puntiDispo").textContent = puntiDisponibili - spesi;

    updatePreview();
}

/* ====== ANTEPRIMA TCG ====== */
function updatePreview() {

    const name = document.getElementById("pgName").value || "—";
    const specie = specieData[document.getElementById("specie").value][1];
    const classe = classeData[document.getElementById("classe").value][1];
    const mult = multiversoData[document.getElementById("multiverso").value][1];
    const lv = livelloData[document.getElementById("livello").value][1];
    const grado = gradoData[document.getElementById("grado").value][1];

    // Mod
    const sm = getSpecieMods();
    const cm = getClasseMods();

    const previewInfo = `
        <h1>${name}</h1>
        <div class="preview-meta">${specie} • ${classe}</div>
        <div class="preview-meta">Multiverso: ${mult}</div>
        <div class="preview-meta">Livello ${lv} • Grado ${grado}</div>
    `;
    document.getElementById("preview-info").innerHTML = previewInfo;

    let modsHTML = `<div class="stats-grid">`;

    statPrimarieList.slice(1).forEach(row => {
        const nome = row[1];
        const val = statsBase[nome];
        const baseMod = calcMod(val);

        const totalMod =
            baseMod +
            (sm[nome.toUpperCase()] || 0) +
            (cm[nome.toUpperCase()] || 0);

        modsHTML += `
            <div class="stat-box">
                ${nome}<br>
                <span>${val}</span>
                <div class="mod-value">${totalMod >= 0 ? "+" : ""}${totalMod}</div>
            </div>
        `;
    });

    modsHTML += `</div>`;
    document.getElementById("preview-mods").innerHTML = modsHTML;
}

/* ====== SALVA CSV ====== */
function downloadCSV() {
    alert("Funzione download CSV in preparazione");
}

/* ====== LOGOUT ====== */
function logout() {
    localStorage.removeItem("legoUser");
    window.location.href = "index.html";
}

init();
