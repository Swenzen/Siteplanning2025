document.getElementById("planningTableWithNames").addEventListener("contextmenu", function(event) {
  event.preventDefault();

  // Cherche si on a cliqué sur un .nom-block ou un de ses enfants
  const nomBlock = event.target.closest('.nom-block');
  if (nomBlock) {
    const nomClique = nomBlock.dataset.nom;
    const nomId = nomBlock.dataset.nomId; // <-- récupère le nom_id ici !
    const cell = nomBlock.closest("td");
    const competenceId = cell.dataset.competenceId;
    const horaireId = cell.dataset.horaireId;
    const date = cell.dataset.date;
    const siteId = sessionStorage.getItem("selectedSite");

    tooltipClicDroit(event, {
      nom: nomClique,
      nom_id: nomId, // <-- passe le nom_id au tooltip
      competenceId,
      horaireId,
      date,
      siteId
    });
    return;
  }
});

// Tooltip clic droit qui affiche toutes les infos
function tooltipClicDroit(event, { nom, nom_id, competenceId, horaireId, date, siteId }) {
  let tooltip = document.getElementById("tooltip-clicdroit");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "tooltip-clicdroit";
    tooltip.style.position = "absolute";
    tooltip.style.zIndex = 10000;
    tooltip.style.background = "#fff";
    tooltip.style.border = "1px solid #ccc";
    tooltip.style.borderRadius = "6px";
    tooltip.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    tooltip.style.padding = "10px";
    tooltip.style.minWidth = "180px";
    tooltip.style.maxWidth = "300px";
    tooltip.style.fontFamily = "Arial, sans-serif";
    document.body.appendChild(tooltip);
  }

  tooltip.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; margin-bottom: 8px; padding-bottom: 6px;">
      <span style="font-weight: bold;">${nom}</span>
      <div style="display: flex; gap: 8px; align-items: center;">
        <button class="tooltip-delete" title="Supprimer" style="background: #fff; color: #ff4d4f; border: 1px solid #ff4d4f; border-radius: 3px; padding: 2px 8px; cursor: pointer; font-size: 13px;">Supprimer</button>
        <span class="tooltip-close" style="cursor: pointer; font-size: 18px; font-weight: bold;">&times;</span>
      </div>
    </div>
    <div style="font-size: 13px; color: #555;">
      <div><b>Compétence ID :</b> ${competenceId}</div>
      <div><b>Horaire ID :</b> ${horaireId}</div>
      <div><b>Date :</b> ${date}</div>
      <div><b>Site ID :</b> ${siteId}</div>
    </div>
  `;

  tooltip.style.left = event.pageX + "px";
  tooltip.style.top = event.pageY + "px";
  tooltip.style.display = "block";

  tooltip.querySelector(".tooltip-close").onclick = function() {
    tooltip.style.display = "none";
  };

  // Suppression directe avec le nom_id déjà connu
  tooltip.querySelector(".tooltip-delete").onclick = async function(e) {
    e.stopPropagation();
    tooltip.style.display = "none";

    try {
      const token = localStorage.getItem("token");
      const res = await fetch('/api/delete-planningv2', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          date,
          nom_id,
          competence_id: competenceId,
          horaire_id: horaireId,
          site_id: siteId
        })
      });
      if (!res.ok) throw new Error(await res.text());

      // Suppression visuelle du bloc nom
      const allCells = document.querySelectorAll('td[data-competence-id][data-horaire-id][data-date]');
      for (const cell of allCells) {
        if (
          cell.dataset.competenceId === competenceId &&
          cell.dataset.horaireId === horaireId &&
          cell.dataset.date === date
        ) {
          const blocks = cell.querySelectorAll('.nom-block');
          blocks.forEach(block => {
            if (block.dataset.nomId === nom_id) block.remove();
          });
        }
      }
    } catch (err) {
      console.error("Erreur lors de la suppression : " + err.message);    }
  };

  document.addEventListener("click", function hideTooltip(e) {
    if (!tooltip.contains(e.target)) {
      tooltip.style.display = "none";
      document.removeEventListener("click", hideTooltip);
    }
  });
}