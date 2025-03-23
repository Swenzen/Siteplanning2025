let currentCell = null;
let currentId = null;

// Fonction pour afficher les données dans le tableau des noms *
async function fetchData() {
    const token = localStorage.getItem('token');
    const siteId = localStorage.getItem('site_id');

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        alert('Erreur : vous devez être authentifié et un site doit être chargé.');
        return;
    }

    try {
        const response = await fetch(`/api/data?site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Données récupérées :', data);

            const tableBody = document.querySelector("#databaseTable tbody");
            tableBody.innerHTML = '';

            data.forEach(rowData => {
                const row = document.createElement("tr");

                const nomCell = document.createElement("td");
                nomCell.textContent = rowData.nom;
                row.appendChild(nomCell);

                const siteCell = document.createElement("td");
                siteCell.textContent = rowData.site_name;
                row.appendChild(siteCell);

                const actionCell = document.createElement("td");
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Supprimer";
                deleteButton.dataset.nomId = rowData.nom_id;
                deleteButton.classList.add("delete-button");
                actionCell.appendChild(deleteButton);
                row.appendChild(actionCell);

                tableBody.appendChild(row);
            });
        } else {
            console.error('Erreur lors de la récupération des données');
        }
    } catch (error) {
        console.error('Erreur lors de la requête :', error);
    }
}

// Fonction pour ajouter un nom *
async function addNom() {
    const token = localStorage.getItem('token');
    const nom = document.getElementById('nomInput').value;
    const siteId = localStorage.getItem('site_id');

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        alert('Erreur : vous devez être authentifié et un site doit être chargé.');
        return;
    }

    try {
        const response = await fetch('/api/add-nom', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nom, site_id: siteId })
        });

        if (response.ok) {
            alert('Nom ajouté avec succès');
            fetchData();
        } else {
            console.error('Erreur lors de l\'ajout du nom');
        }
    } catch (error) {
        console.error('Erreur lors de la requête :', error);
    }
}

// Fonction pour supprimer un nom *
async function deleteName(nom_id) {
    const token = localStorage.getItem('token');
    const siteId = localStorage.getItem('site_id');

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        alert('Erreur : vous devez être authentifié et un site doit être chargé.');
        return;
    }

    console.log('Données envoyées pour suppression :', { nom_id, site_id: siteId });

    try {
        const response = await fetch('/api/delete-nom', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nom_id, site_id: siteId })
        });

        if (response.ok) {
            alert('Nom supprimé avec succès');
            fetchData();
        } else {
            const error = await response.text();
            console.error('Erreur lors de la suppression du nom :', error);
        }
    } catch (error) {
        console.error('Erreur lors de la requête :', error);
    }
}

// Utiliser la délégation d'événements pour gérer les clics sur les boutons de suppression
document.querySelector("#databaseTable tbody").addEventListener("click", (event) => {
    if (event.target.tagName === "BUTTON" && event.target.textContent === "Supprimer") {
        const nomId = event.target.dataset.nomId;
        console.log('ID du nom récupéré :', nomId);
        if (!nomId) {
            console.error('Erreur : nom_id est introuvable.');
            alert('Erreur : Impossible de trouver l\'ID du nom.');
            return;
        }
        deleteName(nomId);
    }
});

// Gestionnaire d'événements pour fermer la fenêtre modale
document.querySelector(".close").addEventListener("click", closeModal);

// Gestionnaire d'événements pour sauvegarder le nouveau nom
document.getElementById("saveName").addEventListener("click", saveName);

// Gestionnaire d'événements pour ajouter un nom
document.getElementById("addNameButton").addEventListener("click", addNom);

// Appeler la fonction pour récupérer les données lorsque la page est chargée
document.addEventListener('DOMContentLoaded', fetchData);

// Fermer la fenêtre modale si l'utilisateur clique en dehors de celle-ci
window.onclick = function(event) {
    const modal = document.getElementById("myModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
}