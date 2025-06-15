let currentCell = null;
let currentId = null;

async function fetchData() {
    const token = localStorage.getItem('token');
    const siteId = sessionStorage.getItem('selectedSite');

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        return;
    }

    try {
        const response = await fetch(`/api/noms?site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de la récupération des données : ${errorText}`);
        }

        const data = await response.json();
        console.log('Données reçues :', data);

        // Insérer les données dans le tableau HTML
        const tableBody = document.querySelector("#databaseTable tbody");
        tableBody.innerHTML = ''; // Vider le tableau avant de le remplir

        data.forEach(({ nom_id, nom, date_debut, date_fin }) => {
            const row = document.createElement('tr');

            const nomCell = document.createElement('td');
            nomCell.textContent = nom;
            row.appendChild(nomCell);

            const dateDebutCell = document.createElement('td');
            dateDebutCell.textContent = formatDate(date_debut); // Reformater la date
            row.appendChild(dateDebutCell);

            const dateFinCell = document.createElement('td');
            dateFinCell.textContent = formatDate(date_fin); // Reformater la date
            row.appendChild(dateFinCell);

            const actionsCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Supprimer';
            deleteButton.dataset.nomId = nom_id; // Ajouter l'ID du nom au bouton
            actionsCell.appendChild(deleteButton);
            row.appendChild(actionsCell);

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
    }
}


function openNomDateModal(nomId, dateDebut, dateFin) {
    currentId = nomId;

    const modal = document.getElementById("dateModal");
    const dateDebutInput = document.getElementById("dateDebutInput");
    const dateFinInput = document.getElementById("dateFinInput");

    dateDebutInput.value = dateDebut || '';
    dateFinInput.value = dateFin || '';

    modal.style.display = "block";
}

document.getElementById("saveDatesButton").addEventListener("click", async () => {
    const dateDebut = document.getElementById("dateDebutInput").value;
    const dateFin = document.getElementById("dateFinInput").value;

    const siteId = sessionStorage.getItem('selectedSite');
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/update-nom-dates', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nom_id: currentId,
                date_debut: dateDebut,
                date_fin: dateFin,
                site_id: siteId
            })
        });

        if (response.ok) {
            alert('Dates mises à jour avec succès.');
            fetchData(); // Recharger les données
        } else {
            alert('Erreur lors de la mise à jour des dates.');
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour des dates :', error);
    }

    document.getElementById("dateModal").style.display = "none";
});


async function addNom() {
    const nom = prompt("Entrez le nom :");
    if (!nom) {
        alert('Le nom est obligatoire.');
        return;
    }

    // Date du jour au format YYYY-MM-DD
    const dateDebut = new Date().toISOString().slice(0, 10);
    const dateFin = "3000-01-01";

    const siteId = sessionStorage.getItem('selectedSite');
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/add-nom', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nom, date_debut: dateDebut, date_fin: dateFin, site_id: siteId })
        });

        if (response.ok) {
            alert('Nom ajouté avec succès.');
            fetchData(); // Recharger les données
        } else {
            alert('Erreur lors de l\'ajout du nom.');
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout du nom :', error);
    }
}


async function deleteNom(nomId) {
    const siteId = sessionStorage.getItem('selectedSite');
    const token = localStorage.getItem('token');

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce nom ?')) {
        return;
    }

    try {
        const response = await fetch('/api/delete-nom', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nom_id: nomId, site_id: siteId })
        });

        if (response.ok) {
            alert('Nom supprimé avec succès.');
            fetchData(); // Recharger les données
        } else {
            alert('Erreur lors de la suppression du nom.');
        }
    } catch (error) {
        console.error('Erreur lors de la suppression du nom :', error);
    }
}


function makeDateEditable(cell, nomId, dateType) {
    const originalValue = cell.textContent;
    const input = document.createElement("input");
    input.type = "date";
    input.value = originalValue.split('/').reverse().join('-'); // Convertir au format YYYY-MM-DD
    cell.textContent = '';
    cell.appendChild(input);

    input.addEventListener("blur", async () => {
        const newValue = input.value;
        if (newValue) {
            try {
                const siteId = sessionStorage.getItem('selectedSite');
                const token = localStorage.getItem('token');

                const updatedDates = {
                    nom_id: nomId,
                    site_id: siteId,
                    date_debut: dateType === "date_debut" ? newValue : cell.parentElement.querySelector('td:nth-child(2)').textContent.split('/').reverse().join('-'),
                    date_fin: dateType === "date_fin" ? newValue : cell.parentElement.querySelector('td:nth-child(3)').textContent.split('/').reverse().join('-')
                };

                const response = await fetch('/api/update-nom-dates', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedDates)
                });

                if (response.ok) {
                    cell.textContent = formatDate(newValue);
                    alert('Date mise à jour avec succès.');
                } else {
                    alert('Erreur lors de la mise à jour de la date.');
                    cell.textContent = originalValue;
                }
            } catch (error) {
                console.error('Erreur lors de la mise à jour de la date :', error);
                cell.textContent = originalValue;
            }
        } else {
            cell.textContent = originalValue;
        }
    });

    input.focus();
}



// Appeler la fonction pour récupérer les données lorsque la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    fetchData(); // Charger les données pour le site sélectionné
});

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
            const token = localStorage.getItem('token');
            const siteId = localStorage.getItem('site_id');

            const response = await fetch('/api/update-name', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nom_id: currentId, nom: newName, site_id: siteId })
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





// Utiliser la délégation d'événements pour gérer les clics sur les boutons de suppression
document.querySelector("#databaseTable tbody").addEventListener("click", (event) => {
    if (event.target.tagName === "BUTTON" && event.target.textContent === "Supprimer") {
        const nomId = event.target.dataset.nomId; // Récupérer l'ID du nom à partir du bouton
        console.log('ID du nom récupéré :', nomId);
        if (!nomId) {
            console.error('Erreur : nom_id est introuvable.');
            alert('Erreur : Impossible de trouver l\'ID du nom.');
            return;
        }
        deleteName(nomId); // Appeler la fonction pour supprimer le nom
    }
});

// Gestionnaire d'événements pour fermer la fenêtre modale
document.querySelector(".close").addEventListener("click", closeModal);

// Gestionnaire d'événements pour sauvegarder le nouveau nom
document.getElementById("saveName").addEventListener("click", saveName);

document.getElementById("addNameButton").addEventListener("click", addNom);

document.querySelector("#databaseTable tbody").addEventListener("click", (event) => {
    if (event.target.tagName === "BUTTON" && event.target.textContent === "Supprimer") {
        const nomId = event.target.dataset.nomId;
        deleteNom(nomId);
    }
});

document.querySelector("#databaseTable tbody").addEventListener("click", (event) => {
    const cell = event.target;
    const row = cell.parentElement;
    const nomId = row.querySelector("button").dataset.nomId;

    if (cell.cellIndex === 1) { // Colonne "Date de début"
        makeDateEditable(cell, nomId, "date_debut");
    } else if (cell.cellIndex === 2) { // Colonne "Date de fin"
        makeDateEditable(cell, nomId, "date_fin");
    }
});

// Appeler la fonction pour récupérer les données lorsque la page est chargée
document.addEventListener('DOMContentLoaded', fetchData);

// Fermer la fenêtre modale si l'utilisateur clique en dehors de celle-ci
window.onclick = function(event) {
    const modal = document.getElementById("myModal");
    if (event.target === modal) {
        modal.style.display = "none";
    }
}