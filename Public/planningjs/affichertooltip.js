// Fonction pour récupérer les noms disponibles pour une compétence donnée dans le tooltip
async function fetchNomIds(competenceId, siteId, event) {
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage

    if (!token) {
        console.error('Erreur : aucun token trouvé.');
        return;
    }

    const semaine = document.getElementById("weekNumber").value;
    const annee = document.getElementById("yearNumber").value;
    const jour_id = currentDay;

    console.log('Données envoyées pour fetchNomIds :', { competenceId, siteId, semaine, annee, jour_id });

    try {
        const response = await fetch(`/api/nom-ids?competence_id=${competenceId}&site_id=${siteId}&semaine=${semaine}&annee=${annee}&jour_id=${jour_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Ajouter le token dans l'en-tête
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération des noms : ${response.status}`);
        }

        const data = await response.json();
        console.log('Noms récupérés :', data);

        // Appeler showTooltip pour afficher les noms dans le tooltip
        showTooltip(event, data);
    } catch (error) {
        console.error('Erreur lors de la récupération des noms :', error);
    }
}

// Fonction pour afficher le tooltip avec les noms
function showTooltip(event, noms) {
    const tooltip = document.getElementById("tooltip");
    tooltip.innerHTML = noms.map(nom => `<div class="tooltip-date">${nom}</div>`).join('');
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.pageX + 10}px`; // Slight offset for better visibility
    tooltip.style.top = `${event.pageY + 10}px`; // Slight offset for better visibility

    // Ajouter un gestionnaire de clics aux éléments de date dans le tooltip
    document.querySelectorAll('.tooltip-date').forEach(element => {
        element.addEventListener('click', function() {
            const div = document.createElement('div');
            div.textContent = this.textContent;
            currentCell.appendChild(div); // Ajouter le nouveau nom dans la cellule
            const semaine = document.getElementById("weekNumber").value;
            const annee = document.getElementById("yearNumber").value;
            const jour_id = currentDay; // Utiliser l'ID du jour
            const [horaire_debut, horaire_fin] = currentHorairesNom.split(' - '); // Séparer les horaires de début et de fin
            updatePlanning(semaine, annee, jour_id, horaire_debut, horaire_fin, currentCompetenceId, this.textContent);
            tooltip.style.display = 'none'; // Fermer le tooltip
        });
    });
}

// Fonction pour afficher le tooltip vide et charger les noms disponibles
function showEmptyTooltip(event, nom, nom_id, day, semaine, annee, competenceId, horaireDebut, horaireFin) {
    const tooltip = document.getElementById("tooltip");
    tooltip.innerHTML = `<p>Chargement des noms disponibles...</p>`;
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.pageX + 10}px`; // Décalage pour une meilleure visibilité
    tooltip.style.top = `${event.pageY + 10}px`;

    // Récupérer le siteId depuis le localStorage
    const siteId = localStorage.getItem('site_id');

    // Appeler fetchNomIds pour récupérer les noms disponibles
    fetchNomIds(competenceId, siteId, event);
}

// Fonction pour mettre à jour le planning dans la base de données
async function updatePlanning(semaine, annee, jour_id, horaire_debut, horaire_fin, competenceId, nom) {
    console.log('Données envoyées pour la mise à jour du planning :', { semaine, annee, jour_id, horaire_debut, horaire_fin, competenceId, nom });
    try {
        const response = await fetch('/api/update-planning', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ semaine, annee, jour_id, horaire_debut, horaire_fin, competence_id: competenceId, nom })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour du planning');
        }

        const result = await response.text();
        console.log('Résultat de la mise à jour du planning :', result);

        // Actualiser le tableau après l'ajout
        fetchPlanningData();
    } catch (error) {
        console.error('Erreur lors de la mise à jour du planning :', error);
    }
}

// Cacher le tooltip lorsque l'utilisateur clique ailleurs
document.addEventListener('click', (event) => {
    const tooltip = document.getElementById("tooltip");
    if (!event.target.closest('td') && !event.target.closest('#tooltip')) {
        tooltip.style.display = 'none';
    }
});

console.log('Contenu du token décodé :', req.user);