let currentCell = null;
let currentId = null;

// Fonction pour afficher les données dans le tableau des noms
async function fetchData() {
    try {
        console.time('fetchData');
        const response = await fetch('/api/data');
        const data = await response.json();
        
        const tableBody = document.querySelector("#databaseTable tbody");
        tableBody.innerHTML = ''; // Vider le contenu du tableau

        // Créer un fragment de document pour minimiser les manipulations du DOM
        const fragment = document.createDocumentFragment();

        // Ajouter les données récupérées au tableau
        data.forEach(rowData => {
            const row = document.createElement("tr");
            Object.keys(rowData).forEach(key => {
                const cell = document.createElement("td");
                cell.textContent = rowData[key];
                // Ajouter un gestionnaire de clics à la colonne "nom"
                if (key === 'nom') {
                    cell.style.cursor = 'pointer';
                    cell.addEventListener("click", () => {
                        currentCell = cell; // Stocker la cellule actuelle
                        currentId = rowData.nom_id; // Stocker l'ID actuel
                        showModal();
                    });
                }
                row.appendChild(cell);
            });
            // Ajouter une cellule pour les actions (supprimer)
            const actionCell = document.createElement("td");
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Supprimer";
            deleteButton.addEventListener("click", () => deleteName(rowData.nom_id));
            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);
            fragment.appendChild(row);
        });

        tableBody.appendChild(fragment); // Ajouter le fragment au DOM en une seule opération
        console.timeEnd('fetchData');

        // Appel de la fonction pour récupérer les compétences des personnes
        fetchCompetencesPersonnes();
        // Appel de la fonction pour récupérer les compétences
        fetchCompetences();
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
    }
}

// Fonction pour afficher la fenêtre modale
function showModal() {
    const modal = document.getElementById("myModal");
    modal.style.display = "block";
    document.getElementById("newName").value = currentCell.textContent;
}

// Fonction pour fermer la fenêtre modale
function closeModal() {
    const modal = document.getElementById("myModal");
    modal.style.display = "none";
}

// Fonction pour sauvegarder le nouveau nom
async function saveName() {
    const newName = document.getElementById("newName").value;
    if (currentCell && currentId) {
        try {
            console.time('saveName');
            const response = await fetch('/api/update-name', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nom_id: currentId, nom: newName })
            });

            if (response.ok) {
                const result = await response.text();
                console.log(result);
                // Mettre à jour l'affichage du nom dans la cellule
                currentCell.textContent = newName;
                closeModal();
            } else {
                console.error('Erreur lors de la mise à jour du nom');
            }
            console.timeEnd('saveName');
        } catch (error) {
            console.error('Erreur lors de la requête:', error);
        }
    }
}

// Fonction pour ajouter un nom
async function addName() {
    const nom = prompt("Entrez le nom");
    if (nom) {
        try {
            console.time('addName');
            const response = await fetch('/api/add-nom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nom })
            });

            if (response.ok) {
                fetchData();
            } else {
                console.error('Erreur lors de l\'ajout du nom');
            }
            console.timeEnd('addName');
        } catch (error) {
            console.error('Erreur lors de la requête:', error);
        }
    }
}

// Fonction pour supprimer un nom
async function deleteName(nom_id) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce nom ?")) {
        try {
            console.time('deleteName');
            const response = await fetch('/api/delete-nom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nom_id })
            });

            if (response.ok) {
                fetchData();
            } else {
                console.error('Erreur lors de la suppression du nom');
            }
            console.timeEnd('deleteName');
        } catch (error) {
            console.error('Erreur lors de la requête:', error);
        }
    }
}

// Gestionnaire d'événements pour fermer la fenêtre modale
document.querySelector(".close").addEventListener("click", closeModal);

// Gestionnaire d'événements pour sauvegarder le nouveau nom
document.getElementById("saveName").addEventListener("click", saveName);

// Gestionnaire d'événements pour ajouter un nom
document.getElementById("addNameButton").addEventListener("click", addName);

// Appeler la fonction pour récupérer les données lorsque la page est chargée
document.addEventListener('DOMContentLoaded', fetchData);

// Fermer la fenêtre modale si l'utilisateur clique en dehors de celle-ci
window.onclick = function(event) {
    const modal = document.getElementById("myModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
}