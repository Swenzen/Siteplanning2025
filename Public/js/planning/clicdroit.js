// Fonction pour afficher un tooltip avec des options de suppression et d'ajout de commentaire lors d'un clic droit
function showEmptyTooltipdt(event, nom, nom_id, jour_id, semaine, annee, competence_id, horaire_debut, horaire_fin) {
    console.log(`Appel de showEmptyTooltip avec les paramètres : nom=${nom}, nom_id=${nom_id}, jour_id=${jour_id}, semaine=${semaine}, annee=${annee}, competence_id=${competence_id}, horaire_debut=${horaire_debut}, horaire_fin=${horaire_fin}`);
    
    // Vérifie si nom_id est null
    if (!nom_id) {
        console.warn("Aucun nom_id trouvé pour cette cellule.");
    }

    // Récupérer les commentaires correspondants à partir de la base de données
    fetch(`/api/comment?nom_id=${nom_id}&jour_id=${jour_id}&semaine=${semaine}&annee=${annee}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des commentaires');
            }
            return response.json();
        })
        .then(data => {
            const commentaires = data.map(item => `
                <div class="comment-item">
                    <span class="comment-text">${item.commentaire}</span>
                    <button class="delete-comment-button" data-comment-id="${item.commentaire_id}">Supprimer</button>
                </div>
            `).join('');
            console.log(`Commentaires récupérés pour nom_id=${nom_id}, jour_id=${jour_id}, semaine=${semaine}, annee=${annee} : ${commentaires}`);
            const emptyTooltip = document.createElement('div');
            emptyTooltip.id = 'emptyTooltip';
            emptyTooltip.innerHTML = `
                <div class="tooltip-item">
                    <div class="tooltip-date">${nom || 'Aucun nom'}</div>
                    <div class="tooltip-comment">${commentaires}</div>
                    <div class="tooltip-options">
                        <button class="tooltip-option" id="deleteNameButton">Supprimer Nom</button>
                        <button class="tooltip-option" id="commentButton">Ajouter Commentaire</button>
                    </div>
                </div>
            `;
            emptyTooltip.style.position = 'absolute';
            emptyTooltip.style.left = `${event.pageX + 10}px`; // Décalage pour une meilleure visibilité
            emptyTooltip.style.top = `${event.pageY + 10}px`; // Décalage pour une meilleure visibilité
            emptyTooltip.style.backgroundColor = 'white';
            emptyTooltip.style.border = '1px solid black';
            emptyTooltip.style.padding = '10px';
            emptyTooltip.style.borderRadius = '5px';
            emptyTooltip.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
            document.body.appendChild(emptyTooltip);

            // Ajouter un gestionnaire de clic au bouton de suppression pour chaque commentaire
            document.querySelectorAll('.delete-comment-button').forEach(button => {
                button.addEventListener('click', () => {
                    const commentId = button.dataset.commentId;
                    deleteComment(commentId, () => {
                        // Fermer le tooltip après la suppression du commentaire
                        emptyTooltip.remove();
                    });
                });
            });

            // Ajouter un gestionnaire de clic au bouton de suppression du nom
            document.getElementById('deleteNameButton').addEventListener('click', () => {
                const site_id = localStorage.getItem('site_id'); // Récupérer le site_id depuis le localStorage
                removeValueFromPlanning(nom, jour_id, semaine, annee, competence_id, horaire_debut, horaire_fin, site_id); // Appeler la fonction depuis afficherplanning.js
                emptyTooltip.remove();
            });

            // Ajouter un gestionnaire de clic au bouton de commentaire
            document.getElementById('commentButton').addEventListener('click', () => {
                const commentaire = prompt('Entrez votre commentaire :');
                if (commentaire) {
                    addCommentToPlanning(nom, commentaire);
                }
                emptyTooltip.remove();
            });

            // Cacher le tooltip lorsque l'utilisateur clique ailleurs
            document.addEventListener('click', (event) => {
                if (!event.target.closest('#emptyTooltip')) {
                    emptyTooltip.remove();
                }
            }, { once: true });
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des commentaires :', error);
        });
}

// Fonction pour supprimer un commentaire
function deleteComment(commentId, callback) {
    fetch(`/api/delete-comment?comment_id=${commentId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la suppression du commentaire');
        }
        console.log(`Commentaire ${commentId} supprimé`);
        if (callback) callback();
        fetchPlanningData(); // Rafraîchir le tableau principal
    })
    .catch(error => {
        console.error('Erreur lors de la suppression du commentaire :', error);
    });
}
// Nouvelle fonction pour afficher un tooltip spécifique pour les cellules vides
function showTooltipForEmptyCell(event, jour_id, semaine, annee, competence_id, horaire_debut, horaire_fin) {
    console.log(`Appel de showTooltipForEmptyCell avec les paramètres : jour_id=${jour_id}, semaine=${semaine}, annee=${annee}, competence_id=${competence_id}, horaire_debut=${horaire_debut}, horaire_fin=${horaire_fin}`);
    
    const emptyTooltip = document.createElement('div');
    emptyTooltip.id = 'emptyTooltip';
    emptyTooltip.innerHTML = `
        <div class="tooltip-item">
            <div class="tooltip-options">
                <button class="tooltip-option" id="closeButton">FERMER</button>
            </div>
        </div>
    `;
    emptyTooltip.style.position = 'absolute';
    emptyTooltip.style.left = `${event.pageX + 10}px`; // Slight offset for better visibility
    emptyTooltip.style.top = `${event.pageY + 10}px`; // Slight offset for better visibility
    emptyTooltip.style.backgroundColor = 'white';
    emptyTooltip.style.border = '1px solid black';
    emptyTooltip.style.padding = '10px';
    emptyTooltip.style.borderRadius = '5px';
    emptyTooltip.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    document.body.appendChild(emptyTooltip);

    // Ajouter un gestionnaire de clic au bouton de fermeture
    document.getElementById('closeButton').addEventListener('click', async () => {
        try {
            const response = await fetch('/api/add-fermeture', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ jour_id, semaine, annee, competence_id, horaire_debut, horaire_fin })
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'ajout dans Tfermeture');
            }

            const result = await response.text();
            console.log('Résultat de l\'ajout dans Tfermeture :', result);

            // Fermer le tooltip après l'ajout
            emptyTooltip.remove();

            // Relancer la fonction fetchPlanningData pour recharger le tableau
            fetchPlanningData();
        } catch (error) {
            console.error('Erreur lors de l\'ajout dans Tfermeture :', error);
        }
    });

    // Cacher le tooltip lorsque l'utilisateur clique ailleurs
    document.addEventListener('click', (event) => {
        if (!event.target.closest('#emptyTooltip')) {
            emptyTooltip.remove();
        }
    }, { once: true });
}

// Fonction pour ajouter un nom au planning
function addNameToPlanning(nom, jour_id, semaine, annee, competence_id, horaire_debut, horaire_fin) {
    // Ajoutez ici la logique pour ajouter le nom au planning
    console.log(`Nom ${nom} ajouté au planning pour jour_id=${jour_id}, semaine=${semaine}, annee=${annee}, competence_id=${competence_id}, horaire_debut=${horaire_debut}, horaire_fin=${horaire_fin}`);
}

// Fonction pour ajouter un commentaire au planning
function addCommentToPlanning(nom, commentaire, jour_id, semaine, annee, competence_id, horaire_debut, horaire_fin) {
    // Ajoutez ici la logique pour ajouter le commentaire au planning
    console.log(`Commentaire ajouté au planning pour nom=${nom}, jour_id=${jour_id}, semaine=${semaine}, annee=${annee}, competence_id=${competence_id}, horaire_debut=${horaire_debut}, horaire_fin=${horaire_fin}`);
}
