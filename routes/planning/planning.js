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
    c.repos,
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

// Récupérer les vacances par jour pour un site et une période
router.get('/vacancesv2', authenticateToken, (req, res) => {
    const { site_id, start_date, end_date } = req.query;
    if (!site_id || !start_date || !end_date) {
        return res.status(400).send('Paramètres manquants');
    }

    const query = `
        SELECT v.date, n.nom, n.nom_id
        FROM Tvacancesv2 v
        JOIN Tnom n ON v.nom_id = n.nom_id
        WHERE v.site_id = ?
          AND v.date BETWEEN ? AND ?
        ORDER BY v.date, n.nom
    `;

    connection.query(query, [site_id, start_date, end_date], (err, results) => {
        if (err) {
            console.error('Erreur SQL vacancesv2:', err.message);
            return res.status(500).send('Erreur lors de la récupération des vacances');
        }
        res.json(results);
    });
});


router.get('/available-count', authenticateToken, (req, res) => {
    const { site_id, dates } = req.query;
    if (!site_id || !dates) {
        return res.status(400).send('Paramètres manquants');
    }
    const dateList = dates.split(',');

    const dateSelect = dateList.map(() => 'SELECT ? AS date').join(' UNION ALL ');
    const allParams = [...dateList, site_id, site_id, site_id];

    const query = `
      SELECT d.date, COUNT(n.nom_id) AS dispo
      FROM (
        ${dateSelect}
      ) d
      JOIN Tnom_Tsite nts ON nts.site_id = ?
      JOIN Tnom n ON n.nom_id = nts.nom_id
      WHERE n.nom_id NOT IN (
        SELECT nom_id FROM Tplanningv2 WHERE date = d.date AND site_id = ?
        UNION
        SELECT nom_id FROM Tvacancesv2 WHERE date = d.date AND site_id = ?
      )
      AND d.date BETWEEN n.date_debut AND n.date_fin
      GROUP BY d.date
    `;

    connection.query(query, allParams, (err, results) => {
        if (err) {
            console.error('Erreur SQL available-count:', err.message);
            return res.status(500).send('Erreur lors du comptage des personnes disponibles');
        }
        const obj = {};
        dateList.forEach(date => obj[date] = 0);
        results.forEach(row => {
            obj[row.date] = row.dispo;
        });
        res.json(obj);
    });
});

router.get('/competence-horaire-dates', authenticateToken, (req, res) => {
    const { site_id } = req.query;
    if (!site_id) {
        return res.status(400).send('Paramètre site_id manquant');
    }

    const query = `
        SELECT 
            hct.competence_id,
            hct.horaire_id,
            c.date_debut,
            c.date_fin
        FROM Thoraire_competence_Tsite hct
        JOIN Tcompetence c ON hct.competence_id = c.competence_id
        WHERE hct.site_id = ?
    `;

    connection.query(query, [site_id], (err, results) => {
        if (err) {
            console.error('Erreur SQL competence-horaire-dates:', err.message);
            return res.status(500).send('Erreur lors de la récupération des dates d\'ouverture');
        }
        res.json(results);
    });
});
module.exports = router;