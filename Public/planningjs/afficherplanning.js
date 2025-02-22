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
        const [planningResponse, commentsResponse, fermeturesResponse] = await Promise.all([
            fetch(`/api/planning-data?semaine=${semaine}&annee=${annee}`),
            fetch(`/api/comments?semaine=${semaine}&annee=${annee}`),
            fetch(`/api/fermetures?semaine=${semaine}&annee=${annee}`)
        ]);

        if (!planningResponse.ok) {
            throw new Error('Erreur lors de la récupération des données du planning');
        }
        if (!commentsResponse.ok) {
            throw new Error('Erreur lors de la récupération des commentaires');
        }
        if (!fermeturesResponse.ok) {
            throw new Error('Erreur lors de la récupération des fermetures');
        }

        const planningData = await planningResponse.json();
        const commentsData = await commentsResponse.json();
        const fermeturesData = await fermeturesResponse.json();

        console.log('Données du planning récupérées :', planningData);
        console.log('Commentaires récupérés :', commentsData);
        console.log('Fermetures récupérées :', fermeturesData);

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
                    const pairs = {};

                    // Créer des paires commentaire-nom regroupées par nom_id
                    rowData.jours[day].forEach(({ nom, nom_id, commentaire }) => {
                        if (!pairs[nom_id]) {
                            pairs[nom_id] = { nom: undefined, commentaire: undefined };
                        }
                        if (nom) {
                            pairs[nom_id].nom = nom;
                        }
                        if (commentaire) {
                            pairs[nom_id].commentaire = commentaire;
                        }
                    });

                    // Ajouter des logs pour vérifier les paires créées
                    console.log(`Paires créées pour le jour ${day}:`, pairs);

                    // Ajouter chaque paire dans un conteneur
                    Object.entries(pairs).forEach(([nom_id, { nom, commentaire }]) => {
                        const container = document.createElement('div');

                        if (commentaire) {
                            const commentDiv = document.createElement('div');
                            commentDiv.textContent = commentaire;
                            commentDiv.style.fontWeight = 'bold'; // Changer le style pour gras
                            console.log(`Commentaire créé: ${commentaire}`);
                            container.appendChild(commentDiv);
                        }

                        if (nom) {
                            const div = document.createElement('div');
                            div.textContent = nom;
                            div.dataset.nomId = nom_id; // Ajouter l'ID du nom comme attribut de données
                            div.dataset.jourId = day; // Ajouter l'ID du jour comme attribut de données
                            div.dataset.competenceId = rowData.competence_id; // Ajouter l'ID de la compétence comme attribut de données
                            div.dataset.horaireDebut = rowData.horaire_debut; // Ajouter l'horaire de début comme attribut de données
                            div.dataset.horaireFin = rowData.horaire_fin; // Ajouter l'horaire de fin comme attribut de données

                            console.log(`Nom créé: ${nom}, Nom ID: ${nom_id}, Jour ID: ${day}, Compétence ID: ${rowData.competence_id}, Horaire Début: ${rowData.horaire_debut}, Horaire Fin: ${rowData.horaire_fin}`);

                            container.appendChild(div);

                            div.addEventListener('contextmenu', (event) => {
                                event.preventDefault(); // Empêcher le menu contextuel par défaut
                                console.log(`Clic droit sur le nom : ${nom}`);
                                currentCell = cell; // Stocker la cellule actuelle
                                currentDay = day;
                                currentHorairesNom = `${rowData.horaire_debut} - ${rowData.horaire_fin}`;
                                currentCompetenceId = rowData.competence_id;
                                const nom_id = div.dataset.nomId; // Récupérer l'ID du nom
                                const jour_id = div.dataset.jourId; // Récupérer l'ID du jour
                                const competence_id = div.dataset.competenceId; // Récupérer l'ID de la compétence
                                const horaire_debut = div.dataset.horaireDebut; // Récupérer l'horaire de début
                                const horaire_fin = div.dataset.horaireFin; // Récupérer l'horaire de fin
                                console.log(`Nom ID récupéré: ${nom_id}`);
                                showEmptyTooltip(event, nom, nom_id, jour_id, semaine, annee, competence_id, horaire_debut, horaire_fin);
                            });
                        }

                        // Ajouter le conteneur à la cellule
                        cell.appendChild(container);
                    });

                    // Ajouter un log pour afficher le contenu de la cellule
                    console.log(`Contenu de la cellule pour le jour ${day}:`, cell.innerHTML);
                } else {
                    // Vérifier si la cellule doit être marquée comme "FERMEE"
                    const isFermeture = fermeturesData.some(fermeture => 
                        fermeture.jour_id == day &&
                        fermeture.semaine == semaine &&
                        fermeture.annee == annee &&
                        fermeture.competence_id == rowData.competence_id &&
                        fermeture.horaire_debut == rowData.horaire_debut &&
                        fermeture.horaire_fin == rowData.horaire_fin
                    );

                    if (isFermeture) {
                        cell.textContent = 'FERMEE';

                        // Ajouter un gestionnaire de clic droit pour supprimer la fermeture
                        cell.addEventListener('contextmenu', (event) => {
                            event.preventDefault(); // Empêcher le menu contextuel par défaut
                            console.log(`Clic droit sur FERMEE : ${day}`);
                            removeFermeture(day, semaine, annee, rowData.competence_id, rowData.horaire_debut, rowData.horaire_fin);
                        });
                    }
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

                // Gestionnaire de clic droit pour afficher le tooltip sur les cellules vides
                cell.addEventListener('contextmenu', (event) => {
                    event.preventDefault(); // Empêcher le menu contextuel par défaut
                    if (cell.innerHTML.trim() === '') {
                        console.log(`Clic droit sur une cellule vide : ${day}`);
                        currentCell = cell; // Stocker la cellule actuelle
                        currentDay = day;
                        currentHorairesNom = `${rowData.horaire_debut} - ${rowData.horaire_fin}`;
                        currentCompetenceId = rowData.competence_id;
                        showTooltipForEmptyCell(event, day, semaine, annee, rowData.competence_id, rowData.horaire_debut, rowData.horaire_fin);
                    }
                });

                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });

        // Calculer le nombre de cellules vides dans la colonne "lundi"
        const lundiCells = document.querySelectorAll("#planningTable tbody tr td:nth-child(3)"); // 3ème colonne pour "lundi"
        let emptyCellsCount = 0;
        lundiCells.forEach(cell => {
            if (cell.innerHTML.trim() === '') {
                emptyCellsCount++;
            }
        });
        console.log(`Pour le tableau fetchplanning : Le nombre de cellules vides dans la colonne lundi est de : ${emptyCellsCount}`);

        // Appeler la fonction pour créer le tableau supplémentaire
        createAdditionalTable();
        createCompetenceTable(semaine, annee);

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
            if (div.textContent === nom && div.parentNode === currentCell) {
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

        // Ajouter le commentaire avant le nom dans la cellule
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

// Fonction pour supprimer une fermeture
async function removeFermeture(jour_id, semaine, annee, competence_id, horaire_debut, horaire_fin) {
    try {
        const response = await fetch('/api/remove-fermeture', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ jour_id, semaine, annee, competence_id, horaire_debut, horaire_fin })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression dans Tfermeture');
        }

        const result = await response.text();
        console.log('Résultat de la suppression dans Tfermeture :', result);

        // Relancer la fonction fetchPlanningData pour recharger le tableau
        fetchPlanningData();
    } catch (error) {
        console.error('Erreur lors de la suppression dans Tfermeture :', error);
    }
}

