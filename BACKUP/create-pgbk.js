// ===============================
// CARICAMENTO CSV
// ===============================

async function loadCSV(url) {
    const res = await fetch(url);
    const text = await res.text();

    // usa ; come separatore
    const rows = text.trim().split("\n").map(r => r.split(";"));

    return rows;
}

// Percorsi GitHub del DB
const DB = {
    specie: "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/speci.csv",
    classe: "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/classi.csv",
    multiverso: "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/multiversi-pg.csv",
    livello: "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/livelli.csv",
    grado: "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/gradi.csv",
    stat: "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/statistiche_primarie.csv"
};

// Variabili dati caricati
let specieData = [];
let classeData = [];
let multiversoData = [];
let livelloData = [];
let gradoData = [];
let statData = [];

// Oggetto statistiche (partono da 1)
let stats = {};
let puntiDisponibili = 0;


// ===============================
// INIZIALIZZAZIONE PAGINA
// ===============================

window.onload = async () => {

    specieData = await loadCSV(DB.specie);
    classeData = await loadCSV(DB.classe);
    multiversoData = await loadCSV(DB.multiverso);
    livelloData = await loadCSV(DB.livello);
    gradoData = await loadCSV(DB.grado);
    statData = await loadCSV(DB.stat);

    fillSelect("specie", specieData);
    fillSelect("classe", classeData);
    fillSelect("multiverso", multiversoData);
    fillSelect("livello", livelloData);
    fillSelect("grado", gradoData);

    // inizializza statistiche base a 1
    statData.slice(1).forEach(row => {
        stats[row[1]] = 1;
    });

    renderStats();
    updateEverything();
};


// ===============================
// RIEMPIMENTO SELECT
// ===============================

function fillSelect(id, data) {
    const select = document.getElementById(id);
    select.innerHTML = "";

    data.slice(1).forEach(row => {
        const opt = document.createElement("option");
        opt.value = row[0];
        opt.textContent = row[1];
        select.appendChild(opt);
    });
}


// ===============================
// RENDER STATISTICHE CON + / -
// ===============================

function renderStats() {
    const container = document.getElementById("statContainer");
    container.innerHTML = "";

    statData.slice(1).forEach(row => {
        const nome = row[1];

        const div = document.createElement("div");
        div.classList.add("stat-row");

        div.innerHTML = `
            <div><b>${nome}</b></div>
            <div class="stat-controls">

                <button class="stat-button" onclick="changeStat('${nome}', -1)">−</button>

                <span id="val-${nome}">${stats[nome]}</span>

                <button class="stat-button" onclick="changeStat('${nome}', +1)">+</button>

            </div>
        `;

        container.appendChild(div);
    });
}


// ===============================
// MODIFICA STAT
// ===============================

function changeStat(nome, delta) {
    const newVal = stats[nome] + delta;

    if (newVal < 1 || newVal > 18) return;

    // controlla budget punti
    const spesi = totalPointsSpent();
    if (delta > 0 && spesi >= puntiDisponibili) return;

    stats[nome] = newVal;

    document.getElementById(`val-${nome}`).textContent = newVal;

    updateEverything();
}


// ===============================
// CALCOLO MODIFICATORI
// ===============================

function modBase(stat) {
    return Math.floor((stat - 10) / 2);
}

function sumMods(statName) {
    const base = modBase(stats[statName]);

    const specieID = document.getElementById("specie").value;
    const classeID = document.getElementById("classe").value;

    const specieRow = specieData.find(r => r[0] === specieID);
    const classeRow = classeData.find(r => r[0] === classeID);

    const index = {
        "Forza": 5,
        "Destrezza": 6,
        "Costituzione": 7,
        "Intelligenza": 8,
        "Saggezza": 9,
        "Carisma": 10
    };

    const modSpecie = specieRow ? parseInt(specieRow[index[statName]]) : 0;
    const modClasse = classeRow ? parseInt(classeRow[index[statName] + 5]) : 0;

    return base + modSpecie + modClasse;
}


// ===============================
// PUNTI DISPONIBILI
// ===============================

function totalPointsSpent() {
    return Object.values(stats).reduce((s, v) => s + (v - 1), 0);
}

function updatePoints() {
    const gradoID = document.getElementById("grado").value;
    const gradoRow = gradoData.find(r => r[0] === gradoID);

    puntiDisponibili = gradoRow ? parseInt(gradoRow[3]) : 0;

    document.getElementById("puntiDispo").textContent =
        puntiDisponibili - totalPointsSpent();
}


// ===============================
// AGGIORNA TUTTO
// ===============================

function updateEverything() {
    updatePoints();
    updatePreview();
}


// ===============================
// ANTEPRIMA CARTA
// ===============================

function updatePreview() {
    const nome = document.getElementById("pgName").value || "Personaggio";

    const specie = document.getElementById("specie");
    const specieTxt = specie.options[specie.selectedIndex]?.text || "";

    const classe = document.getElementById("classe");
    const classeTxt = classe.options[classe.selectedIndex]?.text || "";

    const mult = document.getElementById("multiverso");
    const multTxt = mult.options[mult.selectedIndex]?.text || "";

    const livello = document.getElementById("livello");
    const livelloTxt = livello.options[livello.selectedIndex]?.text || "";

    const grado = document.getElementById("grado");
    const gradoTxt = grado.options[grado.selectedIndex]?.text || "";

    document.getElementById("preview-info").innerHTML = `
        <div style="font-size:1.6em; color:#e53e3e;">${nome}</div>
        <div><b>${specieTxt}</b> • <b>${classeTxt}</b></div>
        <div style="margin-top:4px;">${multTxt}</div>
        <div style="font-size:0.9em; opacity:0.8;">Lv ${livelloTxt} – ${gradoTxt}</div>
    `;

    // Stats nella carta
    const box = document.getElementById("preview-mods");
    box.innerHTML = "";

    Object.keys(stats).forEach(nome => {
        const val = stats[nome];
        const mod = sumMods(nome);

        const div = document.createElement("div");
        div.classList.add("mod-box");
        div.innerHTML = `
            <b>${nome}</b><br>
            ${val} (${mod >= 0 ? "+" : ""}${mod})
        `;
        box.appendChild(div);
    });
}


// ===============================
// EXPORT CSV
// ===============================

function downloadCSV() {
    const nome = document.getElementById("pgName").value || "PG_SenzaNome";

    let csv = "ID;NOME;SPECIE;CLASSE;MULTIVERSO;LIVELLO;GRADO";

    Object.keys(stats).forEach(s => {
        csv += `;${s};MOD_${s}`;
    });

    csv += "\n";

    csv += `0;${nome};${specie.value};${classe.value};${multiverso.value};${livello.value};${grado.value}`;

    Object.keys(stats).forEach(s => {
        csv += `;${stats[s]};${sumMods(s)}`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${nome}.csv`;
    a.click();
}


// ===============================
// LOGOUT
// ===============================

function logout() {
    localStorage.removeItem("legoUser");
    window.location.href = "index.html";
}
