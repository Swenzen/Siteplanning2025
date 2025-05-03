const express = require('express');
const router = express.Router();
const connection = require('../../db'); // Assurez-vous que le chemin est correct
const authenticateToken = require('../../middleware/auth'); // Middleware d'authentification

router.get('/datecompetence', authenticateToken, (req, res) => {
    const { start_date, end_date, site_id } = req.query;

    if (!site_id || !start_date || !end_date) {
        return res.status(400).send('Les paramètres "site_id", "start_date" et "end_date" sont requis.');
    }

    const query = `
    SELECT c.competence_id, c.competence, 
           c.date_debut, 
           c.date_fin,
           cd.date_debut AS indisponibilite_debut,
           cd.date_fin AS indisponibilite_fin
    FROM Tcompetence c
    JOIN Tcompetence_Tsite cs ON c.competence_id = cs.competence_id
    LEFT JOIN Tcompetence_disponibilite cd ON c.competence_id = cd.competence_id
    WHERE cs.site_id = ?
      AND c.date_debut <= ?
      AND c.date_fin >= ?
`;

    const queryParams = [site_id, end_date, start_date];

    connection.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des compétences :', err.message);
            return res.status(500).send('Erreur lors de la récupération des compétences.');
        }

        res.json(results);
    });
});




module.exports = router;