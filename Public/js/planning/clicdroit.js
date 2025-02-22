// Fonction pour afficher un tooltip avec des options de suppression et d'ajout de commentaire lors d'un clic droit
function showEmptyTooltip(event, nom, nom_id, jour_id, semaine, annee, competence_id, horaire_debut, horaire_fin) {
    console.log(`Appel de showEmptyTooltip avec les paramètres : nom=${nom}, nom_id=${nom_id}, jour_id=${jour_id}, semaine=${semaine}, annee=${annee}, competence_id=${competence_id}, horaire_debut=${horaire_debut}, horaire_fin=${horaire_fin}`);
    
    // Récupérer les commentaires correspondants à partir de la base de données
    fetch(`/api/comment?nom_id=${nom_id}&jour_id=${jour_id}&semaine=${semaine}&annee=${annee}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des commentaires');
            }
            return response.json();
        })
        .then(data => {
            const commentaires = data.map(item => item.commentaire).join('<br>');
            console.log(`Commentaires récupérés pour nom_id=${nom_id}, jour_id=${jour_id}, semaine=${semaine}, annee=${annee} : ${commentaires}`);
            const emptyTooltip = document.createElement('div');
            emptyTooltip.id = 'emptyTooltip';
            emptyTooltip.innerHTML = `
                <div class="tooltip-item">
                    <div class="tooltip-date">${nom}</div>
                    <div class="tooltip-comment">${commentaires}</div>
                    <div class="tooltip-options">
                        <button class="tooltip-option" id="deleteButton">Supprimer</button>
                        <button class="tooltip-option" id="commentButton">Commentaire</button>
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

            // Ajouter un gestionnaire de clic au bouton de suppression
            document.getElementById('deleteButton').addEventListener('click', () => {
                removeValueFromPlanning(nom);
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