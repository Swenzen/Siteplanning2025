let draggedRow = null;
let startIndex = null;

function handleDragStart(event) {
    draggedRow = event.target.closest('tr');
    startIndex = Array.from(draggedRow.parentNode.children).indexOf(draggedRow);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', event.target.innerHTML);
}

function handleDragOver(event) {
    if (event.preventDefault) {
        event.preventDefault(); // Nécessaire pour permettre le drop
    }
    event.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(event) {
    if (event.stopPropagation) {
        event.stopPropagation(); // Empêcher certains navigateurs de rediriger
    }

    const targetRow = event.target.closest('tr');
    if (draggedRow !== targetRow) {
        const endIndex = Array.from(targetRow.parentNode.children).indexOf(targetRow);
        if (startIndex < endIndex) {
            targetRow.parentNode.insertBefore(draggedRow, targetRow.nextSibling);
        } else {
            targetRow.parentNode.insertBefore(draggedRow, targetRow);
        }

        // Échanger les display_order des deux compétences
        exchangeCompetenceOrder(draggedRow, targetRow);
    }

    return false;
}

async function exchangeCompetenceOrder(row1, row2) {
    const competenceCell1 = row1.querySelector("td[data-competence-id]");
    const competenceCell2 = row2.querySelector("td[data-competence-id]");

    if (competenceCell1 && competenceCell2) {
        const competenceId1 = competenceCell1.dataset.competenceId;
        const competenceId2 = competenceCell2.dataset.competenceId;
        const displayOrder1 = competenceCell1.dataset.displayOrder;
        const displayOrder2 = competenceCell2.dataset.displayOrder;

        const order = [
            { competenceId: competenceId1, displayOrder: displayOrder2 },
            { competenceId: competenceId2, displayOrder: displayOrder1 }
        ];

        try {
            const response = await fetch('/api/update-competence-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(order)
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la mise à jour de l\'ordre des compétences');
            }

            const result = await response.text();
            console.log('Résultat de la mise à jour de l\'ordre des compétences :', result);

            // Recharger les données pour refléter le nouvel ordre
            fetchPlanningData();
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'ordre des compétences :', error);
        }
    }
}