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

async function displayPlanningWithNames(data, startDate, endDate) {
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
      };
    }
    // Toujours garder la valeur max (1 si au moins une ligne ouverte)
    cases[key].ouverture = Math.max(cases[key].ouverture, Number(row.ouverture));
    if (row.nom && row.nom_id && !cases[key].noms.some(n => n.nom_id === row.nom_id)) {
      cases[key].noms.push({ nom: row.nom, nom_id: row.nom_id });
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

      if (cells[date]) {
        ouverture = Number(cells[date].ouverture) === 1 ? "oui" : "non";
        noms = cells[date].noms;
      }

      dateCell.dataset.ouverture = ouverture;
      if (ouverture === "non") {
        dateCell.style.backgroundColor = "#d3d3d3";
      }

      // Afficher les noms s'il y en a
      if (noms.length > 0) {
        noms.forEach(({ nom, nom_id }) => {
          dateCell.innerHTML += `
        <div class="nom-block" data-nom="${nom}" data-nom-id="${nom_id}">
          <span class="nom-valeur">${nom}</span>
        </div>
      `;
        });
        dateCell.style.whiteSpace = "normal";
      } else {
        dateCell.textContent = "";
        dateCell.style.whiteSpace = "pre-line";
      }

      row.appendChild(dateCell);
    });

    tbody.appendChild(row);
  });
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
    displayPlanningWithNames(competencesWithNames, startDate, endDate);
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
  displayPlanningWithNames(competencesWithNames, startDate, endDate);
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
