// Fonction pour récupérer les nom_id disponibles pour les vacances
async function fetchNomIdsVacances(event) {
    const semaine = document.getElementById("weekNumber").value;
    const annee = document.getElementById("yearNumber").value;

    try {
        const response = await fetch(`/api/nom-ids-vacances?semaine=${semaine}&annee=${annee}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des nom_id');
        }
        const data = await response.json();
        console.log('Nom_id récupérés :', data);
        showTooltipVacances(event, data);
    } catch (error) {
        console.error('Erreur lors de la récupération des nom_id :', error);
    }
}

// Fonction pour afficher le tooltip avec les nom_id pour les vacances
function showTooltipVacances(event, nomIds) {
    const tooltip = document.getElementById("tooltip");
    tooltip.innerHTML = nomIds.map(nomId => `<div class="tooltip-date">${nomId}</div>`).join('');
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.pageX + 10}px`; // Slight offset for better visibility
    tooltip.style.top = `${event.pageY + 10}px`; // Slight offset for better visibility

    // Ajouter un gestionnaire de clics aux éléments de nom_id dans le tooltip
    document.querySelectorAll('.tooltip-date').forEach(element => {
        element.addEventListener('click', function() {
            currentCell.textContent = this.textContent; // Remplacer le contenu de la cellule
            const semaine = document.getElementById("weekNumber").value;
            const annee = document.getElementById("yearNumber").value;
            const nom_id = this.textContent;
            addVacances(semaine, annee, nom_id);
            tooltip.style.display = 'none'; // Fermer le tooltip
        });
    });
}

// Fonction pour ajouter les données dans la table Tvacances
async function addVacances(semaine, annee, nom) {
    console.log('Données envoyées pour l\'ajout dans Tvacances :', { semaine, annee, nom });
    try {
        const response = await fetch('/api/add-vacances', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ semaine, annee, nom })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'ajout dans Tvacances');
        }

        const result = await response.text();
        console.log('Résultat de l\'ajout dans Tvacances :', result);

        // Mettre à jour la cellule avec le nom ajouté
        fetchVacancesData();
    } catch (error) {
        console.error('Erreur lors de l\'ajout dans Tvacances :', error);
    }
}

// Fonction pour supprimer les données dans la table Tvacances
async function removeVacances(semaine, annee, nom) {
    console.log('Données envoyées pour la suppression dans Tvacances :', { semaine, annee, nom });
    try {
        const response = await fetch('/api/remove-vacances', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ semaine, annee, nom })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression dans Tvacances');
        }

        const result = await response.text();
        console.log('Résultat de la suppression dans Tvacances :', result);

        // Mettre à jour la cellule après la suppression
        fetchVacancesData();
    } catch (error) {
        console.error('Erreur lors de la suppression dans Tvacances :', error);
    }
}

// Fonction pour récupérer et afficher les données de vacances
async function fetchVacancesData() {
    const semaine = document.getElementById("weekNumber").value;
    const annee = document.getElementById("yearNumber").value;

    try {
        const response = await fetch(`/api/vacances-data?semaine=${semaine}&annee=${annee}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données de vacances');
        }
        const data = await response.json();
        console.log('Données de vacances récupérées :', data);

        // Sélectionner la cellule de vacances
        const vacancesCell = document.querySelector("#additionalTableContainer td");
        if (vacancesCell) {
            vacancesCell.innerHTML = ''; // Vider le contenu de la cellule avant d'ajouter les noms
            data.forEach(vacance => {
                const div = document.createElement('div');
                div.textContent = vacance.nom;
                div.addEventListener('contextmenu', (event) => {
                    event.preventDefault(); // Empêcher le menu contextuel par défaut
                    removeVacances(semaine, annee, vacance.nom);
                });
                vacancesCell.appendChild(div);
            });
        } else {
            console.error('Élément #additionalTableContainer td non trouvé');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données de vacances :', error);
    }
}