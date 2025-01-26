// Fonction pour créer une table de repos
async function createReposTable(nomRepos) {
    try {
        const response = await fetch('/api/create-repos-table', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nomRepos })
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
        alert('Erreur lors de la création de la table de repos');
    }
}

// Fonction pour charger les tables de repos
async function loadReposTables() {
    try {
        const response = await fetch('/api/get-repos-tables');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des tables de repos');
        }

        const tables = await response.json();
        console.log('Tables récupérées :', tables); // Journal de débogage

        const tbody = document.querySelector('#joursrepos tbody');
        tbody.innerHTML = ''; // Vider le contenu du tableau avant d'ajouter les nouvelles lignes

        tables.forEach(table => {
            if (table) { // Vérifier que table n'est pas null ou undefined
                console.log('Table trouvée :', table); // Journal de débogage
                const row = document.createElement('tr');
                const cellAbsence = document.createElement('td');
                cellAbsence.textContent = table.replace(/^Tjrepos_/i, '').toUpperCase(); // Afficher le nom sans le préfixe et en majuscules
                row.appendChild(cellAbsence);

                const cellActions = document.createElement('td');
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Supprimer';
                deleteButton.addEventListener('click', () => {
                    deleteReposTable(table);
                });
                cellActions.appendChild(deleteButton);
                row.appendChild(cellActions);

                tbody.appendChild(row);
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des tables de repos :', error);
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