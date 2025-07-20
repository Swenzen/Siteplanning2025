// Fonction pour afficher les compétences dans le tableau *
let selectedCompetenceId = null;
let currentCompetenceId = null;

async function fetchCompetences() {
    const token = localStorage.getItem('token');
    const siteId = sessionStorage.getItem('selectedSite');

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        return;
    }

    try {
        const response = await fetch(`/api/competences?site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de la récupération des compétences : ${errorText}`);
        }

        const data = await response.json();
        console.log('Données reçues :', data);

        // Insérer les données dans le tableau HTML
        const tableBody = document.querySelector("#competencesTable tbody");
        tableBody.innerHTML = ''; // Vider le tableau avant de le remplir

        data.forEach(({ competence_id, competence, date_debut, date_fin }) => {
            const row = document.createElement('tr');

            const competenceCell = document.createElement('td');
            competenceCell.textContent = competence;
            row.appendChild(competenceCell);

            const dateDebutCell = document.createElement('td');
            dateDebutCell.textContent = formatDate(date_debut); // Reformater la date
            dateDebutCell.addEventListener("click", () => openCompetenceDateModal(competence_id, date_debut, date_fin));
            row.appendChild(dateDebutCell);

            const dateFinCell = document.createElement('td');
            dateFinCell.textContent = formatDate(date_fin); // Reformater la date
            dateFinCell.addEventListener("click", () => openCompetenceDateModal(competence_id, date_debut, date_fin));
            row.appendChild(dateFinCell);

            const actionsCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Supprimer';
            deleteButton.dataset.competenceId = competence_id; // Ajouter l'ID de la compétence au bouton
            deleteButton.addEventListener("click", () => deleteCompetence(competence_id));
            actionsCell.appendChild(deleteButton);
            row.appendChild(actionsCell);

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des compétences :', error);
    }
}

function openDateModal(competenceId, dateDebut, dateFin) {
    selectedCompetenceId = competenceId;

    const modal = document.getElementById("dateModal");
    const dateDebutInput = document.getElementById("dateDebutInput");
    const dateFinInput = document.getElementById("dateFinInput");

    dateDebutInput.value = dateDebut || '';
    dateFinInput.value = dateFin || '';

    modal.style.display = "block";
}

function openCompetenceDateModal(competenceId, dateDebut, dateFin) {
    currentCompetenceId = competenceId;

    const modal = document.getElementById("dateModal");
    const dateDebutInput = document.getElementById("dateDebutInput");
    const dateFinInput = document.getElementById("dateFinInput");

    dateDebutInput.value = dateDebut ? dateDebut.split('T')[0] : ''; // Format YYYY-MM-DD
    dateFinInput.value = dateFin ? dateFin.split('T')[0] : ''; // Format YYYY-MM-DD

    modal.style.display = "block";
}

document.getElementById("saveDatesButton").addEventListener("click", async () => {
    const dateDebut = document.getElementById("dateDebutInput").value;
    const dateFin = document.getElementById("dateFinInput").value;

    const siteId = sessionStorage.getItem('selectedSite');
    const token = localStorage.getItem('token');

    if (!currentCompetenceId) {
        alert("Erreur : ID de la compétence manquant.");
        return;
    }

    try {
        const response = await fetch('/api/update-competence-dates', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                competence_id: currentCompetenceId,
                date_debut: dateDebut,
                date_fin: dateFin,
                site_id: siteId
            })
        });

        if (response.ok) {
            alert('Dates mises à jour avec succès.');
            fetchCompetences(); // Recharger les données
        } else {
            alert('Erreur lors de la mise à jour des dates.');
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour des dates :', error);
    }

    document.getElementById("dateModal").style.display = "none";
});

