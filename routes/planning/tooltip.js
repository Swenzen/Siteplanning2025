const express = require('express');
const router = express.Router();
const connection = require('../../db'); // Assurez-vous que le chemin est correct


// Route pour récupérer les noms disponibles pour une compétence donnée
router.get('/nom-ids', (req, res) => {
    const { competence_id, semaine, annee, jour_id } = req.query;
    const query = `
        SELECT n.nom
        FROM Tcompetence_nom cn
        JOIN Tnom n ON cn.nom_id = n.nom_id
        WHERE cn.competence_id = ?
        AND n.nom_id NOT IN (
            SELECT p.nom_id
            FROM Tplanning p
            WHERE p.semaine = ? AND p.annee = ? AND p.jour_id = ?
        )
    `;
    connection.query(query, [competence_id, semaine, annee, jour_id], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des noms :', err.message);
            res.status(500).send('Erreur lors de la récupération des noms');
        } else {
            res.json(results.map(row => row.nom));
        }
    });
});

module.exports = router;