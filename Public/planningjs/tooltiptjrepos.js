// Fonction pour récupérer les nom_id disponibles pour les repos
async function fetchNomIdsRepos(event, tableName, jourId) {
    const semaine = document.getElementById("weekNumber").value;
    const annee = document.getElementById("yearNumber").value;
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    const siteId = sessionStorage.getItem('selectedSite'); // Récupérer le site_id depuis le sessionStorage

    if (!token) {
        console.error('Erreur : aucun token trouvé.');
        return;
    }

    if (!siteId) {
        console.error('Erreur : aucun site_id trouvé dans le sessionStorage.');
        return;
    }

    console.log('Données envoyées pour fetchNomIdsRepos :', { semaine, annee, jourId, siteId });

    try {
        const response = await fetch(`/api/nom-ids-repos?semaine=${semaine}&annee=${annee}&jourId=${jourId}&site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Ajouter le token dans l'en-tête
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de la récupération des nom_id : ${response.status} - ${errorText}`);
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
    tooltip.style.left = `${event.pageX + 10}px`; // Décalage pour une meilleure visibilité
    tooltip.style.top = `${event.pageY + 10}px`; // Décalage pour une meilleure visibilité

    // Ajouter un gestionnaire de clics aux éléments de nom_id dans le tooltip
    document.querySelectorAll('.tooltip-date').forEach(element => {
        element.addEventListener('click', function () {
            const nomId = this.getAttribute('data-nom-id');
            const nom = this.textContent;

            // Vérifiez que tableName est valide avant d'appeler addReposData
            if (!tableName || typeof tableName !== 'string' || tableName.trim() === '' || !isNaN(tableName)) {
                console.error('Erreur : tableName est invalide.', tableName);
                return;
            }

            console.log(`Ajout du nom "${nom}" avec nom_id=${nomId} dans la table ${tableName}`);
            addReposData(tableName, document.getElementById("weekNumber").value, document.getElementById("yearNumber").value, jourId, nomId);
            tooltip.style.display = 'none'; // Fermer le tooltip
        });
    });
}

// Fonction pour ajouter les données dans la table Tjrepos_*
async function addReposData(tableName, semaine, annee, jourId, nomId) {
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    const siteId = sessionStorage.getItem('selectedSite'); // Récupérer le site_id depuis le sessionStorage

    if (!token) {
        console.error('Erreur : aucun token trouvé.');
        return;
    }

    if (!siteId) {
        console.error('Erreur : aucun site_id trouvé dans le sessionStorage.');
        return;
    }

    console.log('Données envoyées pour l\'ajout dans', tableName, ':', { semaine, annee, jourId, nomId, siteId });

    try {
        const response = await fetch('/api/add-repos-data', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, // Ajouter le token dans l'en-tête
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tableName, semaine, annee, jourId, nomId, site_id: siteId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de l'ajout dans ${tableName} : ${response.status} - ${errorText}`);
        }

        const result = await response.text();
        console.log('Résultat de l\'ajout dans', tableName, ':', result);

        // Réactualiser le tableau après l'ajout
        createAdditionalTable();
    } catch (error) {
        console.error('Erreur lors de l\'ajout dans', tableName, ':', error);
    }
}