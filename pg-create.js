/* ==============================
   LOGIN CHECK
============================== */
function logout() {
    localStorage.removeItem("legoUser");
    location.href = "index.html";
}

/* ==============================
   LOAD CSV (super fix)
============================== */
async function loadCSV(url) {
    const r = await fetch(url);
    let t = await r.text();

    t = t
        .replace(/^\uFEFF/, "")  // BOM
        .replace(/\r\n/g, "\n")  // CRLF → LF
        .replace(/\r/g, "\n");   // CR → LF

    return t.trim().split("\n").slice(1)
        .map(row => row.split(";").map(x => x.trim()))
        .filter(row => row.length > 1);
}

/* ==============================
   GLOBAL DATA
============================== */
let classi = [];
let speci = [];
let multi = [];
let gradi = [];
let livelli = [];
let statPrimarie = [];
let statSecondarie = [];

let stats = {};
let modSpecie = {};
let modClasse = {};
let puntiDisponibili = 0;

/* ==============================
   INIT
============================== */
async function init() {

    classi = await loadCSV("https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/classi.csv");
    speci  = await loadCSV("https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/speci.csv");
    multi  = await loadCSV("https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/multiversi-pg.csv");
    gradi  = await loadCSV("https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/gradi.csv");
    livelli = await loadCSV("https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/livelli.csv");
    statPrimarie = await loadCSV("https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/statistiche_primarie.csv");
    statSecondarie = await loadCSV("https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/statistiche_secondarie.csv");

    setupSelectors();
    setupPrimaryStats();
    updatePreview();
}

/* ==============================
   POPOLA SELECT
============================== */
function setupSelectors() {
    fillSelect("pg-class", classi);
    fillSelect("pg-specie", speci);
    fillSelect("pg-multi", multi);
    fillSelect("pg-grade", gradi);
    fillSelect("pg-lv", livelli);

    document.querySelectorAll("select").forEach(sel =>
        sel.addEventListener("change", updateAll)
    );
}

function fillSelect(id, arr) {
    const s = document.getElementById(id);
    arr.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r[0];
        opt.textContent = r[1];
        s.appendChild(opt);
    });
}

/* ==============================
   STAT PRIMARIE
============================== */
function setupPrimaryStats() {
    const area = document.getElementById("primaryStats");
    area.innerHTML = "";

    statPrimarie.forEach(row => {
        const id = row[0];
        const nome = row[1];

        stats[id] = 1;

        area.innerHTML += `
        <div class="stat-row">
            <span>⭐ ${nome}</span>

            <div class="stat-controls">
                <button class="stat-button" onclick="modifyStat('${id}', -1)">-</button>
                <span id="stat-${id}">1</span>
                <button class="stat-button" onclick="modifyStat('${id}', +1)">+</button>
            </div>
        </div>`;
    });
}

function modifyStat(id, delta) {
    if (delta > 0 && puntiDisponibili <= 0) return;

    stats[id] = Math.max(1, Math.min(25, stats[id] + delta));

    if (delta > 0) puntiDisponibili--;
    else puntiDisponibili++;

    document.getElementById("stat-" + id).textContent = stats[id];
    document.getElementById("points-left").textContent = puntiDisponibili;

    updateAll();
}

/* ==============================
   UPDATE ALL
============================== */
function updateAll() {
    updatePuntiStat();
    updatePreview();
}

/* calcolo punti stat disponibili */
function updatePuntiStat() {
    const gradeID = document.getElementById("pg-grade").value;
    const g = gradi.find(r => r[0] === gradeID);
    if (!g) return;

    const budget = parseInt(g[3]) || 0;
    const spesi = Object.values(stats).reduce((a, b) => a + (b - 1), 0);

    puntiDisponibili = budget - spesi;
    document.getElementById("points-left").textContent = puntiDisponibili;
}

