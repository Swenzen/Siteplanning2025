const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Configuration de la connexion
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Testtest',
    database: 'planning2',
    port: 3306
});

// Test de la connexion
connection.connect((err) => {
    if (err) {
        console.error('Erreur de connexion :', err.message);
        return;
    }
    console.log('Connecté à la base de données avec succès. ID de connexion :', connection.threadId);
});

// Middleware pour parser le corps des requêtes
app.use(bodyParser.json());

// Route pour récupérer les données
app.get('/api/data', (req, res) => {
    connection.query('SELECT nom_id, nom FROM Tnom', (err, results) => {
        if (err) {
            console.error('Erreur lors de la requête :', err.message);
            res.status(500).send('Erreur lors de la requête');
        } else {
            res.json(results);
        }
    });
});

// Route pour mettre à jour le nom
app.post('/api/update-name', (req, res) => {
    const { nom_id, nom } = req.body;
    const query = 'UPDATE Tnom SET nom = ? WHERE nom_id = ?';

    connection.query(query, [nom, nom_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la mise à jour du nom :', err.message);
            res.status(500).send('Erreur lors de la mise à jour');
            return;
        }
        res.send('Nom mis à jour avec succès');
    });
});

// Route pour ajouter une compétence
app.post('/api/add-competence2', (req, res) => {
    const { competence } = req.body;
    const query = `
        INSERT INTO Tcompetence (competence)
        VALUES (?)
    `;

    connection.query(query, [competence], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout de la compétence :', err.message);
            res.status(500).send('Erreur lors de l\'ajout de la compétence');
        } else {
            res.send('Compétence ajoutée avec succès');
        }
    });
});

// Route pour récupérer les compétences
app.get('/api/competences', (req, res) => {
    const query = 'SELECT competence_id, competence FROM Tcompetence';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des compétences :', err.message);
            res.status(500).send('Erreur lors de la récupération des compétences');
        } else {
            res.json(results);
        }
    });
});

// Route pour récupérer les données de planning
app.get('/api/planning-data', (req, res) => {
    const { semaine, annee } = req.query;

    console.log(`Récupération des données pour la semaine ${semaine} de l'année ${annee}`);

    const query = `
        SELECT h.horaire_debut, h.horaire_fin, c.competence, c.competence_id, j.jour_id, j.jour, n.nom
        FROM Tcompetence_nom cn
        JOIN Tcompetence c ON cn.competence_id = c.competence_id
        JOIN Thoraire_competence hc ON c.competence_id = hc.competence_id
        JOIN Thoraire h ON hc.horaire_id = h.horaire_id
        LEFT JOIN Tplanning p ON c.competence_id = p.competence_id AND h.horaire_id = p.horaire_id AND p.semaine = ? AND p.annee = ?
        LEFT JOIN Tnom n ON p.nom_id = n.nom_id
        LEFT JOIN Tjour j ON p.jour_id = j.jour_id
        ORDER BY c.competence, h.horaire_debut, j.jour_id
    `;

    connection.query(query, [semaine, annee], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des données du planning :', err.message);
            res.status(500).send('Erreur lors de la récupération des données du planning');
        } else {
            res.json(results);
        }
    });
});

// Route pour récupérer les noms des personnes ayant la même competence_id
app.get('/api/nom-ids', (req, res) => {
    const { competence_id } = req.query;
    const query = `
        SELECT n.nom
        FROM Tcompetence_nom cn
        JOIN Tnom n ON cn.nom_id = n.nom_id
        WHERE cn.competence_id = ?
    `;

    connection.query(query, [competence_id], (err, results) => {
        if (err) {
            console.error('Erreur lors de la requête :', err.message);
            res.status(500).send('Erreur lors de la requête');
        } else {
            res.json(results.map(row => row.nom));
        }
    });
});

// Route pour insérer ou mettre à jour le planning
app.post('/api/update-planning', (req, res) => {
    const { semaine, annee, jour_id, horaire_debut, horaire_fin, competence_id, nom } = req.body;

    const selectQuery = `
        SELECT p.planning_id
        FROM Tplanning p
        JOIN Thoraire h ON p.horaire_id = h.horaire_id
        JOIN Tcompetence c ON p.competence_id = c.competence_id
        WHERE p.semaine = ? AND p.annee = ? AND p.jour_id = ? AND h.horaire_debut = ? AND h.horaire_fin = ? AND c.competence_id = ?
    `;

    connection.query(selectQuery, [semaine, annee, jour_id, horaire_debut, horaire_fin, competence_id], (err, results) => {
        if (err) {
            console.error('Erreur lors de la requête de sélection :', err.message);
            res.status(500).send('Erreur lors de la requête de sélection');
        } else if (results.length > 0) {
            // Mettre à jour la ligne existante
            const updateQuery = `
                UPDATE Tplanning
                SET nom_id = (SELECT nom_id FROM Tnom WHERE nom = ? LIMIT 1)
                WHERE planning_id = ?
            `;
            connection.query(updateQuery, [nom, results[0].planning_id], (err, result) => {
                if (err) {
                    console.error('Erreur lors de la mise à jour du planning :', err.message);
                    res.status(500).send('Erreur lors de la mise à jour du planning');
                } else {
                    res.send('Planning mis à jour avec succès');
                }
            });
        } else {
            // Insérer une nouvelle ligne
            const insertQuery = `
                INSERT INTO Tplanning (semaine, annee, jour_id, horaire_id, competence_id, nom_id)
                VALUES (?, ?, ?, (SELECT horaire_id FROM Thoraire WHERE horaire_debut = ? AND horaire_fin = ? LIMIT 1), ?, (SELECT nom_id FROM Tnom WHERE nom = ? LIMIT 1))
            `;
            connection.query(insertQuery, [semaine, annee, jour_id, horaire_debut, horaire_fin, competence_id, nom], (err, result) => {
                if (err) {
                    console.error('Erreur lors de l\'insertion dans le planning :', err.message);
                    res.status(500).send('Erreur lors de l\'insertion dans le planning');
                } else {
                    res.send('Planning inséré avec succès');
                }
            });
        }
    });
});