// Fonction pour créer le tableau des compétences
async function createCompetenceTable(semaine, annee) {
    const competenceTableContainer = document.getElementById("competenceTableContainer");
    if (!competenceTableContainer) {
        console.error('Conteneur competenceTableContainer non trouvé');
        return;
    }
    competenceTableContainer.innerHTML = ''; // Vider le contenu du conteneur

    const table = document.createElement("table");
    table.id = "competenceTable";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const headers = ["Disponible", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    headers.forEach(headerText => {
        const th = document.createElement("th");
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    // Première ligne : résultats de la fonction /count-horaire-competence
    const firstRow = document.createElement("tr");
    const firstRowHeader = document.createElement("td");
    firstRowHeader.textContent = "Salles restantes";
    firstRow.appendChild(firstRowHeader);

    const days = ['1', '2', '3', '4', '5', '6', '7'];
    const countHoraireCompetence = [];

    for (const day of days) {
        const cell = document.createElement("td");
        try {
            const response = await fetch(`/api/count-horaire-competence?jour_id=${day}&semaine=${semaine}&annee=${annee}`);
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération du comptage des horaire_competence');
            }
            const data = await response.json();
            cell.textContent = data.count;
            countHoraireCompetence.push(data.count);
        } catch (error) {
            console.error(`Erreur lors de la récupération du comptage des horaire_competence pour le jour ${day} :`, error);
            cell.textContent = 'Erreur';
            countHoraireCompetence.push(0);
        }
        firstRow.appendChild(cell);
    }
    tbody.appendChild(firstRow);

    // Deuxième ligne : résultats de la fonction /available-names
    const secondRow = document.createElement("tr");
    const secondRowHeader = document.createElement("td");
    secondRowHeader.textContent = "Noms disponibles";
    secondRow.appendChild(secondRowHeader);

    const availableNamesCount = [];

    for (const day of days) {
        const cell = document.createElement("td");
        try {
            const response = await fetch(`/api/available-names?jour_id=${day}&semaine=${semaine}&annee=${annee}`);
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des noms disponibles');
            }
            const data = await response.json();
            cell.textContent = data.length; // Afficher le nombre de noms disponibles
            availableNamesCount.push(data.length);
        } catch (error) {
            console.error(`Erreur lors de la récupération des noms disponibles pour le jour ${day} :`, error);
            cell.textContent = 'Erreur';
            availableNamesCount.push(0);
        }
        secondRow.appendChild(cell);
    }
    tbody.appendChild(secondRow);

    // Troisième ligne : différence entre la première et la deuxième ligne
    const thirdRow = document.createElement("tr");
    const thirdRowHeader = document.createElement("td");
    thirdRowHeader.textContent = "Différence";
    thirdRow.appendChild(thirdRowHeader);

    for (let i = 0; i < days.length; i++) {
        const cell = document.createElement("td");
        const difference =  availableNamesCount[i] - countHoraireCompetence[i];
        cell.textContent = difference;
        thirdRow.appendChild(cell);
    }
    tbody.appendChild(thirdRow);

    table.appendChild(tbody);
    competenceTableContainer.appendChild(table);
    console.log('Tableau des compétences créé avec succès');
}