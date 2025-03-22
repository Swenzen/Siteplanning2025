const express = require('express');
const router = express.Router();
const connection = require('../db'); // Assurez-vous que le chemin est correct
const authenticateToken = require('../middleware/auth'); // Importer le middleware d'authentification


//route pour compétences tableau *
router.get('/competences', authenticateToken, (req, res) => {
    const siteId = req.query.site_id;

    if (!siteId) {
        return res.status(400).send('Le champ "site_id" est requis');
    }

    const query = `
        SELECT c.competence_id, c.competence
        FROM Tcompetence c
        JOIN Tcompetence_Tsite ct ON c.competence_id = ct.competence_id
        WHERE ct.site_id = ?
    `;

    connection.query(query, [siteId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des compétences :', err.message);
            return res.status(500).send('Erreur lors de la récupération des compétences');
        }

        res.json(results);
    });
});


// Route pour ajouter une compétence avec liaison à Tsite *
router.post('/add-competence2', (req, res) => {
    const { competence, displayOrder, site_id } = req.body;

    if (!competence || !site_id) {
        return res.status(400).send('Les champs "competence" et "site_id" sont requis');
    }

    // Étape 1 : Ajouter la compétence dans Tcompetence
    const query = 'INSERT INTO Tcompetence (competence) VALUES (?)';
    connection.query(query, [competence], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout de la compétence :', err.message);
            return res.status(500).send('Erreur lors de l\'ajout de la compétence');
        }

        const competenceId = result.insertId;

        // Étape 2 : Ajouter l'ordre d'affichage dans Tcompetence_order
        const orderQuery = 'INSERT INTO Tcompetence_order (competence_id, display_order) VALUES (?, ?)';
        connection.query(orderQuery, [competenceId, displayOrder], (err) => {
            if (err) {
                console.error('Erreur lors de l\'ajout de l\'ordre de la compétence :', err.message);
                return res.status(500).send('Erreur lors de l\'ajout de l\'ordre de la compétence');
            }

            // Étape 3 : Créer la liaison dans Tcompetence_Tsite
            const linkQuery = 'INSERT INTO Tcompetence_Tsite (competence_id, site_id) VALUES (?, ?)';
            connection.query(linkQuery, [competenceId, site_id], (err) => {
                if (err) {
                    console.error('Erreur lors de la création de la liaison compétence-site :', err.message);
                    return res.status(500).send('Erreur lors de la création de la liaison compétence-site');
                }

                res.send('Compétence ajoutée avec succès et liée au site');
            });
        });
    });
});

// Route pour supprimer une compétence liée à un site
router.post('/delete-competence', (req, res) => {
    const { competence_id, site_id } = req.body;

    if (!competence_id || !site_id) {
        return res.status(400).send('Les champs "competence_id" et "site_id" sont requis');
    }

    // Supprimer la compétence uniquement si elle est liée au site spécifié
    const deleteQuery = `
        DELETE c
        FROM Tcompetence c
        JOIN Tcompetence_Tsite ct ON c.competence_id = ct.competence_id
        WHERE c.competence_id = ? AND ct.site_id = ?
    `;

    connection.query(deleteQuery, [competence_id, site_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression de la compétence :', err.message);
            return res.status(500).send('Erreur lors de la suppression de la compétence');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Aucune compétence trouvée pour ce site');
        }

        res.send('Compétence supprimée avec succès');
    });
});

// Route pour récupérer le plus grand display_order
router.get('/max-display-order', (req, res) => {
    const query = 'SELECT MAX(display_order) AS maxDisplayOrder FROM Tcompetence_order';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération du display_order maximum :', err.message);
            res.status(500).send('Erreur lors de la récupération du display_order maximum');
        } else {
            res.json(results[0]);
        }
    });
});



module.exports = router;