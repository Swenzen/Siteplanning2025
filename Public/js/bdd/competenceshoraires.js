// Fonction pour afficher les horaires par compétence dans le tableau
async function fetchHorairesCompetences() {
    const siteId = localStorage.getItem('site_id');
    const token = localStorage.getItem('token');

    if (!siteId || !token) {
        console.error('Erreur : site_id ou token manquant.');
        alert('Erreur : vous devez être authentifié et un site doit être chargé.');
        return;
    }

    try {
        const [competencesResponse, horairesResponse] = await Promise.all([
            fetch(`/api/competences?site_id=${siteId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`/api/horaires-competences`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const competences = await competencesResponse.json();
        const data = await horairesResponse.json();

        const tableHead = document.querySelector("#horairescompetenceTable thead tr");
        const tableBody = document.querySelector("#horairescompetenceTable tbody");
        tableHead.innerHTML = '<th>Horaires</th>';
        tableBody.innerHTML = '';

        competences.forEach(competence => {
            const th = document.createElement("th");
            th.textContent = competence.competence;
            tableHead.appendChild(th);
        });

        const groupedData = data.reduce((acc, item) => {
            if (!acc[item.horaire_id]) {
                acc[item.horaire_id] = { horaire_debut: item.horaire_debut, horaire_fin: item.horaire_fin };
            }
            if (item.competence) {
                acc[item.horaire_id][item.competence] = true;
            }
            return acc;
        }, {});

        const horaires = Object.keys(groupedData).sort((a, b) => {
            const horaireA = groupedData[a].horaire_debut;
            const horaireB = groupedData[b].horaire_debut;
            return new Date(`1970-01-01T${horaireA}`) - new Date(`1970-01-01T${horaireB}`);
        });

        horaires.forEach(horaire_id => {
            const row = document.createElement("tr");
            const horaireCell = document.createElement("td");
            horaireCell.textContent = `${groupedData[horaire_id].horaire_debut} - ${groupedData[horaire_id].horaire_fin}`;
            row.appendChild(horaireCell);

            competences.forEach(competence => {
                const cell = document.createElement("td");
                cell.textContent = groupedData[horaire_id] && groupedData[horaire_id][competence.competence] ? '✔' : '';
                cell.addEventListener('click', () => toggleHoraireCompetence(horaire_id, competence.competence_id, cell));
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des horaires par compétence :', error);
    }
}

// Fonction pour ajouter ou supprimer une compétence pour un horaire
async function toggleHoraireCompetence(horaire_id, competence_id, cell) {
    const siteId = localStorage.getItem('site_id');
    const token = localStorage.getItem('token');

    if (!siteId || !token) {
        console.error('Erreur : site_id ou token manquant.');
        alert('Erreur : vous devez être authentifié et un site doit être chargé.');
        return;
    }

    try {
        if (cell.textContent === '✔') {
            const response = await fetch('/api/delete-horaire-competence', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ horaire_id, competence_id })
            });

            if (response.ok) {
                cell.textContent = '';
            } else {
                console.error('Erreur lors de la suppression de la compétence de l\'horaire');
            }
        } else {
            const response = await fetch('/api/add-horaire-competence', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ horaire_id, competence_id })
            });

            if (response.ok) {
                cell.textContent = '✔';
            } else {
                console.error('Erreur lors de l\'ajout de la compétence à l\'horaire');
            }
        }
    } catch (error) {
        console.error('Erreur lors de la requête :', error);
    }
}

// Appeler la fonction pour récupérer les horaires par compétence lorsque la page est chargée
document.addEventListener('DOMContentLoaded', fetchHorairesCompetences);