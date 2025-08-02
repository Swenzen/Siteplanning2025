let competenceHoraireColorsCache = {};

async function getCompetenceHoraireColors(siteId) {
    if (Object.keys(competenceHoraireColorsCache).length) return competenceHoraireColorsCache;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/styleload?site_id=${siteId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return {};
    competenceHoraireColorsCache = await res.json();
    return competenceHoraireColorsCache;
}

async function setCompetenceHoraireColor(siteId, competenceId, horaireId, color) {
    competenceHoraireColorsCache[`${competenceId}-${horaireId}`] = color;
    const token = localStorage.getItem("token");
    await fetch('/api/styleupdate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ site_id: siteId, competence_id: competenceId, horaire_id: horaireId, color })
    });
}

// Ajoute les color pickers dans la première colonne de chaque ligne
async function addColorPickersToPlanningTable() {
    const table = document.getElementById("planningTableWithNames");
    if (!table) return;
    const siteId = window.siteId || 1;
    const colors = await getCompetenceHoraireColors(siteId);

    Array.from(table.querySelectorAll("tbody tr")).forEach(row => {
        // On prend la première cellule (compétence)
        const competenceCell = row.querySelector("td");
        if (!competenceCell) return;

        // Trouve la première cellule planning de la ligne pour récupérer les ids
        const firstPlanningCell = row.querySelector('td[data-competence-id][data-horaire-id]');
        if (!firstPlanningCell) return;
        const competenceId = firstPlanningCell.getAttribute("data-competence-id");
        const horaireId = firstPlanningCell.getAttribute("data-horaire-id");
        const key = `${competenceId}-${horaireId}`;

        // Ajoute le color picker si pas déjà présent
        if (!competenceCell.querySelector(".competence-color-picker")) {
            const picker = document.createElement("input");
            picker.type = "color";
            picker.className = "competence-color-picker";
            picker.style.marginLeft = "8px";
            picker.value = colors[key] || "#e3f2fd";
            picker.title = "Changer la couleur de fond pour cette compétence/horaire";
            picker.oninput = async (e) => {
                await setCompetenceHoraireColor(siteId, competenceId, horaireId, e.target.value);
                applyCompetenceHoraireColorsToPlanningTable();
            };
            competenceCell.appendChild(picker);
        }
    });
}

// Applique la couleur sur toutes les cases du planning ayant le même couple competence/horaire
async function applyCompetenceHoraireColorsToPlanningTable() {
    const table = document.getElementById("planningTableWithNames");
    if (!table) return;
    const siteId = window.siteId || 1;
    const colors = await getCompetenceHoraireColors(siteId);

    Array.from(table.querySelectorAll("td[data-competence-id][data-horaire-id]")).forEach(cell => {
        const competenceId = cell.getAttribute("data-competence-id");
        const horaireId = cell.getAttribute("data-horaire-id");
        const key = `${competenceId}-${horaireId}`;
        cell.style.background = colors[key] || "";
    });
}

// Rafraîchir à chaque affichage du tableau
function observePlanningTableChanges() {
    const table = document.getElementById("planningTableWithNames");
    if (!table) return;
    const observer = new MutationObserver(() => {
        addColorPickersToPlanningTable();
        applyCompetenceHoraireColorsToPlanningTable();
    });
    observer.observe(table, { childList: true, subtree: true });
}

// Initialisation
window.addEventListener("DOMContentLoaded", () => {
    addColorPickersToPlanningTable();
    applyCompetenceHoraireColorsToPlanningTable();
    observePlanningTableChanges();
});