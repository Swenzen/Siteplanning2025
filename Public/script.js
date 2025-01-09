// Sélectionner le tableau
const tableBody = document.querySelector("#dynamicTable tbody");

// Fonction pour récupérer les données de l'API et les afficher dans le tableau
async function fetchData() {
    try {
        // Effectuer une requête pour récupérer les données de l'API
        const response = await fetch('/api/data');
        const data = await response.json();

        // Ajouter les données récupérées au tableau
        data.forEach(rowData => {
            const row = document.createElement("tr");
            Object.values(rowData).forEach(cellData => {
                const cell = document.createElement("td");
                cell.textContent = cellData;
                row.appendChild(cell);
            });
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
    }
}

// Appeler la fonction pour récupérer les données lorsque la page est chargée
document.addEventListener('DOMContentLoaded', fetchData);