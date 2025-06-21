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

async function afficherGroupesCompetence() {
    const token = localStorage.getItem("token");
    const siteId = sessionStorage.getItem("selectedSite");
    if (!token || !siteId) return;
    const res = await fetch(`/api/competence-groupes?site_id=${siteId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
        document.getElementById("tbody-groupes").innerHTML = "<tr><td colspan='2'>Erreur lors du chargement</td></tr>";
        return;
    }
    const groupes = await res.json();
    const tbody = document.getElementById("tbody-groupes");
    tbody.innerHTML = groupes.map(g =>
        `<tr>
            <td>${g.nom_groupe}</td>
            <td>${g.competences.length ? g.competences.join(", ") : "<i>Aucune compétence</i>"}</td>
        </tr>`
    ).join("");
}

// Appel au chargement de la page
document.addEventListener("DOMContentLoaded", afficherGroupesCompetence);

// Appel après création d'un groupe
document.getElementById("btn-creer-groupe").onclick = async function() {
    // ... ton code existant ...
    if (res.ok) {
        msgDiv.textContent = "Groupe créé !";
        document.getElementById("nom-nouveau-groupe").value = "";
        document.querySelectorAll("#liste-competences input[type=checkbox]").forEach(cb => cb.checked = false);
        await afficherGroupesCompetence(); // <-- recharge la liste des groupes
    } else {
        msgDiv.textContent = "Erreur lors de la création du groupe.";
    }
};

// Appel automatique au chargement de la page
document.addEventListener("DOMContentLoaded", afficherCompetencesGroupe);