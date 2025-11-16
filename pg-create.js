/* =====================================================
   CARICAMENTO CSV
===================================================== */

async function loadCSV(url) {
    const res = await fetch(url);
    const text = await res.text();
    return text.trim().split("\n").map(r => r.split(";"));
}

const DB = {
    specie: "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/speci.csv",
    classe: "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/classi.csv",
    multiverso: "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/multiversi-pg.csv",
    livello: "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/livelli.csv",
    grado: "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/gradi.csv",
    stat: "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/statistiche_primarie.csv",
    stat2: "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/statistiche_secondarie.csv"
};

let specieData = [];
let classeData = [];
let multiversoData = [];
let livelloData = [];
let gradoData = [];
let statData = [];
let stat2Data = [];

let stats = {};
let puntiDisponibili = 0;


/* =====================================================
   INIZIALIZZAZIONE
===================================================== */

window.onload = async () => {
    specieData = await loadCSV(DB.specie);
    classeData = await loadCSV(DB.classe);
    multiversoData = await loadCSV(DB.multiverso);
    livelloData = await loadCSV(DB.livello);
    gradoData = await loadCSV(DB.grado);
    statData = await loadCSV(DB.stat);
    stat2Data = await loadCSV(DB.stat2);

    fillSelect("specie", specieData);
    fillSelect("classe", classeData);
    fillSelect("multiverso", multiversoData);
    fillSelect("livello", livelloData);
    fillSelect("grado", gradoData);

    // inizializza stat primarie = 1
    statData.slice(1).forEach(r => stats[r[1]] = 1);

    renderStats();
    updateEverything();
};


/* =====================================================
   SELECT DINAMICHE
===================================================== */

function fillSelect(id, data) {
    const sel = document.getElementById(id);
    sel.innerHTML = "";

    data.slice(1).forEach(r => {
        const opt = document.createElement("option");
        opt.value = r[0];
        opt.textContent = r[1];
        sel.appendChild(opt);
    });
}



/* =====================================================
   STATISTICHE PRIMARIE
===================================================== */

function renderStats() {
    const c = document.getElementById("statContainer");
    c.innerHTML = "";

    statData.slice(1).forEach(row => {
        const nome = row[1];

        c.innerHTML += `
        <div class="stat-row">
            <b>${nome}</b>

            <div class="stat-controls">
                <button class="stat-button" onclick="changeStat('${nome}',-1)">−</button>
                <span id="val-${nome}">${stats[nome]}</span>
                <button class="stat-button" onclick="changeStat('${nome}',1)">+</button>
            </div>
        </div>
        `;
    });
}

function changeStat(nome, delta) {
    let newVal = stats[nome] + delta;
    if (newVal < 1 || newVal > 25) return;

    const spesi = totalPointsSpent();
    if (delta > 0 && spesi >= puntiDisponibili) return;

    stats[nome] = newVal;
    document.getElementById(`val-${nome}`).textContent = newVal;

    updateEverything();
}



/* =====================================================
   MODIFICATORI
===================================================== */

function modBase(stat) {
    return Math.floor((stat - 10) / 2);
}

function sumMods(statName) {

    const base = modBase(stats[statName]);

    const specieID = document.getElementById("specie").value;
    const classeID = document.getElementById("classe").value;

    const rowS = specieData.find(r => r[0] === specieID);
    const rowC = classeData.find(r => r[0] === classeID);

    const index = {
        "Forza": 5, "Destrezza": 6, "Costituzione": 7,
        "Intelligenza": 8, "Saggezza": 9, "Carisma": 10
    };

    const modSpecie = rowS ? parseInt(rowS[index[statName]] || 0) : 0;
    const modClasse = rowC ? parseInt(rowC[index[statName] + 5] || 0) : 0;

    return base + modSpecie + modClasse;
}



/* =====================================================
   MOTORE DI CALCOLO FORMULE SECONDARIE
===================================================== */

