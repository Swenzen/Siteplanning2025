// 1. Mapping compétence -> couleur (stocké dans le localStorage)
function getCompetenceColors() {
    return JSON.parse(localStorage.getItem("competenceColors") || "{}");
}
function setCompetenceColor(competence, color) {
    const colors = getCompetenceColors();
    colors[competence] = color;
    localStorage.setItem("competenceColors", JSON.stringify(colors));
}

// 2. Ajoute un bouton couleur à chaque ligne du tableau
function addColorPickersToPlanningTable() {
    const table = document.getElementById("planningTableWithNames");
    if (!table) return;
    const colors = getCompetenceColors();

    // Pour chaque ligne du tbody
    Array.from(table.querySelectorAll("tbody tr")).forEach(row => {
        const competenceCell = row.querySelector("td");
        if (!competenceCell) return;
        const competence = competenceCell.textContent.trim();

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
                applyCompetenceColorsToPlanningTable();
            };
            competenceCell.appendChild(picker);
        }
    });
}

// 3. Applique la couleur de fond à chaque ligne selon la compétence
function applyCompetenceColorsToPlanningTable() {
    const table = document.getElementById("planningTableWithNames");
    if (!table) return;
    const colors = getCompetenceColors();

    Array.from(table.querySelectorAll("tbody tr")).forEach(row => {
        const competenceCell = row.querySelector("td");
        if (!competenceCell) return;
        const competence = competenceCell.textContent.trim();
        row.style.background = colors[competence] || "";
    });
}

// 4. Rafraîchir à chaque affichage du tableau
function observePlanningTableChanges() {
    const table = document.getElementById("planningTableWithNames");
    if (!table) return;
    const observer = new MutationObserver(() => {
        addColorPickersToPlanningTable();
        applyCompetenceColorsToPlanningTable();
    });
    observer.observe(table, { childList: true, subtree: true });
}

// 5. Initialisation
window.addEventListener("DOMContentLoaded", () => {
    addColorPickersToPlanningTable();
    applyCompetenceColorsToPlanningTable();
    observePlanningTableChanges();
});