// Route pour récupérer les compétences des personnes
app.get('/api/competences-personnes', (req, res) => {
    const query = `
        SELECT n.nom, n.nom_id, c.competence, c.competence_id
        FROM Tnom n
        LEFT JOIN Tcompetence_nom cn ON n.nom_id = cn.nom_id
        LEFT JOIN Tcompetence c ON cn.competence_id = c.competence_id
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la requête :', err.message);
            res.status(500).send('Erreur lors de la requête');
        } else {
            res.json(results);
        }
    });
});

// Route pour ajouter une compétence à une personne
app.post('/api/add-competence', (req, res) => {
    const { nom_id, competence_id } = req.body;
    const query = `
        INSERT INTO Tcompetence_nom (nom_id, competence_id)
        VALUES (?, ?)
    `;

    connection.query(query, [nom_id, competence_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout de la compétence :', err.message);
            res.status(500).send('Erreur lors de l\'ajout de la compétence');
        } else {
            res.send('Compétence ajoutée avec succès');
        }
    });
});


// Route pour supprimer une compétence
app.post('/api/delete-competence', (req, res) => {
    const { competence_id } = req.body;
    const query = `
        DELETE FROM Tcompetence
        WHERE competence_id = ?
    `;

    connection.query(query, [competence_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression de la compétence :', err.message);
            res.status(500).send('Erreur lors de la suppression de la compétence');
        } else {
            res.send('Compétence supprimée avec succès');
        }
    });
});


// Route pour supprimer une compétence d'une personne
app.post('/api/delete-competence2', (req, res) => {
    const { nom_id, competence_id } = req.body;
    const query = `
        DELETE FROM Tcompetence_nom
        WHERE nom_id = ? AND competence_id = ?
    `;

    connection.query(query, [nom_id, competence_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression de la compétence :', err.message);
            res.status(500).send('Erreur lors de la suppression de la compétence');
        } else {
            res.send('Compétence supprimée avec succès');
        }
    });
});

// Route pour ajouter un nom
app.post('/api/add-nom', (req, res) => {
    const { nom } = req.body;
    const query = `
        INSERT INTO Tnom (nom)
        VALUES (?)
    `;

    connection.query(query, [nom], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout du nom :', err.message);
            res.status(500).send('Erreur lors de l\'ajout du nom');
        } else {
            res.send('Nom ajouté avec succès');
        }
    });
});

// Route pour supprimer un nom
app.post('/api/delete-nom', (req, res) => {
    const { nom_id } = req.body;

    // Supprimer les enregistrements associés dans Tcompetence_nom
    const deleteCompetenceNomQuery = `
        DELETE FROM Tcompetence_nom
        WHERE nom_id = ?
    `;

    connection.query(deleteCompetenceNomQuery, [nom_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression des compétences associées :', err.message);
            res.status(500).send('Erreur lors de la suppression des compétences associées');
        } else {
            console.log(`Compétences associées supprimées pour nom_id: ${nom_id}`);
            // Mettre à jour les enregistrements associés dans Tplanning
            const updatePlanningQuery = `
                UPDATE Tplanning
                SET nom_id = NULL
                WHERE nom_id = ?
            `;

            connection.query(updatePlanningQuery, [nom_id], (err, result) => {
                if (err) {
                    console.error('Erreur lors de la mise à jour des plannings associés :', err.message);
                    res.status(500).send('Erreur lors de la mise à jour des plannings associés');
                } else {
                    console.log(`Plannings associés mis à jour pour nom_id: ${nom_id}`);
                    // Supprimer le nom dans Tnom
                    const deleteNomQuery = `
                        DELETE FROM Tnom
                        WHERE nom_id = ?
                    `;

                    connection.query(deleteNomQuery, [nom_id], (err, result) => {
                        if (err) {
                            console.error('Erreur lors de la suppression du nom :', err.message);
                            res.status(500).send('Erreur lors de la suppression du nom');
                        } else {
                            console.log(`Nom supprimé avec succès pour nom_id: ${nom_id}`);
                            res.send('Nom supprimé avec succès');
                        }
                    });
                }
            });
        }
    });
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});