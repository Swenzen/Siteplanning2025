const express = require('express');
const router = express.Router();
const connection = require('../../db'); // Assurez-vous que le chemin est correct

// Route pour mettre à jour l'ordre des compétences
router.post('/update-competence-order', (req, res) => {
    const order = req.body;

    if (!Array.isArray(order) || order.length === 0) {
        return res.status(400).send('Données invalides');
    }

    const updateQueries = order.map(({ competenceId, displayOrder }) => {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO Tcompetence_order (competence_id, display_order)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE display_order = VALUES(display_order)
            `;
            connection.query(query, [competenceId, displayOrder], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    });

    Promise.all(updateQueries)
        .then(results => {
            res.send('Ordre des compétences mis à jour avec succès');
        })
        .catch(err => {
            console.error('Erreur lors de la mise à jour de l\'ordre des compétences :', err.message);
            res.status(500).send('Erreur lors de la mise à jour de l\'ordre des compétences');
        });
});

module.exports = router;