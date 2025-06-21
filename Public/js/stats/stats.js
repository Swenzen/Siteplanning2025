// Pré-remplir avec la période du planning si dispo
document.addEventListener("DOMContentLoaded", () => {
    const start = sessionStorage.getItem("planningStartDate");
    const end = sessionStorage.getItem("planningEndDate");
    if (start) document.getElementById("statsStartDate").value = start;
    if (end) document.getElementById("statsEndDate").value = end;
});

document.getElementById("periode-stats-form").addEventListener("submit", async function(e) {
    e.preventDefault();
    const siteId = sessionStorage.getItem("selectedSite");
    const start = document.getElementById("statsStartDate").value;
    const end = document.getElementById("statsEndDate").value;
    const token = localStorage.getItem("token");

    if (!token || !siteId) {
        document.getElementById("stats-results").innerHTML = "Erreur : authentification ou site manquant.";
        return;
    }

    const res = await fetch(`/api/planning-stats?site_id=${siteId}&start=${start}&end=${end}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    if (!res.ok) {
        document.getElementById("stats-results").innerHTML = "Erreur lors du chargement des stats.";
        return;
    }
    const data = await res.json(); // [{nom, competence, horaire_id, ...}, ...]
    const modalites = {
        "Matin": [1],
        "Après-midi": [2],
        "Soir": [3],
        "Journée": [4]
    };
    // Récupère toutes les compétences et modalites présentes
    const allCompetences = [...new Set(data.map(d => d.competence))];
    const allModalites = Object.keys(modalites);

    // Stats par personne
    const stats = {};
    data.forEach(d => {
        if (!stats[d.nom]) stats[d.nom] = {competences: {}, modalites: {}, total: 0};
        stats[d.nom].competences[d.competence] = (stats[d.nom].competences[d.competence] || 0) + 1;
        for (const [mod, ids] of Object.entries(modalites)) {
            if (ids.includes(d.horaire_id)) {
                stats[d.nom].modalites[mod] = (stats[d.nom].modalites[mod] || 0) + 1;
            }
        }
        stats[d.nom].total++;
    });

    // Exemple pour les compétences
    const competenceGroups = [
      { name: "Maison+Jardin", competences: ["Maison", "Jardin"] },
      { name: "Scanner", competences: ["Scanner"] }
    ];
    // Pour les horaires
    const horaireGroups = [
      { name: "Matin", horaires: [1, 4] },
      { name: "Après-midi", horaires: [2] }
    ];

    // Génère le tableau HTML
    let html = `<table><thead><tr><th>Nom</th>`;
    allCompetences.forEach(c => html += `<th>${c}</th>`);
    allModalites.forEach(m => html += `<th>${m}</th>`);
    html += `<th>Total</th></tr></thead><tbody>`;
    for (const [nom, s] of Object.entries(stats)) {
        html += `<tr><td>${nom}</td>`;
        allCompetences.forEach(c => html += `<td>${s.competences[c] || 0}</td>`);
        allModalites.forEach(m => html += `<td>${s.modalites[m] || 0}</td>`);
        html += `<td>${s.total}</td></tr>`;
    }
    html += `</tbody></table>`;
    document.getElementById("stats-results").innerHTML = html;
});

// À placer après le DOMContentLoaded

// Exemples de données à remplacer par un fetch dynamique
const allCompetences = ["Maison", "Jardin", "Scanner", "IRM"];
const allHoraires = [
  { id: 1, label: "08:00-12:00" },
  { id: 2, label: "12:00-16:00" },
  { id: 3, label: "16:00-20:00" },
  { id: 4, label: "08:00-20:00" }
];

let competenceGroups = [];
let horaireGroups = [];

async function afficherCompetencesGroupe() {
    const token = localStorage.getItem("token");
    const siteId = sessionStorage.getItem("selectedSite");
    if (!token || !siteId) return;
    const res = await fetch(`/api/all-competences?site_id=${siteId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
        document.getElementById("liste-competences").innerHTML = "<li>Erreur lors du chargement</li>";
        return;
    }
    const competences = await res.json();
    const ul = document.getElementById("liste-competences");
    ul.innerHTML = competences.map(c =>
        `<li><label><input type="checkbox" value="${c.competence_id}"> ${c.competence}</label></li>`
    ).join("");
}

document.getElementById("btn-creer-groupe").onclick = async function() {
    const token = localStorage.getItem("token");
    const nomGroupe = document.getElementById("nom-nouveau-groupe").value.trim();
    const msgDiv = document.getElementById("message-groupe");
    // Récupère les compétences cochées
    const competences = Array.from(document.querySelectorAll("#liste-competences input[type=checkbox]:checked")).map(cb => cb.value);

    msgDiv.textContent = "";
    if (!token || !nomGroupe) {
        msgDiv.textContent = "Veuillez saisir un nom de groupe.";
        return;
    }

    const res = await fetch('/api/competence-groupe', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nom_groupe: nomGroupe, competences })
    });

    if (res.ok) {
        msgDiv.textContent = "Groupe créé !";
        document.getElementById("nom-nouveau-groupe").value = "";
        document.querySelectorAll("#liste-competences input[type=checkbox]").forEach(cb => cb.checked = false);
    } else {
        msgDiv.textContent = "Erreur lors de la création du groupe.";
    }
};

