document.getElementById("planningTableWithNames").addEventListener("contextmenu", function(event) {
  event.preventDefault();

  const nomBlock = event.target.closest('.nom-block');
  if (nomBlock) {
    const nomClique = nomBlock.dataset.nom;
    const nomId = nomBlock.dataset.nomId;
    const cell = nomBlock.closest("td");
    const competenceId = cell.dataset.competenceId;
    const horaireId = cell.dataset.horaireId;
    const date = cell.dataset.date;
    const siteId = sessionStorage.getItem("selectedSite");

    // Cherche le commentaire lié à ce nom dans la cellule
    let commentaireNom = "";
    const commentaireBlock = Array.from(cell.querySelectorAll('.commentaire-block')).find(div => {
      // On suppose que le commentaire lié au nom est juste avant le .nom-block correspondant
      return div.nextElementSibling && div.nextElementSibling.dataset && div.nextElementSibling.dataset.nomId === nomId;
    });
    if (commentaireBlock) {
      commentaireNom = commentaireBlock.textContent;
    }

    tooltipClicDroit(event, {
      nom: nomClique,
      nom_id: nomId,
      competenceId,
      horaireId,
      date,
      siteId,
      commentaireNom // <-- on passe le commentaire trouvé
    });
    return;
  }
});

// Tooltip clic droit qui affiche toutes les infos et le commentaire lié au nom
function tooltipClicDroit(event, { nom, nom_id, competenceId, horaireId, date, siteId, commentaireNom }) {
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
    ${
      commentaireNom
        ? `<div style="margin-top:10px; border-top:1px solid #eee; padding-top:8px;">
            <div style="font-weight:bold; color:#007bff; margin-bottom:4px;">Commentaire :</div>
            <div style="margin-bottom:6px;">${commentaireNom}</div>
            <button class="tooltip-delete-commentaire" title="Supprimer le commentaire" style="background: #fff; color: #ff4d4f; border: 1px solid #ff4d4f; border-radius: 3px; padding: 2px 8px; cursor: pointer; font-size: 13px;">Supprimer le commentaire</button>
          </div>`
        : ""
    }
  `;

  tooltip.style.left = event.pageX + "px";
  tooltip.style.top = event.pageY + "px";
  tooltip.style.display = "block";

  tooltip.querySelector(".tooltip-close").onclick = function() {
    tooltip.style.display = "none";
  };

  // Suppression du nom
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

  // Suppression du commentaire lié au nom
  const btnDeleteCommentaire = tooltip.querySelector(".tooltip-delete-commentaire");
  if (btnDeleteCommentaire) {
    btnDeleteCommentaire.onclick = async function(e) {
      e.stopPropagation();
      tooltip.style.display = "none";
      try {
        const token = localStorage.getItem("token");
        const res = await fetch('/api/delete-commentairev2', {
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
        // Suppression visuelle du commentaire
        const allCells = document.querySelectorAll('td[data-competence-id][data-horaire-id][data-date]');
        for (const cell of allCells) {
          if (
            cell.dataset.competenceId === competenceId &&
            cell.dataset.horaireId === horaireId &&
            cell.dataset.date === date
          ) {
            const blocks = cell.querySelectorAll('.commentaire-block');
            blocks.forEach(block => {
              // On supprime le commentaire juste avant le bon nom
              if (
                block.nextElementSibling &&
                block.nextElementSibling.classList.contains('nom-block') &&
                block.nextElementSibling.dataset.nomId === nom_id
              ) {
                block.remove();
              }
            });
          }
        }
      } catch (err) {
        console.error("Erreur lors de la suppression du commentaire : " + err.message);
      }
    };
  }

  document.addEventListener("click", function hideTooltip(e) {
    if (!tooltip.contains(e.target)) {
      tooltip.style.display = "none";
      document.removeEventListener("click", hideTooltip);
    }
  });
}