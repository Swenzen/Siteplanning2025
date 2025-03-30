// Fonction pour créer une table de repos
async function createReposTable(nomRepos) {
    try {
        const siteId = localStorage.getItem('site_id'); // Récupérer le site_id depuis le localStorage
        if (!siteId) {
            throw new Error('site_id manquant dans le localStorage.');
        }

        const response = await fetch('/api/create-repos-table', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`, // Ajouter le token
                'site-id': siteId // Ajouter le site_id
            },
            body: JSON.stringify({ nomRepos })
        });

        if (!response.ok) {
            throw new Error(`Erreur lors de la création de la table de repos : ${response.status}`);
        }

        const result = await response.text();
        console.log('Résultat de la création de la table de repos :', result);
        alert('Table de repos créée avec succès');
        loadReposTables(siteId); // Recharger les tables de repos après la création
    } catch (error) {
        console.error('Erreur lors de la création de la table de repos :', error);
        alert('Erreur lors de la création de la table de repos');
    }
}

// Fonction pour charger les tables de repos
async function loadReposTables() {
    try {
        const siteId = localStorage.getItem('site_id'); // Récupérer le site_id depuis le localStorage
        if (!siteId) {
            throw new Error('site_id manquant dans le localStorage.');
        }

        const response = await fetch(`/api/get-repos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`, // Ajouter le token
                'site-id': siteId // Ajouter le site_id
            }
        });

        if (response.ok) {
            const repos = await response.json();
            console.log('Repos récupérés :', repos);

            const joursReposTableBody = document.querySelector('#joursrepos tbody');
            if (!joursReposTableBody) {
                throw new Error('Élément joursrepos introuvable dans le DOM.');
            }

            joursReposTableBody.innerHTML = ''; // Vider le tableau avant d'ajouter les nouveaux repos

            repos.forEach(reposItem => {
                const row = document.createElement('tr');

                // Colonne pour le nom du repos
                const nameCell = document.createElement('td');
                nameCell.textContent = reposItem.repos; // Afficher le nom du repos
                row.appendChild(nameCell);

                // Colonne pour le bouton "Supprimer"
                const actionCell = document.createElement('td');
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Supprimer';
                deleteButton.classList.add('danger'); // Style pour le bouton
                deleteButton.addEventListener('click', async () => {
                    if (confirm(`Voulez-vous vraiment supprimer le repos "${reposItem.repos}" ?`)) {
                        await deleteRepos(reposItem.repos_id); // Appeler la fonction pour supprimer le repos
                        loadReposTables(); // Recharger les repos après suppression
                    }
                });
                actionCell.appendChild(deleteButton);
                row.appendChild(actionCell);

                joursReposTableBody.appendChild(row);
            });
        } else {
            console.error('Erreur lors du chargement des repos. Statut :', response.status);
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des repos :', error);
    }
}

// Fonction pour supprimer un repos
async function deleteRepos(reposId) {
    try {
        const siteId = localStorage.getItem('site_id'); // Récupérer le site_id depuis le localStorage
        if (!siteId) {
            throw new Error('site_id manquant dans le localStorage.');
        }

        const response = await fetch('/api/remove-repos-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Ajouter le token
            },
            body: JSON.stringify({ reposId, siteId }) // Envoyer les données nécessaires
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression du repos.');
        }

        const result = await response.text();
        console.log('Résultat de la suppression du repos :', result);
        alert('Repos supprimé avec succès.');
    } catch (error) {
        console.error('Erreur lors de la suppression du repos :', error);
        alert('Erreur lors de la suppression du repos.');
    }
}

// Ajouter un gestionnaire de clics au bouton pour ajouter un jour de repos
document.getElementById("ajouterjoursrepos").addEventListener("click", () => {
    const nomRepos = prompt("Entrez le nom du repos :");
    if (nomRepos) {
        createReposTable(nomRepos);
    }
});

// Charger les tables de repos lorsque la page est chargée
document.addEventListener('DOMContentLoaded', loadReposTables);