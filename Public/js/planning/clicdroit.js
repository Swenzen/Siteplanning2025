document.getElementById("planningTableWithNames").addEventListener("contextmenu", function(event) {
  event.preventDefault();

  // Cherche si on a cliqué sur un .nom-block ou un de ses enfants
  const nomBlock = event.target.closest('.nom-block');
  if (nomBlock) {
    const nomClique = nomBlock.dataset.nom;
    const cell = nomBlock.closest("td");
    const competenceId = cell.dataset.competenceId;
    const horaireId = cell.dataset.horaireId;
    const date = cell.dataset.date;
    const siteId = sessionStorage.getItem("selectedSite");

    tooltipClicDroit(event, {
      nom: nomClique,
      competenceId,
      horaireId,
      date,
      siteId
    });
    return;
  }

  // Si clic ailleurs dans la cellule, comportement par défaut ou rien
});

// Tooltip clic droit qui affiche toutes les infos
function tooltipClicDroit(event, { nom, competenceId, horaireId, date, siteId }) {
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
      <span class="tooltip-close" style="cursor: pointer; font-size: 18px; font-weight: bold;">&times;</span>
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

  document.addEventListener("click", function hideTooltip(e) {
    if (!tooltip.contains(e.target)) {
      tooltip.style.display = "none";
      document.removeEventListener("click", hideTooltip);
    }
  });
}