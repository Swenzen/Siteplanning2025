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
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    const siteId = localStorage.getItem('site_id'); // Récupérer le site_id depuis le localStorage

    console.log('Paramètres envoyés à fetchPlanningData :', { semaine, annee, siteId, token });

    if (!token) {
        console.error('Erreur : le token est manquant.');
        alert('Erreur : vous devez être authentifié.');
        return;
    }

    if (!siteId) {
        console.error('Erreur : le site_id est manquant.');
        alert('Erreur : un site doit être sélectionné.');
        return;
    }

    try {
        // Effectuer les requêtes en parallèle
        const [planningResponse, commentsResponse, fermeturesResponse] = await Promise.all([
            fetch(`/api/planning-data?semaine=${semaine}&annee=${annee}&siteId=${siteId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`, // Ajouter le token dans l'en-tête
                    'Content-Type': 'application/json'
                }
            }),
            fetch(`/api/comments?semaine=${semaine}&annee=${annee}&siteId=${siteId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }),
            fetch(`/api/fermetures?semaine=${semaine}&annee=${annee}&siteId=${siteId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
        ]);

        // Vérifier si les réponses sont valides
        if (!planningResponse.ok) {
            const errorText = await planningResponse.text();
            console.error('Erreur lors de la récupération des données du planning :', errorText);
            alert('Erreur lors de la récupération des données du planning.');
            return;
        }
        if (!commentsResponse.ok) {
            const errorText = await commentsResponse.text();
            console.error('Erreur lors de la récupération des commentaires :', errorText);
            alert('Erreur lors de la récupération des commentaires.');
            return;
        }
        if (!fermeturesResponse.ok) {
            const errorText = await fermeturesResponse.text();
            console.error('Erreur lors de la récupération des fermetures :', errorText);
            alert('Erreur lors de la récupération des fermetures.');
            return;
        }

        // Extraire les données des réponses
        const planningData = await planningResponse.json();
        const commentsData = await commentsResponse.json();
        const fermeturesData = await fermeturesResponse.json();

        console.log('Données du planning récupérées :', planningData);
        console.log('Commentaires récupérés :', commentsData);
        console.log('Fermetures récupérées :', fermeturesData);

        // Vérifie si les données du planning sont vides
        if (!planningData || planningData.length === 0) {
            console.warn('Aucune donnée de planning trouvée.');
            alert('Aucune donnée de planning trouvée.');
            return;
        }

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

                // Vérifie si la cellule contient des données
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

                    // Ajouter chaque paire dans un conteneur
                    Object.entries(pairs).forEach(([nom_id, { nom, commentaire }]) => {
                        const container = document.createElement('div');

                        if (commentaire) {
                            const commentDiv = document.createElement('div');
                            commentDiv.textContent = commentaire;
                            commentDiv.style.fontWeight = 'bold'; // Changer le style pour gras
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

                            container.appendChild(div);

                            // Gestionnaire de clic gauche
                            div.addEventListener('click', (event) => {
                                console.log(`Clic gauche détecté sur la cellule : ${day}, ${rowData.competence_id}`);
                                currentCell = cell; // Stocker la cellule actuelle
                                currentDay = day;
                                currentHorairesNom = `${rowData.horaire_debut} - ${rowData.horaire_fin}`;
                                currentCompetenceId = rowData.competence_id;

                                // Appeler fetchNomIds pour afficher le tooltip ou effectuer une autre action
                                fetchNomIds(rowData.competence_id, event);
                            });
                        }

                        cell.appendChild(container);
                    });
                }

                // Gestionnaire de clic pour les cases vides
                cell.addEventListener('click', (event) => {
                    console.log(`Clic gauche détecté sur une case vide : ${day}`);
                    currentCell = cell; // Stocker la cellule actuelle
                    currentDay = day;
                    currentHorairesNom = `${rowData.horaire_debut} - ${rowData.horaire_fin}`;
                    currentCompetenceId = rowData.competence_id;

                    // Afficher un tooltip vide ou effectuer une autre action
                    showEmptyTooltip(event, null, null, day, semaine, annee, rowData.competence_id, rowData.horaire_debut, rowData.horaire_fin);
                });

                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });

        // Appeler les fonctions supplémentaires pour créer les tableaux
        createAdditionalTable();
        createCompetenceTable(semaine, annee, siteId);

    } catch (error) {
        console.error('Erreur lors de la récupération des données du planning :', error);
        alert('Une erreur est survenue lors de la récupération des données du planning.');
    }
}

// Fonction pour supprimer la valeur dans le tableau Tplanning
async function removeValueFromPlanning(nom) {
    console.log('Appel de la fonction removeValueFromPlanning');
    const semaine = document.getElementById("weekNumber").value;
    const annee = document.getElementById("yearNumber").value;
    const jour_id = currentDay; // Utiliser l'ID du jour
    const [horaire_debut, horaire_fin] = currentHorairesNom.split(' - '); // Séparer les horaires de début et de fin
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    const siteId = localStorage.getItem('site_id'); // Récupérer le site_id depuis le localStorage

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        alert('Erreur : vous devez être authentifié et un site doit être chargé.');
        return;
    }

    console.log('Données envoyées pour la suppression du planning :', { semaine, annee, jour_id, horaire_debut, horaire_fin, currentCompetenceId, nom, siteId });

    try {
        const response = await fetch('/api/remove-planning', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Ajouter le token dans l'en-tête
            },
            body: JSON.stringify({ semaine, annee, jour_id, horaire_debut, horaire_fin, competence_id: currentCompetenceId, nom, site_id: siteId })
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
async function createCompetenceTable(semaine, annee, siteId) {
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
            const response = await fetch(`/api/count-horaire-competence?jour_id=${day}&semaine=${semaine}&annee=${annee}&site_id=${siteId}`);
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
            const response = await fetch(`/api/available-names?jour_id=${day}&semaine=${semaine}&annee=${annee}&site_id=${siteId}`);
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
        const difference = availableNamesCount[i] - countHoraireCompetence[i];
        cell.textContent = difference;
        thirdRow.appendChild(cell);
    }
    tbody.appendChild(thirdRow);

    table.appendChild(tbody);
    competenceTableContainer.appendChild(table);
    console.log('Tableau des compétences créé avec succès');
    console.log('Paramètres reçus :', { semaine, annee, siteId });
    
   }