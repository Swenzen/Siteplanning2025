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

// Appliquer le filtre de dates
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

    // Récupérer les compétences
    const competences = await fetchCompetences(siteId, startDate, endDate);

    // Afficher le tableau dynamique
    displayCompetencesWithDates(competences, startDate, endDate);
});

// Fonction pour récupérer les compétences depuis la route backend
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
            console.error("Erreur lors de la récupération des compétences :", errorText);
            alert("Erreur lors de la récupération des compétences.");
            return [];
        }

        const competences = await response.json();
        console.log("Compétences récupérées :", competences);
        return competences;
    } catch (error) {
        console.error("Erreur lors de la récupération des compétences :", error);
        alert("Une erreur est survenue lors de la récupération des compétences.");
        return [];
    }
}

function displayCompetencesWithDates(competences, startDate, endDate) {
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

        dateHeaders.push(formattedDate); // Ajouter la date au tableau
        currentDate.setDate(currentDate.getDate() + 1);
    }

    thead.appendChild(headerRow);

    // Ajouter les lignes pour chaque compétence
    competences.forEach((competence) => {
        const row = document.createElement("tr");

        // Colonne Compétence
        const competenceCell = document.createElement("td");
        competenceCell.textContent = competence.competence;
        row.appendChild(competenceCell);

        // Colonne Horaires (vide pour l'instant)
        const horairesCell = document.createElement("td");
        horairesCell.textContent = "-";
        row.appendChild(horairesCell);

        // Colonnes dynamiques pour les dates
        dateHeaders.forEach((date) => {
            const dateCell = document.createElement("td");

            // Vérifier si la date est dans l'intervalle de la compétence
            if (competence.date_debut <= date && competence.date_fin >= date) {
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