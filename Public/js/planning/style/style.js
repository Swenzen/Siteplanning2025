// 1. Mapping compétence -> couleur (stocké dans le localStorage)
function getCompetenceColors() {
    return JSON.parse(localStorage.getItem("competenceColors") || "{}");
}
function setCompetenceColor(competence, color) {
    const colors = getCompetenceColors();
    colors[competence] = color;
    localStorage.setItem("competenceColors", JSON.stringify(colors));
}

// 1bis. Mapping compétence -> bordure (stocké dans le localStorage)
function getCompetenceBorders() {
    return JSON.parse(localStorage.getItem("competenceBorders") || "{}");
}
function setCompetenceBorder(competence, borderStyle) {
    const borders = getCompetenceBorders();
    borders[competence] = borderStyle;
    localStorage.setItem("competenceBorders", JSON.stringify(borders));
}

// 2. Ajoute un bouton couleur ET un select bordure à chaque ligne du tableau
function addPickersToPlanningTable() {
    const table = document.getElementById("planningTableWithNames");
    if (!table) return;
    const colors = getCompetenceColors();
    const borders = getCompetenceBorders();

    Array.from(table.querySelectorAll("tbody tr")).forEach(row => {
        const competenceCell = row.querySelector("td");
        if (!competenceCell) return;
        // Récupère juste le texte (sans les pickers déjà présents)
        let competence = competenceCell.childNodes[0]?.textContent?.trim() || competenceCell.textContent.trim();

        // Ajoute le color picker si pas déjà présent
        if (!competenceCell.querySelector(".competence-color-picker")) {
            const picker = document.createElement("input");
            picker.type = "color";
            picker.className = "competence-color-picker";
            picker.style.marginLeft = "8px";
            picker.value = colors[competence] || "#e3f2fd";
            picker.title = "Changer la couleur de fond pour cette compétence";
            picker.oninput = (e) => {
                setCompetenceColor(competence, e.target.value);
                applyCompetenceStylesToPlanningTable();
            };
            competenceCell.appendChild(picker);
        }

        // Ajoute le select bordure si pas déjà présent
        if (!competenceCell.querySelector(".competence-border-picker")) {
            const select = document.createElement("select");
            select.className = "competence-border-picker";
            select.style.marginLeft = "8px";
            select.title = "Changer le style de bordure pour cette compétence";
            [
                {label: "Aucune", value: "none"},
                {label: "Fine", value: "1px solid #333"},
                {label: "Épaisse", value: "3px solid #333"},
                {label: "Pointillée", value: "2px dashed #333"},
                {label: "Double", value: "4px double #333"},
                {label: "Bleue épaisse", value: "3px solid #2196f3"},
                {label: "Rouge épaisse", value: "3px solid #e53935"},
            ].forEach(opt => {
                const option = document.createElement("option");
                option.value = opt.value;
                option.textContent = opt.label;
                if (borders[competence] === opt.value) option.selected = true;
                select.appendChild(option);
            });
            select.onchange = (e) => {
                setCompetenceBorder(competence, e.target.value);
                applyCompetenceStylesToPlanningTable();
            };
            competenceCell.appendChild(select);
        }
    });
}

// 3. Applique la couleur de fond ET la bordure à chaque cellule de la ligne selon la compétence
function applyCompetenceStylesToPlanningTable() {
    const table = document.getElementById("planningTableWithNames");
    if (!table) return;
    const colors = getCompetenceColors();
    const borders = getCompetenceBorders();

    Array.from(table.querySelectorAll("tbody tr")).forEach(row => {
        const competenceCell = row.querySelector("td");
        if (!competenceCell) return;
        let competence = competenceCell.childNodes[0]?.textContent?.trim() || competenceCell.textContent.trim();
        Array.from(row.children).forEach(td => {
            td.style.background = colors[competence] || "";
            td.style.borderBottom = borders[competence] || "";
        });
    });
}

// 4. Rafraîchir à chaque affichage du tableau
function observePlanningTableChanges() {
    const table = document.getElementById("planningTableWithNames");
    if (!table) return;
    const observer = new MutationObserver(() => {
        addPickersToPlanningTable();
        applyCompetenceStylesToPlanningTable();
    });
    observer.observe(table, { childList: true, subtree: true });
}

// 5. Initialisation
window.addEventListener("DOMContentLoaded", () => {
    addPickersToPlanningTable();
    applyCompetenceStylesToPlanningTable();
    observePlanningTableChanges();
});

// Ajoute une palette flottante pour choisir le style de bordure
function createBorderBrushPalette() {
    if (document.getElementById("border-brush-palette")) return;
    const palette = document.createElement("div");
    palette.id = "border-brush-palette";
    palette.style.position = "fixed";
    palette.style.top = "20px";
    palette.style.right = "20px";
    palette.style.background = "#fff";
    palette.style.border = "1px solid #ccc";
    palette.style.padding = "10px";
    palette.style.zIndex = 10000;

    palette.innerHTML = `
        <b>Mode pinceau bordure</b><br>
        <select id="brush-border-style">
            <option value="1px solid #333">Fine noire</option>
            <option value="3px solid #333">Épaisse noire</option>
            <option value="2px dashed #333">Pointillée noire</option>
            <option value="4px double #333">Double noire</option>
            <option value="3px solid #2196f3">Bleue épaisse</option>
            <option value="3px solid #e53935">Rouge épaisse</option>
            <option value="none">Aucune</option>
        </select>
        <button id="activate-border-brush">Activer pinceau</button>
        <button id="deactivate-border-brush" style="display:none;">Désactiver</button>
    `;
    document.body.appendChild(palette);

    let brushActive = false;

    document.getElementById("activate-border-brush").onclick = () => {
        brushActive = true;
        palette.style.boxShadow = "0 0 10px #2196f3";
        document.getElementById("activate-border-brush").style.display = "none";
        document.getElementById("deactivate-border-brush").style.display = "";
    };
    document.getElementById("deactivate-border-brush").onclick = () => {
        brushActive = false;
        palette.style.boxShadow = "";
        document.getElementById("activate-border-brush").style.display = "";
        document.getElementById("deactivate-border-brush").style.display = "none";
    };

    // Clique sur une cellule du tableau pour appliquer la bordure
    document.addEventListener("click", function(e) {
        if (!brushActive) return;
        const td = e.target.closest("#planningTableWithNames td");
        if (td) {
            const borderStyle = document.getElementById("brush-border-style").value;
            td.style.borderBottom = borderStyle;
            e.preventDefault();
        }
    }, true);
}

// Appelle cette fonction à l'init
window.addEventListener("DOMContentLoaded", () => {
    createBorderBrushPalette();
});