/* ==============================
   PREVIEW UPDATE
============================== */
function updatePreview() {

    /* Header */
    const name = document.getElementById("pg-name").value || "---";
    const sp = document.getElementById("pg-specie").selectedOptions[0]?.text || "---";
    const cl = document.getElementById("pg-class").selectedOptions[0]?.text || "---";
    const lv = document.getElementById("pg-lv").value || "--";

    document.getElementById("prev-name").textContent = name;
    document.getElementById("prev-sub").textContent = `${sp} / ${cl} / Lv ${lv}`;

    /* MOD SPECIE */
    const idSpec = document.getElementById("pg-specie").value;
    const sRow = speci.find(r => r[0] === idSpec);
    modSpecie = sRow ? {
        FOR: parseInt(sRow[5]), DES: parseInt(sRow[6]),
        COS: parseInt(sRow[7]), INT: parseInt(sRow[8]),
        SAG: parseInt(sRow[9]), CAR: parseInt(sRow[10])
    } : { FOR:0,DES:0,COS:0,INT:0,SAG:0,CAR:0 };

    /* MOD CLASSE */
    const idCl = document.getElementById("pg-class").value;
    const cRow = classi.find(r => r[0] === idCl);
    modClasse = cRow ? {
        FOR: parseInt(cRow[10]), DES: parseInt(cRow[11]),
        COS: parseInt(cRow[12]), INT: parseInt(cRow[13]),
        SAG: parseInt(cRow[14]), CAR: parseInt(cRow[15])
    } : { FOR:0,DES:0,COS:0,INT:0,SAG:0,CAR:0 };

    /* MOD TOTALI */
    const primMods = {};
    statPrimarie.forEach(row => {
        const id = row[0];
        const nome = row[1];
        const val = stats[id];
        const base = Math.floor((val - 10) / 2);

        const key = nome.toUpperCase().slice(0,3); // FOR, DES, COS...
        const tot = base + (modSpecie[key]||0) + (modClasse[key]||0);

        primMods[key] = tot;
    });

    /* RENDER PRIMARIE */
    const primDiv = document.getElementById("preview-prim");
    primDiv.innerHTML = "";
    statPrimarie.forEach(row => {
        const nome = row[1];
        const key = nome.toUpperCase().slice(0,3);
        const icon = statIcon(key);

        primDiv.innerHTML += `
            <div class="preview-stat">
                <span class="icon">${icon}</span>
                <span>${nome}</span>
                <strong>${primMods[key]>=0?"+":""}${primMods[key]}</strong>
            </div>`;
    });

    /* SECONDARIE */
    const secDiv = document.getElementById("preview-sec");
    secDiv.innerHTML = "";

    statSecondarie.forEach(row => {
        const nome = row[1];
        let f = row[2];

        f = f.replace(/PVCLASSE/g, cRow ? parseInt(cRow[3]) : 0)
             .replace(/PECLASSE/g, cRow ? parseInt(cRow[4]) : 0)
             .replace(/PSCLASSE/g, cRow ? parseInt(cRow[5]) : 0)
             .replace(/VELCLASSE/g, cRow ? parseInt(cRow[6]) : 0)
             .replace(/LV/g, parseInt(lv)||0)
             .replace(/MOD_FOR/g, primMods["FOR"]||0)
             .replace(/MOD_DES/g, primMods["DES"]||0)
             .replace(/MOD_COS/g, primMods["COS"]||0)
             .replace(/MOD_INT/g, primMods["INT"]||0)
             .replace(/MOD_SAG/g, primMods["SAG"]||0)
             .replace(/MOD_CAR/g, primMods["CAR"]||0)
             .replace(/FOR/g, stats["STAT1_FOR"] || 1);

        let res = "?"

        try { res = eval(f); }
        catch(e){ res = "?"; }

        secDiv.innerHTML += `
            <div class="preview-stat secondary">
                <span class="icon">📘</span>
                <span>${nome}</span>
                <strong>${res}</strong>
            </div>`;
    });
}

/* Icone stat primarie */
function statIcon(key) {
    return {
        FOR:"💪",
        DES:"🎯",
        COS:"❤️",
        INT:"🧠",
        SAG:"👁️",
        CAR:"🗣️"
    }[key] || "⭐";
}

/* avvio */
init();
