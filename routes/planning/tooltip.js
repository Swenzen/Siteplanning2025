const express = require('express');
const router = express.Router();
const connection = require('../../db'); // Assurez-vous que le chemin est correct
const authenticateToken = require('../../middleware/auth'); // Middleware d'authentification

// Route pour récupérer les noms disponibles pour une compétence donnée
router.get('/nom-ids', authenticateToken, (req, res) => {
    const { competence_id, semaine, annee, jour_id } = req.query;

    // Récupérer le site_id depuis le token JWT
    const site_id = req.user.siteIds[0]; // Utiliser le premier site_id du token

    console.log('Paramètres reçus :', { competence_id, site_id, semaine, annee, jour_id });

    const query = `
        SELECT DISTINCT n.nom
        FROM Tcompetence_nom_Tsite cns
        JOIN Tnom n ON cns.nom_id = n.nom_id
        JOIN Tnom_Tsite nts ON n.nom_id = nts.nom_id
        JOIN Tcompetence_Tsite cts ON cns.competence_id = cts.competence_id
        WHERE cns.competence_id = ?
        AND nts.site_id = ?
        AND cts.site_id = ?
        AND cns.site_id = ?
        AND n.nom_id NOT IN (
            SELECT p.nom_id
            FROM Tplanning p
            JOIN Tplanning_Tsite pts ON p.planning_id = pts.planning_id
            WHERE p.semaine = ? AND p.annee = ? AND p.jour_id = ? AND pts.site_id = ?
        )
        AND n.nom_id NOT IN (
            SELECT v.nom_id
            FROM Tvacances v
            WHERE v.semaine = ? AND v.annee = ?
        )
    `;

    console.log('Requête SQL générée :', query);
    console.log('Paramètres SQL :', [competence_id, site_id, site_id, site_id, semaine, annee, jour_id, site_id, semaine, annee]);

    connection.query(
        query,
        [competence_id, site_id, site_id, site_id, semaine, annee, jour_id, site_id, semaine, annee],
        (err, results) => {
            if (err) {
                console.error('Erreur lors de l\'exécution de la requête SQL :', err.message);
                return res.status(500).send('Erreur lors de la récupération des noms');
            }

            console.log('Résultats SQL :', results);
            res.json(results.map(row => row.nom));
        }
    );
});

module.exports = router;