async function createAdditionalTable() {
    const container = document.getElementById("additionalTableContainer");

    if (!container) {
        console.error('Élément #additionalTableContainer non trouvé');
        return;
    }

    // Supprimer le tableau existant s'il y en a un
    const existingTable = document.getElementById("additionalTable");
    if (existingTable) {
        container.removeChild(existingTable);
    }

    const table = document.createElement("table");
    table.id = "additionalTable";
    table.classList.add("table", "table-bordered");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headers = ["Vacances", "Repos", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    headers.forEach(headerText => {
        const th = document.createElement("th");
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    try {
        const siteId = sessionStorage.getItem('selectedSite');
        if (!siteId) {
            throw new Error('site_id manquant dans sessionStorage.');
        }

        // Récupérer les repos liés au site
        const reposResponse = await fetch(`/api/get-repos?site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!reposResponse.ok) {
            throw new Error('Erreur lors de la récupération des repos');
        }

        const repos = await reposResponse.json();
        console.log('Repos récupérés :', repos);

        // Ajouter des lignes dynamiques sous la colonne "Repos"
        repos.forEach(reposItem => {
            const row = document.createElement("tr");

            headers.forEach((header, index) => {
                const td = document.createElement("td");

                if (index === 0) {
                    // Colonne "Vacances"
                    td.addEventListener('click', (event) => {
                        currentCell = td;
                        fetchNomIdsVacances(event);
                    });
                } else if (index === 1) {
                    // Colonne "Repos"
                    td.textContent = reposItem.repos;
                } else {
                    // Colonnes des jours de la semaine
                    td.addEventListener('click', (event) => {
                        currentCell = td;
                        const jourId = index - 1;
                        fetchNomIdsRepos(event, reposItem.repos_id, jourId);
                    });
                }

                row.appendChild(td);
            });

            tbody.appendChild(row);
        });

        // Récupérer et afficher les données des repos pour chaque jour
        const semaine = document.getElementById("weekNumber").value;
        const annee = document.getElementById("yearNumber").value;

        const reposDataResponse = await fetch(`/api/repos-data?semaine=${semaine}&annee=${annee}&site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!reposDataResponse.ok) {
            throw new Error('Erreur lors de la récupération des données de repos');
        }

        const reposData = await reposDataResponse.json();
        console.log('Données de repos récupérées :', reposData);

        reposData.forEach(data => {
            const rows = tbody.getElementsByTagName('tr');
            for (let row of rows) {
                const reposCell = row.cells[1];
                if (reposCell && reposCell.textContent === data.repos) {
                    const cell = row.cells[data.jour_id + 1];
                    const div = document.createElement('div');
                    div.textContent = data.nom;
                    div.dataset.nomId = data.nom_id;
                    div.dataset.nom = data.nom;
                    div.addEventListener('contextmenu', (event) => {
                        event.preventDefault();
                        const semaine = document.getElementById("weekNumber").value;
                        const annee = document.getElementById("yearNumber").value;
                        const jourId = data.jour_id;
                        const nomId = div.dataset.nomId;

                        console.log('Valeurs récupérées :', { semaine, annee, jourId, nomId });

                        removeReposData(data.repos_id, semaine, annee, jourId, nomId);
                    });
                    cell.appendChild(div);
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des repos :', error);
    }

    table.appendChild(tbody);
    container.appendChild(table);

    // Appeler la fonction pour récupérer et afficher les données de vacances
    fetchVacancesData();
}
// Fonction pour récupérer le nom_id et supprimer les données dans la table Tjrepos_*
async function fetchNomIdAndRemoveReposData(tableName, semaine, annee, jourId, nom) {
    try {
        const response = await fetch(`/api/get-nom-id?nom=${encodeURIComponent(nom)}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération du nom_id');
        }

        const data = await response.json();
        const nomId = data.nom_id;

        console.log('Nom_id récupéré pour', nom, ':', nomId);

        removeReposData(tableName, semaine, annee, jourId, nomId);
    } catch (error) {
        console.error('Erreur lors de la récupération du nom_id :', error);
    }
}

// Fonction pour supprimer les données dans la table Trepos_*
async function removeReposData(tableName, semaine, annee, jourId, nomId) {
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    const siteId = sessionStorage.getItem('selectedSite'); // Récupérer le site_id depuis le sessionStorage

    // Vérifications de base
    if (!token) {
        console.error('Erreur : aucun token trouvé.');
        return;
    }

    if (!siteId) {
        console.error('Erreur : aucun site_id trouvé dans le sessionStorage.');
        return;
    }

    // Validation stricte des paramètres
    if (!tableName || isNaN(tableName)) {
        console.error('Erreur : tableName est invalide.', tableName);
        return;
    }

    if (!semaine || !annee || !jourId || !nomId) {
        console.error('Erreur : paramètres manquants pour la suppression.', { semaine, annee, jourId, nomId });
        return;
    }

    console.log('Données envoyées pour la suppression dans', tableName, ':', { tableName, semaine, annee, jourId, nomId, siteId });

    try {
        const response = await fetch('/api/remove-repos-data', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, // Ajouter le token dans l'en-tête
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tableName, semaine, annee, jourId, nomId, site_id: siteId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de la suppression dans ${tableName} : ${response.status} - ${errorText}`);
        }

        const result = await response.text();
        console.log('Résultat de la suppression dans', tableName, ':', result);

        // Réactualiser le tableau après la suppression
        createAdditionalTable();
    } catch (error) {
        console.error('Erreur lors de la suppression dans', tableName, ':', error);
    }
}

// Fonction pour ajouter les données dans la table Tvacances
async function addVacances(semaine, annee, nom) {
    console.log('Données envoyées pour l\'ajout dans Tvacances :', { semaine, annee, nom });
    try {
        const response = await fetch('/api/add-vacances', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ semaine, annee, nom })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de l\'ajout dans Tvacances');
        }

        const result = await response.text();
        console.log('Résultat de l\'ajout dans Tvacances :', result);

        // Mettre à jour la cellule avec le nom ajouté
        fetchVacancesData();
    } catch (error) {
        console.error('Erreur lors de l\'ajout dans Tvacances :', error);
    }
}

// Fonction pour supprimer les données dans la table Tvacances
async function removeVacances(semaine, annee, nom) {
    console.log('Données envoyées pour la suppression dans Tvacances :', { semaine, annee, nom });
    try {
        const response = await fetch('/api/remove-vacances', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ semaine, annee, nom })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la suppression dans Tvacances');
        }

        const result = await response.text();
        console.log('Résultat de la suppression dans Tvacances :', result);

        // Mettre à jour la cellule après la suppression
        fetchVacancesData();
    } catch (error) {
        console.error('Erreur lors de la suppression dans Tvacances :', error);
    }
}