// Fonction pour récupérer les noms disponibles pour une compétence donnée dans le tooltip
// + filtre les noms exclus pour le couple (compétence, horaire)
async function fetchNomIds(competenceId, event, clickedDate, clickedCompetence, horaireDebut, horaireFin, overrideHoraireId) {
  const token = localStorage.getItem("token");
  const siteId = sessionStorage.getItem("selectedSite");
  if (!token || !siteId) return;

  const planningStartDate = localStorage.getItem("savedStartDate");
  const planningEndDate = localStorage.getItem("savedEndDate");

  // Normaliser les heures au format HH:MM:SS
  const toHMS = (t) => {
    if (!t) return null;
    if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
    if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
    return t; // fallback
  };
  const hDeb = toHMS(horaireDebut);
  const hFin = toHMS(horaireFin);

  let horaireId = overrideHoraireId ? Number(overrideHoraireId) : null;
  console.log('[fetchNomIds] params', { competenceId, horaireDebut, horaireFin, overrideHoraireId, siteId });
  try {
    if (!horaireId && hDeb && hFin) {
      const resHor = await fetch(`/api/horaires-competences?site_id=${siteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resHor.ok) {
        const horaires = await resHor.json();
        // Chercher l'horaire par début/fin et qui contient la compétence
        const match = (horaires || []).find(h => (h.horaire_debut || h.debut) === hDeb && (h.horaire_fin || h.fin) === hFin && Array.isArray(h.competences) && h.competences.includes(Number(competenceId)));
        if (match) horaireId = match.horaire_id || match.id || null;
        console.log('[fetchNomIds] resolved horaireId', { hDeb, hFin, found: !!match, horaireId });
      }
    }
  } catch (e) {
    console.warn('Impossible de résoudre horaire_id pour filtrer les exclusions', e);
  }

  // Récupérer la liste initiale
  let data = [];
  try {
    const qs = new URLSearchParams({ competence_id: competenceId, site_id: siteId });
    if (horaireId) qs.append('horaire_id', String(horaireId));
    const url = `/api/nom-ids?${qs.toString()}`;
    console.log('[fetchNomIds] calling', url);
    const res = await fetch(url);
    data = res.ok ? await res.json() : [];
    console.log('[fetchNomIds] initial noms', data);
  } catch (e) {
    data = [];
  }

  // Filtrer si on a un horaireId
  if (horaireId) {
    try {
      const resEx = await fetch(`/api/exclusions-competence-nom?site_id=${siteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resEx.ok) {
        const excl = await resEx.json();
        const excludedSet = new Set((excl || []).filter(r => r.excluded).map(r => `${r.nom_id}|${r.competence_id}|${r.horaire_id}`));
        console.log('[fetchNomIds] excludedSet size', excludedSet.size);
        // data peut contenir des strings (indisponibles) et des objets {nom, nom_id}
        data = Array.isArray(data) ? data.filter(n => {
          if (typeof n === 'string') return true; // on laisse les autres infos du tooltip
          const nid = n.nom_id || n.id;
          if (!nid) return true;
          const key = `${nid}|${competenceId}|${horaireId}`;
          return !excludedSet.has(key);
        }) : data;
        console.log('[fetchNomIds] filtered noms', data);
      }
    } catch {}
  }

  showTooltip(event, data, {
    competenceId,
    horaireId: horaireId || null,
    date: clickedDate,
    siteId,
    planningStartDate,
    planningEndDate,
    clickedCompetence,
    clickedDate
  });
}
async function fetchNomDetails(competenceId, siteId, semaine, annee, noms) {
  try {
    const response = await fetch(`/api/nom-details`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        competence_id: competenceId,
        site_id: siteId,
        semaine,
        annee,
        noms,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erreur lors de la récupération des détails des noms : ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    console.log("Détails des noms récupérés :", data);
    return data; // Retourne les détails des noms
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des détails des noms :",
      error
    );
    return {};
  }
}

function formatTime(time) {
  // Convertir le format "08:30:00" en "08h30"
  const [hours, minutes] = time.split(":");
  return `${hours}h${minutes}`;
}

function adjustTooltipPosition(tooltip, event) {
  const tooltipRect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = event.pageX - tooltip.offsetWidth / 2;
  let top = event.pageY + 15;

  // Ajuster si le tooltip dépasse à droite
  if (left + tooltipRect.width > viewportWidth) {
    left = viewportWidth - tooltipRect.width - 10; // Décalage de 10px pour éviter le bord
  }

  // Ajuster si le tooltip dépasse à gauche
  if (left < 0) {
    left = 10; // Décalage de 10px pour éviter le bord
  }

  // Ajuster si le tooltip dépasse en bas
  if (top + tooltipRect.height > viewportHeight) {
    top = viewportHeight - tooltipRect.height - 10; // Décalage de 10px pour éviter le bord
  }

  // Ajuster si le tooltip dépasse en haut
  if (top < 0) {
    top = 10; // Décalage de 10px pour éviter le bord
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

// Fonction pour afficher le tooltip vide et charger les noms disponibles
function showEmptyTooltip(
  event,
  nom,
  nom_id,
  day,
  semaine,
  annee,
  competenceId,
  horaireDebut,
  horaireFin
) {
  const tooltip = document.getElementById("tooltip");
  tooltip.innerHTML = `
        <div style="position: relative; padding-bottom: 10px; margin-bottom: 8px; border-bottom: 1px solid #eee; text-align: right;">
            <div class="tooltip-close" style="position: static; cursor: pointer; display: inline-block; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 18px; font-weight: bold;">&times;</div>
        </div>
        <p>Chargement des noms disponibles...</p>
    `;

  tooltip.style.display = "block";
  tooltip.style.width = "200px"; // Largeur fixe pour une meilleure présentation
  tooltip.style.padding = "10px";

  // Positionner le tooltip
  tooltip.style.left = `${event.pageX - tooltip.offsetWidth + 25}px`;
  tooltip.style.top = `${event.pageY - 15}px`;

  // Ajouter un gestionnaire de clics pour fermer le tooltip avec la croix
  tooltip
    .querySelector(".tooltip-close")
    .addEventListener("click", function (e) {
      tooltip.style.display = "none";
      e.stopPropagation(); // Empêcher la propagation du clic
    });

  // Ajouter également un gestionnaire de clic sur le document
  document.addEventListener(
    "click",
    function closeTooltip(e) {
      // Si le clic est sur la croix ou à l'intérieur du tooltip, ne pas fermer
      if (
        e.target.closest(".tooltip-close") ||
        (e.target !== tooltip && tooltip.contains(e.target))
      )
        return;

      tooltip.style.display = "none";
      document.removeEventListener("click", closeTooltip);
    },
    { once: true }
  );

  // Appeler fetchNomIds pour récupérer les noms disponibles
  const td = event.target && event.target.closest ? event.target.closest('td[data-horaire-id][data-competence-id]') : null;
  const overrideHoraireId = td ? td.getAttribute('data-horaire-id') : null;
  console.log('[showEmptyTooltip] td dataset', td ? { competenceId: td.getAttribute('data-competence-id'), horaireId: td.getAttribute('data-horaire-id'), date: td.getAttribute('data-date') } : null);
  fetchNomIds(competenceId, event, null, null, horaireDebut, horaireFin, overrideHoraireId);
}

// Fonction pour mettre à jour le planning dans la base de données
async function updatePlanning(
  semaine,
  annee,
  jour_id,
  horaire_debut,
  horaire_fin,
  competenceId,
  nom
) {
  const token = localStorage.getItem("token"); // Récupérer le token depuis le localStorage
  const siteId = sessionStorage.getItem("selectedSite"); // Récupérer le site_id depuis le sessionStorage

  if (!token) {
    console.error("Erreur : aucun token trouvé.");
    return;
  }

  if (!siteId) {
    console.error("Erreur : aucun site_id trouvé dans le sessionStorage.");
    return;
  }

  console.log("Données envoyées pour la mise à jour du planning :", {
    semaine,
    annee,
    jour_id,
    horaire_debut,
    horaire_fin,
    competenceId,
    nom,
    siteId,
  });

  try {
    const response = await fetch("/api/update-planning", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`, // Ajouter le token dans l'en-tête
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        semaine,
        annee,
        jour_id,
        horaire_debut,
        horaire_fin,
        competence_id: competenceId,
        nom,
        site_id: siteId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erreur lors de la mise à jour du planning : ${response.status} - ${errorText}`
      );
    }

    const result = await response.text();
    console.log("Résultat de la mise à jour du planning :", result);

    // Actualiser le tableau après l'ajout
    fetchPlanningData();
  } catch (error) {
    console.error("Erreur lors de la mise à jour du planning :", error);
    alert("Une erreur est survenue lors de la mise à jour du planning.");
  }
}

// 2eme tableau pour afficher les noms disponibles

async function fetchAvailableNames(competenceId, siteId, date, horaireId) {
  console.log('Appel à fetchAvailableNames avec :', { competenceId, siteId, date, horaireId });

  const token = localStorage.getItem("token");

  if (!token) {
    console.error("Erreur : aucun token trouvé.");
    return [];
  }

  try {
    const params = new URLSearchParams({
      competence_id: competenceId,
      site_id: siteId,
      date: date
    });
    if (horaireId) params.append('horaire_id', horaireId);
    const url = `/api/available-names?${params.toString()}`;
    console.log('[fetchAvailableNames] calling', url);
    const response = await fetch(
      url,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erreur lors de la récupération des noms disponibles : ${response.status} - ${errorText}`
      );
    }

  let data = await response.json();
  console.log('Noms disponibles récupérés :', data);
    // Fallback filtrage client si nécessaire
    if (horaireId) {
      try {
        const exRes = await fetch(`/api/exclusions-competence-nom?site_id=${siteId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (exRes.ok) {
          const excl = await exRes.json();
          const excludedSet = new Set((excl || []).filter(r => r.excluded).map(r => `${r.nom_id}|${r.competence_id}|${r.horaire_id}`));
      const before = Array.isArray(data) ? data.slice() : [];
      data = Array.isArray(data) ? data.filter(n => !excludedSet.has(`${n.nom_id}|${competenceId}|${horaireId}`)) : data;
      console.log('[fetchAvailableNames] fallback filtered', { before, after: data, excludedSetSize: excludedSet.size });
        }
      } catch {}
    }
    return data;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des noms disponibles :",
      error
    );
    return [];
  }
}

// Tooltip : transmet clickedCompetence et clickedDate à la fonction d'affichage du tableau
function showTooltip(event, noms, { competenceId, horaireId, date, siteId, planningStartDate, planningEndDate, clickedCompetence, clickedDate }) {
  // Trier les noms A→Z (les chaînes simples et les objets {nom, nom_id})
  const sorted = Array.isArray(noms)
    ? [...noms].sort((a, b) => {
        const an = typeof a === 'string' ? a : (a.nom || '');
        const bn = typeof b === 'string' ? b : (b.nom || '');
        return an.localeCompare(bn, 'fr', { sensitivity: 'base' });
      })
    : [];
  const tooltip = document.getElementById("tooltip");
  tooltip.innerHTML = `
    <div class="tooltip-content">
        <div class="tooltip-close">&times;</div>
    </div>
    <ul class="tooltip-list">
        ${sorted.map(nomObj => {
          if (typeof nomObj === "string") {
            return `<li class="unavailable" data-nom="${nomObj}">${nomObj}</li>`;
          } else {
            return `<li data-nom="${nomObj.nom}" data-nom-id="${nomObj.nom_id}">${nomObj.nom}</li>`;
          }
        }).join("")}
    </ul>
    <div id="affectations-table-container"></div>
  `;
  tooltip.style.display = "block";
  tooltip.style.left = `${event.pageX}px`;
  tooltip.style.top = `${event.pageY}px`;

  tooltip.querySelector(".tooltip-close").addEventListener("click", () => {
    tooltip.style.display = "none";
  });

  tooltip.querySelectorAll("li[data-nom-id]").forEach(li => {
    li.addEventListener("click", async () => {
      tooltip.style.display = "none";
      const nomId = li.dataset.nomId;
      if (!nomId) return;
      await updatePlanningV2({
        date,
        nom_id: nomId,
        competenceId,
        horaireId,
        siteId
      });
    });

    li.addEventListener("mouseenter", async function() {
      const nom = li.dataset.nom;
      const nomId = li.dataset.nomId;
      let dateHeaders = Array.from(document.querySelectorAll("#planningTableWithNames thead th[data-date]"))
        .map(th => th.dataset.date)
        .filter(Boolean);

      if ((!dateHeaders || !dateHeaders.length)) {
        let start = sessionStorage.getItem("planningStartDate");
        let end = sessionStorage.getItem("planningEndDate");
        if (start && end) {
          dateHeaders = [];
          let current = new Date(start);
          const endDateObj = new Date(end);
          while (current <= endDateObj) {
            dateHeaders.push(current.toISOString().slice(0, 10));
            current.setDate(current.getDate() + 1);
          }
        }
      }

      const container = tooltip.querySelector("#affectations-table-container");
      if (!dateHeaders.length) {
        container.innerHTML = `<div class="tooltip-error">Erreur : aucune date trouvée</div>`;
        return;
      }
      container.innerHTML = `<div class="tooltip-loading">Chargement...</div>`;
      await showNomAffectationsTableInTooltip(
        nom, nomId, dateHeaders, siteId, container,
        clickedCompetence, clickedDate
      );
    });

    li.addEventListener("mouseleave", function() {
      const container = tooltip.querySelector("#affectations-table-container");
      container.innerHTML = "";
    });
  });
}

// Affichage du tableau avec le X rouge à la bonne case
async function showNomAffectationsTableInTooltip(nom, nom_id, dateHeaders, siteId, container, clickedCompetence, clickedDate) {
  if (!Array.isArray(dateHeaders) || !dateHeaders.length || !dateHeaders[0] || !dateHeaders[dateHeaders.length - 1]) {
    container.innerHTML = `<div class="tooltip-error">Erreur : période non définie</div>`;
    return;
  }
  const startDate = dateHeaders[0];
  const endDate = dateHeaders[dateHeaders.length - 1];
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`/api/affectations-nom-periode?nom_id=${nom_id}&site_id=${siteId}&start_date=${startDate}&end_date=${endDate}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      container.innerHTML = `<div class="tooltip-error">Erreur de chargement</div>`;
      return;
    }
    const affectations = await res.json();

    const compDates = {};
    affectations.forEach(a => {
      if (!compDates[a.nom_competence]) compDates[a.nom_competence] = {};
      compDates[a.nom_competence][a.date] = `${a.horaire_debut.slice(0,5)}-${a.horaire_fin.slice(0,5)}`;
    });
    const competences = Object.keys(compDates);

    if (competences.length === 0) {
      container.innerHTML = `<div class="tooltip-loading">Aucune affectation sur la période</div>`;
      return;
    }

    let table = `<table class="tooltip-table">
      <tr>
        <th></th>
        ${dateHeaders.map(date => `<th>${new Date(date).toLocaleDateString("fr-FR")}</th>`).join("")}
      </tr>
      ${competences.map(comp => `
        <tr>
          <td><strong>${comp}</strong></td>
          ${dateHeaders.map(date => {
            if (compDates[comp] && compDates[comp][date]) {
              return `<td>${compDates[comp][date]}</td>`;
            } else if (comp == clickedCompetence && date == clickedDate) {
              return `<td class="cell-x">X</td>`;
            } else {
              return `<td></td>`;
            }
          }).join("")}
        </tr>
      `).join("")}
    </table>`;

    container.innerHTML = `<div class="tooltip-title">Affectations de ${nom} :</div>${table}`;
  } catch (err) {
    container.innerHTML = `<div class="tooltip-error">Erreur réseau ou serveur</div>`;
  }
}


async function updatePlanningV2({
  date,
  nom_id,
  competenceId,
  horaireId,
  siteId,
}) {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("Erreur : aucun token trouvé.");
    return;
  }

  try {
    const response = await fetch("/api/update-planningv2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date,
        nom_id,
        competence_id: competenceId,
        horaire_id: horaireId,
        site_id: siteId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erreur lors de la mise à jour de Tplanningv2 : ${response.status} - ${errorText}`
      );
    }

    console.log("Planning mis à jour avec succès.");
    await refreshSecondTable();
  } catch (error) {
    console.error("Erreur lors de la mise à jour de Tplanningv2 :", error);
    alert("Une erreur est survenue lors de la mise à jour du planning.");
  }
}

