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
            const tableBody = document.querySelector("#competencesTable tbody");
            tableBody.innerHTML = '';

            data.forEach(rowData => {
                const row = document.createElement("tr");
            
                const competenceCell = document.createElement("td");
                competenceCell.textContent = rowData.competence;
                row.appendChild(competenceCell);
            
                const dateDebutCell = document.createElement("td");
                dateDebutCell.textContent = formatDate(rowData.date_debut);
                dateDebutCell.addEventListener("click", () => openDateModal(rowData.competence_id, rowData.date_debut, rowData.date_fin));
                row.appendChild(dateDebutCell);
            
                const dateFinCell = document.createElement("td");
                dateFinCell.textContent = formatDate(rowData.date_fin);
                dateFinCell.addEventListener("click", () => openDateModal(rowData.competence_id, rowData.date_debut, rowData.date_fin));
                row.appendChild(dateFinCell);
            
                const actionCell = document.createElement("td");
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Supprimer";
                deleteButton.addEventListener("click", () => deleteCompetence(rowData.competence_id));
                actionCell.appendChild(deleteButton);
                row.appendChild(actionCell);
            
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
            console.time('addCompetence');

            // Récupérer le site_id depuis le sessionStorage
            const siteId = sessionStorage.getItem('selectedSite');
            if (!siteId) {
                console.error('Erreur : le site_id est introuvable.');
                alert('Erreur : le site n\'est pas chargé.');
                return;
            }

            // Récupérer le token depuis le localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Erreur : le token d\'authentification est introuvable.');
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
                const error = await responseOrder.text();
                console.error('Erreur lors de la récupération du display_order maximum :', error);
                alert('Erreur lors de la récupération du display_order maximum.');
                return;
            }

            const maxOrderData = await responseOrder.json();
            const maxDisplayOrder = maxOrderData.maxDisplayOrder || 0;

            // Envoyer la requête pour ajouter la compétence avec la liaison au site
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
                console.log('Compétence ajoutée avec succès');
                fetchCompetences(); // Rafraîchir la liste des compétences
                fetchHorairesCompetences(); // Rafraîchir le tableau des horaires par compétence
                fetchCompetencesPersonnes(); // Rafraîchir le tableau des compétences des personnes
            } else {
                const error = await response.text();
                console.error('Erreur lors de l\'ajout de la compétence :', error);
            }
            console.timeEnd('addCompetence');
        } catch (error) {
            console.error('Erreur lors de la requête :', error);
        }
    }
}

async function deleteCompetence(competenceId) {
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    const siteId = sessionStorage.getItem('selectedSite'); // Récupérer le site_id depuis le sessionStorage

    if (!siteId) {
        console.error('Erreur : le site_id est introuvable.');
        alert('Erreur : le site n\'est pas chargé.');
        return;
    }

    try {
        const response = await fetch('/api/delete-competence', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, // Ajouter le token dans l'en-tête
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ competence_id: competenceId, site_id: siteId })
        });

        if (response.ok) {
            console.log('Compétence supprimée avec succès');
            fetchCompetences(); // Rafraîchir la liste des compétences
            fetchHorairesCompetences(); // Rafraîchir le tableau des horaires par compétence
            fetchCompetencesPersonnes(); // Rafraîchir le tableau des compétences des personnes
        } else {
            const error = await response.text();
            console.error('Erreur lors de la suppression de la compétence :', error);
        }
    } catch (error) {
        console.error('Erreur lors de la requête :', error);
    }
}

// Gestionnaire d'événements pour ajouter une compétence
document.getElementById("addCompetenceButton").addEventListener("click", addCompetence);

// Appeler la fonction pour récupérer les compétences lorsque la page est chargée
document.addEventListener('DOMContentLoaded', fetchCompetences);