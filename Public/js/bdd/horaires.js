// Fonction pour afficher les horaires dans le tableau
// Fonction pour afficher les horaires dans le tableau
async function fetchHoraires() {
    try {
        console.time('fetchHoraires');

        // Récupérer le site_id depuis le localStorage
        const siteId = localStorage.getItem('site_id');
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

        // Effectuer une requête pour récupérer les horaires liés au site
        const response = await fetch(`/api/horaires?site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Ajouter le jeton dans l'en-tête
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP ! statut : ${response.status}`);
        }

        const data = await response.json();
        console.log('Données récupérées :', data);

        const tableBody = document.querySelector("#horairesTable tbody");
        tableBody.innerHTML = ''; // Vider le contenu du tableau

        // Ajouter les données récupérées au tableau
        data.forEach(rowData => {
            const row = document.createElement("tr");
            const horaireDebutCell = document.createElement("td");
            horaireDebutCell.textContent = rowData.horaire_debut;
            row.appendChild(horaireDebutCell);

            const horaireFinCell = document.createElement("td");
            horaireFinCell.textContent = rowData.horaire_fin;
            row.appendChild(horaireFinCell);

            const actionCell = document.createElement("td");
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Supprimer";
            deleteButton.dataset.horaireId = rowData.horaire_id;
            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);

            tableBody.appendChild(row);
        });

        console.timeEnd('fetchHoraires');
    } catch (error) {
        console.error('Erreur lors de la récupération des horaires :', error);
    }
}

// Fonction pour ajouter un horaire
async function addHoraire() {
    const horaireDebut = prompt("Entrez l'horaire de début (HH:MM)");
    const horaireFin = prompt("Entrez l'horaire de fin (HH:MM)");

    if (horaireDebut && horaireFin) {
        try {
            console.time('addHoraire');

            // Récupérer le site_id depuis le localStorage
            const siteId = localStorage.getItem('site_id');
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

            // Envoyer la requête pour ajouter l'horaire
            const response = await fetch('/api/add-horaires', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`, // Ajouter le token dans l'en-tête
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    horaire_debut: horaireDebut,
                    horaire_fin: horaireFin,
                    site_id: siteId
                })
            });

            if (response.ok) {
                alert('Horaire ajouté avec succès');
                fetchHoraires(); // Rafraîchir la liste des horaires
            } else {
                console.error('Erreur lors de l\'ajout de l\'horaire');
            }

            console.timeEnd('addHoraire');
        } catch (error) {
            console.error('Erreur lors de la requête :', error);
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