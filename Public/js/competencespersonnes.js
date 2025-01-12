        // TODO: Section pour le tableau des compétences des personnes
        // Fonction pour afficher les compétences des personnes dans le tableau
        async function fetchCompetencesPersonnes() {
            try {
                const response = await fetch('/api/competences-personnes');
                const data = await response.json();
                
                const tableHead = document.querySelector("#competencesPersonnesTable thead tr");
                const tableBody = document.querySelector("#competencesPersonnesTable tbody");
                tableHead.innerHTML = '<th>Nom</th>'; // Vider le contenu des en-têtes de colonne
                tableBody.innerHTML = ''; // Vider le contenu du tableau

                // Récupérer toutes les compétences uniques
                const competences = [...new Set(data.map(item => item.competence))];

                // Ajouter les compétences en tant qu'en-têtes de colonne
                competences.forEach(competence => {
                    const th = document.createElement("th");
                    th.textContent = competence;
                    tableHead.appendChild(th);
                });

                // Grouper les données par nom
                const groupedData = data.reduce((acc, item) => {
                    if (!acc[item.nom]) {
                        acc[item.nom] = { nom_id: item.nom_id };
                    }
                    if (item.competence) {
                        acc[item.nom][item.competence] = true;
                    }
                    return acc;
                }, {});

                // Ajouter les données récupérées au tableau
                Object.keys(groupedData).forEach(nom => {
                    const row = document.createElement("tr");
                    const nameCell = document.createElement("td");
                    nameCell.textContent = nom;
                    row.appendChild(nameCell);

                    competences.forEach(competence => {
                        const cell = document.createElement("td");
                        cell.textContent = groupedData[nom][competence] ? '✔' : '';
                        cell.addEventListener('click', () => toggleCompetence(groupedData[nom].nom_id, competence, cell));
                        row.appendChild(cell);
                    });

                    tableBody.appendChild(row);
                });
            } catch (error) {
                console.error('Erreur lors de la récupération des compétences des personnes :', error);
            }
        }

        // Fonction pour ajouter ou supprimer une compétence pour une personne
        async function toggleCompetence(nom_id, competence, cell) {
            try {
                const response = await fetch('/api/competences-personnes');
                const data = await response.json();
                const competenceData = data.find(item => item.competence === competence);

                if (cell.textContent === '✔') {
                    // Supprimer la compétence
                    const response = await fetch('/api/delete-competence2', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ nom_id, competence_id: competenceData.competence_id })
                    });

                    if (response.ok) {
                        cell.textContent = '';
                    } else {
                        console.error('Erreur lors de la suppression de la compétence');
                    }
                } else {
                    // Ajouter la compétence
                    const response = await fetch('/api/add-competence', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ nom_id, competence_id: competenceData.competence_id })
                    });

                    if (response.ok) {
                        cell.textContent = '✔';
                    } else {
                        console.error('Erreur lors de l\'ajout de la compétence');
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la requête:', error);
            }
        }
