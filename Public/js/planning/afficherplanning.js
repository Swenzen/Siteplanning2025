// Gestion des sélecteurs de dates
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const applyDateFilterButton = document.getElementById("applyDateFilter");
let generationCounter = 1;

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
    const count = cells.filter((td) => {
      if (td.dataset.ouverture !== "oui") return false;
      if (td.querySelector(".nom-block")) return false;

      // Cherche un commentaire "Fermée"
      const commentaireBlocks = td.querySelectorAll(".commentaire-block");
      for (const cb of commentaireBlocks) {
        if (cb.textContent.trim().toLowerCase() === "fermée") {
          return false; // case pleine si commentaire = Fermée
        }
      }
      // Sinon, case vide même s'il y a un autre commentaire
      return true;
    }).length;

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

    renderPlanningRemplissageTable(data);

    // Ajoute ces deux lignes ici :
    const competencesParNom = await fetchCompetencesParNom();
    startSwitchEvolution(data, competencesParNom);

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
  sessionStorage.setItem("planningStartDate", startDate);
  sessionStorage.setItem("planningEndDate", endDate);
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

async function fetchCompetencesParNom() {
  const token = localStorage.getItem("token");
  const siteId = sessionStorage.getItem("selectedSite");
  if (!token || !siteId) return {};

  const res = await fetch(`/api/competences-personnes?site_id=${siteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return {};

  const personnes = await res.json();
  // On veut un mapping { nom_id: [liste_competence_id] }
  const map = {};
  personnes.forEach((p) => {
    map[p.nom_id] = p.competences;
  });
  return map;
}


// =======================
// 1. FONCTIONS UTILITAIRES
// =======================

// Regroupe les données pour affichage
function buildLignesEtDates(data) {
  const lignes = {};
  const datesSet = new Set();
  data.forEach(row => {
    const key = `${row.competence_id}||${row.horaire_id}`;
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
  return { lignes: Object.values(lignes), dates: Array.from(datesSet).sort() };
}

// Calcule les stats d’un planning
function computeStats(planning) {
  const stats = {};
  planning.forEach((cell) => {
    if (!cell.nom) return;
    if (!stats[cell.nom])
      stats[cell.nom] = { total: 0, IRM: 0, Perso: 0, Matin: 0, ApresMidi: 0 };
    if (cell.competence && cell.competence.toLowerCase().includes("irm"))
      stats[cell.nom].IRM++;
    if (cell.competence && cell.competence.toLowerCase().includes("perso"))
      stats[cell.nom].Perso++;
    if (cell.horaire_debut && cell.horaire_debut.startsWith("08"))
      stats[cell.nom].Matin++;
    if (cell.horaire_debut && cell.horaire_debut.startsWith("12"))
      stats[cell.nom].ApresMidi++;
    stats[cell.nom].total++;
  });
  return stats;
}

// Calcule le score d’équilibre
function computeEquilibreScore(stats) {
  function ecartType(arr) {
    const moy = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(
      arr.reduce((a, b) => a + Math.pow(b - moy, 2), 0) / arr.length
    );
  }
  const noms = Object.keys(stats);
  if (noms.length === 0) return 99999;
  const irm = noms.map((n) => stats[n].IRM || 0);
  const perso = noms.map((n) => stats[n].Perso || 0);
  const matin = noms.map((n) => stats[n].Matin || 0);
  const apm = noms.map((n) => stats[n].ApresMidi || 0);
  return ecartType(irm) + ecartType(perso) + ecartType(matin) + ecartType(apm);
}

// Affiche le panneau stats
function renderStatsPanel(stats) {
  let html = `<table border="1" style="border-collapse:collapse;"><thead>
    <tr><th>Nom</th><th>IRM</th><th>Perso</th><th>Matin</th><th>Après-midi</th><th>Total</th></tr></thead><tbody>`;
  Object.entries(stats).forEach(([nom, s]) => {
    html += `<tr>
      <td>${nom}</td>
      <td>${s.IRM || 0}</td>
      <td>${s.Perso || 0}</td>
      <td>${s.Matin || 0}</td>
      <td>${s.ApresMidi || 0}</td>
      <td>${s.total || 0}</td>
    </tr>`;
  });
  html += "</tbody></table>";
  document.getElementById("stats-results").innerHTML = html;
}

// Affiche le tableau planning
function renderPlanningSwitchTable(data, dates, switched = []) {
  const { lignes } = buildLignesEtDates(data);

  let html = '<table border="1" style="border-collapse:collapse;"><tr>';
  html += '<th>Compétence</th><th>Horaires</th>';
  dates.forEach(date => html += `<th>${date}</th>`);
  html += '</tr>';

  lignes.forEach(ligne => {
    html += `<tr>
      <td>${ligne.competence}</td>
      <td>${ligne.horaire_debut} - ${ligne.horaire_fin}</td>`;
    dates.forEach(date => {
      const cell = ligne.cells[date];
      let highlight = '';
      if (cell && switched.some(sw =>
        sw.competence_id == ligne.competence_id &&
        sw.horaire_id == ligne.horaire_id &&
        sw.date == date
      )) {
        highlight = ' class="highlight-switch"';
      }
      if (!cell) {
        html += `<td style="background:#eee"></td>`;
      } else if (cell.ouverture == 1) {
        html += `<td${highlight}>${cell.nom ? `<b>${cell.nom}</b>` : ''}</td>`;
      } else {
        html += `<td style="background:#d3d3d3"></td>`;
      }
    });
    html += '</tr>';
  });
  html += '</table>';
  document.getElementById("planning-evolution-content").innerHTML = html;
}

// =======================
// 2. GÉNÉRATION ALÉATOIRE
// =======================

// Génère X plannings aléatoires avec Y mutations chacun
async function generateRandomPlannings(nbPlannings = 20, nbMutations = 1000) {
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;
  const siteId = sessionStorage.getItem("selectedSite");
  if (!startDate || !endDate || !siteId) {
    alert("Sélectionne d'abord un site et une période !");
    return [];
  }
  const planningInitial = await fetchCompetencesWithNames(
    siteId,
    startDate,
    endDate
  );
  const competencesParNom = await fetchCompetencesParNom();

  let plannings = [];
  for (let i = 0; i < nbPlannings; i++) {
    let planning = JSON.parse(JSON.stringify(planningInitial));
    for (let j = 0; j < nbMutations; j++) {
      const res = nextGeneration(planning, competencesParNom);
      planning = res.planning;
    }
    // Ajoute ce log pour voir si les plannings sont différents
    console.log("Planning généré n°" + i, planning.map((c) => c.nom).join(","));
    plannings.push(planning);
  }
  return plannings;
}

// =======================
// 3. CROISEMENT ET MUTATION
// =======================

// Croisement avec points communs figés

function crossoverByExchange(parentA, parentB) {
  // On suppose que parentA et parentB sont des tableaux de cases, même ordre
  const enfant = [];
  const casesParDate = {};

  // 1. Repère les points communs et prépare les cases à échanger
  parentA.forEach((cellA, i) => {
    const cellB = parentB[i];
    const key = cellA.date;
    if (!casesParDate[key]) casesParDate[key] = [];
    // Si tout est identique, on fige
    if (
      cellA.nom === cellB.nom &&
      cellA.nom_id === cellB.nom_id &&
      cellA.competence_id === cellB.competence_id &&
      cellA.horaire_id === cellB.horaire_id &&
      cellA.date === cellB.date
    ) {
      enfant.push({ ...cellA }); // point commun figé
    } else {
      casesParDate[key].push({ idx: i, cellA, cellB });
      enfant.push(null); // à remplir plus tard
    }
  });

  // 2. Pour chaque jour, fait des échanges entre les cases non communes
  Object.values(casesParDate).forEach(cases => {
    // Liste des noms à échanger ce jour
    const nomsA = cases.map(c => c.cellA.nom_id).filter(Boolean);
    const nomsB = cases.map(c => c.cellB.nom_id).filter(Boolean);

    // On mélange les deux listes et on répartit sans doublon
    const nomsDispo = Array.from(new Set([...nomsA, ...nomsB]));
    let used = new Set();

    cases.forEach(c => {
      // On prend un nom qui n'a pas encore été utilisé ce jour
      let nom_id = null, nom = null;
      for (let id of nomsDispo) {
        if (!used.has(id)) {
          // Cherche le nom dans cellA ou cellB
          if (c.cellA.nom_id === id) {
            nom_id = c.cellA.nom_id;
            nom = c.cellA.nom;
          } else if (c.cellB.nom_id === id) {
            nom_id = c.cellB.nom_id;
            nom = c.cellB.nom;
          }
          used.add(id);
          break;
        }
      }
      enfant[c.idx] = {
        ...c.cellA,
        nom,
        nom_id
      };
    });
  });

  // Remplit les cases null (si jamais)
  return enfant.map((cell, i) => cell ? cell : { ...parentA[i], nom: null, nom_id: null });
}

let crossMutatePlannings = [];
let crossMutateStats = [];
let currentCrossIdx = 0;

// Mutation par échange sur une journée (garantie anti-doublon)
function nextGeneration(prevPlanning, competencesParNom) {
  const { lignes, dates } = buildLignesEtDates(prevPlanning);
  const planning = JSON.parse(JSON.stringify(prevPlanning));
  for (let essais = 0; essais < 20; essais++) {
    const date = dates[Math.floor(Math.random() * dates.length)];
    const casesJour = [];
    lignes.forEach(ligne => {
      const cell = ligne.cells[date];
      if (cell && cell.ouverture == 1 && cell.nom_id) {
        casesJour.push({ ...cell, competence_id: ligne.competence_id, horaire_id: ligne.horaire_id });
      }
    });
    if (casesJour.length < 2) continue;
    let idx1 = Math.floor(Math.random() * casesJour.length);
    let idx2;
    do { idx2 = Math.floor(Math.random() * casesJour.length); } while (idx2 === idx1);
    const c1 = casesJour[idx1];
    const c2 = casesJour[idx2];

    // Vérifie la compatibilité croisée sur competence_id
    if (
      competencesParNom[c1.nom_id] && competencesParNom[c1.nom_id].includes(c2.competence_id) &&
      competencesParNom[c2.nom_id] && competencesParNom[c2.nom_id].includes(c1.competence_id)
    ) {
      // Vérifie que c2.nom_id n'est pas déjà affecté à une autre case ce jour-là (hors c1 et c2)
      const doublonC2 = planning.some(l =>
        l.date === date &&
        l.nom_id === c2.nom_id &&
        !(l.competence_id === c1.competence_id && l.horaire_id === c1.horaire_id) &&
        !(l.competence_id === c2.competence_id && l.horaire_id === c2.horaire_id)
      );
      // Vérifie que c1.nom_id n'est pas déjà affecté à une autre case ce jour-là (hors c1 et c2)
      const doublonC1 = planning.some(l =>
        l.date === date &&
        l.nom_id === c1.nom_id &&
        !(l.competence_id === c1.competence_id && l.horaire_id === c1.horaire_id) &&
        !(l.competence_id === c2.competence_id && l.horaire_id === c2.horaire_id)
      );
      if (!doublonC1 && !doublonC2) {
        planning.forEach(l => {
          if (l.competence_id == c1.competence_id && l.horaire_id == c1.horaire_id && l.date == c1.date) {
            l.nom = c2.nom; l.nom_id = c2.nom_id;
          } else if (l.competence_id == c2.competence_id && l.horaire_id == c2.horaire_id && l.date == c2.date) {
            l.nom = c1.nom; l.nom_id = c1.nom_id;
          }
        });
        return { planning, switched: [c1, c2], dates };
      }
    }
  }
  return { planning: prevPlanning, switched: [], dates };
}

// =======================
// 4. NAVIGATION ET AFFICHAGE
// =======================

// Affiche un planning parmi les meilleurs
function showBestPlanning(idx) {
  console.log(
    "Affichage du planning n°",
    idx + 1,
    bestPlannings[idx].map((c) => c.nom).join(",")
  );
  const { lignes, dates } = buildLignesEtDates(bestPlannings[idx]);
  renderPlanningSwitchTable(bestPlannings[idx], dates);
  renderStatsPanel(bestStats[idx]);
  document.getElementById("genLabel").textContent = `Planning ${idx + 1}/10`;
}

// Navigation dans les meilleurs plannings
function setupBestPlanningNav() {
  // Supprime tous les anciens listeners en remplaçant les boutons par des clones
  const nextBtn = document.getElementById("nextGen");
  const prevBtn = document.getElementById("prevGen");
  const newNext = nextBtn.cloneNode(true);
  const newPrev = prevBtn.cloneNode(true);
  nextBtn.parentNode.replaceChild(newNext, nextBtn);
  prevBtn.parentNode.replaceChild(newPrev, prevBtn);

  // Ajoute les nouveaux listeners pour la navigation des 10 meilleurs
  newNext.addEventListener("click", () => {
    if (currentBestIdx < bestPlannings.length - 1) {
      currentBestIdx++;
      showBestPlanning(currentBestIdx);
    }
  });
  newPrev.addEventListener("click", () => {
    if (currentBestIdx > 0) {
      currentBestIdx--;
      showBestPlanning(currentBestIdx);
    }
  });
}

// Affiche un planning croisé/muté
function showCrossMutatePlanning(idx) {
  const { lignes, dates } = buildLignesEtDates(crossMutatePlannings[idx]);
  renderPlanningSwitchTable(crossMutatePlannings[idx], dates);
  renderStatsPanel(crossMutateStats[idx]);
  document.getElementById("genLabel").textContent = `Enfant ${
    idx + 1
  }/10 (Génération ${generationCounter})`;
}

// Navigation dans les plannings croisés/mutés
function setupCrossMutateNav() {
  const nextBtn = document.getElementById("nextGen");
  const prevBtn = document.getElementById("prevGen");
  const newNext = nextBtn.cloneNode(true);
  const newPrev = prevBtn.cloneNode(true);
  nextBtn.parentNode.replaceChild(newNext, nextBtn);
  prevBtn.parentNode.replaceChild(newPrev, prevBtn);

  newNext.addEventListener("click", () => {
    if (currentCrossIdx < crossMutatePlannings.length - 1) {
      currentCrossIdx++;
      showCrossMutatePlanning(currentCrossIdx);
    }
  });
  newPrev.addEventListener("click", () => {
    if (currentCrossIdx > 0) {
      currentCrossIdx--;
      showCrossMutatePlanning(currentCrossIdx);
    }
  });
}

// =======================
// 5. BOUTONS ET INITIALISATION
// =======================

// Lance la génération des meilleurs plannings
async function launchBestPlannings() {
  document.getElementById("stats-results").innerHTML = "Calcul en cours...";
  const plannings = await generateRandomPlannings(20, 1000);
  let statsPlannings = plannings.map((planning) => ({
    planning,
    stats: computeStats(planning),
    score: computeEquilibreScore(computeStats(planning)),
  }));
  statsPlannings.sort((a, b) => a.score - b.score);
  bestPlannings = statsPlannings.slice(0, 10).map((x) => x.planning);
  bestStats = statsPlannings.slice(0, 10).map((x) => x.stats);
  currentBestIdx = 0;
  showBestPlanning(0);
  setupBestPlanningNav();
}

// Lance le croisement/mutation des meilleurs plannings
async function launchCrossMutateCycle() {
  if (bestPlannings.length < 10) {
    alert("Il faut d'abord générer les 10 meilleurs plannings !");
    return;
  }
  document.getElementById("stats-results").innerHTML =
    "Croisement et mutations en cours...";

  const competencesParNom = await fetchCompetencesParNom();
  const pairs = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [8, 9],
  ];
  let enfants = [];

  for (const [i1, i2] of pairs) {
    let parentA = bestPlannings[i1];
    let parentB = bestPlannings[i2];
    // Pour chaque paire, génère 20 enfants indépendants
    for (let k = 0; k < 20; k++) {
      // 1. Croisement avec points communs figés
      let enfant = crossoverByExchange(parentA, parentB);
      // 2. 3 mutations sur l'enfant
      for (let j = 0; j < 3; j++) {
        const res = nextGeneration(enfant, competencesParNom);
        enfant = res.planning;
      }
      enfants.push(enfant);
    }
  }

  // 3. Pour chaque enfant, calcule les stats et le score
  let statsEnfants = enfants.map((planning) => ({
    planning,
    stats: computeStats(planning),
    score: computeEquilibreScore(computeStats(planning)),
  }));
  statsEnfants.sort((a, b) => a.score - b.score);

  crossMutatePlannings = statsEnfants.slice(0, 10).map((x) => x.planning);
  crossMutateStats = statsEnfants.slice(0, 10).map((x) => x.stats);
  currentCrossIdx = 0;
  showCrossMutatePlanning(0);
  setupCrossMutateNav();
}

// Lance une nouvelle génération à partir des enfants
async function nextEvolutionGeneration() {
  generationCounter++; // Incrémente à chaque nouvelle génération

  // Classe les 50 enfants et garde les 10 meilleurs
  let statsEnfants = crossMutatePlannings.map((planning) => ({
    planning,
    stats: computeStats(planning),
    score: computeEquilibreScore(computeStats(planning)),
  }));
  statsEnfants.sort((a, b) => a.score - b.score);

  // Met à jour bestPlannings avec les 10 meilleurs enfants
  bestPlannings = statsEnfants.slice(0, 10).map((x) => x.planning);
  bestStats = statsEnfants.slice(0, 10).map((x) => x.stats);

  // Relance un cycle de croisement/mutation sur ces nouveaux parents
  await launchCrossMutateCycle();
}

// Ajoute les boutons à la page
window.addEventListener("DOMContentLoaded", () => {
  // ... (reprends ta version actuelle)
});





// 6. ÉVOLUTION SIMPLE (PLANNING SIMULÉ)
// Stockage des générations et de la surbrillance
let generations = [];
let currentGen = 0;
let lastSwitch = null;
let evolutionDates = [];
let evolutionLignes = [];

// Initialise l'évolution simple (planning simulé)
function startSwitchEvolution(planningInitial, competencesParNom) {
  const { lignes, dates } = buildLignesEtDates(planningInitial);
  generations = [JSON.parse(JSON.stringify(planningInitial))];
  currentGen = 0;
  lastSwitch = [];

  // Affichage initial
  renderPlanningSwitchTable(generations[0], dates);

  // Désactive la navigation classique pour éviter le conflit avec les 10 meilleurs
  document.getElementById("nextGen").onclick = () => {};
  document.getElementById("prevGen").onclick = () => {};
}



// 7. Ajoute un bouton pour lancer la génération
window.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("btnBestPlannings")) {
    const btn = document.createElement("button");
    btn.id = "btnBestPlannings";
    btn.textContent = "Générer 100 plannings équilibrés";
    btn.onclick = launchBestPlannings;
    document.body.insertBefore(btn, document.getElementById("evolution-nav"));
    setupBestPlanningNav();
  }
  if (!document.getElementById("btnCrossMutate")) {
    const btn = document.createElement("button");
    btn.id = "btnCrossMutate";
    btn.textContent = "Croiser et muter les meilleurs plannings";
    btn.style.marginTop = "16px";
    btn.onclick = launchCrossMutateCycle;
    // Ajoute le bouton sous le tableau d'évolution
    document.getElementById("evolution-visualization").after(btn);
  }
  if (!document.getElementById("btnNextGen")) {
    const btn = document.createElement("button");
    btn.id = "btnNextGen";
    btn.textContent = "Nouvelle génération (croiser/muter les enfants)";
    btn.style.marginTop = "16px";
    btn.onclick = nextEvolutionGeneration;
    document.getElementById("evolution-visualization").after(btn);
  }
});
