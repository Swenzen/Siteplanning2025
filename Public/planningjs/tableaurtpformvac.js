
// Fonction pour créer un tableau supplémentaire avec 9 colonnes
function createAdditionalTable() {
    const container = document.getElementById("additionalTableContainer"); // Assurez-vous d'avoir un conteneur pour le nouveau tableau
    const table = document.createElement("table");
    table.id = "additionalTable";
    table.classList.add("table", "table-bordered");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headers = ["Vacances", "", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    headers.forEach(headerText => {
        const th = document.createElement("th");
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    // Ajouter une ligne vide
    const emptyRow = document.createElement("tr");
    for (let i = 0; i < headers.length; i++) {
        const td = document.createElement("td");
        if (i === 0) { // Ajouter un gestionnaire de clics à la cellule en dessous de "Vacances"
            td.addEventListener('click', (event) => {
                currentCell = td; // Stocker la cellule actuelle
                fetchNomIdsVacances(event);
            });
        }
        emptyRow.appendChild(td);
    }
    tbody.appendChild(emptyRow);

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