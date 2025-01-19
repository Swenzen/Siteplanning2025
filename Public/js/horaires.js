// Fonction pour afficher les horaires dans le tableau
async function fetchHoraires() {
    try {
        console.time('fetchHoraires');
        const response = await fetch('/api/horaires');
        if (!response.ok) {
            throw new Error(`Erreur HTTP ! statut : ${response.status}`);
        }
        const data = await response.json();
        console.log('Données récupérées :', data); // Ajoutez ce message de console pour vérifier les données

        const tableBody = document.querySelector("#horairesTable tbody");
        tableBody.innerHTML = ''; // Vider le contenu du tableau

        // Créer un fragment de document pour minimiser les manipulations du DOM
        const fragment = document.createDocumentFragment();

        // Trier les horaires par ordre croissant
        data.sort((a, b) => new Date(`1970-01-01T${a.horaire_debut}`) - new Date(`1970-01-01T${b.horaire_debut}`));

        // Ajouter les données récupérées au tableau
        data.forEach(rowData => {
            console.log('Row data:', rowData); // Ajoutez ce message de console pour vérifier chaque ligne de données
            const row = document.createElement("tr");
            const horaireDebutCell = document.createElement("td");
            horaireDebutCell.textContent = rowData.horaire_debut; // Utilisez le nom de la colonne correcte
            row.appendChild(horaireDebutCell);

            const horaireFinCell = document.createElement("td");
            horaireFinCell.textContent = rowData.horaire_fin; // Utilisez le nom de la colonne correcte
            row.appendChild(horaireFinCell);

            // Ajouter une cellule pour les actions (supprimer)
            const actionCell = document.createElement("td");
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Supprimer";
            deleteButton.dataset.horaireId = rowData.horaire_id; // Utiliser dataset pour stocker l'ID
            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);

            fragment.appendChild(row);
        });

        tableBody.appendChild(fragment); // Ajouter le fragment au DOM en une seule opération
        console.timeEnd('fetchHoraires');
    } catch (error) {
        console.error('Erreur lors de la récupération des horaires :', error);
    }
}

// Fonction pour ajouter un horaire
async function addHoraire() {
    const horaire_debut = prompt("Entrez l'horaire de début");
    const horaire_fin = prompt("Entrez l'horaire de fin");
    if (horaire_debut && horaire_fin) {
        try {
            console.time('addHoraire');
            const response = await fetch('/api/add-horaires', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ horaire_debut, horaire_fin })
            });

            if (response.ok) {
                fetchHoraires();
            } else {
                console.error('Erreur lors de l\'ajout de l\'horaire');
            }
            console.timeEnd('addHoraire');
        } catch (error) {
            console.error('Erreur lors de la requête:', error);
        }
    }
}

// Fonction pour supprimer un horaire
async function deleteHoraire(horaire_id) {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet horaire ?")) {
        try {
            console.time('deleteHoraire');
            const response = await fetch('/api/delete-horaires', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ horaire_id })
            });

            if (response.ok) {
                fetchHoraires();
            } else {
                console.error('Erreur lors de la suppression de l\'horaire');
            }
            console.timeEnd('deleteHoraire');
        } catch (error) {
            console.error('Erreur lors de la requête:', error);
        }
    }
}

// Appeler la fonction pour récupérer les horaires lorsque la page est chargée
document.addEventListener('DOMContentLoaded', fetchHoraires);

// Utiliser la délégation d'événements pour gérer les clics sur les boutons de suppression
document.querySelector("#horairesTable tbody").addEventListener("click", (event) => {
    if (event.target.tagName === "BUTTON" && event.target.textContent === "Supprimer") {
        const horaireId = event.target.dataset.horaireId;
        deleteHoraire(horaireId);
    }
});

// Gestionnaire d'événements pour ajouter un horaire
document.getElementById("addHoraireButton").addEventListener("click", addHoraire);