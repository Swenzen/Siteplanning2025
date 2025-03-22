const express = require('express');
const router = express.Router();
const connection = require('../db'); // Assurez-vous que le chemin est correct

// Route pour récupérer les compétences
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

// Route pour ajouter une compétence
router.post('/add-competence2', (req, res) => {
    const { competence, displayOrder } = req.body;
    const query = 'INSERT INTO Tcompetence (competence) VALUES (?)';
    connection.query(query, [competence], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout de la compétence :', err.message);
            res.status(500).send('Erreur lors de l\'ajout de la compétence');
        } else {
            const competenceId = result.insertId;
            const orderQuery = 'INSERT INTO Tcompetence_order (competence_id, display_order) VALUES (?, ?)';
            connection.query(orderQuery, [competenceId, displayOrder], (err, result) => {
                if (err) {
                    console.error('Erreur lors de l\'ajout de l\'ordre de la compétence :', err.message);
                    res.status(500).send('Erreur lors de l\'ajout de l\'ordre de la compétence');
                } else {
                    res.send('Compétence ajoutée avec succès');
                }
            });
        }
    });
});

// Route pour supprimer une compétence
router.post('/delete-competence', (req, res) => {
    const { competence_id } = req.body;
    const query = 'DELETE FROM Tcompetence WHERE competence_id = ?';
    connection.query(query, [competence_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression de la compétence :', err.message);
            res.status(500).send('Erreur lors de la suppression de la compétence');
        } else {
            res.send('Compétence supprimée avec succès');
        }
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