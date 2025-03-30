let currentCell = null;
let currentId = null;

// Fonction pour afficher les données dans le tableau des noms *
async function fetchData() {
    const token = localStorage.getItem('token'); // Récupérer le jeton depuis le localStorage
    const siteId = localStorage.getItem('site_id'); // Récupérer le site_id depuis le localStorage

    try {
        const response = await fetch(`/api/data?site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Ajouter le jeton dans l'en-tête
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Données récupérées :', data);

            const tableBody = document.querySelector("#databaseTable tbody");
            tableBody.innerHTML = ''; // Vider le contenu du tableau

            // Ajouter les données récupérées au tableau
            data.forEach(rowData => {
                const row = document.createElement("tr");

                // Ajouter les colonnes pour chaque donnée
                const nomCell = document.createElement("td");
                nomCell.textContent = rowData.nom;
                row.appendChild(nomCell);

                const siteCell = document.createElement("td");
                siteCell.textContent = rowData.site_name;
                row.appendChild(siteCell);

                // Ajouter une colonne pour les actions (bouton "Supprimer")
                const actionCell = document.createElement("td");
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Supprimer";
                console.log('Données de la ligne :', rowData);
                deleteButton.dataset.nomId = rowData.nom_id; // Stocker l'ID du nom dans le bouton
deleteButton.classList.add("delete-button"); // Ajouter une classe pour le style
                console.log('Bouton de suppression créé avec nom_id :', rowData.nom_id);
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

// Fonction pour afficher la fenêtre modale
function showModal() {
    const modal = document.getElementById("myModal");
    modal.style.display = "block";
    document.getElementById("newName").value = currentCell.textContent;
}

// Fonction pour fermer la fenêtre modale
function closeModal() {
    const modal = document.getElementById("myModal");
    modal.style.display = "none";
}

// Fonction pour sauvegarder le nouveau nom
async function saveName() {
    const newName = document.getElementById("newName").value;
    if (currentCell && currentId) {
        try {
            console.time('saveName');
            const token = localStorage.getItem('token');
            const siteId = localStorage.getItem('site_id');

            const response = await fetch('/api/update-name', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nom_id: currentId, nom: newName, site_id: siteId })
            });

            if (response.ok) {
                const result = await response.text();
                console.log(result);
                // Mettre à jour l'affichage du nom dans la cellule
                currentCell.textContent = newName;
                closeModal();
            } else {
                console.error('Erreur lors de la mise à jour du nom');
            }
            console.timeEnd('saveName');
        } catch (error) {
            console.error('Erreur lors de la requête:', error);
        }
    }
}

async function addNom() {
    const token = localStorage.getItem('token');
    const nom = document.getElementById('nomInput').value;

    if (!nom) {
        alert('Veuillez entrer un nom.');
        return;
    }

    console.log('Données envoyées :', { nom });

    try {
        const response = await fetch('/api/add-nom', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nom }) // On n'envoie plus le site_id
        });

        if (response.ok) {
            document.getElementById('nomInput').value = ''; // Réinitialise le champ de saisie
            fetchData(); // Rafraîchit le tableau des noms
            fetchCompetencesPersonnes(); // Rafraîchit le tableau des compétences des personnes
        } else {
            const error = await response.text();
            console.error('Erreur lors de l\'ajout du nom :', error);
            alert('Erreur lors de l\'ajout du nom : ' + error);
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout du nom :', error);
    }
}

// Fonction pour supprimer un nom *
async function deleteName(nom_id) {
    const token = localStorage.getItem('token');
    const siteId = localStorage.getItem('site_id');

    if (!siteId) {
        console.error('Erreur : le site_id est introuvable.');
        alert('Erreur : le site n\'est pas chargé.');
        return;
    }

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
            fetchData(); // Rafraîchit le tableau des noms
            fetchCompetencesPersonnes(); // Rafraîchit le tableau des compétences des personnes
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
        const nomId = event.target.dataset.nomId; // Récupérer l'ID du nom à partir du bouton
        console.log('ID du nom récupéré :', nomId);
        if (!nomId) {
            console.error('Erreur : nom_id est introuvable.');
            alert('Erreur : Impossible de trouver l\'ID du nom.');
            return;
        }
        deleteName(nomId); // Appeler la fonction pour supprimer le nom
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