// Affiche les compétences disponibles (non liées à un groupe)
async function afficherCompetencesDisponibles() {
    const token = localStorage.getItem("token");
    const siteId = sessionStorage.getItem("selectedSite");
    if (!token || !siteId) return;
    const res = await fetch(`/api/all-competences?site_id=${siteId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const competences = await res.json();
    // Récupère toutes les compétences déjà liées à un groupe
    const groupes = await fetch(`/api/competence-groupes?site_id=${siteId}`, {
        headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.ok ? r.json() : []);
    const liees = new Set(groupes.flatMap(g => g.competences.map(c => c.competence_id)));
    const ul = document.getElementById("liste-competences");
    ul.innerHTML = competences
        .filter(c => !liees.has(c.competence_id))
        .map(c => `<li class="draggable-competence" draggable="true" data-id="${c.competence_id}">${c.competence}</li>`)
        .join("");
    addDragEvents();
}

// Affiche les groupes et leurs compétences
async function afficherGroupesCompetence() {
    const token = localStorage.getItem("token");
    const siteId = sessionStorage.getItem("selectedSite");
    if (!token || !siteId) return;
    const res = await fetch(`/api/competence-groupes?site_id=${siteId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const groupes = await res.json();
    const container = document.getElementById("groupes-container");
    container.innerHTML = groupes.map(g =>
        `<div class="groupe-dropzone" data-groupe="${g.groupe_id}" style="min-width:180px; min-height:120px; border:1px solid #aaa; border-radius:8px; padding:8px; margin-bottom:16px;">
            <div style="font-weight:bold; margin-bottom:8px;">${g.nom_groupe}</div>
            <ul class="competence-groupe-list" style="min-height:60px;">
                ${g.competences.map(c => `<li class="draggable-competence" draggable="true" data-id="${c.competence_id}">${c.competence}</li>`).join("")}
            </ul>
        </div>`
    ).join("");
    addDropEvents();
    addDragEvents();
}

// Drag & Drop events
function addDragEvents() {
    document.querySelectorAll('.draggable-competence').forEach(el => {
        el.ondragstart = e => {
            e.dataTransfer.setData("competence_id", el.dataset.id);
            e.dataTransfer.effectAllowed = "move";
            setTimeout(() => el.classList.add("dragging"), 0);
        };
        el.ondragend = e => el.classList.remove("dragging");
    });
}
function addDropEvents() {
    // Drop sur un groupe
    document.querySelectorAll('.groupe-dropzone').forEach(zone => {
        zone.ondragover = e => { e.preventDefault(); zone.classList.add("over"); };
        zone.ondragleave = e => zone.classList.remove("over");
        zone.ondrop = async e => {
            e.preventDefault();
            zone.classList.remove("over");
            const competence_id = e.dataTransfer.getData("competence_id");
            const groupe_id = zone.dataset.groupe;
            await fetch('/api/competence-groupe/liaison', {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify({ groupe_id, competence_id })
            });
            await afficherCompetencesDisponibles();
            await afficherGroupesCompetence();
        };
    });
    // Drop sur la liste de gauche (pour retirer d'un groupe)
    const ul = document.getElementById("liste-competences");
    ul.ondragover = e => { e.preventDefault(); ul.classList.add("over"); };
    ul.ondragleave = e => ul.classList.remove("over");
    ul.ondrop = async e => {
        e.preventDefault();
        ul.classList.remove("over");
        const competence_id = e.dataTransfer.getData("competence_id");
        // Trouve le groupe d'origine
        const token = localStorage.getItem("token");
        const siteId = sessionStorage.getItem("selectedSite");
        const groupes = await fetch(`/api/competence-groupes?site_id=${siteId}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : []);
        let groupe_id = null;
        groupes.forEach(g => {
            if (g.competences.some(c => c.competence_id == competence_id)) groupe_id = g.groupe_id;
        });
        if (groupe_id) {
            await fetch('/api/competence-groupe/liaison', {
                method: "DELETE",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ groupe_id, competence_id })
            });
            await afficherCompetencesDisponibles();
            await afficherGroupesCompetence();
        }
    };
}

// Création de groupe
document.getElementById("btn-creer-groupe").onclick = async function() {
    const token = localStorage.getItem("token");
    const nomGroupe = document.getElementById("nom-nouveau-groupe").value.trim();
    const siteId = sessionStorage.getItem("selectedSite");
    const msgDiv = document.getElementById("message-groupe");
    msgDiv.textContent = "";
    if (!token || !siteId || !nomGroupe) {
        msgDiv.textContent = "Veuillez saisir un nom de groupe.";
        return;
    }
    const res = await fetch('/api/competence-groupe', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nom_groupe: nomGroupe, competences: [] })
    });
    if (res.ok) {
        msgDiv.textContent = "Groupe créé !";
        document.getElementById("nom-nouveau-groupe").value = "";
        await afficherGroupesCompetence();
    } else {
        msgDiv.textContent = "Erreur lors de la création du groupe.";
    }
};

// Initialisation
document.addEventListener("DOMContentLoaded", async () => {
    await afficherCompetencesDisponibles();
    await afficherGroupesCompetence();
});