// Inclure la fonction showEmptyTooltip depuis clicdroit.js
// Assurez-vous que clicdroit.js est inclus avant afficherplanning.js dans planning.html

const tooltip = document.getElementById("tooltip");
let currentCell = null;
let currentDay = null;
let currentHorairesNom = null;
let currentCompetenceId = null;

const dayMapping = {
    '1': 'lundi',
    '2': 'mardi',
    '3': 'mercredi',
    '4': 'jeudi',
    '5': 'vendredi',
    '6': 'samedi',
    '7': 'dimanche'
};


// Fonction pour récupérer les données du planning
async function fetchPlanningData() {
    const semaine = document.getElementById("weekNumber").value;
    const annee = document.getElementById("yearNumber").value;

    try {
        const [planningResponse, commentsResponse] = await Promise.all([
            fetch(`/api/planning-data?semaine=${semaine}&annee=${annee}`),
            fetch(`/api/comments?semaine=${semaine}&annee=${annee}`)
        ]);

        if (!planningResponse.ok) {
            throw new Error('Erreur lors de la récupération des données du planning');
        }
        if (!commentsResponse.ok) {
            throw new Error('Erreur lors de la récupération des commentaires');
        }

        const planningData = await planningResponse.json();
        const commentsData = await commentsResponse.json();

        console.log('Données du planning récupérées :', planningData);
        console.log('Commentaires récupérés :', commentsData);

        const tableBody = document.querySelector("#planningTable tbody");
        tableBody.innerHTML = ''; // Vider le contenu du tableau

        // Regrouper les données par compétence et horaire
        const groupedData = planningData.reduce((acc, row) => {
            const key = `${row.competence}-${row.horaire_debut}-${row.horaire_fin}`;
            if (!acc[key]) {
                acc[key] = { ...row, jours: {} };
            }
            if (row.jour_id) {
                if (!acc[key].jours[row.jour_id]) {
                    acc[key].jours[row.jour_id] = [];
                }
                acc[key].jours[row.jour_id].push({ nom: row.nom, nom_id: row.nom_id });
            }
            return acc;
        }, {});

        // Ajouter les commentaires aux données regroupées
        commentsData.forEach(comment => {
            const key = `${comment.competence}-${comment.horaire_debut}-${comment.horaire_fin}`;
            if (!groupedData[key]) {
                groupedData[key] = { competence: comment.competence, horaire_debut: comment.horaire_debut, horaire_fin: comment.horaire_fin, jours: {} };
            }
            if (!groupedData[key].jours[comment.jour_id]) {
                groupedData[key].jours[comment.jour_id] = [];
            }
            groupedData[key].jours[comment.jour_id].push({ nom: comment.nom, nom_id: comment.nom_id, commentaire: comment.commentaire });
        });

        // Trier les données regroupées par display_order, heure de début et heure de fin
        const sortedData = Object.values(groupedData).sort((a, b) => {
            if (a.display_order < b.display_order) return -1;
            if (a.display_order > b.display_order) return 1;
            if (a.horaire_debut < b.horaire_debut) return -1;
            if (a.horaire_debut > b.horaire_debut) return 1;
            if (a.horaire_fin < b.horaire_fin) return -1;
            if (a.horaire_fin > b.horaire_fin) return 1;
            return 0;
        });

        // Ajouter les données triées au tableau
        sortedData.forEach((rowData) => {
            console.log('Ajout de la ligne :', rowData);
            const row = document.createElement("tr");
            row.setAttribute('draggable', true); // Rendre la ligne draggable
            row.addEventListener('dragstart', handleDragStart);
            row.addEventListener('dragover', handleDragOver);
            row.addEventListener('drop', handleDrop);

            const modalitiesCell = document.createElement("td");
            modalitiesCell.textContent = rowData.competence;
            modalitiesCell.dataset.competenceId = rowData.competence_id; // Ajouter l'ID de la compétence
            modalitiesCell.dataset.displayOrder = rowData.display_order; // Utiliser l'ordre d'affichage depuis les données
            console.log(`Compétence ID: ${rowData.competence_id}, Display Order: ${rowData.display_order}`); // Ajouter un log pour vérifier les valeurs
            row.appendChild(modalitiesCell);

            const horairesCell = document.createElement("td");
            horairesCell.textContent = `${rowData.horaire_debut} - ${rowData.horaire_fin}`;
            row.appendChild(horairesCell);

            const days = ['1', '2', '3', '4', '5', '6', '7']; // Utiliser les IDs des jours
            days.forEach(day => {
                const cell = document.createElement("td");
                if (rowData.jours[day]) {
                    rowData.jours[day].forEach(({ nom, nom_id, commentaire }) => {
                        const div = document.createElement('div');
                        div.textContent = nom;

                        // Ajouter les commentaires correspondants
                        if (commentaire) {
                            const commentDiv = document.createElement('div');
                            commentDiv.textContent = commentaire;
                            commentDiv.style.fontStyle = 'italic'; // Optionnel : pour différencier visuellement le commentaire
                            cell.appendChild(commentDiv);
                        }

                        cell.appendChild(div);

                        div.addEventListener('contextmenu', (event) => {
                            event.preventDefault(); // Empêcher le menu contextuel par défaut
                            console.log(`Clic droit sur le nom : ${nom}`);
                            currentCell = cell; // Stocker la cellule actuelle
                            currentDay = day;
                            currentHorairesNom = `${rowData.horaire_debut} - ${rowData.horaire_fin}`;
                            currentCompetenceId = rowData.competence_id;
                            showEmptyTooltip(event, nom);
                        });
                    });
                }

                // Gestionnaire de clic gauche pour afficher le tooltip
                cell.addEventListener('click', (event) => {
                    console.log(`Cellule cliquée : ${day}, ${rowData.competence_id}`);
                    currentCell = cell; // Stocker la cellule actuelle
                    currentDay = day;
                    currentHorairesNom = `${rowData.horaire_debut} - ${rowData.horaire_fin}`;
                    currentCompetenceId = rowData.competence_id;
                    fetchNomIds(rowData.competence_id, event);
                });

                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });

        // Appeler la fonction pour créer le tableau supplémentaire
        createAdditionalTable();

    } catch (error) {
        console.error('Erreur lors de la récupération des données du planning :', error);
    }
}

// Fonction pour supprimer la valeur dans le tableau tplanning
async function removeValueFromPlanning(nom) {
    console.log('Appel de la fonction removeValueFromPlanning');
    const semaine = document.getElementById("weekNumber").value;
    const annee = document.getElementById("yearNumber").value;
    const jour_id = currentDay; // Utiliser l'ID du jour
    const [horaire_debut, horaire_fin] = currentHorairesNom.split(' - '); // Séparer les horaires de début et de fin

    console.log('Données envoyées pour la suppression du planning :', { semaine, annee, jour_id, horaire_debut, horaire_fin, currentCompetenceId, nom });

    try {
        const response = await fetch('/api/remove-planning', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ semaine, annee, jour_id, horaire_debut, horaire_fin, competence_id: currentCompetenceId, nom })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression du planning');
        }

        const result = await response.text();
        console.log('Résultat de la suppression du planning :', result);

        // Mettre à jour l'interface utilisateur
        const divs = currentCell.querySelectorAll('div');
        divs.forEach(div => {
            if (div.textContent === nom) {
                currentCell.removeChild(div);
            }
        });

        // Actualiser le tableau après la suppression
        fetchPlanningData();
    } catch (error) {
        console.error('Erreur lors de la suppression du planning :', error);
    }
}

// Fonction pour ajouter un commentaire dans le planning
async function addCommentToPlanning(nom, commentaire) {
    console.log('Appel de la fonction addCommentToPlanning');
    const semaine = document.getElementById("weekNumber").value;
    const annee = document.getElementById("yearNumber").value;
    const jour_id = currentDay; // Utiliser l'ID du jour

    console.log('Données envoyées pour l\'ajout du commentaire :', { semaine, annee, jour_id, nom, commentaire });

    try {
        const response = await fetch('/api/add-comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ semaine, annee, jour_id, nom, commentaire })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'ajout du commentaire');
        }

        const result = await response.text();
        console.log('Résultat de l\'ajout du commentaire :', result);

        // Ajouter le commentaire au-dessus du nom dans la cellule
        const divs = currentCell.querySelectorAll('div');
        divs.forEach(div => {
            if (div.textContent === nom) {
                const commentDiv = document.createElement('div');
                commentDiv.textContent = commentaire;
                commentDiv.style.fontStyle = 'italic'; // Optionnel : pour différencier visuellement le commentaire
                currentCell.insertBefore(commentDiv, div);
            }
        });

    } catch (error) {
        console.error('Erreur lors de l\'ajout du commentaire :', error);
    }
}