function formatDate(dateString) {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Les mois commencent à 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

async function addCompetence() {
    const competence = prompt("Entrez la compétence");
    if (competence) {
        try {
            const siteId = sessionStorage.getItem('selectedSite');
            if (!siteId) {
                alert('Erreur : le site n\'est pas chargé.');
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                alert('Erreur : vous n\'êtes pas authentifié.');
                return;
            }

            // Récupérer le plus grand display_order existant
            const responseOrder = await fetch('/api/max-display-order', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!responseOrder.ok) {
                alert('Erreur lors de la récupération du display_order maximum.');
                return;
            }

            const maxOrderData = await responseOrder.json();
            const maxDisplayOrder = maxOrderData.maxDisplayOrder || 0;

            // Envoyer la requête pour ajouter la compétence
            const response = await fetch('/api/add-competence2', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    competence,
                    displayOrder: maxDisplayOrder + 1,
                    site_id: siteId
                })
            });

            if (response.ok) {
                alert('Compétence ajoutée avec succès.');
                fetchCompetences(); // Rafraîchir la liste des compétences
            } else {
                const error = await response.text();
                console.error('Erreur lors de l\'ajout de la compétence :', error);
                alert('Erreur lors de l\'ajout de la compétence.');
            }
        } catch (error) {
            console.error('Erreur lors de la requête :', error);
            alert('Erreur lors de l\'ajout de la compétence.');
        }
    }
}

async function deleteCompetence(competenceId) {
    const siteId = sessionStorage.getItem('selectedSite');
    const token = localStorage.getItem('token');

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette compétence ?')) {
        return;
    }

    try {
        const response = await fetch('/api/delete-competence', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ competence_id: competenceId, site_id: siteId })
        });

        if (response.ok) {
            alert('Compétence supprimée avec succès.');
            fetchCompetences(); // Recharger les données
        } else {
            alert('Erreur lors de la suppression de la compétence.');
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de la compétence :', error);
    }
}



function makeDateEditable(cell, competenceId, dateType) {
    const originalValue = cell.textContent;
    const input = document.createElement("input");
    input.type = "date";
    input.value = originalValue.split('/').reverse().join('-'); // Convertir au format YYYY-MM-DD
    cell.textContent = '';
    cell.appendChild(input);

    input.addEventListener("blur", async () => {
        const newValue = input.value;
        if (newValue) {
            try {
                const siteId = sessionStorage.getItem('selectedSite');
                const token = localStorage.getItem('token');

                // Récupérer les valeurs actuelles de date_debut et date_fin
                const row = cell.parentElement;
                const dateDebut = row.querySelector('td:nth-child(2)').textContent.split('/').reverse().join('-');
                const dateFin = row.querySelector('td:nth-child(3)').textContent.split('/').reverse().join('-');

                const updatedDates = {
                    competence_id: competenceId,
                    site_id: siteId,
                    date_debut: dateType === "date_debut" ? newValue : dateDebut,
                    date_fin: dateType === "date_fin" ? newValue : dateFin
                };

                console.log('Données envoyées :', updatedDates);

                const response = await fetch('/api/update-competence-dates', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedDates)
                });

                if (response.ok) {
                    cell.textContent = formatDate(newValue);
                    alert('Date mise à jour avec succès.');
                } else {
                    alert('Erreur lors de la mise à jour de la date.');
                    cell.textContent = originalValue; // Restaurer la valeur d'origine en cas d'erreur
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour de la date :', error);
                cell.textContent = originalValue; // Restaurer la valeur d'origine en cas d'erreur
            }
        } else {
            cell.textContent = originalValue; // Restaurer la valeur d'origine si aucune nouvelle valeur n'est saisie
        }
    });

    input.focus();
}




