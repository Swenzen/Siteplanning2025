const express = require('express');
const router = express.Router();
const connection = require('../../db'); // Assurez-vous que le chemin est correct

// Route pour créer une table de repos
router.post('/create-repos-table', (req, res) => {
    const { nomRepos } = req.body;
    const tableName = `Tjrepos_${nomRepos}`;

    const query = `
        CREATE TABLE ?? (
            Tjrepos_id INT AUTO_INCREMENT PRIMARY KEY,
            semaine INT,
            annee INT,
            jour_id INT,
            nom_id INT,
            FOREIGN KEY (nom_id) REFERENCES Tnom(nom_id) ON DELETE CASCADE,
            FOREIGN KEY (jour_id) REFERENCES Tjour(jour_id) ON DELETE CASCADE
        )
    `;

    connection.query(query, [tableName], (err, result) => {
        if (err) {
            console.error('Erreur lors de la création de la table de repos :', err.message);
            res.status(500).send(`Erreur lors de la création de la table de repos : ${err.message}`);
        } else {
            res.send('Table de repos créée avec succès');
        }
    });
});

// Route pour récupérer les noms des tables qui commencent par Tjrepos_
router.get('/get-repos-tables', (req, res) => {
    const query = `
        SELECT TABLE_NAME
        FROM information_schema.tables
        WHERE table_schema = DATABASE() AND TABLE_NAME LIKE 'Tjrepos_%'
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des tables de repos :', err.message);
            res.status(500).send(`Erreur lors de la récupération des tables de repos : ${err.message}`);
        } else {
            console.log('Tables trouvées :', results); // Journal de débogage
            res.json(results.map(row => row.TABLE_NAME));
        }
    });
});

// Route pour supprimer une table de repos
router.post('/delete-repos-table', (req, res) => {
    const { tableName } = req.body;

    const query = `DROP TABLE ??`;

    connection.query(query, [tableName], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression de la table de repos :', err.message);
            res.status(500).send(`Erreur lors de la suppression de la table de repos : ${err.message}`);
        } else {
            res.send('Table de repos supprimée avec succès');
        }
    });
});

// Route pour ajouter des données dans la table Tjrepos_*
router.post('/add-repos-data', (req, res) => {
    const { tableName, semaine, annee, jourId, nomId } = req.body;

    const query = `
        INSERT INTO ?? (semaine, annee, jour_id, nom_id)
        VALUES (?, ?, ?, ?)
    `;

    connection.query(query, [tableName, semaine, annee, jourId, nomId], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout des données dans', tableName, ':', err.message);
            res.status(500).send(`Erreur lors de l'ajout des données dans ${tableName} : ${err.message}`);
        } else {
            res.send('Données ajoutées avec succès');
        }
    });
});

// Route pour récupérer les nom_id disponibles pour les repos
router.get('/nom-ids-repos', (req, res) => {
    const { semaine, annee, jourId } = req.query;

    // Récupérer les noms des tables Tjrepos_
    const getTablesQuery = `
        SELECT TABLE_NAME
        FROM information_schema.tables
        WHERE table_schema = DATABASE() AND TABLE_NAME LIKE 'Tjrepos_%'
    `;

    connection.query(getTablesQuery, (err, tables) => {
        if (err) {
            console.error('Erreur lors de la récupération des tables de repos :', err.message);
            res.status(500).send(`Erreur lors de la récupération des tables de repos : ${err.message}`);
        } else {
            const tableNames = tables.map(row => row.TABLE_NAME);
            if (tableNames.length === 0) {
                res.json([]);
                return;
            }

            // Construire la requête pour vérifier les nom_id dans toutes les tables Tjrepos_ existantes pour le jour spécifique
            const queries = tableNames.map(tableName => `
                SELECT nom_id
                FROM ${tableName}
                WHERE semaine = ${connection.escape(semaine)} AND annee = ${connection.escape(annee)} AND jour_id = ${connection.escape(jourId)}
            `).join(' UNION ');

            connection.query(queries, (err, results) => {
                if (err) {
                    console.error('Erreur lors de la récupération des nom_id :', err.message);
                    res.status(500).send(`Erreur lors de la récupération des nom_id : ${err.message}`);
                } else {
                    const usedNomIds = results.map(row => row.nom_id);
                    const getNomIdsQuery = usedNomIds.length > 0 ? `
                        SELECT nom_id, nom
                        FROM Tnom
                        WHERE nom_id NOT IN (?)
                    ` : `
                        SELECT nom_id, nom
                        FROM Tnom
                    `;

                    connection.query(getNomIdsQuery, [usedNomIds], (err, nomIds) => {
                        if (err) {
                            console.error('Erreur lors de la récupération des nom_id :', err.message);
                            res.status(500).send(`Erreur lors de la récupération des nom_id : ${err.message}`);
                        } else {
                            res.json(nomIds);
                        }
                    });
                }
            });
        }
    });
});

// Route pour récupérer les données des tables Tjrepos_*
router.get('/repos-data', (req, res) => {
    const { semaine, annee } = req.query;

    // Récupérer les noms des tables Tjrepos_
    const getTablesQuery = `
        SELECT TABLE_NAME
        FROM information_schema.tables
        WHERE table_schema = DATABASE() AND TABLE_NAME LIKE 'Tjrepos_%'
    `;

    connection.query(getTablesQuery, (err, tables) => {
        if (err) {
            console.error('Erreur lors de la récupération des tables de repos :', err.message);
            res.status(500).send(`Erreur lors de la récupération des tables de repos : ${err.message}`);
        } else {
            const tableNames = tables.map(row => row.TABLE_NAME);
            if (tableNames.length === 0) {
                res.json([]);
                return;
            }

            // Construire la requête pour récupérer les données dans toutes les tables Tjrepos_ existantes
            const queries = tableNames.map(tableName => `
                SELECT ${connection.escape(tableName)} AS tableName, semaine, annee, jour_id, Tnom.nom
                FROM ${tableName}
                JOIN Tnom ON ${tableName}.nom_id = Tnom.nom_id
                WHERE semaine = ${connection.escape(semaine)} AND annee = ${connection.escape(annee)}
            `).join(' UNION ');

            connection.query(queries, (err, results) => {
                if (err) {
                    console.error('Erreur lors de la récupération des données :', err.message);
                    res.status(500).send(`Erreur lors de la récupération des données : ${err.message}`);
                } else {
                    res.json(results);
                }
            });
        }
    });
});

module.exports = router;