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
                acc[key].jours[row.jour_id] = row.nom;
            }
            return acc;
        }, {});

        // Ajouter les données regroupées au tableau
        Object.values(groupedData).forEach(rowData => {
            console.log('Ajout de la ligne :', rowData);
            const row = document.createElement("tr");
            row.setAttribute('draggable', true); // Rendre la ligne draggable
            row.addEventListener('dragstart', handleDragStart);
            row.addEventListener('dragover', handleDragOver);
            row.addEventListener('drop', handleDrop);

            const modalitiesCell = document.createElement("td");
            modalitiesCell.textContent = rowData.competence;
            modalitiesCell.dataset.competenceId = rowData.competence_id; // Ajouter l'ID de la compétence
            modalitiesCell.dataset.displayOrder = rowData.display_order; // Ajouter l'ordre d'affichage
            row.appendChild(modalitiesCell);

            const horairesCell = document.createElement("td");
            horairesCell.textContent = `${rowData.horaire_debut} - ${rowData.horaire_fin}`;
            row.appendChild(horairesCell);

            const days = ['1', '2', '3', '4', '5', '6', '7']; // Utiliser les IDs des jours
            days.forEach(day => {
                const cell = document.createElement("td");
                cell.textContent = rowData.jours[day] || ''; // Afficher le nom pour chaque jour
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
    } catch (error) {
        console.error('Erreur lors de la récupération des données du planning :', error);
    }
}