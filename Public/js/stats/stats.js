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
        `<li>${c.competence}</li>`
    ).join("");
}

// Appel automatique au chargement de la page
document.addEventListener("DOMContentLoaded", afficherCompetencesGroupe);