async function fetchHorairesCompetences() {
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    const siteId = sessionStorage.getItem('selectedSite'); // Récupérer le site_id depuis le sessionStorage

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        return;
    }

    try {
        const [competencesResponse, horairesResponse] = await Promise.all([
            fetch(`/api/competences?site_id=${siteId}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }),
            fetch(`/api/horaires-competences?site_id=${siteId}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
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


async function toggleHoraireCompetence(horaire_id, competence_id, cell) {
    const token = localStorage.getItem('token'); // Récupérer le token depuis le localStorage
    const siteId = sessionStorage.getItem('selectedSite'); // Récupérer le site_id depuis le sessionStorage

    if (!token || !siteId) {
        console.error('Erreur : le token ou le site_id est introuvable.');
        return;
    }

    try {
        if (cell.textContent === '✔') {
            // Supprimer la compétence de l'horaire
            const response = await fetch('/api/delete-horaire-competence', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ horaire_id, competence_id, site_id: siteId })
            });

            if (response.ok) {
                cell.textContent = '';
            } else {
                const error = await response.text();
                console.error('Erreur lors de la suppression de la compétence de l\'horaire :', error);
            }
        } else {
            // Ajouter la compétence à l'horaire avec des dates par défaut
            const dateDebut = new Date().toISOString().split('T')[0]; // Date actuelle au format YYYY-MM-DD
            const dateFin = '3000-01-01'; // Date éloignée dans le futur

            const response = await fetch('/api/add-horaire-competence', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ horaire_id, competence_id, site_id: siteId, date_debut: dateDebut, date_fin: dateFin })
            });

            if (response.ok) {
                cell.textContent = '✔';
            } else {
                const error = await response.text();
                console.error('Erreur lors de l\'ajout de la compétence à l\'horaire :', error);
            }
        }
    } catch (error) {
        console.error('Erreur lors de la requête :', error);
    }
}

