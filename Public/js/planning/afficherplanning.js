// Gestion des sélecteurs de dates
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const applyDateFilterButton = document.getElementById("applyDateFilter");

// Restaurer les dates depuis le localStorage
window.addEventListener("DOMContentLoaded", () => {
  const savedStartDate = sessionStorage.getItem("startDate");
  const savedEndDate = sessionStorage.getItem("endDate");

  if (savedStartDate) {
    startDateInput.value = savedStartDate;
  }
  if (savedEndDate) {
    endDateInput.value = savedEndDate;
  }
});

// second planning
//fonction creatioon tableau dessous
function generateFooterRows(dateHeaders) {
  const vacanceRow = document.createElement("tr");
  const autreRow = document.createElement("tr");

  // Première colonne
  vacanceRow.appendChild(document.createElement("th")).textContent = "Vacance";
  autreRow.appendChild(document.createElement("th")).textContent = "Autre";

  // Colonnes jours
  dateHeaders.forEach((date) => {
    vacanceRow.appendChild(document.createElement("td"));
    autreRow.appendChild(document.createElement("td"));
  });

  return [vacanceRow, autreRow];
}

async function displayPlanningWithNames(
  data,
  startDate,
  endDate,
  vacancesData = {}
) {
  const table = document.getElementById("planningTableWithNames");
  const tbody = table.querySelector("tbody");
  const thead = table.querySelector("thead");
  let tfoot = table.querySelector("tfoot");
  if (!tfoot) tfoot = table.createTFoot();

  // Effacer le contenu précédent
  tbody.innerHTML = "";
  thead.innerHTML = "";

  // Créer l'en-tête du tableau
  const headerRow = document.createElement("tr");
  const competenceHeader = document.createElement("th");
  competenceHeader.textContent = "Compétence";
  headerRow.appendChild(competenceHeader);

  const horairesHeader = document.createElement("th");
  horairesHeader.textContent = "Horaires";
  headerRow.appendChild(horairesHeader);

  // Colonnes dynamiques pour les dates
  const currentDate = new Date(startDate);
  const endDateObj = new Date(endDate);
  const dateHeaders = [];
  while (currentDate <= endDateObj) {
    const dateHeader = document.createElement("th");
    const formattedDate = currentDate.toISOString().slice(0, 10);
    dateHeader.textContent = currentDate.toLocaleDateString("fr-FR");
    headerRow.appendChild(dateHeader);
    dateHeaders.push(formattedDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  thead.appendChild(headerRow);

  // Regrouper les données par competence_id, horaire_id, date
  const cases = {};
  data.forEach((row) => {
    const key = `${row.competence_id}-${row.horaire_id}-${row.date}`;
    if (!cases[key]) {
      cases[key] = {
        competence_id: row.competence_id,
        horaire_id: row.horaire_id,
        competence: row.competence,
        horaire_debut: row.horaire_debut,
        horaire_fin: row.horaire_fin,
        date: row.date,
        ouverture: 0,
        noms: [],
        commentaires: [],
        competence_date_debut: row.competence_date_debut,
        competence_date_fin: row.competence_date_fin,
        repos: row.repos || 0,
      };
    }
    cases[key].ouverture = Math.max(
      cases[key].ouverture,
      Number(row.ouverture)
    );
    if (
      row.nom &&
      row.nom_id &&
      !cases[key].noms.some((n) => n.nom_id === row.nom_id)
    ) {
      cases[key].noms.push({ nom: row.nom, nom_id: row.nom_id });
    }
    if (row.commentaire) {
      cases[key].commentaires.push({
        commentaire: row.commentaire,
        nom_id: row.commentaire_nom_id,
      });
    }
  });

  // Regrouper par competence_id et horaire_id pour les lignes
  const lignes = {};
  Object.values(cases).forEach((cell) => {
    const key = `${cell.competence_id}-${cell.horaire_id}`;
    if (!lignes[key]) {
      lignes[key] = {
        competence: cell.competence,
        horaire_debut: cell.horaire_debut,
        horaire_fin: cell.horaire_fin,
        cells: {},
        competence_id: cell.competence_id,
        horaire_id: cell.horaire_id,
        competence_date_debut: cell.competence_date_debut,
        competence_date_fin: cell.competence_date_fin,
        repos: cell.repos || 0,
      };
    }
    lignes[key].cells[cell.date] = cell;
  });

  // Préparer les lignes repos à insérer dans le tfoot
  const lignesRepos = [];

  Object.values(lignes).forEach((item) => {
    const {
      competence,
      horaire_debut,
      horaire_fin,
      cells,
      competence_id,
      horaire_id,
      competence_date_debut,
      competence_date_fin,
      repos,
    } = item;

    // Vérifier si au moins une date affichée est dans la période d'ouverture
    const ligneActivePourAuMoinsUneDate = dateHeaders.some(
      (date) =>
        (!competence_date_debut || date >= competence_date_debut) &&
        (!competence_date_fin || date <= competence_date_fin)
    );
    if (!ligneActivePourAuMoinsUneDate) return;

    const row = document.createElement("tr");

    // Colonne Compétence
    const competenceCell = document.createElement("td");
    competenceCell.textContent = competence;
    row.appendChild(competenceCell);

    // Colonne Horaires
    const horairesCell = document.createElement("td");
    horairesCell.textContent = `${horaire_debut} - ${horaire_fin}`;
    row.appendChild(horairesCell);

    // Colonnes dynamiques pour les dates
    dateHeaders.forEach((date) => {
      const dateCell = document.createElement("td");
      dateCell.dataset.competenceId = competence_id;
      dateCell.dataset.horaireId = horaire_id;
      dateCell.dataset.date = date;

      let ouverture = "non";
      let noms = [];
      let commentaires = [];

      // Afficher la case uniquement si la date est dans la période d'ouverture
      if (
        (!competence_date_debut || date >= competence_date_debut) &&
        (!competence_date_fin || date <= competence_date_fin)
      ) {
        if (cells[date]) {
          ouverture = Number(cells[date].ouverture) === 1 ? "oui" : "non";
          noms = cells[date].noms;
          commentaires = cells[date].commentaires || [];
        }
        dateCell.dataset.ouverture = ouverture;
        if (ouverture === "non") {
          dateCell.style.backgroundColor = "#d3d3d3";
        }

        // Afficher le commentaire général (case sans nom)
        const commentaireGeneral = commentaires.find((c) => !c.nom_id);
        if (commentaireGeneral) {
          dateCell.innerHTML += `<div class="commentaire-block">${commentaireGeneral.commentaire}</div>`;
        }

        // Afficher les noms et leur commentaire
        if (noms.length > 0) {
          noms.forEach(({ nom, nom_id }) => {
            const commentaireNom = commentaires.find((c) => c.nom_id == nom_id);
            if (commentaireNom) {
              dateCell.innerHTML += `<div class="commentaire-block">${commentaireNom.commentaire}</div>`;
            }
            dateCell.innerHTML += `
              <div class="nom-block" data-nom="${nom}" data-nom-id="${nom_id}">
                <span class="nom-valeur">${nom}</span>
              </div>
            `;
          });
          dateCell.style.whiteSpace = "normal";
        } else if (!commentaireGeneral) {
          dateCell.textContent = "";
          dateCell.style.whiteSpace = "pre-line";
        }
      } else {
        // Hors période d'ouverture : case vide et grisée
        dateCell.dataset.ouverture = "non";
        dateCell.style.backgroundColor = "#d3d3d3";
        dateCell.textContent = "";
      }

      row.appendChild(dateCell);
    });

    // Si repos == 1, stocke la ligne pour le tfoot, sinon ajoute au tbody
    if (repos == 1) {
      lignesRepos.push(row);
    } else {
      tbody.appendChild(row);
    }
  });

  // Insérer les lignes repos dans le tfoot juste avant extra-vacance-row
  const extraRowRef = document.getElementById("extra-vacance-row");
  if (extraRowRef) {
    lignesRepos.forEach((row) => {
      tfoot.insertBefore(row, extraRowRef);
    });
  } else {
    lignesRepos.forEach((row) => tfoot.appendChild(row));
  }

  // Nettoyer le tfoot
  tfoot.innerHTML = "";

  // 1. Ligne Vacance/Autre + dates (toujours en premier)
  const vacanceAutreRow = document.createElement("tr");
  vacanceAutreRow.id = "vacance-autre-row";
  const thVacance = document.createElement("th");
  thVacance.textContent = "Vacance";
  vacanceAutreRow.appendChild(thVacance);
  const thAutre = document.createElement("th");
  thAutre.textContent = "Autre";
  vacanceAutreRow.appendChild(thAutre);
  dateHeaders.forEach((date) => {
    const th = document.createElement("th");
    // Affiche la date au format JJ/MM/AAAA
    th.textContent = new Date(date).toLocaleDateString("fr-FR");
    vacanceAutreRow.appendChild(th);
  });
  tfoot.appendChild(vacanceAutreRow);

  // 2. Lignes repos (juste après la ligne Vacance/Autre)
  lignesRepos.forEach((row) => tfoot.appendChild(row));

  // 3. Ligne extra-vacance-row (celle qui contient les noms en vacances)
  let extraRow = document.getElementById("extra-vacance-row");
  if (extraRow) extraRow.remove();
  const extraTr = document.createElement("tr");
  extraTr.id = "extra-vacance-row";

  // 1. Calculer les noms présents dans toutes les dates
  const allDates = dateHeaders;
  const nomsParDate = allDates.map((date) =>
    ((vacancesData && vacancesData[date]) || []).map((v) => v.nom_id)
  );
  const nomsDansToutesLesDates = nomsParDate.reduce(
    (acc, noms) => acc.filter((nomId) => noms.includes(nomId)),
    nomsParDate[0] || []
  );
  // nomsDansToutesLesDates = [nom_id, nom_id, ...] présents tous les jours

  // 2. Récupérer les objets {nom, nom_id} pour affichage
  let nomsDansToutesLesDatesObj = [];
  if (nomsDansToutesLesDates.length > 0) {
    // On prend le premier jour pour récupérer les noms/nom_id
    const refList = (vacancesData && vacancesData[allDates[0]]) || [];
    nomsDansToutesLesDatesObj = refList.filter((v) =>
      nomsDansToutesLesDates.includes(v.nom_id)
    );
  }

  // Cellule "Vacance" (titre)
  const tdVacanceTitle = document.createElement("td");
  tdVacanceTitle.style.cursor = "pointer";
  tdVacanceTitle.onclick = function (event) {
    showTooltipVacanceMulti(event, dateHeaders); // On passe toutes les dates affichées
  };
  tdVacanceTitle.style.fontWeight = "bold";
  // Afficher les noms présents tous les jours ici
  if (nomsDansToutesLesDatesObj.length > 0) {
    nomsDansToutesLesDatesObj.forEach((vacance) => {
      const div = document.createElement("div");
      div.className = "nom-block";
      div.dataset.nom = vacance.nom;
      div.dataset.nomId = vacance.nom_id;
      div.innerHTML = `<span class="nom-valeur">${vacance.nom}</span>`;
      // Ajout du clic droit
      div.addEventListener("contextmenu", function (e) {
        e.preventDefault();
        // SUPPRIMER cette ligne :
        // showTooltipVacanceDeleteMulti(e, vacance.nom_id, dateHeaders, vacance.nom);
        // Le clic droit est déjà géré globalement par clicdroit.js
      });
      tdVacanceTitle.appendChild(div);
    });
  } else {
    tdVacanceTitle.textContent = "";
  }
  extraTr.appendChild(tdVacanceTitle);

  // Cellule "Autre" (titre ou "Congés")
  const tdAutre = document.createElement("td");
  tdAutre.textContent = "Congés";
  extraTr.appendChild(tdAutre);

  // Pour chaque date affichée, une cellule "vacance" TOUJOURS créée et cliquable
  dateHeaders.forEach((date) => {
    const td = document.createElement("td");
    td.classList.add("vacance-cell");
    td.dataset.date = date;
    td.style.cursor = "pointer";
    td.style.background = "#f8fcff";

    // Affiche les noms en vacances pour cette date/site, sauf ceux déjà dans la case "Vacance" (tous les jours)
    const vacanceList = (vacancesData && vacancesData[date]) || [];
    const vacanceListFiltered = vacanceList.filter(
      (v) => !nomsDansToutesLesDates.includes(v.nom_id)
    );
    if (vacanceListFiltered.length > 0) {
      vacanceListFiltered.forEach((vacance) => {
        td.innerHTML += `<div class="nom-block" data-nom="${vacance.nom}" data-nom-id="${vacance.nom_id}">
          <span class="nom-valeur">${vacance.nom}</span>
        </div>`;
      });
      td.style.whiteSpace = "normal";
    } else {
      td.innerHTML = "";
      td.style.whiteSpace = "pre-line";
    }

    // Clic pour afficher le tooltip vacances (siteId et date)
    td.onclick = function (event) {
      showTooltipVacance(event, date);
    };

    extraTr.appendChild(td);
  });

  tfoot.appendChild(extraTr);

  const compteurTr = document.createElement("tr");
  compteurTr.id = "compteur-row";

  // Première colonne : "Compteur"
  const compteurTh = document.createElement("th");
  compteurTh.textContent = "Compteur";
  compteurTr.appendChild(compteurTh);

  // Deuxième colonne : vide
  const emptyTd = document.createElement("td");
  emptyTd.textContent = "";
  compteurTr.appendChild(emptyTd);

  // Colonnes dates : compter les cases non grisées ET vides (pas de nom, pas de commentaire)
  const siteId = sessionStorage.getItem("selectedSite");
  const availableCounts = await fetchAvailableCount(siteId, dateHeaders);

  dateHeaders.forEach((date) => {
    // Sélectionne toutes les cases du tbody pour cette date
    const cells = Array.from(
      document.querySelectorAll(
        `#planningTableWithNames tbody td[data-date="${date}"]`
      )
    );
    // Compte celles qui sont ouvertes ET vides (pas de nom-block, pas de commentaire-block)
    const count = cells.filter(
      (td) =>
        td.dataset.ouverture === "oui" &&
        !td.querySelector(".nom-block") &&
        !td.querySelector(".commentaire-block") &&
        td.textContent.trim() === ""
    ).length;

    // Nombre de personnes disponibles ce jour
    const dispo = availableCounts[date] ?? null;

    // Calcul du delta
    let delta = "";
    let color = "#007bff";
    if (dispo !== null && !isNaN(Number(dispo))) {
      const d = Number(dispo) - count;
      if (dispo !== 0 || count !== 0) {
        delta = d > 0 ? `+${d}` : `${d}`;
        color = d < 0 ? "#c00" : "#007bff";
      } else {
        delta = "0";
        color = "#007bff";
      }
    }

    const tdElem = document.createElement("td");
    tdElem.style.fontWeight = "bold";
    tdElem.style.fontSize = "18px";
    tdElem.style.textAlign = "center";
    tdElem.innerHTML = `<span style="color:${color};">${delta}</span>`;
    compteurTr.appendChild(tdElem);
  });

  tfoot.appendChild(compteurTr);
}

async function fetchCompetencesWithNames(siteId, startDate, endDate) {
  const token = localStorage.getItem("token");

  if (!token || !siteId) {
    console.error("Erreur : le token ou le site_id est manquant.");
    alert("Erreur : vous devez être authentifié et avoir sélectionné un site.");
    return [];
  }

  try {
    const response = await fetch(
      `/api/datecompetencewithnames?site_id=${siteId}&start_date=${startDate}&end_date=${endDate}`,
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
      console.error("Erreur lors de la récupération des données :", errorText);
      alert("Erreur lors de la récupération des données.");
      return [];
    }

    const data = await response.json();
    console.log("Données récupérées pour le tableau avec noms :", data);
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération des données :", error);
    alert("Une erreur est survenue lors de la récupération des données.");
    return [];
  }
}

async function refreshSecondTable() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const siteId = sessionStorage.getItem("selectedSite");
  if (startDate && endDate && siteId) {
    const competencesWithNames = await fetchCompetencesWithNames(
      siteId,
      startDate,
      endDate
    );
    // Ajoute ici la récupération des vacances pour la période
    const vacancesData = await fetchVacancesData(siteId, startDate, endDate);
    displayPlanningWithNames(
      competencesWithNames,
      startDate,
      endDate,
      vacancesData
    );
  }
}
applyDateFilterButton.addEventListener("click", async () => {
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;
  const siteId = sessionStorage.getItem("selectedSite");

  // Vérifiez si les dates sont définies
  if (!startDate || !endDate) {
    alert("Veuillez sélectionner une date de début et une date de fin.");
    return;
  }

  console.log("Dates sélectionnées :", { startDate, endDate });

  // Récupérer les compétences avec noms pour le deuxième tableau
  const competencesWithNames = await fetchCompetencesWithNames(
    siteId,
    startDate,
    endDate
  );
  // Récupérer les vacances pour la période
  const vacancesData = await fetchVacancesData(siteId, startDate, endDate);

  displayPlanningWithNames(
    competencesWithNames,
    startDate,
    endDate,
    vacancesData
  );
});

document
  .getElementById("planningTableWithNames")
  .addEventListener("click", async (event) => {
    const cell = event.target;

    // Vérifiez si la cellule cliquée est valide
    if (
      cell.tagName !== "TD" ||
      !cell.dataset.competenceId ||
      !cell.dataset.horaireId ||
      !cell.dataset.date
    ) {
      console.log("Clic ignoré : attributs manquants ou cellule invalide.");
      return;
    }

    const competenceId = cell.dataset.competenceId;
    const horaireId = cell.dataset.horaireId;
    const date = cell.dataset.date;
    const siteId = sessionStorage.getItem("selectedSite");

    // Récupère le nom de la compétence affiché dans la colonne (première colonne de la ligne)
    const nomDeLaCompetence =
      cell.parentElement.querySelector("td").textContent;

    // Récupérer les noms disponibles
    const noms = await fetchAvailableNames(competenceId, siteId, date);

    // Afficher le tooltip en passant bien le nom de la compétence et la date cliquée
    showTooltip(event, noms, {
      competenceId,
      horaireId,
      date,
      siteId,
      clickedCompetence: nomDeLaCompetence, // <-- c'est le nom affiché dans la colonne
      clickedDate: date,
    });
  });

async function fetchVacancesData(siteId, startDate, endDate) {
  const token = localStorage.getItem("token");
  const res = await fetch(
    `/api/vacancesv2?site_id=${siteId}&start_date=${startDate}&end_date=${endDate}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) return {};
  const data = await res.json();
  // Regroupe par date
  const vacancesData = {};
  data.forEach((v) => {
    if (!vacancesData[v.date]) vacancesData[v.date] = [];
    vacancesData[v.date].push({ nom: v.nom, nom_id: v.nom_id });
  });
  return vacancesData;
}

// Sauvegarder les dates dans le localStorage lors de l'application du filtre
applyDateFilterButton.addEventListener("click", () => {
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;

  sessionStorage.setItem("startDate", startDate);
  sessionStorage.setItem("endDate", endDate);
});

async function fetchAvailableCount(siteId, dates) {
  const token = localStorage.getItem("token");
  // On suppose que tu as une route qui retourne un objet { "2025-05-05": 3, ... }
  const res = await fetch(
    `/api/available-count?site_id=${siteId}&dates=${dates.join(",")}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) return {};
  return await res.json();
}