async function fetchCompetenceDays() {
    const siteId = sessionStorage.getItem('selectedSite');
    const token = localStorage.getItem('token');

    if (!siteId || !token) {
        console.error("Erreur : le site ou le token est manquant.");
        return;
    }

    try {
        const response = await fetch(`/api/competence-days?site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error("Erreur lors de la récupération des jours par compétence.");
            return;
        }

        const data = await response.json();
        console.log("Données des jours par compétence :", data);

        const tableBody = document.querySelector("#competenceDaysTable tbody");
        if (!tableBody) {
            console.error("Le tableau #competenceDaysTable ou son tbody n'existe pas !");
            return;
        }
        tableBody.innerHTML = '';

        data.forEach(({ competence_id, competence, jours }) => {
            const row = document.createElement("tr");

            // Colonne Compétence
            const competenceCell = document.createElement("td");
            competenceCell.textContent = competence;
            row.appendChild(competenceCell);

            // Colonnes pour les jours
            for (let jourId = 1; jourId <= 7; jourId++) {
                const dayCell = document.createElement("td");
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.checked = jours.includes(jourId); // Cocher si le jour est associé
                checkbox.addEventListener("change", () => toggleCompetenceDay(competence_id, jourId, checkbox.checked));
                dayCell.appendChild(checkbox);
                row.appendChild(dayCell);
            }

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des jours par compétence :", error);
    }
}

async function toggleCompetenceDay(competenceId, jourId, isChecked) {
    const siteId = sessionStorage.getItem('selectedSite');
    const token = localStorage.getItem('token');

    if (!siteId || !token) {
        console.error("Erreur : le site ou le token est manquant.");
        return;
    }

    try {
        const response = await fetch('/api/toggle-competence-day', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                competence_id: competenceId,
                jour_id: jourId,
                is_checked: isChecked,
                site_id: siteId
            })
        });

        if (!response.ok) {
            console.error("Erreur lors de la mise à jour des jours par compétence.");
        } else {
            console.log(`Jour ${jourId} pour la compétence ${competenceId} mis à jour : ${isChecked}`);
        }
    } catch (error) {
        console.error("Erreur lors de la mise à jour des jours par compétence :", error);
    }
}

async function fetchCompetenceIndisponibilitesTable() {
    const siteId = sessionStorage.getItem('selectedSite');
    const token = localStorage.getItem('token');

    if (!siteId || !token) {
        console.error("Erreur : le site ou le token est manquant.");
        return;
    }

    try {
        const response = await fetch(`/api/competences?site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error("Erreur lors de la récupération des compétences.");
            return;
        }

        const data = await response.json();
        console.log("Données des compétences reçues :", data);

        const tableBody = document.querySelector("#competenceIndisponibilitesTable tbody");
        tableBody.innerHTML = ''; // Vider le tableau avant de le remplir

        // Regrouper les compétences pour éviter les doublons
        const groupedCompetences = data.reduce((acc, row) => {
            if (!acc[row.competence_id]) {
                acc[row.competence_id] = row; // Ajouter la compétence si elle n'existe pas encore
            }
            return acc;
        }, {});

        // Afficher chaque compétence une seule fois
        Object.values(groupedCompetences).forEach(({ competence_id, competence }) => {
            const row = document.createElement("tr");

            // Colonne Compétence
            const competenceCell = document.createElement("td");
            competenceCell.textContent = competence;
            row.appendChild(competenceCell);

            // Colonne Actions
            const actionsCell = document.createElement("td");
            const manageButton = document.createElement("button");
            manageButton.textContent = "Gérer les indisponibilités";
            manageButton.addEventListener("click", () => openIndisponibilitesModal(competence_id, competence));
            actionsCell.appendChild(manageButton);
            row.appendChild(actionsCell);

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des compétences :", error);
    }
}


function openIndisponibilitesModal(competenceId, competenceName) {
    console.log("Appel de openIndisponibilitesModal avec :", {
        competenceId,
        competenceName,
    });

    // Définir la compétence sélectionnée
    selectedCompetenceId = competenceId;

    const modal = document.getElementById("indisponibilitesModal");
    const tableBody = document.querySelector("#indisponibilitesTable tbody");

    if (!tableBody) {
        console.error("Le tableau 'indisponibilitesTable' ou son tbody n'existe pas !");
        return;
    }

    console.log("Ouverture de la modale pour les indisponibilités :", {
        competence_id: competenceId,
        competence_name: competenceName,
    });

    // Réinitialiser le tableau
    tableBody.innerHTML = `<tr><td colspan="3">Chargement...</td></tr>`;

    // Charger les indisponibilités depuis l'API
    fetchIndisponibilites(competenceId).then((indisponibilites) => {
        tableBody.innerHTML = ""; // Vider le tableau

        indisponibilites.forEach(({ date_debut, date_fin }) => {
            const row = document.createElement("tr");

            const dateDebutCell = document.createElement("td");
            dateDebutCell.textContent = formatDate(date_debut);
            row.appendChild(dateDebutCell);

            const dateFinCell = document.createElement("td");
            dateFinCell.textContent = formatDate(date_fin);
            row.appendChild(dateFinCell);

            const actionsCell = document.createElement("td");
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Supprimer";
            deleteButton.addEventListener("click", () => deleteIndisponibilite(competenceId, date_debut, date_fin));
            actionsCell.appendChild(deleteButton);
            row.appendChild(actionsCell);

            tableBody.appendChild(row);
        });

        console.log("Indisponibilités chargées :", indisponibilites);
    });

    // Afficher la modale
    modal.style.display = "block";

    // Fermer la modale
    document.querySelector(".indisponibilites-close").addEventListener("click", () => {
        modal.style.display = "none";
        console.log("Modale fermée.");
    });
}


async function fetchIndisponibilites(competenceId) {
    const siteId = sessionStorage.getItem("selectedSite");
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`/api/competence-disponibilites?competence_id=${competenceId}&site_id=${siteId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            console.error("Erreur lors de la récupération des indisponibilités.");
            return [];
        }

        return await response.json();
    } catch (error) {
        console.error("Erreur lors de la récupération des indisponibilités :", error);
        return [];
    }
}


function generateCalendar(indisponibilites) {
    const calendarContainer = document.getElementById("calendarContainer");
    calendarContainer.innerHTML = ""; // Réinitialiser le calendrier

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Créer un tableau pour le calendrier
    const table = document.createElement("table");
    table.classList.add("calendar");

    // Ajouter les en-têtes des jours de la semaine
    const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const headerRow = document.createElement("tr");
    daysOfWeek.forEach((day) => {
        const th = document.createElement("th");
        th.textContent = day;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Générer les jours du mois
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // Jour de la semaine du 1er jour du mois
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Nombre de jours dans le mois

    let date = 1;
    for (let i = 0; i < 6; i++) {
        const row = document.createElement("tr");

        for (let j = 0; j < 7; j++) {
            const cell = document.createElement("td");

            if (i === 0 && j < (firstDay === 0 ? 6 : firstDay - 1)) {
                // Cellules vides avant le début du mois
                cell.textContent = "";
            } else if (date > daysInMonth) {
                // Cellules vides après la fin du mois
                cell.textContent = "";
            } else {
                // Ajouter la date
                cell.textContent = date;

                // Vérifier si la date est une indisponibilité
                const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
                const isIndisponible = indisponibilites.some(
                    (ind) => ind.date_debut <= formattedDate && ind.date_fin >= formattedDate
                );

                if (isIndisponible) {
                    cell.classList.add("indisponible");
                }

                date++;
            }

            row.appendChild(cell);
        }

        table.appendChild(row);
    }

    calendarContainer.appendChild(table);
}

document.getElementById("addIndisponibiliteButton").addEventListener("click", async () => {
    const dateDebut = prompt("Entrez la date de début (YYYY-MM-DD) :");
    const dateFin = prompt("Entrez la date de fin (YYYY-MM-DD) :");

    if (!dateDebut || !dateFin) {
        alert("Les deux dates sont obligatoires.");
        console.error("Erreur : Les dates saisies sont invalides ou manquantes.");
        return;
    }

    const competenceId = selectedCompetenceId; // Variable globale pour suivre la compétence sélectionnée
    const siteId = sessionStorage.getItem("selectedSite");
    const token = localStorage.getItem("token");

    console.log("Données pour l'ajout d'une indisponibilité :", {
        competence_id: competenceId,
        date_debut: dateDebut,
        date_fin: dateFin,
        site_id: siteId,
    });

    if (!competenceId || !siteId || !token) {
        alert("Erreur : Les informations nécessaires sont manquantes.");
        console.error("Erreur : competenceId, siteId ou token manquant.", {
            competenceId,
            siteId,
            token,
        });
        return;
    }

    try {
        const response = await fetch("/api/add-indisponibilite", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                competence_id: competenceId,
                date_debut: dateDebut,
                date_fin: dateFin,
                site_id: siteId,
            }),
        });

        if (response.ok) {
            alert("Indisponibilité ajoutée avec succès.");
            console.log("Indisponibilité ajoutée avec succès.");
            openIndisponibilitesModal(competenceId); // Recharger la modale
        } else {
            const errorText = await response.text();
            alert("Erreur lors de l'ajout de l'indisponibilité.");
            console.error("Erreur lors de l'ajout de l'indisponibilité :", errorText);
        }
    } catch (error) {
        console.error("Erreur lors de l'ajout de l'indisponibilité :", error);
    }
});

function adjustDate(date, offset) {
    const d = new Date(date);
    d.setDate(d.getDate() + offset); // Décale la date de +1 ou -1 jour
    return d.toISOString().split('T')[0]; // Retourne au format YYYY-MM-DD
}

async function deleteIndisponibilite(competenceId, dateDebut, dateFin) {
    const siteId = sessionStorage.getItem("selectedSite");
    const token = localStorage.getItem("token");

    // Ajuster les dates pour correspondre à la base de données
    const adjustedDateDebut = adjustDate(dateDebut, 1); // Décale de +1 jour
    const adjustedDateFin = adjustDate(dateFin, 1);

    console.log("Données pour la suppression d'une indisponibilité :", {
        competence_id: competenceId,
        date_debut: adjustedDateDebut,
        date_fin: adjustedDateFin,
        site_id: siteId,
    });

    if (!competenceId || !adjustedDateDebut || !adjustedDateFin || !siteId || !token) {
        alert("Erreur : Les informations nécessaires sont manquantes.");
        console.error("Erreur : competenceId, dateDebut, dateFin, siteId ou token manquant.", {
            competenceId,
            dateDebut: adjustedDateDebut,
            dateFin: adjustedDateFin,
            siteId,
            token,
        });
        return;
    }

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette indisponibilité ?")) {
        console.log("Suppression annulée par l'utilisateur.");
        return;
    }

    try {
        const response = await fetch("/api/remove-indisponibilite", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                competence_id: competenceId,
                date_debut: adjustedDateDebut,
                date_fin: adjustedDateFin,
                site_id: siteId,
            }),
        });

        if (response.ok) {
            alert("Indisponibilité supprimée avec succès.");
            console.log("Indisponibilité supprimée avec succès.");
            openIndisponibilitesModal(competenceId); // Recharger la modale
        } else {
            const errorText = await response.text();
            alert("Erreur lors de la suppression de l'indisponibilité.");
            console.error("Erreur lors de la suppression de l'indisponibilité :", errorText);
        }
    } catch (error) {
        console.error("Erreur lors de la suppression de l'indisponibilité :", error);
    }
}

// Gestionnaire d'événements pour ajouter une compétence
document.getElementById("addCompetenceButton").addEventListener("click", addCompetence);

document.addEventListener('DOMContentLoaded', () => {
    console.log("Chargement des compétences pour 'Gérer les indisponibilités'.");
    fetchCompetences(); // Charger les compétences
    fetchCompetenceDays(); // Charger les jours par compétence
});

document.addEventListener('DOMContentLoaded', () => {
    console.log("Chargement des compétences pour 'Gérer les indisponibilités'.");
    fetchCompetenceIndisponibilitesTable(); // Charger les compétences pour le tableau
});

const tableBody = document.querySelector("#competenceIndisponibilitesTable tbody");
if (!tableBody) {
    console.error("Le tableau 'Gérer les indisponibilités par compétence' n'existe pas dans le DOM !");
} else {
    console.log("Le tableau 'Gérer les indisponibilités par compétence' a été trouvé.");
}