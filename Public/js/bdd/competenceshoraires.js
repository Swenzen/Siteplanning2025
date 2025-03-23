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
            fetch(`/api/horaires-competences?site_id=${siteId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        if (!competencesResponse.ok || !horairesResponse.ok) {
            const competencesError = await competencesResponse.text();
            const horairesError = await horairesResponse.text();
            console.error('Erreur lors de la récupération des données :', competencesError, horairesError);
            alert('Erreur lors de la récupération des données.');
            return;
        }

        const competences = await competencesResponse.json();
        const horaires = await horairesResponse.json();

        if (!horaires || horaires.length === 0) {
            console.error('Aucun horaire trouvé pour ce site.');
            alert('Aucun horaire trouvé pour ce site.');
            return;
        }

        const tableHead = document.querySelector("#horairescompetenceTable thead tr");
        const tableBody = document.querySelector("#horairescompetenceTable tbody");
        tableHead.innerHTML = '<th>Horaires</th>';
        tableBody.innerHTML = '';

        // Ajouter les colonnes pour les compétences
        competences.forEach(competence => {
            const th = document.createElement("th");
            th.textContent = competence.competence;
            tableHead.appendChild(th);
        });

        // Ajouter les lignes pour les horaires
        horaires.forEach(horaire => {
            const row = document.createElement("tr");
            const horaireCell = document.createElement("td");
            horaireCell.textContent = `${horaire.horaire_debut} - ${horaire.horaire_fin}`;
            row.appendChild(horaireCell);

            competences.forEach(competence => {
                const cell = document.createElement("td");
                cell.textContent = horaire.competences && horaire.competences.includes(competence.competence_id) ? '✔' : '';
                cell.addEventListener('click', () => toggleHoraireCompetence(horaire.horaire_id, competence.competence_id, cell));
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