async function fetchHoraireCompetenceDays() {
    const siteId = sessionStorage.getItem('selectedSite');
    const token = localStorage.getItem('token');

    if (!siteId || !token) {
        console.error('Erreur : le site ou le token est manquant.');
        return;
    }

    try {
        const response = await fetch(`/api/horaire-competence-jours?site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur lors de la récupération des données :', errorText);
            return;
        }

        const data = await response.json();
        console.log('Données récupérées :', data);

        const tableHead = document.querySelector("#horaireCompetenceDaysTable thead tr");
        const tableBody = document.querySelector("#horaireCompetenceDaysTable tbody");

        // Réinitialiser l'en-tête et le corps du tableau
        tableHead.innerHTML = '<th>Horaires</th>';
        tableBody.innerHTML = '';

        // Ajouter les colonnes pour les compétences
        const allCompetences = new Set();
        data.forEach(horaire => {
            Object.values(horaire.competences).forEach(competence => {
                allCompetences.add(competence.competence);
            });
        });

        allCompetences.forEach(competence => {
            const th = document.createElement("th");
            th.textContent = competence; // Afficher le nom de la compétence
            tableHead.appendChild(th);
        });

        // Ajouter les lignes pour les horaires
        data.forEach(horaire => {
            const row = document.createElement("tr");

            // Colonne des horaires
            const horaireCell = document.createElement("td");
            horaireCell.textContent = `${horaire.horaire_debut} - ${horaire.horaire_fin}`;
            row.appendChild(horaireCell);

            // Colonnes des compétences
            allCompetences.forEach(competenceName => {
                const cell = document.createElement("td");

                const competence = Object.values(horaire.competences).find(c => c.competence === competenceName);

                if (competence) {
                    // Sous-tableau pour les jours (jours en colonnes avec initiales)
                    const subTable = document.createElement("table");
                    subTable.classList.add("sub-table");

                    // Ajouter l'en-tête des jours
                    const subTableHead = document.createElement("thead");
                    const subTableHeaderRow = document.createElement("tr");
                    const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D']; // Initiales des jours
                    days.forEach(day => {
                        const dayHeaderCell = document.createElement("th");
                        dayHeaderCell.textContent = day;
                        subTableHeaderRow.appendChild(dayHeaderCell);
                    });
                    subTableHead.appendChild(subTableHeaderRow);
                    subTable.appendChild(subTableHead);

                    // Ajouter la ligne des cases à cocher
                    const subTableBody = document.createElement("tbody");
                    const subTableRow = document.createElement("tr");
                    days.forEach((_, index) => {
                        const dayCell = document.createElement("td");
                        const checkbox = document.createElement("input");
                        checkbox.type = "checkbox";
                        checkbox.checked = competence.jours[index + 1] || false; // Vérifier si le jour est associé
                        checkbox.addEventListener("change", () => toggleHoraireCompetenceDay(horaire.horaire_id, competence.competence_id, index + 1, checkbox.checked));
                        dayCell.appendChild(checkbox);
                        subTableRow.appendChild(dayCell);
                    });
                    subTableBody.appendChild(subTableRow);
                    subTable.appendChild(subTableBody);

                    cell.appendChild(subTable);
                }

                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
    }
}

async function toggleHoraireCompetenceDay(horaireId, competenceId, jourId, isChecked) {
    const siteId = sessionStorage.getItem('selectedSite');
    const token = localStorage.getItem('token');

    if (!siteId || !token) {
        console.error('Erreur : le site ou le token est manquant.');
        return;
    }

    try {
        const response = await fetch(isChecked ? '/api/add-horaire-competence-jour' : '/api/delete-horaire-competence-jour', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                horaire_id: horaireId,
                competence_id: competenceId,
                jour_id: jourId,
                site_id: siteId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur lors de la mise à jour des jours :', errorText);
        } else {
            console.log(`Jour ${jourId} pour l'horaire ${horaireId} et la compétence ${competenceId} mis à jour : ${isChecked}`);
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour des jours :', error);
    }
}

async function fetchHoraireCompetenceDates() {
    const siteId = sessionStorage.getItem('selectedSite');
    const token = localStorage.getItem('token');

    if (!siteId || !token) {
        console.error('Erreur : le site ou le token est manquant.');
        return;
    }

    try {
        const response = await fetch(`/api/horaire-competence-dates?site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur lors de la récupération des données :', errorText);
            return;
        }

        const data = await response.json();
        console.log('Données récupérées :', data);

        const tableHead = document.querySelector("#horaireCompetenceDatesTable thead tr");
        const tableBody = document.querySelector("#horaireCompetenceDatesTable tbody");

        // Réinitialiser l'en-tête et le corps du tableau
        tableHead.innerHTML = '<th>Horaires</th>';
        tableBody.innerHTML = '';

        // Ajouter les colonnes pour les compétences
        const allCompetences = new Set();
        data.forEach(horaire => {
            Object.values(horaire.competences).forEach(competence => {
                allCompetences.add(competence.competence);
            });
        });

        allCompetences.forEach(competence => {
            const th = document.createElement("th");
            th.textContent = competence; // Afficher le nom de la compétence
            tableHead.appendChild(th);
        });

        // Ajouter les lignes pour les horaires
        data.forEach(horaire => {
            const row = document.createElement("tr");

            // Colonne des horaires
            const horaireCell = document.createElement("td");
            horaireCell.textContent = `${horaire.horaire_debut} - ${horaire.horaire_fin}`;
            row.appendChild(horaireCell);

            // Colonnes des compétences
            allCompetences.forEach(competenceName => {
                const cell = document.createElement("td");

                const competence = Object.values(horaire.competences).find(c => c.competence === competenceName);

                if (competence) {
                    // Sous-tableau pour afficher les dates de début et de fin
                    const subTable = document.createElement("table");
                    subTable.classList.add("sub-table");

                    // Ajouter l'en-tête des dates
                    const subTableHead = document.createElement("thead");
                    const subTableHeaderRow = document.createElement("tr");
                    const dateHeaders = ['Date de début', 'Date de fin'];
                    dateHeaders.forEach(header => {
                        const headerCell = document.createElement("th");
                        headerCell.textContent = header;
                        subTableHeaderRow.appendChild(headerCell);
                    });
                    subTableHead.appendChild(subTableHeaderRow);
                    subTable.appendChild(subTableHead);

                    // Ajouter les valeurs des dates
                    const subTableBody = document.createElement("tbody");
                    const subTableRow = document.createElement("tr");

                    // Date de début
                    const dateDebutCell = document.createElement("td");
                    dateDebutCell.textContent = formatDate(competence.date_debut); // Formatage de la date
                    dateDebutCell.addEventListener("click", () => openDateModal(horaire.horaire_id, competence.competence_id, competence.date_debut, competence.date_fin, "date_debut"));
                    subTableRow.appendChild(dateDebutCell);

                    // Date de fin
                    const dateFinCell = document.createElement("td");
                    dateFinCell.textContent = formatDate(competence.date_fin); // Formatage de la date
                    dateFinCell.addEventListener("click", () => openDateModal(horaire.horaire_id, competence.competence_id, competence.date_debut, competence.date_fin, "date_fin"));
                    subTableRow.appendChild(dateFinCell);

                    subTableBody.appendChild(subTableRow);
                    subTable.appendChild(subTableBody);

                    cell.appendChild(subTable);
                }

                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
    }
}

function openDateModal(horaireId, competenceId, dateDebut, dateFin, dateType) {
    const modal = document.getElementById("dateModal");
    const dateDebutInput = document.getElementById("dateDebutInput");
    const dateFinInput = document.getElementById("dateFinInput");
    const saveButton = document.getElementById("saveDatesButton");

    // Pré-remplir les champs avec les dates actuelles
    dateDebutInput.value = dateDebut ? dateDebut.split('T')[0] : ''; // Format YYYY-MM-DD
    dateFinInput.value = dateFin ? dateFin.split('T')[0] : ''; // Format YYYY-MM-DD

    // Supprimer tout événement existant sur le bouton "Sauvegarder"
    saveButton.replaceWith(saveButton.cloneNode(true)); // Remplace le bouton pour supprimer les anciens événements
    const newSaveButton = document.getElementById("saveDatesButton");

    // Ajouter un nouvel événement pour sauvegarder les modifications
    newSaveButton.addEventListener("click", async () => {
        const newDateDebut = dateDebutInput.value;
        const newDateFin = dateFinInput.value;

        const siteId = sessionStorage.getItem('selectedSite');
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/update-horaire-competence-dates', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    horaire_id: horaireId,
                    competence_id: competenceId,
                    date_debut: newDateDebut,
                    date_fin: newDateFin,
                    site_id: siteId
                })
            });

            if (response.ok) {                
                fetchHoraireCompetenceDates(); // Rafraîchir le tableau
            } else {
                alert('Erreur lors de la mise à jour des dates.');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des dates :', error);
        }

        modal.style.display = "none";
    });

    modal.style.display = "block";
}

function formatDate(dateString) {
    if (!dateString) return 'Non définie';

    // Extraire uniquement la partie date (YYYY-MM-DD) et la formater en JJ/MM/AAAA
    const [year, month, day] = dateString.split('-'); // Pas de conversion en objet Date
    return `${day}/${month}/${year}`;
}

// Fermer le modal
document.querySelector(".date-close").addEventListener("click", () => {
    document.getElementById("dateModal").style.display = "none";
});


// Appeler la fonction pour récupérer les horaires par compétence lorsque la page est chargée
document.addEventListener('DOMContentLoaded', fetchHorairesCompetences);
document.addEventListener('DOMContentLoaded', fetchHoraireCompetenceDays);
document.addEventListener('DOMContentLoaded', fetchHoraireCompetenceDates);