function calculateFormula(formula, vars) {
    let f = formula;

    // sostituisci tutte le variabili
    Object.keys(vars).forEach(key => {
        const regex = new RegExp("\\b" + key + "\\b", "g");
        f = f.replace(regex, vars[key]);
    });

    try {
        return eval(f);
    } catch (e) {
        console.warn("Formula non valida:", formula);
        return "?";
    }
}

function computeSecondaryStats() {

    // dati base per calcoli
    const classeID = document.getElementById("classe").value;
    const classeRow = classeData.find(r => r[0] === classeID);

    const vars = {
        FOR: stats.Forza,
        DES: stats.Destrezza,
        COS: stats.Costituzione,
        INT: stats.Intelligenza,
        SAG: stats.Saggezza,
        CAR: stats.Carisma,

        MOD_FOR: sumMods("Forza"),
        MOD_DES: sumMods("Destrezza"),
        MOD_COS: sumMods("Costituzione"),
        MOD_INT: sumMods("Intelligenza"),
        MOD_SAG: sumMods("Saggezza"),
        MOD_CAR: sumMods("Carisma"),

        LV: parseInt(document.getElementById("livello").value.replace(/\D/g, "")) || 1,

        PVCLASSE: parseInt(classeRow[3]) || 0,
        PECLASSE: parseInt(classeRow[4]) || 0,
        PSCLASSE: parseInt(classeRow[5]) || 0,
        VELCLASSE: parseInt(classeRow[6]) || 0,
    };

    const res = {};

    stat2Data.slice(1).forEach(row => {
        const nome = row[1];
        const formula = row[2];

        res[nome] = calculateFormula(formula, vars);
    });

    return res;
}



/* =====================================================
   PUNTI DISPONIBILI
===================================================== */

function totalPointsSpent() {
    return Object.values(stats).reduce((s, v) => s + (v - 1), 0);
}

function updatePoints() {
    const gID = document.getElementById("grado").value;
    const gRow = gradoData.find(r => r[0] === gID);
    puntiDisponibili = gRow ? parseInt(gRow[3]) : 0;

    document.getElementById("puntiDispo").textContent =
        puntiDisponibili - totalPointsSpent();
}



/* =====================================================
   AGGIORNA TUTTO
===================================================== */

function updateEverything() {
    updatePoints();
    updatePreview();
}



/* =====================================================
   ANTEPRIMA CARTA
===================================================== */

function updatePreview() {

    const nome = document.getElementById("pgName").value || "Personaggio";

    const specieTxt = specie.options[specie.selectedIndex].text;
    const classeTxt = classe.options[classe.selectedIndex].text;
    const multTxt = multiverso.options[multiverso.selectedIndex].text;
    const livTxt = livello.options[livello.selectedIndex].text;
    const gradoTxt = grado.options[grado.selectedIndex].text;

    document.getElementById("preview-info").innerHTML = `
        <div style="font-size:1.6em; color:#e53e3e;">${nome}</div>
        <div><b>${specieTxt}</b> • <b>${classeTxt}</b></div>
        <div style="margin-top:4px;">${multTxt}</div>
        <div style="font-size:0.9em; opacity:0.8;">Lv ${livTxt} – ${gradoTxt}</div>
    `;

    /* --- STAT PRIMARIE --- */
    const box = document.getElementById("preview-mods");
    box.innerHTML = "";

    Object.keys(stats).forEach(s => {
        const val = stats[s];
        const mod = sumMods(s);

        box.innerHTML += `
            <div class="mod-box">
                <b>${s}</b><br>
                ${val} (${mod >= 0 ? "+" : ""}${mod})
            </div>
        `;
    });

    /* --- STAT SECONDARIE --- */
    const secBox = document.getElementById("preview-secondary");
    secBox.innerHTML = "";

    const sec = computeSecondaryStats();

    Object.keys(sec).forEach(nome => {
        secBox.innerHTML += `
            <div class="mod-box">
                <b>${nome}</b><br>${sec[nome]}
            </div>
        `;
    });
}



/* =====================================================
   LOGOUT
===================================================== */

function logout() {
    localStorage.removeItem("legoUser");
    window.location.href = "index.html";
}
