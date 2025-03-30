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

    console.log('Token récupéré :', token);
    console.log('Site ID récupéré :', siteId);

    if (!token) {
        console.error('Erreur : le token est manquant.');
        alert('Erreur : vous n\'êtes pas authentifié.'); // Ajout de l'alerte
        return;
    }

    if (!siteId) {
        console.error('Erreur : le site_id est manquant.');
        alert('Erreur : un site doit être sélectionné.');
        return;
    }

    console.log('Paramètres envoyés à fetchPlanningData :', { semaine, annee, siteId, token });

    try {
        // Effectuer les requêtes en parallèle
        const [planningResponse, fermeturesResponse, commentsResponse] = await Promise.all([
            fetch(`/api/planning-data?semaine=${semaine}&annee=${annee}&siteId=${siteId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`, // Ajouter le token dans l'en-tête
                    'Content-Type': 'application/json'
                }
            }),
            fetch(`/api/fermetures?semaine=${semaine}&annee=${annee}&siteId=${siteId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }),
            fetch(`/api/comments?semaine=${semaine}&annee=${annee}&site_id=${siteId}`, {
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
        if (!fermeturesResponse.ok) {
            const errorText = await fermeturesResponse.text();
            console.error('Erreur lors de la récupération des fermetures :', errorText);
            alert('Erreur lors de la récupération des fermetures.');
            return;
        }
        if (!commentsResponse.ok) {
            const errorText = await commentsResponse.text();
            console.error('Erreur lors de la récupération des commentaires :', errorText);
            alert('Erreur lors de la récupération des commentaires.');
            return;
        }

        // Extraire les données des réponses
        const planningData = await planningResponse.json();
        const fermeturesData = await fermeturesResponse.json();
        const commentsData = await commentsResponse.json();

        console.log('Données du planning récupérées :', planningData);
        console.log('Fermetures récupérées :', fermeturesData);
        console.log('Commentaires récupérés :', commentsData);

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

        // Associer les commentaires récupérés aux noms dans rowData.jours
        const commentairesMap = {};
        commentsData.forEach(comment => {
            const key = `${comment.jour_id}-${comment.nom_id}`;
            commentairesMap[key] = comment.commentaire;
        });

        Object.values(groupedData).forEach(rowData => {
            Object.keys(rowData.jours).forEach(day => {
                rowData.jours[day].forEach(entry => {
                    const key = `${day}-${entry.nom_id}`;
                    if (commentairesMap[key]) {
                        entry.commentaire = commentairesMap[key];
                    }
                });
            });
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
                cell.dataset.jourId = day; // Ajouter l'ID du jour
                cell.dataset.competenceId = rowData.competence_id; // Ajouter l'ID de la compétence
                cell.dataset.horaireDebut = rowData.horaire_debut; // Ajouter l'horaire de début
                cell.dataset.horaireFin = rowData.horaire_fin; // Ajouter l'horaire de fin

                // Vérifie si la cellule contient des données
                if (rowData.jours[day]) {
                    console.log(`Données pour le jour ${day} :`, rowData.jours[day]);

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

                    console.log(`Paires générées pour le jour ${day} :`, pairs);

                    // Ajouter chaque paire dans un conteneur
                    Object.entries(pairs).forEach(([nom_id, { nom, commentaire }]) => {
                        const container = document.createElement('div');

                        if (commentaire) {
                            console.log(`Ajout du commentaire : ${commentaire}`);
                            const commentDiv = document.createElement('div');
                            commentDiv.textContent = commentaire;
                            commentDiv.style.fontWeight = 'bold'; // Changer le style pour gras
                            container.appendChild(commentDiv);
                        }

                        if (nom) {
                            const div = document.createElement('div');
                            div.textContent = nom;
                            div.dataset.nomId = nom_id || null; // Ajouter l'ID du nom comme attribut de données
                            div.dataset.nom = nom || null; // Ajouter le nom comme attribut de données
                            div.dataset.jourId = day; // Ajouter l'ID du jour comme attribut de données
                            div.dataset.competenceId = rowData.competence_id; // Ajouter l'ID de la compétence comme attribut de données
                            div.dataset.horaireDebut = rowData.horaire_debut; // Ajouter l'horaire de début comme attribut de données
                            div.dataset.horaireFin = rowData.horaire_fin; // Ajouter l'horaire de fin comme attribut de données

                            console.log("Attributs ajoutés au div :", {
                                "data-nom": div.dataset.nom,
                                "data-nom-id": div.dataset.nomId,
                                "data-jour-id": div.dataset.jourId,
                                "data-competence-id": div.dataset.competenceId,
                                "data-horaire-debut": div.dataset.horaireDebut,
                                "data-horaire-fin": div.dataset.horaireFin
                            });

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

        // Activer le clic droit sur les cellules du tableau
        enableRightClickOnTable();

    } catch (error) {
        console.error('Erreur lors de la récupération des données du planning :', error);
        alert('Une erreur est survenue lors de la récupération des données du planning.');
    }
}

// Fonction pour supprimer un nom du planning
async function removeValueFromPlanning(nom, jour_id, semaine, annee, competence_id, horaire_debut, horaire_fin, site_id) {
    console.log('Appel de la fonction removeValueFromPlanning');
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage

    if (!token || !site_id) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        return;
    }

    console.log('Données envoyées pour la suppression du planning :', { semaine, annee, jour_id, horaire_debut, horaire_fin, competence_id, nom, site_id });

    try {
        const response = await fetch('/api/remove-planning', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Ajouter le token dans l'en-tête
            },
            body: JSON.stringify({ semaine, annee, jour_id, horaire_debut, horaire_fin, competence_id, nom, site_id })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression du planning');
        }

        const result = await response.text();
        console.log('Résultat de la suppression du planning :', result);

        // Mettre à jour l'interface utilisateur
        fetchPlanningData(); // Actualiser le tableau après la suppression
    } catch (error) {
        console.error('Erreur lors de la suppression du planning :', error);
    }
}


async function addCommentToPlanning(nom, commentaire, jour_id, semaine, annee, competence_id, horaire_debut, horaire_fin) {
    console.log('Appel de la fonction addCommentToPlanning');
    const site_id = localStorage.getItem('site_id'); // Récupérer le site_id depuis le localStorage
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage

    if (!jour_id) {
        console.error('Erreur : jour_id est manquant.');
        return;
    }

    if (!token) {
        console.error('Erreur : le token est manquant.');
        return;
    }

    console.log('Données envoyées pour l\'ajout du commentaire :', { semaine, annee, jour_id, nom, commentaire, site_id });

    try {
        const response = await fetch('/api/add-comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Ajouter le token dans l'en-tête
            },
            body: JSON.stringify({ semaine, annee, jour_id, nom, commentaire, site_id })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'ajout du commentaire');
        }

        const result = await response.text();
        console.log('Résultat de l\'ajout du commentaire :', result);

        // Vérifie si currentCell est défini
        if (!currentCell) {
            console.warn('currentCell est null. Le commentaire a été ajouté dans la base de données, mais pas dans l\'interface utilisateur.');
            return;
        }

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

// Ajouter un détecteur de clic droit sur les cellules du tableau
function enableRightClickOnTable() {
    const table = document.getElementById("planningTable"); // Sélectionner le tableau par son ID
    if (!table) {
        console.error("Tableau 'planningTable' introuvable.");
        return;
    }

    // Ajouter un gestionnaire d'événements pour chaque cellule du tableau
    table.querySelectorAll("td").forEach(cell => {
        cell.addEventListener("contextmenu", (event) => {
            event.preventDefault(); // Empêcher le menu contextuel par défaut

            // Vérifie si l'élément cible est un div
            const targetDiv = event.target.closest('div');
            if (targetDiv) {
                console.log("Attributs du div cible :", {
                    "data-nom": targetDiv.dataset.nom,
                    "data-nom-id": targetDiv.dataset.nomId,
                    "data-jour-id": targetDiv.dataset.jourId,
                    "data-competence-id": targetDiv.dataset.competenceId,
                    "data-horaire-debut": targetDiv.dataset.horaireDebut,
                    "data-horaire-fin": targetDiv.dataset.horaireFin
                });
            } else {
                console.warn("Aucun div trouvé comme cible du clic droit.");
            }

            // Récupérer les informations nécessaires depuis le div ou la cellule
            const jour_id = targetDiv ? targetDiv.dataset.jourId : cell.dataset.jourId || null;
            const competence_id = targetDiv ? targetDiv.dataset.competenceId : cell.dataset.competenceId || null;
            const horaire_debut = targetDiv ? targetDiv.dataset.horaireDebut : cell.dataset.horaireDebut || null;
            const horaire_fin = targetDiv ? targetDiv.dataset.horaireFin : cell.dataset.horaireFin || null;
            const nom = targetDiv ? targetDiv.dataset.nom : cell.dataset.nom || null;
            const nom_id = targetDiv ? targetDiv.dataset.nomId : cell.dataset.nomId || null;
            const semaine = document.getElementById("weekNumber").value;
            const annee = document.getElementById("yearNumber").value;

            console.log("Clic droit détecté sur une cellule :", {
                jour_id,
                competence_id,
                horaire_debut,
                horaire_fin,
                nom,
                nom_id,
                semaine,
                annee
            });

            // Appeler la fonction showEmptyTooltipdt
            showEmptyTooltipdt(event, nom, nom_id, jour_id, semaine, annee, competence_id, horaire_debut, horaire_fin);
        });
    });
}

// Appeler la fonction après avoir généré le tableau
document.addEventListener("DOMContentLoaded", () => {
    enableRightClickOnTable();
});