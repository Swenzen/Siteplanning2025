// Fonction pour récupérer les noms disponibles pour une compétence donnée dans le tooltip
// Appel à showTooltip : ajoute clickedCompetence et clickedDate
function fetchNomIds(competenceId, event, clickedDate, clickedCompetence) {
  const token = localStorage.getItem("token");
  const siteId = sessionStorage.getItem("selectedSite");
  if (!token || !siteId) return;

  const planningStartDate = localStorage.getItem("savedStartDate");
  const planningEndDate = localStorage.getItem("savedEndDate");

  fetch(`/api/nom-ids?competence_id=${competenceId}&site_id=${siteId}`)
    .then(res => res.json())
    .then(data => {
      showTooltip(event, data, {
        competenceId,
        horaireId: null,
        date: clickedDate,
        siteId,
        planningStartDate,
        planningEndDate,
        clickedCompetence,
        clickedDate
      });
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
  fetchNomIds(competenceId, event);
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

async function fetchAvailableNames(competenceId, siteId, date) {
  console.log("Appel à fetchAvailableNames avec :", {
    competenceId,
    siteId,
    date,
  });

  const token = localStorage.getItem("token");

  if (!token) {
    console.error("Erreur : aucun token trouvé.");
    return [];
  }

  try {
    const response = await fetch(
      `/api/available-names?competence_id=${competenceId}&site_id=${siteId}&date=${date}`,
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

    const data = await response.json();
    console.log("Noms disponibles récupérés :", data);
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
  const tooltip = document.getElementById("tooltip");
  tooltip.innerHTML = `
    <div style="position: relative; padding-bottom: 10px; margin-bottom: 8px; border-bottom: 1px solid #eee; text-align: right;">
        <div class="tooltip-close" style="cursor: pointer;">&times;</div>
    </div>
    <ul style="list-style: none; padding: 0; margin: 0;">
        ${noms.map(nomObj => {
          if (typeof nomObj === "string") {
            return `<li style="cursor:pointer;" data-nom="${nomObj}">${nomObj}</li>`;
          } else {
            return `<li style="cursor:pointer;" data-nom="${nomObj.nom}" data-nom-id="${nomObj.nom_id}">${nomObj.nom}</li>`;
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
        container.innerHTML = `<div style="color:#c00;">Erreur : aucune date trouvée</div>`;
        return;
      }
      container.innerHTML = `<div style="color:#888; font-size:13px;">Chargement...</div>`;
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
  // Vérification des dates
  if (!Array.isArray(dateHeaders) || !dateHeaders.length || !dateHeaders[0] || !dateHeaders[dateHeaders.length - 1]) {
    container.innerHTML = `<div style="color:#c00;">Erreur : période non définie</div>`;
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
      container.innerHTML = `<div style="color:#c00;">Erreur de chargement</div>`;
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
      container.innerHTML = `<div style="color:#888; font-size:13px;">Aucune affectation sur la période</div>`;
      return;
    }

    let table = `<table style="border-collapse:collapse;width:100%;font-size:13px;">
      <tr>
        <th style="border-bottom:1px solid #ccc;"></th>
        ${dateHeaders.map(date => `<th style="border-bottom:1px solid #ccc;padding:2px 4px;">${new Date(date).toLocaleDateString("fr-FR")}</th>`).join("")}
      </tr>
      ${competences.map(comp => `
        <tr>
          <td style="font-weight:bold;padding:2px 4px;">${comp}</td>
          ${dateHeaders.map(date => {
            // Ajoute ce log pour debug
            console.log("comp=", comp, "clickedCompetence=", clickedCompetence, "date=", date, "clickedDate=", clickedDate);
            if (compDates[comp] && compDates[comp][date]) {
              return `<td style="padding:2px 4px;text-align:center;">${compDates[comp][date]}</td>`;
            } else if (comp == clickedCompetence && date == clickedDate) {
              return `<td style="padding:2px 4px;text-align:center; color:red; font-weight:bold;">X</td>`;
            } else {
              return `<td style="padding:2px 4px;text-align:center;"></td>`;
            }
          }).join("")}
        </tr>
      `).join("")}
    </table>`;

    container.innerHTML = `<div style="font-weight:bold; margin-bottom:4px;">Affectations de ${nom} :</div>${table}`;
  } catch (err) {
    container.innerHTML = `<div style="color:#c00;">Erreur réseau ou serveur</div>`;
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
    <div style="position: relative; padding-bottom: 10px; margin-bottom: 8px; border-bottom: 1px solid #eee; text-align: right;">
      <div class="tooltip-close" style="cursor: pointer;">&times;</div>
    </div>
    <div style="font-weight:bold; margin-bottom:6px;">Ajouter une personne en vacances :</div>
    <ul style="list-style:none; padding:0; margin:0;">
      ${noms.length === 0
        ? `<li style="color:#888;">Aucun nom disponible</li>`
        : noms.map(n => `<li style="cursor:pointer; padding:2px 0;" data-nom-id="${n.nom_id}">${n.nom}</li>`).join("")}
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
    <div style="position: relative; padding-bottom: 10px; margin-bottom: 8px; border-bottom: 1px solid #eee; text-align: right;">
      <div class="tooltip-close" style="cursor: pointer;">&times;</div>
    </div>
    <div style="font-weight:bold; margin-bottom:6px;">Ajouter une personne en vacances sur toute la période :</div>
    <ul style="list-style:none; padding:0; margin:0;">
      ${noms.length === 0
        ? `<li style="color:#888;">Aucun nom disponible</li>`
        : noms.map(n => `<li style="cursor:pointer; padding:2px 0;" data-nom-id="${n.nom_id}">${n.nom}</li>`).join("")}
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

async function autoFillPlanningTable() {
  const siteId = sessionStorage.getItem("selectedSite");
  if (!siteId) {
    alert("Aucun site sélectionné !");
    return;
  }
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Non authentifié !");
    return;
  }

  // Récupère toutes les cases du tbody à remplir
  let cells = Array.from(document.querySelectorAll(
    "#planningTableWithNames tbody td[data-ouverture='oui']"
  )).filter(td => !td.querySelector(".nom-block"));

  // Prépare pour chaque case la liste des noms dispo (et leur nombre)
  let casesWithChoices = [];
  for (const td of cells) {
    const competenceId = td.dataset.competenceId;
    const horaireId = td.dataset.horaireId;
    const date = td.dataset.date;
    const res = await fetch(`/api/available-names?competence_id=${competenceId}&site_id=${siteId}&date=${date}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) continue;
    const noms = await res.json();
    casesWithChoices.push({
      td,
      competenceId,
      horaireId,
      date,
      noms,
      nbNoms: noms.length
    });
  }

  // Regroupe les cases par date
  const casesByDate = {};
  for (const c of casesWithChoices) {
    if (!casesByDate[c.date]) casesByDate[c.date] = [];
    casesByDate[c.date].push(c);
  }

  // Prépare les compteurs d'affectations et d'affectations par jour
  const affectationCounts = {};
  const affectationsParJour = {};
  Array.from(document.querySelectorAll("#planningTableWithNames tbody .nom-block")).forEach(div => {
    const nomId = div.dataset.nomId;
    const td = div.closest("td");
    const date = td.dataset.date;
    if (!affectationCounts[nomId]) affectationCounts[nomId] = 0;
    affectationCounts[nomId]++;
    if (!affectationsParJour[nomId]) affectationsParJour[nomId] = new Set();
    affectationsParJour[nomId].add(date);
  });

  // Pour chaque jour, traite d'abord les cases critiques (nom dispo unique pour cette case)
  const allDates = Object.keys(casesByDate).sort();
  for (const date of allDates) {
    const cases = casesByDate[date];

    // 1. Pour chaque nom dispo ce jour, compte dans combien de cases il apparaît
    const nomUsage = {};
    for (const c of cases) {
      for (const nom of c.noms) {
        if (!nomUsage[nom.nom_id]) nomUsage[nom.nom_id] = 0;
        nomUsage[nom.nom_id]++;
      }
    }

    // 2. Marque les cases où un nom n'est dispo que pour cette case (priorité absolue)
    cases.forEach(c => {
      c.hasUniqueNom = false;
      c.uniqueNomId = null;
      for (const nom of c.noms) {
        if (nomUsage[nom.nom_id] === 1) {
          c.hasUniqueNom = true;
          c.uniqueNomId = nom.nom_id;
          break;
        }
      }
    });

    // 3. Trie : d'abord les cases avec un nom unique, puis par rareté
    cases.sort((a, b) => {
      if (a.hasUniqueNom && !b.hasUniqueNom) return -1;
      if (!a.hasUniqueNom && b.hasUniqueNom) return 1;
      return a.nbNoms - b.nbNoms;
    });

    for (const c of cases) {
      const {td, competenceId, horaireId, noms, hasUniqueNom, uniqueNomId} = c;
      // Filtrer les noms déjà affectés ce jour-là
      const nomsDispo = noms.filter(nom => !((affectationsParJour[nom.nom_id] || new Set()).has(date)));
      if (!nomsDispo.length) continue;

      let chosenNom = null;
      if (hasUniqueNom) {
        // Prend le nom unique pour cette case
        chosenNom = nomsDispo.find(nom => nom.nom_id == uniqueNomId);
      }
      if (!chosenNom) {
        // Sinon, équilibré
        let minCount = Infinity;
        let candidats = [];
        for (const nom of nomsDispo) {
          const count = affectationCounts[nom.nom_id] || 0;
          if (count < minCount) {
            minCount = count;
            candidats = [nom];
          } else if (count === minCount) {
            candidats.push(nom);
          }
        }
        if (candidats.length > 0) {
          chosenNom = candidats[Math.floor(Math.random() * candidats.length)];
        }
      }
      if (!chosenNom) continue;

      // Affecter ce nom à la case
      await fetch("/api/update-planningv2", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          date,
          nom_id: chosenNom.nom_id,
          competence_id: competenceId,
          horaire_id: horaireId,
          site_id: siteId
        })
      });

      // Mettre à jour les compteurs
      affectationCounts[chosenNom.nom_id] = (affectationCounts[chosenNom.nom_id] || 0) + 1;
      if (!affectationsParJour[chosenNom.nom_id]) affectationsParJour[chosenNom.nom_id] = new Set();
      affectationsParJour[chosenNom.nom_id].add(date);
      // Optionnel : petit délai pour voir le remplissage
      // await new Promise(r => setTimeout(r, 30));
    }
  }

  await refreshSecondTable && refreshSecondTable();
  alert("Remplissage automatique terminé !");
}

