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

    // Regrouper les données par competence_id et horaire_id
    const groupedData = {};
    const uniqueData = Array.from(
        new Map(
            data.map((item) => [
                `${item.competence_id}-${item.horaire_id}-${item.jour_id}`,
                item,
            ])
        ).values()
    );
    
    uniqueData.forEach((item) => {
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
                jours: [],
            };
        }
        if (!groupedData[key].jours.includes(item.jour_id)) {
            groupedData[key].jours.push(item.jour_id);
        }
    });

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
    
            // Vérifier si la date est dans l'intervalle de la compétence
            const isWithinDateRange = date >= date_debut && date <= date_fin;
    
            // Vérifier si la date est dans une plage d'indisponibilité
            const isWithinIndispoRange =
                indisponibilite_debut && indisponibilite_fin && date >= indisponibilite_debut && date <= indisponibilite_fin;
    
            // Vérifier si le jour est autorisé
            const isDayAllowed = jours.includes(dayOfWeek);
    
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