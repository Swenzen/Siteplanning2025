document.getElementById("planningTableWithNames").addEventListener("contextmenu", function(event) {
  event.preventDefault();

  // --- GESTION CLIC DROIT SUR UNE MISSION ---
  const missionBlock = event.target.closest('.mission-block');
  if (missionBlock) {
    const missionId = missionBlock.dataset.missionId;
    const missionTexte = missionBlock.textContent.replace(/^Mission\s*:\s*/i, "");
    let tooltip = document.getElementById("tooltip-clicdroit");
    if (tooltip) tooltip.remove();

    tooltip = document.createElement("div");
    tooltip.id = "tooltip-clicdroit";
    tooltip.className = "tooltip-clicdroit";
    document.body.appendChild(tooltip);

    // ... d'abord, mets le contenu du tooltip :
    tooltip.innerHTML = `
      <div class="tooltip-header">
        <span class="tooltip-title">Mission</span>
        <span class="tooltip-close" style="cursor:pointer;float:right;">&times;</span>
      </div>
      <div class="tooltip-content">
        <div class="tooltip-mission-label">Mission :</div>
        <div class="tooltip-mission">${missionTexte}</div>
        <button class="tooltip-delete-mission" data-mission-id="${missionId}">Supprimer la mission</button>
      </div>
    `;

    // Puis positionne le tooltip :
    tooltip.style.position = "fixed"; // Ajoute cette ligne

    const margin = 10;
    let x = event.clientX + margin;
    let y = event.clientY + margin;
    const rect = tooltip.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - margin;
    if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - margin;
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";

    // Fermeture tooltip
    tooltip.querySelector(".tooltip-close").onclick = function() {
      tooltip.style.display = "none";
    };

    // Bouton supprimer la mission
    const btnDeleteMission = tooltip.querySelector(".tooltip-delete-mission");
    if (btnDeleteMission) {
      btnDeleteMission.onclick = async function(e) {
        e.stopPropagation();
        tooltip.style.display = "none";
        const missionId = this.dataset.missionId; // <-- Correction ici
        if (!confirm("Supprimer cette mission ?")) return;
        try {
          const token = localStorage.getItem("token");
          await fetch(`/api/delete-mission/${missionId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
          });
          await refreshSecondTable();
        } catch (err) {
          alert("Erreur lors de la suppression de la mission : " + err.message);
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

    return; // Stoppe ici pour ne pas déclencher les autres tooltips
  }

  const nomBlock = event.target.closest('.nom-block');
  if (nomBlock) {
    const nomClique = nomBlock.dataset.nom;
    const nomId = nomBlock.dataset.nomId;
    const cell = nomBlock.closest("td");
    const siteId = sessionStorage.getItem("selectedSite");

    // Détection : est-ce la case sous "Vacance" (colonne 1 du tfoot) ?
    const isVacanceSousCase = cell && cell.parentElement && cell.parentElement.id === "extra-vacance-row" && cell.cellIndex === 0;
    // Détection : est-ce une cellule vacance-cell ?
    const isVacanceCell = cell && cell.classList.contains('vacance-cell');

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

    // Si clic droit sur une case vacance-cell (hors première colonne)
    if (isVacanceCell) {
      const date = cell.dataset.date;
      tooltipClicDroit(event, {
        nom: nomClique,
        nom_id: nomId,
        siteId,
        date,
        isVacanceCell: true
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

    // Cherche la mission liée à ce nom
    let missionNom = null;
    const missionBlock = Array.from(cell.querySelectorAll('.mission-block')).find(div => {
      return div.dataset && div.dataset.missionId && div.dataset.nomId === nomId;
    });
    if (missionBlock) {
      missionNom = {
        id: missionBlock.dataset.missionId,
        texte: missionBlock.textContent.replace(/^Mission\s*:\s*/i, "")
      };
    }

    tooltipClicDroit(event, {
      nom: nomClique,
      nom_id: nomId,
      competenceId,
      horaireId,
      date,
      siteId,
      commentaireNom, // <-- on passe le commentaire trouvé
      missionNom      // <-- ajoute bien cette ligne
    });
    return;
  }

  // Si clic droit sur une case (td) sans nom
  const cellVide = event.target.closest('td');
  if (
    cellVide &&
    cellVide.dataset.competenceId &&
    cellVide.dataset.horaireId &&
    cellVide.dataset.date
  ) {
    const competenceId = cellVide.dataset.competenceId;
    const horaireId = cellVide.dataset.horaireId;
    const date = cellVide.dataset.date;
    const siteId = sessionStorage.getItem("selectedSite");

    // Cherche le commentaire général (où nom_id est null)
    let commentaireGeneral = "";
    const commentaireBlock = Array.from(cellVide.querySelectorAll('.commentaire-block')).find(div => {
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
function tooltipClicDroit(event, { nom, nom_id, competenceId, horaireId, date, siteId, commentaireNom, missionNom, isCaseVide, dateHeaders, isVacanceSousCase, isVacanceCell }) {
  // Supprime l'ancien tooltip si présent
  let tooltip = document.getElementById("tooltip-clicdroit");
  if (tooltip) tooltip.remove();

  tooltip = document.createElement("div");
  tooltip.id = "tooltip-clicdroit";
  tooltip.className = "tooltip-clicdroit";
  document.body.appendChild(tooltip);

  // ... d'abord, mets le contenu du tooltip :
  tooltip.innerHTML = `
      <div class="tooltip-header">
        <span class="tooltip-title">${nom}</span>
        <div class="tooltip-actions">
          <button class="tooltip-delete" title="Supprimer">Supprimer</button>
          <span class="tooltip-close">&times;</span>
        </div>
      </div>
      <div class="tooltip-content">
    `;

    // CASE VACANCE SOUS-CASE
    if (isVacanceSousCase) {
      tooltip.innerHTML = `
        <div class="tooltip-header">
          <span class="tooltip-title">${nom}</span>
          <div class="tooltip-actions">
            <button class="tooltip-delete-multi" title="Supprimer">Supprimer sur toute la période</button>
            <span class="tooltip-close">&times;</span>
          </div>
        </div>
        <div class="tooltip-details">
          <div><b>Site ID :</b> ${siteId}</div>
          <div><b>Période :</b> ${dateHeaders ? dateHeaders.join(" / ") : ""}</div>
        </div>
      `;
    }
    // CASE VIDE
    else if (isCaseVide) {
      let isFermee = commentaireNom && commentaireNom.trim().toLowerCase() === "fermée";
      tooltip.innerHTML = `
        <div class="tooltip-header">
          <span class="tooltip-title">Case vide</span>
          <span class="tooltip-close">&times;</span>
        </div>
        <div class="tooltip-content">
          ${
            isFermee
              ? `<button class="tooltip-reopen">Réouvrir</button>`
              : `
                ${commentaireNom
                  ? `<div class="tooltip-comment-label">Commentaire :</div>
                     <div class="tooltip-comment">${commentaireNom}</div>
                     <button class="tooltip-delete-commentaire">Supprimer le commentaire</button>`
                  : `<button class="tooltip-fermee">Fermée</button>
                     <button class="tooltip-add-commentaire">Ajouter un commentaire</button>`
                }
                <button class="tooltip-add-mission">Ajouter une mission</button>
              `
          }
        </div>
      `;
    }
    // CASE AVEC NOM
    else {
      let html = `
        <div class="tooltip-header">
          <span class="tooltip-title">${nom}</span>
          <div class="tooltip-actions">
            <button class="tooltip-delete" title="Supprimer">Supprimer</button>
            <span class="tooltip-close">&times;</span>
          </div>
        </div>
        <div class="tooltip-content">
      `;

      // Ajoute le commentaire s'il existe
      if (commentaireNom) {
        html += `
          <div class="tooltip-comment-label">Commentaire :</div>
          <div class="tooltip-comment">${commentaireNom}</div>
          <button class="tooltip-delete-commentaire">Supprimer le commentaire</button>
        `;
      } else {
        html += `<button class="tooltip-add-commentaire">Ajouter un commentaire</button>`;
      }

      // Ajoute la mission liée au nom s'il y en a une
      if (missionNom) {
        html += `
          <div class="tooltip-mission-label">Mission :</div>
          <div class="tooltip-mission">${missionNom.texte}</div>
          <button class="tooltip-delete-mission" data-mission-id="${missionNom.id}">Supprimer la mission</button>
        `;
      } else {
        html += `<button class="tooltip-add-mission">Ajouter une mission</button>`;
      }

      html += `</div>`;
      tooltip.innerHTML = html;
    }

    // Puis positionne le tooltip :
    tooltip.style.position = "fixed"; // Ajoute cette ligne

    const margin = 10;
    let x = event.clientX + margin;
    let y = event.clientY + margin;
    const rect = tooltip.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - margin;
    if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - margin;
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";

  // Gestion des boutons du tooltip
  tooltip.onclick = async function(e) {
    // Fermer le tooltip
    if (e.target.classList.contains("tooltip-close")) {
      tooltip.style.display = "none";
    }

    // Supprimer la mission
    if (e.target.classList.contains("tooltip-delete-mission")) {
      e.stopPropagation();
      tooltip.style.display = "none";
      const missionId = e.target.dataset.missionId;
      if (!confirm("Supprimer cette mission ?")) return;
      try {
        const token = localStorage.getItem("token");
        await fetch(`/api/delete-mission/${missionId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        await refreshSecondTable();
      } catch (err) {
        alert("Erreur lors de la suppression de la mission : " + err.message);
      }
    }

    // Bouton Fermée (case vide)
    if (e.target.classList.contains("tooltip-fermee")) {
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
    }

    // Bouton Réouvrir (case vide avec Fermée)
    if (e.target.classList.contains("tooltip-reopen")) {
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
    }

    // Ajouter un commentaire
    if (e.target.classList.contains("tooltip-add-commentaire")) {
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
    }

    // Supprimer le commentaire
    if (e.target.classList.contains("tooltip-delete-commentaire")) {
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
    }

    // Supprimer le nom (case avec nom)
    if (e.target.classList.contains("tooltip-delete")) {
      e.stopPropagation();
      tooltip.style.display = "none";
      try {
        const token = localStorage.getItem("token");
        if (isVacanceSousCase || isVacanceCell) {
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
    }

    // Supprimer sur toute la période (vacance sous-case)
    if (e.target.classList.contains("tooltip-delete-multi")) {
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
    }

    // Ajouter une mission
    if (e.target.classList.contains("tooltip-add-mission")) {
      e.stopPropagation();
      const texte = prompt("Écris la mission à ajouter pour cette case :");
      if (!texte) return;
      tooltip.style.display = "none";
      try {
        const token = localStorage.getItem("token");
        await fetch('/api/add-mission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            site_id: siteId,
            competence_id: competenceId,
            horaire_id: horaireId,
            date,
            nom_id: isCaseVide ? null : nom_id,
            texte
          })
        });
        await refreshSecondTable();
      } catch (err) {
        alert("Erreur lors de l'ajout de la mission : " + err.message);
      }
    }
  };

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
