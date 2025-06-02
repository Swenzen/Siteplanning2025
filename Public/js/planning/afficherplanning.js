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

    console.log("Dates restaurées depuis le localStorage :", { savedStartDate, savedEndDate });
});


async function fetchCompetences(siteId, startDate, endDate) {
    const token = localStorage.getItem("token");

    if (!token || !siteId) {
        console.error("Erreur : le token ou le site_id est manquant.");
        alert("Erreur : vous devez être authentifié et avoir sélectionné un site.");
        return [];
    }

    try {
        const response = await fetch(
            `/planning/datecompetence?site_id=${siteId}&start_date=${startDate}&end_date=${endDate}`,
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
        console.log("Données récupérées :", data);
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
        alert("Une erreur est survenue lors de la récupération des données.");
        return [];
    }
}

function displayCompetencesWithDates(data, startDate, endDate) {
    const table = document.getElementById("planningTable");
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

    const dateHeaders = []; // Stocker les dates pour les utiliser dans les lignes
    while (currentDate <= endDateObj) {
        const dateHeader = document.createElement("th");
        const formattedDate = currentDate.toISOString().split("T")[0]; // Format YYYY-MM-DD
        dateHeader.textContent = currentDate.toLocaleDateString("fr-FR");
        headerRow.appendChild(dateHeader);

        dateHeaders.push({
            date: formattedDate,
            dayOfWeek: currentDate.getDay(), // 0 = dimanche, 1 = lundi, etc.
        });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    thead.appendChild(headerRow);

    // Fonction pour mapper les jours de JavaScript à ceux de la base de données
    function mapDayToDatabase(day) {
        return day === 0 ? 7 : day; // Si 0 (dimanche), renvoyer 7, sinon renvoyer le jour tel quel
    }

    // Regrouper les données par competence_id et horaire_id
    const groupedData = {};
    data.forEach((item) => {
        const key = `${item.competence_id}-${item.horaire_id}`;
        if (!groupedData[key]) {
            groupedData[key] = {
                competence: item.competence,
                horaire_debut: item.horaire_debut,
                horaire_fin: item.horaire_fin,
                date_debut: item.date_debut,
                date_fin: item.date_fin,
                indisponibilite_debut: item.indisponibilite_debut,
                indisponibilite_fin: item.indisponibilite_fin,
                jours: {}, // Stocker les jours autorisés par compétence et horaire
            };
        }

        // Ajouter les jours autorisés pour chaque compétence et horaire
        const mappedDayOfWeek = mapDayToDatabase(item.jour_id);
        groupedData[key].jours[mappedDayOfWeek] = true;
    });

    console.log("Données regroupées dans groupedData :", groupedData);

    // Ajouter les lignes pour chaque combinaison compétence-horaire
    Object.values(groupedData).forEach(({ competence, horaire_debut, horaire_fin, date_debut, date_fin, indisponibilite_debut, indisponibilite_fin, jours }) => {
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
        dateHeaders.forEach(({ date, dayOfWeek }) => {
            const dateCell = document.createElement("td");

            // Mapper le jour de la semaine pour correspondre à la base de données
            const mappedDayOfWeek = mapDayToDatabase(dayOfWeek);

            // Vérifier si la date est dans l'intervalle de la compétence
            const isWithinDateRange = date >= date_debut && date <= date_fin;

            // Vérifier si la date est dans une plage d'indisponibilité
            const isWithinIndispoRange =
                indisponibilite_debut && indisponibilite_fin && date >= indisponibilite_debut && date <= indisponibilite_fin;

            // Vérifier si le jour est autorisé
            const isDayAllowed = jours[mappedDayOfWeek];

            if (isWithinDateRange && !isWithinIndispoRange && isDayAllowed) {
                dateCell.textContent = "✔"; // Disponible
            } else {
                dateCell.textContent = "✘"; // Non disponible
                dateCell.style.backgroundColor = "#d3d3d3"; // Griser la cellule
            }

            row.appendChild(dateCell);
        });

        tbody.appendChild(row);
    });
}



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

    const dateHeaders = []; // Stocker les dates pour les utiliser dans les lignes
    while (currentDate <= endDateObj) {
        const dateHeader = document.createElement("th");
        const formattedDate = currentDate.toISOString().split("T")[0]; // Format YYYY-MM-DD
        dateHeader.textContent = currentDate.toLocaleDateString("fr-FR");
        headerRow.appendChild(dateHeader);

        dateHeaders.push(formattedDate);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    thead.appendChild(headerRow);

    // Regrouper les données par competence_id et horaire_id
    const groupedData = {};
    data.forEach((item) => {
        const key = `${item.competence_id}-${item.horaire_id}`;
        if (!groupedData[key]) {
            groupedData[key] = {
                competence_id: item.competence_id, // Ajoutez cette ligne
                horaire_id: item.horaire_id,     // Ajoutez cette ligne
                competence: item.competence,
                horaire_debut: item.horaire_debut,
                horaire_fin: item.horaire_fin,
                dates: {} // Stocker les noms par date
            };
        }

        // Ajouter les noms pour chaque date
        if (item.date) {
            groupedData[key].dates[item.date] = item.nom || null; // Ajouter le nom ou null
        }
    });

    console.log("Données reçues dans displayPlanningWithNames :", data);

    // Ajouter les lignes pour chaque combinaison compétence-horaire
    Object.values(groupedData).forEach((item) => {
        const { competence, horaire_debut, horaire_fin, dates } = item;
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
        
            // Vérifiez que les données existent avant de les utiliser
            if (item.competence_id && item.horaire_id) {
                dateCell.dataset.competenceId = item.competence_id;
                dateCell.dataset.horaireId = item.horaire_id;
            } else {
                console.warn("Données manquantes pour competence_id ou horaire_id :", item);
                dateCell.dataset.competenceId = "inconnu";
                dateCell.dataset.horaireId = "inconnu";
            }
        
            dateCell.dataset.date = date;
        
            // Vérifier si un nom est associé à cette date
            if (dates[date]) {
                dateCell.textContent = dates[date]; // Afficher le nom
            } else {
                dateCell.textContent = ""; // Cellule vide
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
            `/planning/datecompetencewithnames?site_id=${siteId}&start_date=${startDate}&end_date=${endDate}`,
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
        const competencesWithNames = await fetchCompetencesWithNames(siteId, startDate, endDate);
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

    // Récupérer les compétences pour le premier tableau
    const competences = await fetchCompetences(siteId, startDate, endDate);
    displayCompetencesWithDates(competences, startDate, endDate);

    // Récupérer les compétences avec noms pour le deuxième tableau
    const competencesWithNames = await fetchCompetencesWithNames(siteId, startDate, endDate);
    displayPlanningWithNames(competencesWithNames, startDate, endDate);
});


document.getElementById("planningTableWithNames").addEventListener("click", async (event) => {
    const cell = event.target;

    // Vérifiez si la cellule cliquée est valide
    if (cell.tagName !== "TD" || !cell.dataset.competenceId || !cell.dataset.horaireId || !cell.dataset.date) {
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

