const express = require('express');
const router = express.Router();
const connection = require('../../db');
const authenticateToken = require('../../middleware/auth');
const validateSiteAccess = require('../../middleware/validateSiteAccess');

router.post('/nom-details', authenticateToken, validateSiteAccess(), (req, res) => {
    const { competence_id, site_id, semaine, annee, noms } = req.body;

    if (!competence_id || !site_id || !semaine || !annee || !noms) {
        return res.status(400).send('Paramètres manquants.');
    }

    const query = `
        SELECT 
            p.jour_id, n.nom, h.horaire_debut, h.horaire_fin, c.competence
        FROM 
            Tplanning p
        JOIN 
            Tnom n ON p.nom_id = n.nom_id
        JOIN 
            Thoraire h ON p.horaire_id = h.horaire_id
        JOIN 
            Tcompetence c ON p.competence_id = c.competence_id
        JOIN 
            Tplanning_Tsite pts ON p.planning_id = pts.planning_id
        WHERE 
            pts.site_id = ? AND p.semaine = ? AND p.annee = ? AND n.nom IN (?)
    `;

    connection.query(query, [site_id, semaine, annee, noms], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des détails des noms :', err.message);
            return res.status(500).send('Erreur lors de la récupération des détails des noms.');
        }

        const details = results.reduce((acc, row) => {
            if (!acc[row.nom]) acc[row.nom] = {};
            acc[row.nom][row.jour_id] = {
                horaire_debut: row.horaire_debut,
                horaire_fin: row.horaire_fin,
                competence: row.competence
            };
            return acc;
        }, {});

        res.json(details);
    });
});


module.exports = router;