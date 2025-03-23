// Fonction pour afficher les horaires dans le tableau
async function fetchHoraires() {
    const token = localStorage.getItem('token');
    const siteId = localStorage.getItem('site_id');

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        alert('Erreur : vous devez être authentifié et un site doit être chargé.');
        return;
    }

    try {
        const response = await fetch(`/api/horaires?site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP ! statut : ${response.status}`);
        }

        const data = await response.json();
        console.log('Données récupérées :', data);

        const tableBody = document.querySelector("#horairesTable tbody");
        tableBody.innerHTML = '';

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
    const token = localStorage.getItem('token');
    const siteId = localStorage.getItem('site_id');

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        alert('Erreur : vous devez être authentifié et un site doit être chargé.');
        return;
    }

    if (horaireDebut && horaireFin) {
        try {
            const response = await fetch('/api/add-horaires', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
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
                fetchHoraires();
            } else {
                console.error('Erreur lors de l\'ajout de l\'horaire');
            }
        } catch (error) {
            console.error('Erreur lors de la requête :', error);
        }
    }
}

// Fonction pour supprimer un horaire
async function deleteHoraire(horaire_id) {
    const token = localStorage.getItem('token');

    if (!token) {
        console.error('Erreur : le token d\'authentification est introuvable.');
        alert('Erreur : vous devez être authentifié.');
        return;
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer cet horaire ?")) {
        try {
            const response = await fetch('/api/delete-horaires', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ horaire_id })
            });

            if (response.ok) {
                fetchHoraires();
            } else {
                console.error('Erreur lors de la suppression de l\'horaire');
            }
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