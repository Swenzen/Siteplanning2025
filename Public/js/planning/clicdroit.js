// Fonction pour afficher un tooltip avec des options de suppression et d'ajout de commentaire lors d'un clic droit
function showEmptyTooltip(event, nom) {
    const emptyTooltip = document.createElement('div');
    emptyTooltip.id = 'emptyTooltip';
    emptyTooltip.innerHTML = `
        <div class="tooltip-item">
            <div class="tooltip-date">${nom}</div>
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
}