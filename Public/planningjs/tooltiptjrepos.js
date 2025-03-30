// Fonction pour récupérer les nom_id disponibles pour les repos
async function fetchNomIdsRepos(event, tableName, jourId) {
    const semaine = document.getElementById("weekNumber").value;
    const annee = document.getElementById("yearNumber").value;
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    const siteId = localStorage.getItem('site_id'); // Récupérer le site_id depuis le localStorage

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        return;
    }

    try {
        const response = await fetch(`/api/nom-ids-repos?semaine=${semaine}&annee=${annee}&jourId=${jourId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Ajouter le token dans l'en-tête
                'site-id': siteId, // Ajouter le site_id dans l'en-tête
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des nom_id');
        }

        const data = await response.json();
        console.log('Nom_id récupérés :', data);
        showTooltipRepos(event, data, tableName, jourId);
    } catch (error) {
        console.error('Erreur lors de la récupération des nom_id :', error);
    }
}

// Fonction pour afficher le tooltip avec les nom_id pour les repos
function showTooltipRepos(event, nomIds, tableName, jourId) {
    const tooltip = document.getElementById("tooltip");
    tooltip.innerHTML = nomIds.map(nom => `<div class="tooltip-date" data-nom-id="${nom.nom_id}">${nom.nom}</div>`).join('');
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.pageX + 10}px`; // Slight offset for better visibility
    tooltip.style.top = `${event.pageY + 10}px`; // Slight offset for better visibility

    // Ajouter un gestionnaire de clics aux éléments de nom_id dans le tooltip
    document.querySelectorAll('.tooltip-date').forEach(element => {
        element.addEventListener('click', function() {
            currentCell.textContent = this.textContent; // Remplacer le contenu de la cellule
            const semaine = document.getElementById("weekNumber").value;
            const annee = document.getElementById("yearNumber").value;
            const nom_id = this.getAttribute('data-nom-id');
            addReposData(tableName, semaine, annee, jourId, nom_id);
            tooltip.style.display = 'none'; // Fermer le tooltip
        });
    });
}

// Fonction pour ajouter les données dans la table Tjrepos_*
async function addReposData(tableName, semaine, annee, jourId, nomId) {
    console.log('Données envoyées pour l\'ajout dans', tableName, ':', { semaine, annee, jourId, nomId });
    try {
        const response = await fetch('/api/add-repos-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tableName, semaine, annee, jourId, nomId })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'ajout dans ' + tableName);
        }

        const result = await response.text();
        console.log('Résultat de l\'ajout dans', tableName, ':', result);

        // Réactualiser le tableau après l'ajout
        createAdditionalTable();
    } catch (error) {
        console.error('Erreur lors de l\'ajout dans', tableName, ':', error);
    }
}