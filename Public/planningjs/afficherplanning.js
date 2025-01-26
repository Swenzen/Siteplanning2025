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
        const response = await fetch(`/api/planning-data?semaine=${semaine}&annee=${annee}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données');
        }
        const data = await response.json();
        console.log('Données récupérées :', data);

        const tableBody = document.querySelector("#planningTable tbody");
        tableBody.innerHTML = ''; // Vider le contenu du tableau

        // Regrouper les données par compétence et horaire
        const groupedData = data.reduce((acc, row) => {
            const key = `${row.competence}-${row.horaire_debut}-${row.horaire_fin}`;
            if (!acc[key]) {
                acc[key] = { ...row, jours: {} };
            }
            if (row.jour_id) {
                if (!acc[key].jours[row.jour_id]) {
                    acc[key].jours[row.jour_id] = [];
                }
                acc[key].jours[row.jour_id].push(row.nom);
            }
            return acc;
        }, {});

        // Ajouter les données regroupées au tableau
        Object.values(groupedData).forEach((rowData, index) => {
            console.log('Ajout de la ligne :', rowData);
            const row = document.createElement("tr");
            row.setAttribute('draggable', true); // Rendre la ligne draggable
            row.addEventListener('dragstart', handleDragStart);
            row.addEventListener('dragover', handleDragOver);
            row.addEventListener('drop', handleDrop);

            const modalitiesCell = document.createElement("td");
            modalitiesCell.textContent = rowData.competence;
            modalitiesCell.dataset.competenceId = rowData.competence_id; // Ajouter l'ID de la compétence
            modalitiesCell.dataset.displayOrder = index; // Utiliser l'index comme ordre d'affichage
            console.log(`Compétence ID: ${rowData.competence_id}, Display Order: ${index}`); // Ajouter un log pour vérifier les valeurs
            row.appendChild(modalitiesCell);

            const horairesCell = document.createElement("td");
            horairesCell.textContent = `${rowData.horaire_debut} - ${rowData.horaire_fin}`;
            row.appendChild(horairesCell);

            const days = ['1', '2', '3', '4', '5', '6', '7']; // Utiliser les IDs des jours
            days.forEach(day => {
                const cell = document.createElement("td");
                if (rowData.jours[day]) {
                    rowData.jours[day].forEach(nom => {
                        const div = document.createElement('div');
                        div.textContent = nom;
                        div.addEventListener('contextmenu', (event) => {
                            event.preventDefault(); // Empêcher le menu contextuel par défaut
                            console.log(`Clic droit sur le nom : ${nom}`);
                            currentCell = cell; // Stocker la cellule actuelle
                            currentDay = day;
                            currentHorairesNom = `${rowData.horaire_debut} - ${rowData.horaire_fin}`;
                            currentCompetenceId = rowData.competence_id;
                            removeValueFromPlanning(nom);
                        });
                        cell.appendChild(div);
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
    } catch (error) {
        console.error('Erreur lors de la suppression du planning :', error);
    }
}