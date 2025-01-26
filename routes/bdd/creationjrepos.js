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

module.exports = router;