async function showTooltipVacance(event, date) {
  const siteId = sessionStorage.getItem("selectedSite");
  if (!siteId) {
    alert("Aucun site sélectionné !");
    return;
  }
  const token = localStorage.getItem("token");
  // Récupère tous les noms disponibles pour ce site (hors ceux déjà en vacances ce jour-là)
  const res = await fetch(`/api/available-vacance-names?site_id=${siteId}&date=${date}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    alert("Erreur lors de la récupération des noms !");
    return;
  }
  const noms = await res.json();

  // Affiche le tooltip avec la liste des noms
  let tooltip = document.getElementById("tooltip");
  tooltip.innerHTML = `
    <div class="tooltip-header">
      <div class="tooltip-close">&times;</div>
    </div>
    <div class="tooltip-title">Ajouter une personne en vacances sur toute la période :</div>
    <ul class="tooltip-list">
      ${noms.length === 0
        ? `<li class="tooltip-unavailable">Aucun nom disponible</li>`
        : noms.map(n => `<li class="tooltip-list-item" data-nom-id="${n.nom_id}">${n.nom}</li>`).join("")}
    </ul>
  `;
  tooltip.style.display = "block";
  tooltip.style.left = event.pageX + "px";
  tooltip.style.top = event.pageY + "px";

  tooltip.querySelector(".tooltip-close").onclick = () => tooltip.style.display = "none";

  tooltip.querySelectorAll("li[data-nom-id]").forEach(li => {
    li.onclick = async function() {
      const nomId = li.dataset.nomId;
      // Ajoute à la base pour cette date/site
      const res = await fetch('/api/ajouter-vacance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ site_id: siteId, nom_id: nomId, date })
      });
      if (res.ok) {
        tooltip.style.display = "none";
        await refreshSecondTable();
      } else {
        alert("Erreur lors de l'ajout !");
      }
    };
  });
}

//toltip vacances
async function showTooltipVacanceMulti(event, dateHeaders) {
  const siteId = sessionStorage.getItem("selectedSite");
  if (!siteId) {
    alert("Aucun site sélectionné !");
    return;
  }
  const token = localStorage.getItem("token");
  // On prend la première et la dernière date affichée
  const startDate = dateHeaders[0];
  const endDate = dateHeaders[dateHeaders.length - 1];

  // Appel à une route qui retourne les noms non en vacances sur toute la période
  const res = await fetch(`/api/available-vacance-names-multi?site_id=${siteId}&start_date=${startDate}&end_date=${endDate}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    alert("Erreur lors de la récupération des noms !");
    return;
  }
  const noms = await res.json();

  // Affiche le tooltip avec la liste des noms
  let tooltip = document.getElementById("tooltip");
  tooltip.innerHTML = `
  <div class="tooltip-header">
    <div class="tooltip-close">&times;</div>
  </div>
  <div class="tooltip-title">Ajouter une personne en vacances :</div>
  <ul class="tooltip-list">
    ${noms.length === 0
      ? `<li class="tooltip-unavailable">Aucun nom disponible</li>`
      : noms.map(n => `<li class="tooltip-list-item" data-nom-id="${n.nom_id}">${n.nom}</li>`).join("")}
  </ul>
`;
  tooltip.style.display = "block";
  tooltip.style.left = event.pageX + "px";
  tooltip.style.top = event.pageY + "px";

  tooltip.querySelector(".tooltip-close").onclick = () => tooltip.style.display = "none";

  tooltip.querySelectorAll("li[data-nom-id]").forEach(li => {
    li.onclick = async function() {
      const nomId = li.dataset.nomId;
      // Ajoute la personne dans Tvacancesv2 pour chaque date de la période
      const res = await fetch('/api/ajouter-vacance-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ site_id: siteId, nom_id: nomId, dates: dateHeaders })
      });
      if (res.ok) {
        tooltip.style.display = "none";
        await refreshSecondTable();
      } else {
        alert("Erreur lors de l'ajout !");
      }
    };
  });
}




