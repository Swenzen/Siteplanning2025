// Fonction pour créer une table de repos
async function createReposTable(nomRepos) {
    const token = localStorage.getItem('token');
    const siteId = sessionStorage.getItem('selectedSite');

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        return;
    }

    try {
        const response = await fetch('/api/create-repos-table', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nomRepos, site_id: siteId })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la création de la table de repos');
        }

        const result = await response.text();
        console.log('Résultat de la création de la table de repos :', result);
        alert('Table de repos créée avec succès');
        loadReposTables(); // Recharger les tables de repos après la création
    } catch (error) {
        console.error('Erreur lors de la création de la table de repos :', error);
    }
}

async function loadReposTables() {
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    const siteId = sessionStorage.getItem('selectedSite'); // Récupérer le site_id depuis le sessionStorage

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        return;
    }

    try {
        const response = await fetch(`/api/get-repos?site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Erreur lors de la récupération des repos : ${error}`);
        }

        const repos = await response.json();
        console.log('Repos récupérés :', repos);

        const tableBody = document.querySelector('#joursrepos tbody');
        tableBody.innerHTML = ''; // Vider le tableau avant d'ajouter les nouveaux repos

        repos.forEach(reposItem => {
            const row = document.createElement('tr');

            const nameCell = document.createElement('td');
            nameCell.textContent = reposItem.repos;
            row.appendChild(nameCell);

            const actionCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Supprimer';
            deleteButton.addEventListener('click', () => deleteRepos(reposItem.repos_id));
            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des repos :', error);
    }
}

// Fonction pour supprimer un repos
async function deleteRepos(reposId) {
    const token = localStorage.getItem('token');
    const siteId = sessionStorage.getItem('selectedSite');

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        return;
    }

    try {
        const response = await fetch('/api/delete-repos-table', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ repos_id: reposId, site_id: siteId })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression du repos');
        }

        const result = await response.text();
        console.log('Résultat de la suppression du repos :', result);
        alert('Repos supprimé avec succès');
        loadReposTables(); // Recharger les tables de repos après la suppression
    } catch (error) {
        console.error('Erreur lors de la suppression du repos :', error);
    }
}

// Charger les tables de repos lorsque la page est chargée
document.addEventListener('DOMContentLoaded', loadReposTables);

document.getElementById('ajouterjoursrepos').addEventListener('click', () => {
    const nomRepos = prompt('Entrez le nom du jour de repos :');
    if (nomRepos) {
        createReposTable(nomRepos); // Appelle la fonction pour créer un jour de repos
    }
});