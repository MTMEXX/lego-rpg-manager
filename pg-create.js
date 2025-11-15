//-------------------------------------------------------------
// CONFIG
//-------------------------------------------------------------
const BASE_URL = "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/";

const FILE_CLASSI = "classi.csv";
const FILE_GRADI = "gradi.csv";
const FILE_SPECIE = "speci.csv";
const FILE_LIVELLI = "livelli.csv";
const FILE_MULTIVERSO = "multiversi-pg.csv";

let classiData=[], gradiData=[], specieData=[], livelliData=[], multiversiData=[];

// punti disponibili
let puntiDisponibili = 0;


//-------------------------------------------------------------
// CARICA CSV
//-------------------------------------------------------------
async function caricaCSV(nome) {
    const res = await fetch(BASE_URL + nome);
    const txt = await res.text();

    return txt.trim().split("\n").map(r => r.split(";"));
}


//-------------------------------------------------------------
// POPOLA SELECT
//-------------------------------------------------------------
function popolaSelect(select, data) {
    select.innerHTML = "";

    for (let i = 1; i < data.length; i++) {
        if (!data[i][0] || !data[i][1]) continue;
        const opt = document.createElement("option");
        opt.value = data[i][0];
        opt.textContent = data[i][1];
        select.appendChild(opt);
    }
}


//-------------------------------------------------------------
// INIT
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

    creaStatCards();
    aggiornaPuntiDaGrado();
    aggiornaTutto();
}

window.onload = init;


//-------------------------------------------------------------
// CREA CARTE STAT
//-------------------------------------------------------------
function creaStatCards() {
    const stats = ["for","des","cos","int","sag","car"];
    const container = document.getElementById("statContainer");

    stats.forEach(s => {
        container.innerHTML += `
            <div class="stat-card">
                <h3>${s.toUpperCase()}</h3>

                <div class="stat-controls">
                    <button class="stat-btn" onclick="modificaStat('${s}',-1)">–</button>
                    <input id="stat-${s}" type="text" value="8" readonly>
                    <button class="stat-btn" onclick="modificaStat('${s}',1)">+</button>
                </div>

                <div class="stat-mod-value" id="mod-${s}">0</div>
            </div>
        `;
    });
}


//-------------------------------------------------------------
// PUNTI DISPONIBILI DA GRADO
//-------------------------------------------------------------
function aggiornaPuntiDaGrado() {
    const id = document.getElementById("grado").value;
    const row = gradiData.find(r => r[0] === id);

    puntiDisponibili = parseInt(row?.[3]) || 0;
    document.getElementById("puntiDispo").textContent = puntiDisponibili;
}


//-------------------------------------------------------------
// MODIFICA STAT— VERSIONE CORRETTA
//-------------------------------------------------------------
function modificaStat(s, delta) {
    const input = document.getElementById("stat-" + s);
    let val = parseInt(input.value);

    if (delta > 0) {
        if (puntiDisponibili <= 0) return;
        if (val >= 18) return;

        val++;
        puntiDisponibili--;
    }

    if (delta < 0) {
        if (val <= 1) return;

        val--;
        puntiDisponibili++;
    }

    input.value = val;
    document.getElementById("puntiDispo").textContent = puntiDisponibili;

    aggiornaTutto();
}


//-------------------------------------------------------------
// CALCOLO MODIFICATORI TOTALI
//-------------------------------------------------------------
function calculateTotalModifiers() {

    const val = s => parseInt(document.getElementById("stat-" + s).value);
    const base = v => Math.floor((v - 10) / 2);

    // BASE
    const baseStats = {
        for: base(val("for")),
        des: base(val("des")),
        cos: base(val("cos")),
        int: base(val("int")),
        sag: base(val("sag")),
        car: base(val("car"))
    };

    // SPECIE
    const specieRow = specieData.find(r => r[0] === document.getElementById("specie").value);
    const modSpecie = specieRow ? {
        for: +specieRow[5] || 0,
        des: +specieRow[6] || 0,
        cos: +specieRow[7] || 0,
        int: +specieRow[8] || 0,
        sag: +specieRow[9] || 0,
        car: +specieRow[10] || 0
    } : {for:0,des:0,cos:0,int:0,sag:0,car:0};

    // CLASSI
    const classeRow = classiData.find(r => r[0] === document.getElementById("classe").value);
    const modClasse = classeRow ? {
        for: +classeRow[10] || 0,
        des: +classeRow[11] || 0,
        cos: +classeRow[12] || 0,
        int: +classeRow[13] || 0,
        sag: +classeRow[14] || 0,
        car: +classeRow[15] || 0
    } : {for:0,des:0,cos:0,int:0,sag:0,car:0};


    // TOTALI
    ["for","des","cos","int","sag","car"].forEach(s => {
        const tot = baseStats[s] + modSpecie[s] + modClasse[s];
        document.getElementById("mod-" + s).textContent = tot;
    });
}


//-------------------------------------------------------------
// PREVIEW
//-------------------------------------------------------------
function updatePreview() {
    const specieSel = specie.options[specie.selectedIndex]?.text || "—";
    const classeSel = classe.options[classe.selectedIndex]?.text || "—";
    const multiSel = multiverso.options[multiverso.selectedIndex]?.text || "—";
    const livSel = livello.options[livello.selectedIndex]?.text || "—";
    const gradoSel = grado.options[grado.selectedIndex]?.text || "—";

    document.getElementById("preview").innerHTML = `
        <div class="stat-line"><span>👤 Nome</span><b>${pgName.value || "—"}</b></div>
        <div class="stat-line"><span>🧬 Specie</span><b>${specieSel}</b></div>
        <div class="stat-line"><span>⚔️ Classe</span><b>${classeSel}</b></div>
        <div class="stat-line"><span>🌌 Multiverso</span><b>${multiSel}</b></div>
        <div class="stat-line"><span>⭐ Livello</span><b>${livSel}</b></div>
        <div class="stat-line"><span>🏅 Grado</span><b>${gradoSel}</b></div>
    `;
}


//-------------------------------------------------------------
// AGGIORNA TUTTO
//-------------------------------------------------------------
function aggiornaTutto() {
    calculateTotalModifiers();
    updatePreview();
}
