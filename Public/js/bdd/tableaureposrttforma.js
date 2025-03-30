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

async function loadReposTables(siteId) {
    try {
        const response = await fetch(`/api/get-repos?site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const repos = await response.json();
            const reposContainer = document.getElementById('reposContainer');
            reposContainer.innerHTML = ''; // Vider le conteneur

            repos.forEach(repos => {
                const div = document.createElement('div');
                div.textContent = repos.repos; // Afficher le nom du repos
                reposContainer.appendChild(div);
            });
        } else {
            console.error('Erreur lors du chargement des repos.');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des repos :', error);
    }
}

// Fonction pour supprimer une table de repos
async function deleteReposTable(tableName) {
    try {
        const response = await fetch('/api/delete-repos-table', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tableName })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression de la table de repos');
        }

        const result = await response.text();
        console.log('Résultat de la suppression de la table de repos :', result);
        alert('Table de repos supprimée avec succès');
        loadReposTables(); // Recharger les tables de repos après la suppression
    } catch (error) {
        console.error('Erreur lors de la suppression de la table de repos :', error);
        alert('Erreur lors de la suppression de la table de repos');
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