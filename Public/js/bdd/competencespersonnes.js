// Fonction pour afficher les compétences des personnes dans le tableau
async function fetchCompetencesPersonnes() {
    const siteId = localStorage.getItem('site_id');
    const token = localStorage.getItem('token');

    if (!siteId || !token) {
        console.error('Erreur : site_id ou token manquant.');
        return;
    }

    try {
        const [competencesResponse, personnesResponse] = await Promise.all([
            fetch(`/api/competences`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`/api/competences-personnes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        if (!competencesResponse.ok || !personnesResponse.ok) {
            const competencesError = await competencesResponse.text();
            const personnesError = await personnesResponse.text();
            console.error('Erreur lors de la récupération des données :', competencesError, personnesError);
            alert('Erreur lors de la récupération des données.');
            return;
        }

        const competences = await competencesResponse.json();
        const personnes = await personnesResponse.json();

        const tableHead = document.querySelector("#competencesPersonnesTable thead tr");
        const tableBody = document.querySelector("#competencesPersonnesTable tbody");
        tableHead.innerHTML = '<th>Nom</th>';
        tableBody.innerHTML = '';

        competences.forEach(competence => {
            const th = document.createElement("th");
            th.textContent = competence.competence;
            tableHead.appendChild(th);
        });

        personnes.forEach(personne => {
            const row = document.createElement("tr");
            const nameCell = document.createElement("td");
            nameCell.textContent = personne.nom;
            row.appendChild(nameCell);

            competences.forEach(competence => {
                const cell = document.createElement("td");
                cell.textContent = personne.competences.includes(competence.competence_id) ? '✔' : '';
                cell.addEventListener('click', () => toggleCompetence(personne.nom_id, competence.competence_id, cell));
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des compétences des personnes :', error);
    }
}

// Fonction pour ajouter ou supprimer une compétence pour une personne
async function toggleCompetence(nom_id, competence_id, cell) {
    const siteId = localStorage.getItem('site_id');
    const token = localStorage.getItem('token');

    if (!siteId || !token) {
        console.error('Erreur : site_id ou token manquant.');
        return;
    }

    try {
        if (cell.textContent === '✔') {
            const response = await fetch('/api/delete-competence', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nom_id, competence_id })
            });

            if (response.ok) {
                cell.textContent = '';
            } else {
                console.error('Erreur lors de la suppression de la compétence');
            }
        } else {
            const response = await fetch('/api/add-competence', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nom_id, competence_id })
            });

            if (response.ok) {
                cell.textContent = '✔';
            } else {
                console.error('Erreur lors de l\'ajout de la compétence');
            }
        }
    } catch (error) {
        console.error('Erreur lors de la requête :', error);
    }
}

// Appeler la fonction pour récupérer les compétences des personnes lorsque la page est chargée
document.addEventListener('DOMContentLoaded', fetchCompetencesPersonnes);