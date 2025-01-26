// Fonction pour créer un tableau supplémentaire avec 9 colonnes
async function createAdditionalTable() {
    const container = document.getElementById("additionalTableContainer"); // Assurez-vous d'avoir un conteneur pour le nouveau tableau

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

    // Récupérer les noms des tables Tjrepos_ existantes
    try {
        const response = await fetch('/api/get-repos-tables');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des tables de repos');
        }

        const tables = await response.json();
        console.log('Tables récupérées :', tables); // Journal de débogage

        // Ajouter des lignes dynamiques sous la colonne "Repos"
        tables.forEach((table, index) => {
            if (table) { // Vérifier que table n'est pas null ou undefined
                const row = document.createElement("tr");
                for (let i = 0; i < headers.length; i++) {
                    const td = document.createElement("td");
                    if (i === 0 && index === 0) { // Ajouter un gestionnaire de clics à la cellule en dessous de "Vacances" dans la première ligne
                        td.addEventListener('click', (event) => {
                            currentCell = td; // Stocker la cellule actuelle
                            fetchNomIdsVacances(event);
                        });
                    }
                    if (i === 1) { // Ajouter les valeurs sous l'en-tête "Repos"
                        td.textContent = table.replace(/^Tjrepos_/i, '').toUpperCase(); // Afficher le nom sans le préfixe et en majuscules
                    }
                    row.appendChild(td);
                }
                tbody.appendChild(row);
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des tables de repos :', error);
    }

    table.appendChild(tbody);
    container.appendChild(table);

    // Appeler la fonction pour récupérer et afficher les données de vacances
    fetchVacancesData();
}

// Fonction pour récupérer et afficher les données de vacances
async function fetchVacancesData() {
    const semaine = document.getElementById("weekNumber").value;
    const annee = document.getElementById("yearNumber").value;

    try {
        const response = await fetch(`/api/vacances-data?semaine=${semaine}&annee=${annee}`);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données de vacances');
        }
        const data = await response.json();
        console.log('Données de vacances récupérées :', data);

        // Afficher les données de vacances dans la cellule correspondante
        const vacancesCell = document.querySelector("#additionalTableContainer td");
        vacancesCell.innerHTML = ''; // Vider le contenu de la cellule avant d'ajouter les noms
        data.forEach(vacance => {
            const div = document.createElement('div');
            div.textContent = vacance.nom;
            div.addEventListener('contextmenu', (event) => {
                event.preventDefault(); // Empêcher le menu contextuel par défaut
                removeVacances(semaine, annee, vacance.nom);
            });
            vacancesCell.appendChild(div);
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des données de vacances :', error);
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