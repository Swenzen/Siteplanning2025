const express = require('express');
const router = express.Router();
const connection = require('../../db'); // Assurez-vous que le chemin est correct
const authenticateToken = require('../../middleware/auth'); // Middleware d'authentification

router.get('/datecompetencewithnames', authenticateToken, (req, res) => {
    const { site_id, start_date, end_date } = req.query;

    if (!site_id || !start_date || !end_date) {
        return res.status(400).send('Les paramètres site_id, start_date et end_date sont requis.');
    }

    const query = `
WITH RECURSIVE dates AS (
  SELECT DATE(?) AS date
  UNION ALL
  SELECT DATE_ADD(date, INTERVAL 1 DAY)
  FROM dates
  WHERE date < DATE(?)
)
SELECT 
    hct.horaire_id,
    hct.competence_id,
    h.horaire_debut,
    h.horaire_fin,
    c.competence,
    c.date_debut AS competence_date_debut,
    c.date_fin AS competence_date_fin,
    d.date,
    n.nom,
    n.nom_id,
    comm.commentaire,
    comm.nom_id AS commentaire_nom_id,
    CASE 
        WHEN d.date IS NOT NULL THEN 
            CASE WHEN DAYOFWEEK(d.date) = 1 THEN 7 ELSE DAYOFWEEK(d.date) - 1 END
        ELSE NULL
    END AS jour_id,
    CASE 
        WHEN 
            hcj.horaire_id IS NOT NULL
            AND d.date >= c.date_debut
            AND d.date <= c.date_fin
        THEN 1
        ELSE 0
    END AS ouverture
FROM Thoraire_competence_Tsite hct
JOIN Thoraire h ON hct.horaire_id = h.horaire_id
JOIN Tcompetence c ON hct.competence_id = c.competence_id
JOIN Tcompetence_order co ON c.competence_id = co.competence_id
JOIN dates d
LEFT JOIN Tplanningv2 p 
    ON hct.horaire_id = p.horaire_id 
    AND hct.competence_id = p.competence_id 
    AND hct.site_id = p.site_id
    AND p.date = d.date
LEFT JOIN Tnom n ON p.nom_id = n.nom_id
LEFT JOIN Thoraire_competence_jour hcj
    ON hct.horaire_id = hcj.horaire_id
    AND hct.competence_id = hcj.competence_id
    AND hcj.site_id = hct.site_id
    AND hcj.jour_id = CASE WHEN DAYOFWEEK(d.date) = 1 THEN 7 ELSE DAYOFWEEK(d.date) - 1 END
LEFT JOIN Tcommentairev2 comm
    ON comm.site_id = hct.site_id
    AND comm.competence_id = hct.competence_id
    AND comm.horaire_id = hct.horaire_id
    AND comm.date = d.date
    AND (comm.nom_id = n.nom_id OR (comm.nom_id IS NULL AND n.nom_id IS NULL))
WHERE hct.site_id = ?
  AND d.date BETWEEN ? AND ?
ORDER BY co.display_order ASC, hct.horaire_id, d.date;
    `;

    connection.query(query, [start_date, end_date, site_id, start_date, end_date], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des données :', err.message);
            return res.status(500).send('Erreur lors de la récupération des données.');
        }

        res.json(results);
    });
});


module.exports = router;