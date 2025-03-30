// Fonction pour récupérer les noms disponibles pour les vacances
async function fetchNomIdsVacances(event) {
    const semaine = document.getElementById("weekNumber").value;
    const annee = document.getElementById("yearNumber").value;
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    const siteId = localStorage.getItem('site_id'); // Récupérer le site_id depuis le localStorage

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        return;
    }

    try {
        const response = await fetch(`/api/nom-ids-vacances?semaine=${semaine}&annee=${annee}&site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Ajouter le token dans l'en-tête
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des noms disponibles pour les vacances');
        }

        const data = await response.json();
        console.log('Noms disponibles récupérés :', data);

        // Afficher le tooltip avec les noms récupérés
        showTooltipVacances(event, data);
    } catch (error) {
        console.error('Erreur lors de la récupération des noms disponibles pour les vacances :', error);
    }
}

// Fonction pour afficher le tooltip avec les noms disponibles
function showTooltipVacances(event, noms) {
    const tooltip = document.getElementById("tooltip");
    tooltip.innerHTML = noms.map(nom => `<div class="tooltip-date">${nom}</div>`).join('');
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.pageX + 10}px`; // Décalage pour une meilleure visibilité
    tooltip.style.top = `${event.pageY + 10}px`; // Décalage pour une meilleure visibilité

    // Ajouter un gestionnaire de clics aux éléments de nom dans le tooltip
    document.querySelectorAll('.tooltip-date').forEach(element => {
        element.addEventListener('click', function () {
            const nom = this.textContent;
            const semaine = document.getElementById("weekNumber").value;
            const annee = document.getElementById("yearNumber").value;
            addVacances(semaine, annee, nom); // Ajouter le nom aux vacances
            tooltip.style.display = 'none'; // Fermer le tooltip
        });
    });
}

// Fonction pour ajouter un nom aux vacances
async function addVacances(semaine, annee, nom) {
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    const siteId = localStorage.getItem('site_id'); // Récupérer le site_id depuis le localStorage

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        return;
    }

    console.log('Données envoyées pour l\'ajout dans Tvacances :', { semaine, annee, nom, siteId });

    try {
        const response = await fetch('/api/add-vacances', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, // Ajouter le token dans l'en-tête
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ semaine, annee, nom, site_id: siteId })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'ajout dans Tvacances');
        }

        const result = await response.text();
        console.log('Résultat de l\'ajout dans Tvacances :', result);

        // Mettre à jour les données de vacances après l'ajout
        fetchVacancesData();
    } catch (error) {
        console.error('Erreur lors de l\'ajout dans Tvacances :', error);
    }
}

// Fonction pour supprimer un nom des vacances
async function removeVacances(semaine, annee, nom) {
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    const siteId = localStorage.getItem('site_id'); // Récupérer le site_id depuis le localStorage

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        return;
    }

    console.log('Données envoyées pour la suppression dans Tvacances :', { semaine, annee, nom, siteId });

    try {
        const response = await fetch('/api/remove-vacances', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, // Ajouter le token dans l'en-tête
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ semaine, annee, nom, site_id: siteId })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression dans Tvacances');
        }

        const result = await response.text();
        console.log('Résultat de la suppression dans Tvacances :', result);

        // Mettre à jour les données de vacances après la suppression
        fetchVacancesData();
    } catch (error) {
        console.error('Erreur lors de la suppression dans Tvacances :', error);
    }
}

// Fonction pour récupérer et afficher les données de vacances
async function fetchVacancesData() {
    const semaine = document.getElementById("weekNumber").value;
    const annee = document.getElementById("yearNumber").value;
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    const siteId = localStorage.getItem('site_id'); // Récupérer le site_id depuis le localStorage

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        return;
    }

    try {
        const response = await fetch(`/api/vacances-data?semaine=${semaine}&annee=${annee}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Ajouter le token dans l'en-tête
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données de vacances');
        }

        const data = await response.json();
        console.log('Données de vacances récupérées :', data);

        // Afficher les données dans la cellule correspondante
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