//-------------------------------------------------------------
// CONFIGURAZIONE
//-------------------------------------------------------------
const BASE_URL = "https://raw.githubusercontent.com/MTMEXX/lego-rpg-manager/main/db/";

const FILE_CLASSI = "classi.csv";
const FILE_GRADI = "gradi.csv";
const FILE_SPECIE = "speci.csv";
const FILE_LIVELLI = "livelli.csv";
const FILE_MULTIVERSO = "multiversi-pg.csv";

let classiData = [];
let gradiData = [];
let specieData = [];
let livelliData = [];
let multiversiData = [];

// STAT PRIMARIE
let puntiDisponibili = 0;


//-------------------------------------------------------------
// CARICA CSV
//-------------------------------------------------------------
async function caricaCSV(nomeFile) {
    const response = await fetch(BASE_URL + nomeFile);
    const text = await response.text();

    // Split per righe
    const rows = text.trim().split("\n");

    // Ogni colonna è separata da ";"
    return rows.map(r => r.split(";"));
}


//-------------------------------------------------------------
// CARICA TUTTI I CSV
//-------------------------------------------------------------
async function init() {
    classiData = await caricaCSV(FILE_CLASSI);
    gradiData = await caricaCSV(FILE_GRADI);
    specieData = await caricaCSV(FILE_SPECIE);
    livelliData = await caricaCSV(FILE_LIVELLI);
    multiversiData = await caricaCSV(FILE_MULTIVERSO);

    popolaSelect(document.getElementById("classe"), classiData);
    popolaSelect(document.getElementById("grado"), gradiData);
    popolaSelect(document.getElementById("specie"), specieData);
    popolaSelect(document.getElementById("livello"), livelliData);
    popolaSelect(document.getElementById("multiverso"), multiversiData);
}

window.onload = init;


//-------------------------------------------------------------
// POPOLARE MENU A TENDINA
//-------------------------------------------------------------
function popolaSelect(select, data) {
    if (!select || data.length <= 1) return;

    select.innerHTML = "";

    // prima riga è intestazione → la salto
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const option = document.createElement("option");
        option.value = row[0];     // ID
        option.textContent = row[1]; // NOME
        select.appendChild(option);
    }
}


//-------------------------------------------------------------
// GESTIONE PUNTI STAT (dal grado)
//-------------------------------------------------------------
function aggiornaPuntiDaGrado() {
    const gradoId = document.getElementById("grado").value;
    const gradoRow = gradiData.find(r => r[0] === gradoId);

    puntiDisponibili = parseInt(gradoRow?.[3]) || 0;
    document.getElementById("punti-restanti").textContent = puntiDisponibili;
}


//-------------------------------------------------------------
// MODIFICA DELLE STAT
//-------------------------------------------------------------
function modificaStat(stat, delta) {
    const campo = document.getElementById("stat-" + stat);
    let value = parseInt(campo.value) || 0;

    // controlli
    if (delta > 0 && puntiDisponibili <= 0) return;
    if (delta < 0 && value <= 1) return;

    value += delta;
    campo.value = value;

    // aggiorna punti
    if (delta > 0) puntiDisponibili--;
    else puntiDisponibili++;

    document.getElementById("punti-restanti").textContent = puntiDisponibili;

    // aggiorna mod
    calculateTotalModifiers();
}


//-------------------------------------------------------------
// CALCOLO MODIFICATORI TOTALI
//-------------------------------------------------------------
function calculateTotalModifiers() {

    // STAT BASE
    const forz = parseInt(document.getElementById("stat-for").value) || 0;
    const des  = parseInt(document.getElementById("stat-des").value) || 0;
    const cos  = parseInt(document.getElementById("stat-cos").value) || 0;
    const intt = parseInt(document.getElementById("stat-int").value) || 0;
    const sag  = parseInt(document.getElementById("stat-sag").value) || 0;
    const car  = parseInt(document.getElementById("stat-car").value) || 0;

    const base = v => Math.floor((v - 10) / 2);

    //---------------------------------------------------------
    // MOD SPECIE
    //---------------------------------------------------------
    const specieRow = specieData.find(r => r[0] === document.getElementById("specie").value);
    const modSpecie = specieRow ? {
        for: parseInt(specieRow[5]) || 0,
        des: parseInt(specieRow[6]) || 0,
        cos: parseInt(specieRow[7]) || 0,
        int: parseInt(specieRow[8]) || 0,
        sag: parseInt(specieRow[9]) || 0,
        car: parseInt(specieRow[10]) || 0,
    } : { for: 0, des: 0, cos: 0, int: 0, sag: 0, car: 0 };

    //---------------------------------------------------------
    // MOD CLASSE
    //---------------------------------------------------------
    const classeRow = classiData.find(r => r[0] === document.getElementById("classe").value);
    const modClasse = classeRow ? {
        for: parseInt(classeRow[10]) || 0,
        des: parseInt(classeRow[11]) || 0,
        cos: parseInt(classeRow[12]) || 0,
        int: parseInt(classeRow[13]) || 0,
        sag: parseInt(classeRow[14]) || 0,
        car: parseInt(classeRow[15]) || 0,
    } : { for: 0, des: 0, cos: 0, int: 0, sag: 0, car: 0 };

    //---------------------------------------------------------
    // MOD TOTALI
    //---------------------------------------------------------
    const total = {
        for: base(forz) + modSpecie.for + modClasse.for,
        des: base(des) + modSpecie.des + modClasse.des,
        cos: base(cos) + modSpecie.cos + modClasse.cos,
        int: base(intt) + modSpecie.int + modClasse.int,
        sag: base(sag) + modSpecie.sag + modClasse.sag,
        car: base(car) + modSpecie.car + modClasse.car,
    };

    //---------------------------------------------------------
    // UPDATE IN HTML
    //---------------------------------------------------------
    document.getElementById("mod-for").textContent = total.for;
    document.getElementById("mod-des").textContent = total.des;
    document.getElementById("mod-cos").textContent = total.cos;
    document.getElementById("mod-int").textContent = total.int;
    document.getElementById("mod-sag").textContent = total.sag;
    document.getElementById("mod-car").textContent = total.car;
}


//-------------------------------------------------------------
// UPDATE PREVIEW
//-------------------------------------------------------------
function aggiornarePreview() {
    document.getElementById("preview-nome").textContent = document.getElementById("nome").value;
    document.getElementById("preview-specie").textContent = document.getElementById("specie").selectedOptions[0]?.textContent || "";
    document.getElementById("preview-classe").textContent = document.getElementById("classe").selectedOptions[0]?.textContent || "";
    document.getElementById("preview-multiverso").textContent = document.getElementById("multiverso").selectedOptions[0]?.textContent || "";
    document.getElementById("preview-livello").textContent = document.getElementById("livello").selectedOptions[0]?.textContent || "";
    document.getElementById("preview-grado").textContent = document.getElementById("grado").selectedOptions[0]?.textContent || "";
}


//-------------------------------------------------------------
// AGGIORNA TUTTO QUANDO CAMBIA QUALCOSA
//-------------------------------------------------------------
function aggiornaTutto() {
    aggiornaPuntiDaGrado();
    calculateTotalModifiers();
    aggiornarePreview();
}
