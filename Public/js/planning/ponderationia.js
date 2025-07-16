// Variable globale pour les pondérations dynamiques
window.groupePriorites = {}; // sera rempli dynamiquement

// Fonction pour afficher le tableau de pondération dynamique
async function renderPonderationTable() {
  // Récupère dynamiquement les groupes depuis le site courant
  const site_id = sessionStorage.getItem("selectedSite");
  let groupes = [];
  try {
    const res = await fetch(`/api/competence-groupes?site_id=${site_id}`, {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") }
    });
    if (res.ok) {
      groupes = await res.json();
    }
  } catch (e) {
    console.error("Erreur lors du fetch des groupes pour pondération", e);
  }
  if (!groupes.length) return;

  // Prépare le HTML du tableau
  let html = `<div id="ponderationia-panel" style="margin-top:32px;">
    <h3>Pondération des groupes</h3>
    <table border="1" style="border-collapse:collapse;">
      <thead><tr><th>Groupe</th><th>Pondération</th></tr></thead>
      <tbody>
  `;
  groupes.forEach(groupe => {
    const val = window.groupePriorites[groupe.nom_groupe] ?? 1;
    html += `<tr>
      <td>${groupe.nom_groupe}</td>
      <td>
        <input type="number" min="1" step="1" value="${val}" 
          data-groupe="${groupe.nom_groupe}" style="width:60px;">
      </td>
    </tr>`;
  });
  html += `</tbody></table>
    <button id="btnApplyPonderation" style="margin-top:8px;">Appliquer</button>
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