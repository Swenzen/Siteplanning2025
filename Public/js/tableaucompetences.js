// Fonction pour afficher les compétences dans le tableau
async function fetchCompetences() {
    try {
        console.time('fetchCompetences');
        const response = await fetch('/api/competences');
        const data = await response.json();
        
        const tableBody = document.querySelector("#competencesTable tbody");
        tableBody.innerHTML = ''; // Vider le contenu du tableau

        // Créer un fragment de document pour minimiser les manipulations du DOM
        const fragment = document.createDocumentFragment();

        // Ajouter les données récupérées au tableau
        data.forEach(rowData => {
            const row = document.createElement("tr");
            const competenceCell = document.createElement("td");
            competenceCell.textContent = rowData.competence;
            row.appendChild(competenceCell);

            // Ajouter une cellule pour les actions (supprimer)
            const actionCell = document.createElement("td");
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Supprimer";
            deleteButton.dataset.competenceId = rowData.competence_id; // Utiliser dataset pour stocker l'ID
            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);

            fragment.appendChild(row);
        });

        tableBody.appendChild(fragment); // Ajouter le fragment au DOM en une seule opération
        console.timeEnd('fetchCompetences');
    } catch (error) {
        console.error('Erreur lors de la récupération des compétences :', error);
    }
}

// Fonction pour ajouter une compétence
async function addCompetence() {
    const competence = prompt("Entrez la compétence");
    if (competence) {
        try {
            console.time('addCompetence');
            // Récupérer le plus grand display_order existant
            const responseOrder = await fetch('/api/max-display-order');
            const maxOrderData = await responseOrder.json();
            const maxDisplayOrder = maxOrderData.maxDisplayOrder || 0;

            const response = await fetch('/api/add-competence2', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ competence, displayOrder: maxDisplayOrder + 1 })
            });

            if (response.ok) {
                fetchCompetences();
            } else {
                console.error('Erreur lors de l\'ajout de la compétence');
            }
            console.timeEnd('addCompetence');
        } catch (error) {
            console.error('Erreur lors de la requête:', error);
        }
    }
}

// Fonction pour supprimer une compétence
async function deleteCompetence(competence_id) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette compétence ?")) {
        try {
            console.time('deleteCompetence');
            const response = await fetch('/api/delete-competence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ competence_id })
            });

            if (response.ok) {
                fetchCompetences();
            } else {
                console.error('Erreur lors de la suppression de la compétence');
            }
            console.timeEnd('deleteCompetence');
        } catch (error) {
            console.error('Erreur lors de la requête:', error);
        }
    }
}

// Utiliser la délégation d'événements pour gérer les clics sur les boutons de suppression
document.querySelector("#competencesTable tbody").addEventListener("click", (event) => {
    if (event.target.tagName === "BUTTON" && event.target.textContent === "Supprimer") {
        const competenceId = event.target.dataset.competenceId;
        deleteCompetence(competenceId);
    }
});

// Gestionnaire d'événements pour ajouter une compétence
document.getElementById("addCompetenceButton").addEventListener("click", addCompetence);

// Appeler la fonction pour récupérer les compétences lorsque la page est chargée
document.addEventListener('DOMContentLoaded', fetchCompetences);