const express = require('express');
const router = express.Router();
const connection = require('../../db'); // Assurez-vous que le chemin est correct
const authenticateToken = require('../../middleware/auth'); // Middleware d'authentification

router.get('/datecompetence', authenticateToken, (req, res) => {
    const { site_id, start_date, end_date } = req.query;

    if (!site_id || !start_date || !end_date) {
        return res.status(400).send('Les paramètres site_id, start_date et end_date sont requis.');
    }

    const query = `
    SELECT 
        hct.horaire_id,
        hct.competence_id,
        h.horaire_debut,
        h.horaire_fin,
        c.competence,
        hct.date_debut,
        hct.date_fin,
        cd.date_debut AS indisponibilite_debut,
        cd.date_fin AS indisponibilite_fin,
        cj.jour_id
    FROM Thoraire_competence_Tsite hct
    JOIN Thoraire h ON hct.horaire_id = h.horaire_id
    JOIN Tcompetence c ON hct.competence_id = c.competence_id
    LEFT JOIN Tcompetence_disponibilite cd ON hct.competence_id = cd.competence_id
    LEFT JOIN Thoraire_competence_jour cj ON hct.horaire_id = cj.horaire_id
    WHERE hct.site_id = ?
    AND (
        (hct.date_debut <= ? AND hct.date_fin >= ?)
        AND (
            cd.date_debut IS NULL OR cd.date_fin IS NULL OR
            NOT (cd.date_debut <= ? AND cd.date_fin >= ?)
        )
    )
    ORDER BY hct.horaire_id, hct.competence_id, cj.jour_id;
`;

    connection.query(query, [site_id, end_date, start_date, end_date, start_date], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des données :', err.message);
            return res.status(500).send('Erreur lors de la récupération des données.');
        }

        res.json(results);
    });
});




module.exports = router;