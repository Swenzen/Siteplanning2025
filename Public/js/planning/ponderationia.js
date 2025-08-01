// Variable globale pour les pondérations dynamiques
window.groupePriorites = {}; // sera rempli dynamiquement

// Fonction pour afficher le tableau de pondération dynamique
async function renderPonderationTable() {
  const site_id = sessionStorage.getItem("selectedSite");
  let groupesCompetence = [];
  let groupesHoraire = [];
  try {
    const res1 = await fetch(`/api/competence-groupes?site_id=${site_id}`, {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") }
    });
    if (res1.ok) groupesCompetence = await res1.json();

    const res2 = await fetch(`/api/horaire-groupes?site_id=${site_id}`, {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") }
    });
    if (res2.ok) groupesHoraire = await res2.json();
  } catch (e) {
    console.error("Erreur lors du fetch des groupes pour pondération", e);
  }
  const groupes = [
    ...groupesCompetence.map(g => ({ ...g, type: "competence" })),
    ...groupesHoraire.map(g => ({ ...g, type: "horaire" }))
  ];
  if (!groupes.length) return;

  // Prépare le HTML du tableau SANS style inline
  let html = `<div id="ponderationia-panel" class="ponderationia-panel">
    <h3>Pondération des groupes</h3>
    <table border="1" class="ponderation-table">
      <thead><tr><th>Groupe</th><th>Type</th><th>Pondération</th></tr></thead>
      <tbody>
  `;
  groupes.forEach(groupe => {
    const val = window.groupePriorites[groupe.nom_groupe] ?? 1;
    html += `<tr>
      <td>${groupe.nom_groupe}</td>
      <td>${groupe.type === "horaire" ? "Horaires" : "Compétences"}</td>
      <td class="bg-ponderation">
        <input type="number" min="1" step="1" value="${val}" 
          data-groupe="${groupe.nom_groupe}" class="ponderation-input">
      </td>
    </tr>`;
  });
  html += `</tbody></table>
    <button id="btnApplyPonderation" class="btn-ponderation">Appliquer</button>
  </div>`;

  // Ajoute le tableau tout en bas du body
  let panel = document.getElementById("ponderationia-panel");
  if (panel) panel.outerHTML = html;
  else document.body.insertAdjacentHTML("beforeend", html);

  // Gestion du bouton "Appliquer"
  document.getElementById("btnApplyPonderation").onclick = () => {
    const inputs = document.querySelectorAll('#ponderationia-panel input[type="number"]');
    inputs.forEach(input => {
      const groupe = input.getAttribute("data-groupe");
      let val = parseInt(input.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      window.groupePriorites[groupe] = val;
    });
    alert("Pondérations appliquées !");
  };
}

// Appelle la fonction au chargement de la page
window.addEventListener("DOMContentLoaded", renderPonderationTable);