// Fonction pour afficher les compétences dans le tableau *
let selectedCompetenceId = null;

async function fetchCompetences() {
    try {
        const siteId = sessionStorage.getItem('selectedSite');
        const token = localStorage.getItem('token');

        const response = await fetch(`/api/competences?site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Données reçues de l\'API :', data);

            const tableBody = document.querySelector("#competencesTable tbody");
            tableBody.innerHTML = '';

            const groupedData = data.reduce((acc, row) => {
                if (!acc[row.competence_id]) {
                    acc[row.competence_id] = {
                        competence_id: row.competence_id, // Ajout explicite de competence_id
                        competence: row.competence,
                        date_debut: row.date_debut,
                        date_fin: row.date_fin,
                        indisponibilites: []
                    };
                }
                if (row.indisponibilite_debut && row.indisponibilite_fin) {
                    acc[row.competence_id].indisponibilites.push({
                        date_debut: row.indisponibilite_debut,
                        date_fin: row.indisponibilite_fin
                    });
                }
                return acc;
            }, {});

            console.log('groupedData:', groupedData);

            Object.values(groupedData).forEach(({ competence_id, competence, date_debut, date_fin }) => {
                const row = document.createElement("tr");

                const competenceCell = document.createElement("td");
                competenceCell.textContent = competence;
                row.appendChild(competenceCell);

                const dateDebutCell = document.createElement("td");
                dateDebutCell.textContent = formatDate(date_debut);
                dateDebutCell.addEventListener("click", () => makeDateEditable(dateDebutCell, competence_id, "date_debut"));
                row.appendChild(dateDebutCell);

                const dateFinCell = document.createElement("td");
                dateFinCell.textContent = formatDate(date_fin);
                dateFinCell.addEventListener("click", () => makeDateEditable(dateFinCell, competence_id, "date_fin"));
                row.appendChild(dateFinCell);

                const actionsCell = document.createElement("td");
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Supprimer";
                deleteButton.addEventListener("click", () => deleteCompetence(competence_id));
                actionsCell.appendChild(deleteButton);
                row.appendChild(actionsCell);

                tableBody.appendChild(row);
            });
        }
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

document.getElementById("saveDatesButton").addEventListener("click", async () => {
    const dateDebut = document.getElementById("dateDebutInput").value;
    const dateFin = document.getElementById("dateFinInput").value;

    const siteId = sessionStorage.getItem('selectedSite');
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/update-competence-dates', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                competence_id: selectedCompetenceId,
                date_debut: dateDebut,
                date_fin: dateFin,
                site_id: siteId
            })
        });

        if (response.ok) {
            alert('Dates mises à jour avec succès.');
            fetchCompetences();
        } else {
            alert('Erreur lors de la mise à jour des dates.');
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour des dates :', error);
    }

    document.getElementById("dateModal").style.display = "none";
});

document.querySelector(".date-close").addEventListener("click", () => {
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
    const token = localStorage.getItem('token');
    const siteId = sessionStorage.getItem('selectedSite');

    console.log('competenceId:', competenceId);
    console.log('siteId:', siteId);

    if (!siteId) {
        alert('Erreur : le site n\'est pas chargé.');
        return;
    }

    if (!competenceId) {
        alert('Erreur : l\'ID de la compétence est manquant.');
        return;
    }

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
            fetchCompetences(); // Rafraîchir la liste des compétences
        } else {
            const error = await response.text();
            console.error('Erreur lors de la suppression de la compétence :', error);
            alert('Erreur lors de la suppression de la compétence.');
        }
    } catch (error) {
        console.error('Erreur lors de la requête :', error);
        alert('Erreur lors de la suppression de la compétence.');
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



// Gestionnaire d'événements pour ajouter une compétence
document.getElementById("addCompetenceButton").addEventListener("click", addCompetence);

document.addEventListener('DOMContentLoaded', () => {
    fetchCompetences(); // Charger les compétences
    fetchCompetenceDays(); // Charger les jours par compétence
});