// Pré-remplir avec la période du planning si dispo (fallback sur startDate/endDate)
document.addEventListener("DOMContentLoaded", () => {
    const start = sessionStorage.getItem("planningStartDate") || sessionStorage.getItem("startDate") || localStorage.getItem("savedStartDate");
    const end = sessionStorage.getItem("planningEndDate") || sessionStorage.getItem("endDate") || localStorage.getItem("savedEndDate");
    const startInput = document.getElementById("statsStartDate");
    const endInput = document.getElementById("statsEndDate");
    if (start && startInput) startInput.value = start;
    if (end && endInput) endInput.value = end;

    // Sync immédiat sur changement des inputs
    const syncDates = () => {
        const s = startInput?.value || "";
        const e = endInput?.value || "";
        if (s) {
            sessionStorage.setItem("planningStartDate", s);
            sessionStorage.setItem("startDate", s);
            localStorage.setItem("savedStartDate", s);
        }
        if (e) {
            sessionStorage.setItem("planningEndDate", e);
            sessionStorage.setItem("endDate", e);
            localStorage.setItem("savedEndDate", e);
        }
    };
    startInput?.addEventListener("change", syncDates);
    endInput?.addEventListener("change", syncDates);
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

    // Sauvegarde/Synchronise la période sélectionnée pour les autres pages
    if (start) {
        sessionStorage.setItem("planningStartDate", start);
        sessionStorage.setItem("startDate", start);
        localStorage.setItem("savedStartDate", start);
    }
    if (end) {
        sessionStorage.setItem("planningEndDate", end);
        sessionStorage.setItem("endDate", end);
        localStorage.setItem("savedEndDate", end);
    }

    // Récupère les stats brutes
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

    // Récupère les groupes de compétences et d'horaires
    const groupesCompetence = await getCompetenceGroups();
    const groupesHoraire = await getHoraireGroups();

    // Toutes les personnes
    const allNoms = [...new Set(data.map(d => d.nom))];

    // Stats par personne
    const stats = {};
    data.forEach(d => {
        if (!stats[d.nom]) stats[d.nom] = {competences: {}, horairesById: {}, total: 0};
        // Compétences unitaires (servira pour sommer dans les groupes)
        stats[d.nom].competences[d.competence] = (stats[d.nom].competences[d.competence] || 0) + 1;
        // Comptage par horaire_id (pour sommer dans les groupes d'horaires)
        const hid = d.horaire_id;
        if (hid != null) {
            stats[d.nom].horairesById[hid] = (stats[d.nom].horairesById[hid] || 0) + 1;
        }
        stats[d.nom].total++;
    });

    // Fonctions d'agrégation par groupe
    // Compétences: somme des occurrences de toutes les compétences incluses
    function getGroupeCompetenceStat(nom, groupe) {
        if (!stats[nom]) return 0;
        return (groupe.competences || []).reduce((sum, c) => sum + (stats[nom].competences[c.competence] || 0), 0);
    }
    // Horaires: somme des occurrences de tous les horaires inclus
    function getGroupeHoraireStat(nom, groupe) {
        if (!stats[nom]) return 0;
        return (groupe.horaires || []).reduce((sum, h) => sum + (stats[nom].horairesById[h.horaire_id] || 0), 0);
    }

    // Génère le tableau HTML: seulement les groupes (compétences et horaires) + total
    let html = `<table><thead><tr><th>Nom</th>`;
    // Groupes de compétences
    groupesCompetence.forEach(g => html += `<th class="stats-groupe-col">${g.nom_groupe}</th>`);
    // Groupes d'horaires
    groupesHoraire.forEach(g => html += `<th class="stats-groupe-col">${g.nom_groupe}</th>`);
    html += `<th>Total</th></tr></thead><tbody>`;

    for (const nom of allNoms) {
        html += `<tr><td>${nom}</td>`;
        // Groupes de compétences
        groupesCompetence.forEach(g => html += `<td class="stats-groupe-col">${getGroupeCompetenceStat(nom, g)}</td>`);
        // Groupes d'horaires
        groupesHoraire.forEach(g => html += `<td class="stats-groupe-col">${getGroupeHoraireStat(nom, g)}</td>`);
        html += `<td>${stats[nom]?.total || 0}</td></tr>`;
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
        `<div class="groupe-dropzone group-card" data-groupe="${g.groupe_id}">
            <div class="group-header">
                <span class="group-title">${g.nom_groupe}</span>
                <button class="delete-group-btn" data-groupe="${g.groupe_id}" title="Supprimer ce groupe">🗑️</button>
            </div>
            <ul class="competence-groupe-list">
                ${g.competences.map(c => `<li class="draggable-competence" draggable="true" data-id="${c.competence_id}">${c.competence}</li>`).join("")}
            </ul>
        </div>`
    ).join("");
    addDropEvents();
    addDragEvents();
    // Ajoute l'event sur les boutons supprimer
    document.querySelectorAll('.delete-group-btn').forEach(btn => {
        btn.onclick = async function() {
            if (!confirm("Supprimer ce groupe ?")) return;
            const groupe_id = btn.dataset.groupe;
            await fetch(`/api/competence-groupe/${groupe_id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            await afficherGroupesCompetence();
            await afficherCompetencesDisponibles();
        };
    });
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
        body: JSON.stringify({ nom_groupe: nomGroupe, competences: [], site_id: siteId })
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
    // ...autres initialisations...
    await afficherCompetencesDisponibles();
    await afficherGroupesCompetence();
    await afficherHorairesDisponibles();
    await afficherGroupesHoraire();
});

// Ajoute cette fonction dans ton stats.js (frontend)
async function getCompetenceGroups() {
    const token = localStorage.getItem("token");
    const siteId = sessionStorage.getItem("selectedSite");
    if (!token || !siteId) return [];
    const res = await fetch(`/api/competence-groupes?site_id=${siteId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json(); // [{groupe_id, nom_groupe, competences: [{competence_id, competence}, ...]}, ...]
}


//pour hoaires 

// --- Récupérer les groupes d'horaires ---
async function getHoraireGroups() {
    const token = localStorage.getItem("token");
    const siteId = sessionStorage.getItem("selectedSite");
    if (!token || !siteId) return [];
    const res = await fetch(`/api/horaire-groupes?site_id=${siteId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json(); // [{groupe_id, nom_groupe, horaires: [{horaire_id, horaire_debut, horaire_fin}, ...]}, ...]
}

// --- Afficher les horaires disponibles (non liés à un groupe) ---
async function afficherHorairesDisponibles() {
    const token = localStorage.getItem("token");
    const siteId = sessionStorage.getItem("selectedSite");
    if (!token || !siteId) return;
    const res = await fetch(`/api/all-horaires?site_id=${siteId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const horaires = await res.json();
    // Récupère tous les horaires déjà liés à un groupe
    const groupes = await getHoraireGroups();
    const liees = new Set(groupes.flatMap(g => g.horaires.map(h => h.horaire_id)));
    const ul = document.getElementById("liste-horaires");
    ul.innerHTML = horaires
        .filter(h => !liees.has(h.horaire_id))
        .map(h => `<li class="draggable-horaire" draggable="true" data-id="${h.horaire_id}">${h.horaire_debut} - ${h.horaire_fin}</li>`)
        .join("");
    addDragEventsHoraire();
}

// --- Afficher les groupes d'horaires et leurs horaires ---
async function afficherGroupesHoraire() {
    const token = localStorage.getItem("token");
    const siteId = sessionStorage.getItem("selectedSite");
    if (!token || !siteId) return;
    const groupes = await getHoraireGroups();
    const container = document.getElementById("groupes-horaire-container");
    container.innerHTML = groupes.map(g =>
        `<div class="groupe-dropzone-horaire group-card" data-groupe="${g.groupe_id}">
            <div class="group-header">
                <span class="group-title">${g.nom_groupe}</span>
                <button class="delete-group-btn-horaire" data-groupe="${g.groupe_id}" title="Supprimer ce groupe">🗑️</button>
            </div>
            <ul class="horaire-groupe-list">
                ${g.horaires.map(h => `<li class="draggable-horaire" draggable="true" data-id="${h.horaire_id}">${h.horaire_debut} - ${h.horaire_fin}</li>`).join("")}
            </ul>
        </div>`
    ).join("");
    addDropEventsHoraire();
    addDragEventsHoraire();
    // Ajoute l'event sur les boutons supprimer
    document.querySelectorAll('.delete-group-btn-horaire').forEach(btn => {
        btn.onclick = async function() {
            if (!confirm("Supprimer ce groupe d'horaires ?")) return;
            const groupe_id = btn.dataset.groupe;
            await fetch(`/api/horaire-groupe/${groupe_id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            await afficherGroupesHoraire();
            await afficherHorairesDisponibles();
        };
    });
}

// --- Drag & Drop pour horaires ---
function addDragEventsHoraire() {
    document.querySelectorAll('.draggable-horaire').forEach(el => {
        el.ondragstart = e => {
            e.dataTransfer.setData("horaire_id", el.dataset.id);
            e.dataTransfer.effectAllowed = "move";
            setTimeout(() => el.classList.add("dragging"), 0);
        };
        el.ondragend = e => el.classList.remove("dragging");
    });
}
function addDropEventsHoraire() {
    // Drop sur un groupe d'horaires
    document.querySelectorAll('.groupe-dropzone-horaire').forEach(zone => {
        zone.ondragover = e => { e.preventDefault(); zone.classList.add("over"); };
        zone.ondragleave = e => zone.classList.remove("over");
        zone.ondrop = async e => {
            e.preventDefault();
            zone.classList.remove("over");
            const horaire_id = e.dataTransfer.getData("horaire_id");
            const groupe_id = zone.dataset.groupe;
            await fetch('/api/horaire-groupe/liaison', {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
                body: JSON.stringify({ groupe_id, horaire_id })
            });
            await afficherHorairesDisponibles();
            await afficherGroupesHoraire();
        };
    });
    // Drop sur la liste de gauche (pour retirer d'un groupe)
    const ul = document.getElementById("liste-horaires");
    ul.ondragover = e => { e.preventDefault(); ul.classList.add("over"); };
    ul.ondragleave = e => ul.classList.remove("over");
    ul.ondrop = async e => {
        e.preventDefault();
        ul.classList.remove("over");
        const horaire_id = e.dataTransfer.getData("horaire_id");
        // Trouve le groupe d'origine
        const token = localStorage.getItem("token");
        const siteId = sessionStorage.getItem("selectedSite");
        const groupes = await getHoraireGroups();
        let groupe_id = null;
        groupes.forEach(g => {
            if (g.horaires.some(h => h.horaire_id == horaire_id)) groupe_id = g.groupe_id;
        });
        if (groupe_id) {
            await fetch('/api/horaire-groupe/liaison', {
                method: "DELETE",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ groupe_id, horaire_id })
            });
            await afficherHorairesDisponibles();
            await afficherGroupesHoraire();
        }
    };
}

// --- Création de groupe d'horaires ---
document.getElementById("btn-creer-groupe-horaire").onclick = async function() {
    const token = localStorage.getItem("token");
    const nomGroupe = document.getElementById("nom-nouveau-groupe-horaire").value.trim();
    const siteId = sessionStorage.getItem("selectedSite");
    const msgDiv = document.getElementById("message-groupe-horaire");
    msgDiv.textContent = "";
    if (!token || !siteId || !nomGroupe) {
        msgDiv.textContent = "Veuillez saisir un nom de groupe d'horaires.";
        return;
    }
    const res = await fetch('/api/horaire-groupe', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nom_groupe: nomGroupe, horaires: [], site_id: siteId })
    });
    if (res.ok) {
        msgDiv.textContent = "Groupe d'horaires créé !";
        document.getElementById("nom-nouveau-groupe-horaire").value = "";
        await afficherGroupesHoraire();
    } else {
        msgDiv.textContent = "Erreur lors de la création du groupe d'horaires.";
    }
};

// --- Initialisation (à placer dans le DOMContentLoaded principal) ---
document.addEventListener("DOMContentLoaded", async () => {
    await afficherHorairesDisponibles();
    await afficherGroupesHoraire();
});