// Ajoute un bouton pour lancer l'automatisation
(function() {
  if (document.getElementById("auto-fill-btn")) return;
  const btn = document.createElement("button");
  btn.id = "auto-fill-btn";
  btn.textContent = "Remplir automatiquement le planning";
  btn.style.position = "fixed";
  btn.style.bottom = "20px";
  btn.style.right = "20px";
  btn.style.zIndex = 2000;
  btn.style.padding = "10px 18px";
  btn.style.background = "#007bff";
  btn.style.color = "#fff";
  btn.style.border = "none";
  btn.style.borderRadius = "5px";
  btn.style.fontWeight = "bold";
  btn.style.cursor = "pointer";
  btn.onclick = autoFillPlanningTable;
  document.body.appendChild(btn);
})();







function renderPlanningRemplissageTable(data) {
  // Regroupe les compétences et horaires
  const lignes = {};
  const datesSet = new Set();
  data.forEach(row => {
    const key = `${row.competence}||${row.horaire_debut}||${row.horaire_fin}||${row.competence_id}||${row.horaire_id}`;
    if (!lignes[key]) {
      lignes[key] = {
        competence: row.competence,
        horaire_debut: row.horaire_debut,
        horaire_fin: row.horaire_fin,
        competence_id: row.competence_id,
        horaire_id: row.horaire_id,
        cells: {}
      };
    }
    lignes[key].cells[row.date] = {
      ouverture: row.ouverture,
      nom: row.nom,
      nom_id: row.nom_id,
      date: row.date
    };
    datesSet.add(row.date);
  });
  const dates = Array.from(datesSet).sort();

  let html = '<table border="1" style="border-collapse:collapse;"><tr>';
  html += '<th>Compétence</th><th>Horaires</th>';
  dates.forEach(date => html += `<th>${date}</th>`);
  html += '</tr>';

  Object.values(lignes).forEach(ligne => {
    html += `<tr>
      <td>${ligne.competence}</td>
      <td>${ligne.horaire_debut} - ${ligne.horaire_fin}</td>`;
    dates.forEach(date => {
      const cell = ligne.cells[date];
      if (!cell) {
        html += `<td style="background:#eee"></td>`;
      } else if (cell.ouverture == 1) {
        // Case à remplir
        html += `<td style="background:#ffe082;font-weight:bold;">À remplir</td>`;
      } else {
        // Case fermée ou hors période
        html += `<td style="background:#d3d3d3"></td>`;
      }
    });
    html += '</tr>';
  });
  html += '</table>';
  document.getElementById("planning-evolution-content").innerHTML = html;
}