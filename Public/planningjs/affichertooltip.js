// Fonction pour récupérer les noms disponibles pour une compétence donnée dans le tooltip
async function fetchNomIds(competenceId, event) {
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
            const errorText = await response.text();
            throw new Error(`Erreur lors de la récupération des noms : ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Noms récupérés :', data);

        // Appeler showTooltip pour afficher les noms dans le tooltip
        showTooltip(event, data);
    } catch (error) {
        console.error('Erreur lors de la récupération des noms :', error);
        alert('Une erreur est survenue lors de la récupération des noms.');
    }
}

async function fetchNomDetails(competenceId, siteId, semaine, annee, noms) {
    try {
        const response = await fetch(`/api/nom-details`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ competence_id: competenceId, site_id: siteId, semaine, annee, noms })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de la récupération des détails des noms : ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Détails des noms récupérés :', data);
        return data; // Retourne les détails des noms
    } catch (error) {
        console.error('Erreur lors de la récupération des détails des noms :', error);
        return {};
    }
}

function formatTime(time) {
    // Convertir le format "08:30:00" en "08h30"
    const [hours, minutes] = time.split(':');
    return `${hours}h${minutes}`;
}

function adjustTooltipPosition(tooltip, event) {
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = event.pageX - tooltip.offsetWidth / 2;
    let top = event.pageY + 15;

    // Ajuster si le tooltip dépasse à droite
    if (left + tooltipRect.width > viewportWidth) {
        left = viewportWidth - tooltipRect.width - 10; // Décalage de 10px pour éviter le bord
    }

    // Ajuster si le tooltip dépasse à gauche
    if (left < 0) {
        left = 10; // Décalage de 10px pour éviter le bord
    }

    // Ajuster si le tooltip dépasse en bas
    if (top + tooltipRect.height > viewportHeight) {
        top = viewportHeight - tooltipRect.height - 10; // Décalage de 10px pour éviter le bord
    }

    // Ajuster si le tooltip dépasse en haut
    if (top < 0) {
        top = 10; // Décalage de 10px pour éviter le bord
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}


// Fonction pour afficher le tooltip vide et charger les noms disponibles
function showEmptyTooltip(event, nom, nom_id, day, semaine, annee, competenceId, horaireDebut, horaireFin) {
    const tooltip = document.getElementById("tooltip");
    tooltip.innerHTML = `
        <div style="position: relative; padding-bottom: 10px; margin-bottom: 8px; border-bottom: 1px solid #eee; text-align: right;">
            <div class="tooltip-close" style="position: static; cursor: pointer; display: inline-block; width: 20px; height: 20px; text-align: center; line-height: 20px; font-size: 18px; font-weight: bold;">&times;</div>
        </div>
        <p>Chargement des noms disponibles...</p>
    `;
    
    tooltip.style.display = 'block';
    tooltip.style.width = '200px'; // Largeur fixe pour une meilleure présentation
    tooltip.style.padding = '10px';
    
    // Positionner le tooltip
    tooltip.style.left = `${event.pageX - tooltip.offsetWidth + 25}px`;
    tooltip.style.top = `${event.pageY - 15}px`;
    
    // Ajouter un gestionnaire de clics pour fermer le tooltip avec la croix
    tooltip.querySelector('.tooltip-close').addEventListener('click', function (e) {
        tooltip.style.display = 'none';
        e.stopPropagation(); // Empêcher la propagation du clic
    });
    
    // Ajouter également un gestionnaire de clic sur le document
    document.addEventListener('click', function closeTooltip(e) {
        // Si le clic est sur la croix ou à l'intérieur du tooltip, ne pas fermer
        if (e.target.closest('.tooltip-close') || (e.target !== tooltip && tooltip.contains(e.target))) return;
        
        tooltip.style.display = 'none';
        document.removeEventListener('click', closeTooltip);
    }, { once: true });

    // Appeler fetchNomIds pour récupérer les noms disponibles
    fetchNomIds(competenceId, event);
}

// Fonction pour mettre à jour le planning dans la base de données
async function updatePlanning(semaine, annee, jour_id, horaire_debut, horaire_fin, competenceId, nom) {
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

    console.log('Données envoyées pour la mise à jour du planning :', { semaine, annee, jour_id, horaire_debut, horaire_fin, competenceId, nom, siteId });

    try {
        const response = await fetch('/api/update-planning', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, // Ajouter le token dans l'en-tête
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ semaine, annee, jour_id, horaire_debut, horaire_fin, competence_id: competenceId, nom, site_id: siteId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de la mise à jour du planning : ${response.status} - ${errorText}`);
        }

        const result = await response.text();
        console.log('Résultat de la mise à jour du planning :', result);

        // Actualiser le tableau après l'ajout
        fetchPlanningData();
    } catch (error) {
        console.error('Erreur lors de la mise à jour du planning :', error);
        alert('Une erreur est survenue lors de la mise à jour du planning.');
    }
}





// deuxième tooltip   



