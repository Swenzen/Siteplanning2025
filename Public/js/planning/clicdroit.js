document.getElementById("planningTableWithNames").addEventListener("contextmenu", function(event) {
  event.preventDefault();

  const nomBlock = event.target.closest('.nom-block');
  if (nomBlock) {
    const nomClique = nomBlock.dataset.nom;
    const nomId = nomBlock.dataset.nomId;
    const cell = nomBlock.closest("td");
    const siteId = sessionStorage.getItem("selectedSite");

    // Détection : est-ce la case sous "Vacance" (colonne 1 du tfoot) ?
    const isVacanceSousCase = cell && cell.parentElement && cell.parentElement.id === "extra-vacance-row" && cell.cellIndex === 0;

    if (isVacanceSousCase) {
      // On récupère toutes les dates affichées (headers du tfoot)
      const dateHeaders = Array.from(document.querySelectorAll("#planningTableWithNames tfoot tr:nth-child(1) th"))
        .slice(2) // On saute "Vacance" et "Autre"
        .map(th => th.dataset.date || th.textContent.trim().split("/").reverse().join("-")); // adapte si besoin

      tooltipClicDroit(event, {
        nom: nomClique,
        nom_id: nomId,
        siteId,
        dateHeaders,
        isVacanceSousCase: true
      });
      return;
    }

    // Si clic droit sur une case (td) avec nom
    const competenceId = cell.dataset.competenceId;
    const horaireId = cell.dataset.horaireId;
    const date = cell.dataset.date;

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

  // Si clic droit sur une case (td) sans nom
  const cell = event.target.closest('td');
  if (
    cell &&
    cell.dataset.competenceId &&
    cell.dataset.horaireId &&
    cell.dataset.date
  ) {
    const competenceId = cell.dataset.competenceId;
    const horaireId = cell.dataset.horaireId;
    const date = cell.dataset.date;
    const siteId = sessionStorage.getItem("selectedSite");

    // Cherche le commentaire général (où nom_id est null)
    let commentaireGeneral = "";
    const commentaireBlock = Array.from(cell.querySelectorAll('.commentaire-block')).find(div => {
      // On considère que le commentaire général n'est pas suivi d'un .nom-block
      return !div.nextElementSibling || !div.nextElementSibling.classList.contains('nom-block');
    });
    if (commentaireBlock) {
      commentaireGeneral = commentaireBlock.textContent;
    }

    tooltipClicDroit(event, {
      nom: "", // pas de nom
      nom_id: null,
      competenceId,
      horaireId,
      date,
      siteId,
      commentaireNom: commentaireGeneral, // on passe le commentaire général
      isCaseVide: true // pour adapter l'affichage dans le tooltip
    });
  }
});

// Tooltip clic droit qui affiche toutes les infos et le commentaire lié au nom
function tooltipClicDroit(event, { nom, nom_id, competenceId, horaireId, date, siteId, commentaireNom, isCaseVide, dateHeaders, isVacanceSousCase }) {
  // Supprime l'ancien tooltip si présent
  let tooltip = document.getElementById("tooltip-clicdroit");
  if (tooltip) tooltip.remove();

  tooltip = document.createElement("div");
  tooltip.id = "tooltip-clicdroit";
  tooltip.style.position = "fixed";
  tooltip.style.zIndex = 10000;
  tooltip.style.background = "#fff";
  tooltip.style.border = "1px solid #ccc";
  tooltip.style.borderRadius = "6px";
  tooltip.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
  tooltip.style.padding = "10px";
  tooltip.style.minWidth = "180px";
  tooltip.style.maxWidth = "300px";
  tooltip.style.fontFamily = "Arial, sans-serif";
  tooltip.style.display = "block";
  document.body.appendChild(tooltip);

  // Positionnement intelligent (évite de sortir de l'écran)
  const margin = 10;
  let x = event.clientX + margin;
  let y = event.clientY + margin;
  setTimeout(() => {
    const rect = tooltip.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - margin;
    if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - margin;
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
  }, 0);

  // Détection : est-ce une cellule de vacances (tfoot) ?
  let isVacanceCell = false;
  if (event.target.closest('td') && event.target.closest('td').classList.contains('vacance-cell')) {
    isVacanceCell = !(competenceId && horaireId);
  }

  // CASE VACANCE SOUS-CASE
  if (isVacanceSousCase) {
    tooltip.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; margin-bottom: 8px; padding-bottom: 6px;">
        <span style="font-weight: bold;">${nom}</span>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="tooltip-delete-multi" title="Supprimer" style="background: #fff; color: #ff4d4f; border: 1px solid #ff4d4f; border-radius: 3px; padding: 2px 8px; cursor: pointer; font-size: 13px;">Supprimer sur toute la période</button>
          <span class="tooltip-close" style="cursor: pointer; font-size: 18px; font-weight: bold;">&times;</span>
        </div>
      </div>
      <div style="font-size: 13px; color: #555;">
        <div><b>Site ID :</b> ${siteId}</div>
        <div><b>Période :</b> ${dateHeaders ? dateHeaders.join(" / ") : ""}</div>
      </div>
    `;
  }
  // CASE VIDE
  else if (isCaseVide) {
    let isFermee = commentaireNom && commentaireNom.trim().toLowerCase() === "fermée";
    tooltip.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; margin-bottom: 8px; padding-bottom: 6px;">
        <span style="font-weight: bold;">Case vide</span>
        <span class="tooltip-close" style="cursor: pointer; font-size: 18px; font-weight: bold;">&times;</span>
      </div>
      <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
        ${
          isFermee
            ? `<button class="tooltip-reopen" style="background: #fff; color: #28a745; border: 1px solid #28a745; border-radius: 3px; padding: 2px 8px; cursor: pointer; font-size: 13px;">Réouvrir</button>`
            : `<button class="tooltip-fermee" style="background: #fff; color: #c00; border: 1px solid #c00; border-radius: 3px; padding: 2px 8px; cursor: pointer; font-size: 13px;">Fermée</button>
               <button class="tooltip-add-commentaire" style="background: #fff; color: #007bff; border: 1px solid #007bff; border-radius: 3px; padding: 2px 8px; cursor: pointer; font-size: 13px;">Ajouter un commentaire</button>`
        }
      </div>
    `;
  }
  // CASE AVEC NOM
  else {
    tooltip.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; margin-bottom: 8px; padding-bottom: 6px;">
        <span style="font-weight: bold;">${nom}</span>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="tooltip-delete" title="Supprimer" style="background: #fff; color: #ff4d4f; border: 1px solid #ff4d4f; border-radius: 3px; padding: 2px 8px; cursor: pointer; font-size: 13px;">Supprimer</button>
          <span class="tooltip-close" style="cursor: pointer; font-size: 18px; font-weight: bold;">&times;</span>
        </div>
      </div>
      ${
        commentaireNom
          ? `<div style="margin-top:10px; border-top:1px solid #eee; padding-top:8px;">
              <div style="font-weight:bold; color:#007bff; margin-bottom:4px;">Commentaire :</div>
              <div style="margin-bottom:6px;">${commentaireNom}</div>
              <button class="tooltip-delete-commentaire" style="background: #fff; color: #ff4d4f; border: 1px solid #ff4d4f; border-radius: 3px; padding: 2px 8px; cursor: pointer; font-size: 13px;">Supprimer le commentaire</button>
            </div>`
          : `<button class="tooltip-add-commentaire" style="margin-top:10px; background: #fff; color: #007bff; border: 1px solid #007bff; border-radius: 3px; padding: 2px 8px; cursor: pointer; font-size: 13px;">Ajouter un commentaire</button>`
      }
    `;
  }

  // Fermeture tooltip
  tooltip.querySelector(".tooltip-close").onclick = function() {
    tooltip.style.display = "none";
  };

  // Bouton Fermée (case vide)
  const btnFermee = tooltip.querySelector(".tooltip-fermee");
  if (btnFermee) {
    btnFermee.onclick = async function(e) {
      e.stopPropagation();
      tooltip.style.display = "none";
      try {
        const token = localStorage.getItem("token");
        await fetch('/api/add-commentairev2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ site_id: siteId, competence_id: competenceId, horaire_id: horaireId, date, nom_id: null, commentaire: "Fermée" })
        });
        await refreshSecondTable();
      } catch (err) {
        alert("Erreur lors de l'ajout du commentaire Fermée : " + err.message);
      }
    };
  }

  // Bouton Réouvrir (case vide avec Fermée)
  const btnReopen = tooltip.querySelector(".tooltip-reopen");
  if (btnReopen) {
    btnReopen.onclick = async function(e) {
      e.stopPropagation();
      tooltip.style.display = "none";
      try {
        const token = localStorage.getItem("token");
        await fetch('/api/delete-commentairev2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ date, nom_id: null, competence_id: competenceId, horaire_id: horaireId, site_id: siteId })
        });
        await refreshSecondTable();
      } catch (err) {
        alert("Erreur lors de la suppression du commentaire Fermée : " + err.message);
      }
    };
  }

  // Bouton Ajouter un commentaire (case vide ou avec nom)
  const btnAddCommentaire = tooltip.querySelector(".tooltip-add-commentaire");
  if (btnAddCommentaire) {
    btnAddCommentaire.onclick = async function(e) {
      e.stopPropagation();
      const commentaire = prompt("Écris le commentaire à ajouter pour cette case :");
      if (!commentaire) return;
      tooltip.style.display = "none";
      try {
        const token = localStorage.getItem("token");
        await fetch('/api/add-commentairev2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ site_id: siteId, competence_id: competenceId, horaire_id: horaireId, date, nom_id: isCaseVide ? null : nom_id, commentaire })
        });
        await refreshSecondTable();
      } catch (err) {
        alert("Erreur lors de l'ajout du commentaire : " + err.message);
      }
    };
  }

  // Bouton Supprimer le commentaire (case avec nom)
  const btnDeleteCommentaire = tooltip.querySelector(".tooltip-delete-commentaire");
  if (btnDeleteCommentaire) {
    btnDeleteCommentaire.onclick = async function(e) {
      e.stopPropagation();
      tooltip.style.display = "none";
      try {
        const token = localStorage.getItem("token");
        await fetch('/api/delete-commentairev2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ date, nom_id: isCaseVide ? null : nom_id, competence_id: competenceId, horaire_id: horaireId, site_id: siteId })
        });
        await refreshSecondTable();
      } catch (err) {
        alert("Erreur lors de la suppression du commentaire : " + err.message);
      }
    };
  }

  // Bouton Supprimer le nom (case avec nom)
  const btnDelete = tooltip.querySelector(".tooltip-delete");
  if (btnDelete) {
    btnDelete.onclick = async function(e) {
      e.stopPropagation();
      tooltip.style.display = "none";
      try {
        const token = localStorage.getItem("token");
        if (isVacanceCell) {
          await fetch('/api/delete-vacancev2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ date, nom_id, site_id: siteId })
          });
        } else {
          await fetch('/api/delete-planningv2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ date, nom_id, competence_id: competenceId, horaire_id: horaireId, site_id: siteId })
          });
        }
        await refreshSecondTable();
      } catch (err) {
        alert("Erreur lors de la suppression : " + err.message);
      }
    };
  }

  // Bouton Supprimer sur toute la période (vacance sous-case)
  const btnDeleteMulti = tooltip.querySelector(".tooltip-delete-multi");
  if (btnDeleteMulti) {
    btnDeleteMulti.onclick = async function(e) {
      e.stopPropagation();
      tooltip.style.display = "none";
      try {
        const token = localStorage.getItem("token");
        await fetch('/api/delete-vacance-multi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ site_id: siteId, nom_id: nom_id, dates: dateHeaders })
        });
        await refreshSecondTable();
      } catch (err) {
        alert("Erreur lors de la suppression sur toute la période : " + err.message);
      }
    };
  }

  // Fermer le tooltip si clic ailleurs
  setTimeout(() => {
    function hideTooltip(e) {
      if (!tooltip.contains(e.target)) {
        tooltip.style.display = "none";
        document.removeEventListener("mousedown", hideTooltip);
      }
    }
    document.addEventListener("mousedown", hideTooltip);
  }, 0);
}

