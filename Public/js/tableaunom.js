let currentCell = null;
let currentId = null;

// Fonction pour afficher les données dans le tableau des noms
async function fetchData() {
    const token = localStorage.getItem('token'); // Récupérer le jeton depuis le localStorage

    try {
        const response = await fetch('/api/data', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Ajouter le jeton dans l'en-tête
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Données récupérées :', data);

            const tableBody = document.querySelector("#databaseTable tbody");
            tableBody.innerHTML = ''; // Vider le contenu du tableau

            // Ajouter les données récupérées au tableau
            data.forEach(rowData => {
                const row = document.createElement("tr");
                Object.keys(rowData).forEach(key => {
                    const cell = document.createElement("td");
                    cell.textContent = rowData[key];
                    row.appendChild(cell);
                });
                tableBody.appendChild(row);
            });
        } else {
            console.error('Erreur lors de la récupération des données');
        }
    } catch (error) {
        console.error('Erreur lors de la requête :', error);
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
        const token = localStorage.getItem('token'); // Récupérer le jeton depuis le localStorage

        try {
            console.time('addName');
            const response = await fetch('/api/add-nom', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`, // Ajouter le jeton dans l'en-tête
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nom }) // Envoyer le nom dans le corps de la requête
            });

            if (response.ok) {
                console.log('Nom ajouté avec succès');
                fetchData(); // Rafraîchir la liste des noms
            } else {
                console.error('Erreur lors de l\'ajout du nom');
                const error = await response.text();
                console.error('Détails de l\'erreur :', error);
            }
            console.timeEnd('addName');
        } catch (error) {
            console.error('Erreur lors de la requête :', error);
        }
    }
}

// Fonction pour ajouter un nom avec site_id
async function addNom() {
    const token = localStorage.getItem('token'); // Récupérer le jeton depuis le localStorage
    const nom = document.getElementById('nomInput').value; // Récupérer le nom saisi par l'utilisateur
    const siteId = localStorage.getItem('site_id'); // Récupérer le site_id stocké (par exemple, après avoir affiché le site)

    if (!nom || !siteId) {
        alert('Veuillez saisir un nom et vérifier que le site est chargé.');
        return;
    }

    try {
        const response = await fetch('/api/add-nom', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nom, site_id: siteId }) // Envoyer le nom et le site_id
        });

        if (response.ok) {
            alert('Nom ajouté avec succès !');
        } else {
            const error = await response.text();
            alert(`Erreur : ${error}`);
        }
    } catch (error) {
        console.error('Erreur lors de l\'ajout du nom :', error);
    }
}

// Fonction pour supprimer un nom
async function deleteName(nom_id) {
    const token = localStorage.getItem('token'); // Récupérer le jeton depuis le localStorage

    try {
        const response = await fetch('/api/delete-nom', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, // Ajouter le jeton dans l'en-tête
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nom_id })
        });

        if (response.ok) {
            alert('Nom supprimé avec succès');
            // Rafraîchir la liste des noms ou mettre à jour l'interface
        } else {
            console.error('Erreur lors de la suppression du nom');
            const error = await response.text();
            console.error('Détails de l\'erreur :', error);
        }
    } catch (error) {
        console.error('Erreur lors de la requête :', error);
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