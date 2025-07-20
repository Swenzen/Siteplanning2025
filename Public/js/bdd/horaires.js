// Fonction pour afficher les horaires dans le tableau
async function fetchHoraires() {
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    const siteId = sessionStorage.getItem('selectedSite'); // Récupérer le site_id depuis le sessionStorage

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
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
        tableBody.innerHTML = ''; // Vider le tableau avant d'ajouter les nouvelles données

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
    } catch (error) {
        console.error('Erreur lors de la récupération des horaires :', error);
    }
}



async function deleteHoraire(horaire_id) {
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    const siteId = sessionStorage.getItem('selectedSite'); // Récupérer le site_id depuis le sessionStorage

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
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
                body: JSON.stringify({ horaire_id, site_id: siteId })
            });

            if (response.ok) {
                console.log('Horaire supprimé avec succès');
                fetchHoraires(); // Rafraîchir le tableau des horaires
                fetchHorairesCompetences(); // Rafraîchir le tableau des horaires par compétence
            } else {
                console.error('Erreur lors de la suppression de l\'horaire');
            }
        } catch (error) {
            console.error('Erreur lors de la requête :', error);
        }
    }
}



function openHoraireModal() {
    document.getElementById('horaireModal').style.display = 'block';
}
function closeHoraireModal() {
    document.getElementById('horaireModal').style.display = 'none';
    document.getElementById('horaireDebutInput').value = '';
    document.getElementById('horaireFinInput').value = '';
}

document.getElementById("addHoraireButton").addEventListener("click", openHoraireModal);
document.getElementById("closeHoraireModal").addEventListener("click", closeHoraireModal);

// Quand on clique sur "Ajouter" dans la modale
document.getElementById("confirmAddHoraire").addEventListener("click", async function() {
    const horaireDebut = document.getElementById('horaireDebutInput').value;
    const horaireFin = document.getElementById('horaireFinInput').value;
    const token = localStorage.getItem('token');
    const siteId = sessionStorage.getItem('selectedSite');
    if (!horaireDebut || !horaireFin) {
        alert("Veuillez renseigner les deux horaires.");
        return;
    }
    if (!token || !siteId) {
        alert("Erreur d'authentification ou de site.");
        return;
    }
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
            fetchHoraires();
            if (typeof fetchHorairesCompetences === "function") fetchHorairesCompetences();
            closeHoraireModal();
        } else {
            alert("Erreur lors de l'ajout de l'horaire.");
        }
    } catch (error) {
        alert("Erreur lors de la requête.");
    }
});



// Appeler la fonction pour récupérer les horaires lorsque la page est chargée
document.addEventListener('DOMContentLoaded', fetchHoraires);

// Utiliser la délégation d'événements pour gérer les clics sur les boutons de suppression
document.querySelector("#horairesTable tbody").addEventListener("click", (event) => {
    if (event.target.tagName === "BUTTON" && event.target.textContent === "Supprimer") {
        const horaireId = event.target.dataset.horaireId;
        deleteHoraire(horaireId);
    }
});