// Gestion des sélecteurs de dates
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const applyDateFilterButton = document.getElementById("applyDateFilter");

// Restaurer les dates depuis le localStorage
window.addEventListener("DOMContentLoaded", () => {
  const savedStartDate = localStorage.getItem("startDate");
  const savedEndDate = localStorage.getItem("endDate");

  if (savedStartDate) {
    startDateInput.value = savedStartDate;
  }

  if (savedEndDate) {
    endDateInput.value = savedEndDate;
  }

  console.log("Dates restaurées depuis le localStorage :", {
    savedStartDate,
    savedEndDate,
  });
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
  dateHeaders.forEach(date => {
    vacanceRow.appendChild(document.createElement("td"));
    autreRow.appendChild(document.createElement("td"));
  });

  return [vacanceRow, autreRow];
}

async function displayPlanningWithNames(data, startDate, endDate, vacancesData = {}) {
  const table = document.getElementById("planningTableWithNames");
  const tbody = table.querySelector("tbody");
  const thead = table.querySelector("thead");

  // Effacer le contenu précédent
  tbody.innerHTML = "";
  thead.innerHTML = "";

  // Créer l'en-tête du tableau
  const headerRow = document.createElement("tr");

  // Colonnes fixes : Compétence et Horaires
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
        commentaires: [] // <-- Ajouté pour stocker les commentaires
      };
    }
    // Toujours garder la valeur max (1 si au moins une ligne ouverte)
    cases[key].ouverture = Math.max(cases[key].ouverture, Number(row.ouverture));
    if (row.nom && row.nom_id && !cases[key].noms.some(n => n.nom_id === row.nom_id)) {
      cases[key].noms.push({ nom: row.nom, nom_id: row.nom_id });
    }
    // Ajout du commentaire si présent
    if (row.commentaire) {
      cases[key].commentaires.push({
        commentaire: row.commentaire,
        nom_id: row.commentaire_nom_id
      });
    }
  });

  console.log("cases[1-1-2025-05-05]", cases["1-1-2025-05-05"]);

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
      };
    }
    lignes[key].cells[cell.date] = cell;
  });

  // Générer les lignes du tableau
  Object.values(lignes).forEach((item) => {
    const { competence, horaire_debut, horaire_fin, cells, competence_id, horaire_id } = item;
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
      const commentaireGeneral = commentaires.find(c => !c.nom_id);
      if (commentaireGeneral) {
        dateCell.innerHTML += `<div class="commentaire-block">${commentaireGeneral.commentaire}</div>`;
      }

      // Afficher les noms et leur commentaire
      if (noms.length > 0) {
        noms.forEach(({ nom, nom_id }) => {
          const commentaireNom = commentaires.find(c => c.nom_id == nom_id);
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

      row.appendChild(dateCell);
    });

    tbody.appendChild(row);
  });

  // Générer dynamiquement le tfoot pour l'alignement parfait
  const tfoot = table.querySelector("tfoot") || table.createTFoot();
  tfoot.innerHTML = "";

  // Ligne Vacance/Autre + dates
  const vacanceAutreDatesRow = document.createElement("tr");

  // 1ère colonne : Vacance
  const vacanceTh = document.createElement("th");
  vacanceTh.textContent = "Vacance";
  vacanceAutreDatesRow.appendChild(vacanceTh);

  // 2ème colonne : Autre
  const autreTh = document.createElement("th");
  autreTh.textContent = "Autre";
  vacanceAutreDatesRow.appendChild(autreTh);

  // Colonnes dates (même format que le thead)
  dateHeaders.forEach(date => {
    const th = document.createElement("th");
    th.textContent = new Date(date).toLocaleDateString("fr-FR");
    vacanceAutreDatesRow.appendChild(th);
  });

  tfoot.appendChild(vacanceAutreDatesRow);

let extraRow = document.getElementById("extra-vacance-row");
if (extraRow) extraRow.remove();

const extraTr = document.createElement("tr");
extraTr.id = "extra-vacance-row";

// Cellule "Vacance" (titre)
const tdVacanceTitle = document.createElement("td");
tdVacanceTitle.textContent = "Vacance";
tdVacanceTitle.style.fontWeight = "bold";
extraTr.appendChild(tdVacanceTitle);

// Cellule "Autre" (titre ou vide)
const tdAutre = document.createElement("td");
tdAutre.textContent = "";
extraTr.appendChild(tdAutre);

// Pour chaque date affichée, une cellule "vacance" TOUJOURS créée et cliquable
dateHeaders.forEach(date => {
  const td = document.createElement("td");
  td.classList.add("vacance-cell");
  td.dataset.date = date;
  td.style.cursor = "pointer";
  td.style.background = "#f8fcff";

  // Affiche TOUS les noms en vacances pour cette date/site si existant
  const vacanceList = (vacancesData && vacancesData[date]) || [];
  if (vacanceList.length > 0) {
    vacanceList.forEach(vacance => {
      td.innerHTML += `<div class="nom-block" data-nom="${vacance.nom}" data-nom-id="${vacance.nom_id}">
        <span class="nom-valeur">${vacance.nom}</span>
      </div>`;
    });
    td.style.whiteSpace = "normal";
  } else {
    // Ne rien mettre du tout si pas de nom
    td.innerHTML = "";
    td.style.whiteSpace = "pre-line";
  }

  // Clic pour afficher le tooltip vacances (siteId et date)
  td.onclick = function(event) {
    showTooltipVacance(event, date);
  };

  extraTr.appendChild(td);
});

tfoot.appendChild(extraTr);
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
    displayPlanningWithNames(competencesWithNames, startDate, endDate, vacancesData);
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

  displayPlanningWithNames(competencesWithNames, startDate, endDate, vacancesData);
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

    console.log("Cellule cliquée :", {
      competenceId: cell.dataset.competenceId,
      horaireId: cell.dataset.horaireId,
      date: cell.dataset.date,
    });

    const competenceId = cell.dataset.competenceId;
    const horaireId = cell.dataset.horaireId;
    const date = cell.dataset.date;
    const siteId = sessionStorage.getItem("selectedSite");

    // Récupérer les noms disponibles
    const noms = await fetchAvailableNames(competenceId, siteId, date);

    // Afficher le tooltip
    showTooltip(event, noms, { competenceId, horaireId, date, siteId });
  });

async function fetchVacancesData(siteId, startDate, endDate) {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/vacancesv2?site_id=${siteId}&start_date=${startDate}&end_date=${endDate}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return {};
  const data = await res.json();
  // Regroupe par date
  const vacancesData = {};
  data.forEach(v => {
    if (!vacancesData[v.date]) vacancesData[v.date] = [];
    vacancesData[v.date].push({ nom: v.nom, nom_id: v.nom_id });
  });
  return vacancesData;
}
