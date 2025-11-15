//-------------------------------------------------------------
// CONFIG
//-------------------------------------------------------------
const BASE_URL = "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/";

const FILE_CLASSI = "classi.csv";
const FILE_GRADI = "gradi.csv";
const FILE_SPECIE = "speci.csv";
const FILE_LIVELLI = "livelli.csv";
const FILE_MULTIVERSO = "multiversi-pg.csv";

// dati caricati
let classiData=[], gradiData=[], specieData=[], livelliData=[], multiversiData=[];

// stat
let puntiDisponibili = 0;


//-------------------------------------------------------------
// CARICA CSV (robusto)
//-------------------------------------------------------------
async function caricaCSV(nome) {
    const res = await fetch(BASE_URL + nome);
    const txt = await res.text();
    return txt.trim().split("\n").map(r => r.split(";"));
}


//-------------------------------------------------------------
// POPOLA SELECT (solo colonne valide)
//-------------------------------------------------------------
function popolaSelect(select, data) {
    if (!select || data.length < 2) return;

    select.innerHTML = "";

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0] || !row[1]) continue; // evita righe rotte

        const opt = document.createElement("option");
        opt.value = row[0];
        opt.textContent = row[1].trim();
        select.appendChild(opt);
    }
}


//-------------------------------------------------------------
// CARICA TUTTI I CSV
//-------------------------------------------------------------
async function init() {
    specieData = await caricaCSV(FILE_SPECIE);
    classiData = await caricaCSV(FILE_CLASSI);
    gradiData = await caricaCSV(FILE_GRADI);
    livelliData = await caricaCSV(FILE_LIVELLI);
    multiversiData = await caricaCSV(FILE_MULTIVERSO);

    popolaSelect(document.getElementById("specie"), specieData);
    popolaSelect(document.getElementById("classe"), classiData);
    popolaSelect(document.getElementById("grado"), gradiData);
    popolaSelect(document.getElementById("livello"), livelliData);
    popolaSelect(document.getElementById("multiverso"), multiversiData);

    aggiornaPuntiDaGrado();
    creaStatCards();
    aggiornaTutto();
}

window.onload = init;


//-------------------------------------------------------------
// CREA CARTE STAT
//-------------------------------------------------------------
function creaStatCards() {
    const stats = ["for","des","cos","int","sag","car"];
    const container = document.getElementById("statContainer");
    container.innerHTML = "";

    stats.forEach(s => {
        container.innerHTML += `
            <div class="stat-card">
                <h3>${s.toUpperCase()}</h3>
                <div class="stat-controls">
                    <button class="remove" onclick="modificaStat('${s}',-1)">–</button>
                    <input id="stat-${s}" type="number" value="8" readonly>
                    <button class="add" onclick="modificaStat('${s}',1)">+</button>
                </div>
                <p>Modificatore: <b id="mod-${s}">0</b></p>
            </div>
        `;
    });
}


//-------------------------------------------------------------
// AGGIORNA PUNTI DA GRADO
//-------------------------------------------------------------
function aggiornaPuntiDaGrado() {
    const id = document.getElementById("grado").value;
    const row = gradiData.find(r => r[0] === id);

    puntiDisponibili = parseInt(row?.[3]) || 0;
    document.getElementById("puntiDispo").textContent = puntiDisponibili;
}


//-------------------------------------------------------------
// MODIFICA STAT
//-------------------------------------------------------------
function modificaStat(s, delta) {
    const input = document.getElementById("stat-" + s);
    let val = parseInt(input.value) || 0;

    if (delta > 0 && puntiDisponibili <= 0) return;
    if (delta < 0 && val <= 1) return;

    input.value = val + delta;
    puntiDisponibili -= delta;
    document.getElementById("puntiDispo").textContent = puntiDisponibili;

    aggiornaTutto();
}


//-------------------------------------------------------------
// CALCOLO MODIFICATORI TOTALI
//-------------------------------------------------------------
function calculateTotalModifiers() {

    const val = s => parseInt(document.getElementById("stat-" + s).value);
    const base = v => Math.floor((v - 10) / 2);

    // STAT BASE
    const baseStats = {
        for: base(val("for")),
        des: base(val("des")),
        cos: base(val("cos")),
        int: base(val("int")),
        sag: base(val("sag")),
        car: base(val("car"))
    };

    // MOD SPECIE
    const specieRow = specieData.find(r => r[0] === document.getElementById("specie").value);
    const modSpecie = specieRow ? {
        for: +specieRow[5] || 0,
        des: +specieRow[6] || 0,
        cos: +specieRow[7] || 0,
        int: +specieRow[8] || 0,
        sag: +specieRow[9] || 0,
        car: +specieRow[10] || 0,
    } : {for:0,des:0,cos:0,int:0,sag:0,car:0};

    // MOD CLASSE
    const classeRow = classiData.find(r => r[0] === document.getElementById("classe").value);
    const modClasse = classeRow ? {
        for: +classeRow[10] || 0,
        des: +classeRow[11] || 0,
        cos: +classeRow[12] || 0,
        int: +classeRow[13] || 0,
        sag: +classeRow[14] || 0,
        car: +classeRow[15] || 0,
    } : {for:0,des:0,cos:0,int:0,sag:0,car:0};

    // TOTALI
    ["for","des","cos","int","sag","car"].forEach(s => {
        const tot = baseStats[s] + modSpecie[s] + modClasse[s];
        document.getElementById("mod-" + s).textContent = tot;
    });
}


//-------------------------------------------------------------
// UPDATE PREVIEW
//-------------------------------------------------------------
function updatePreview() {
    const nome = document.getElementById("pgName").value || "—";

    document.getElementById("preview").innerHTML = `
        <div class="stat-line"><span>👤 Nome</span> <b>${nome}</b></div>
        <div class="stat-line"><span>🧬 Specie</span> <b>${specie.options[specie.selectedIndex].text}</b></div>
        <div class="stat-line"><span>⚔️ Classe</span> <b>${classe.options[classe.selectedIndex].text}</b></div>
        <div class="stat-line"><span>🌌 Multiverso</span> <b>${multiverso.options[multiverso.selectedIndex].text}</b></div>
        <div class="stat-line"><span>⭐ Livello</span> <b>${livello.options[livello.selectedIndex].text}</b></div>
        <div class="stat-line"><span>🏅 Grado</span> <b>${grado.options[grado.selectedIndex].text}</b></div>
    `;
}


//-------------------------------------------------------------
// AGGIORNA TUTTO
//-------------------------------------------------------------
function aggiornaTutto() {
    calculateTotalModifiers();
    updatePreview();
}
