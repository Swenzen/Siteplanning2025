// Fonction pour récupérer les noms disponibles pour une compétence donnée dans le tooltip
async function fetchNomIds(competenceId, event) {
    const semaine = document.getElementById("weekNumber").value;
    const annee = document.getElementById("yearNumber").value;
    const jour_id = currentDay; // Utiliser l'ID du jour

    try {
        const response = await fetch(`/api/nom-ids?competence_id=${competenceId}&semaine=${semaine}&annee=${annee}&jour_id=${jour_id}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des noms');
        }
        const data = await response.json();
        console.log('Noms récupérés :', data);
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