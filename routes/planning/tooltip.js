const express = require('express');
const router = express.Router();
const connection = require('../../db'); // Assurez-vous que le chemin est correct
const authenticateToken = require('../../middleware/auth'); // Middleware d'authentification

// Route pour récupérer les noms disponibles pour une compétence donnée
router.get('/nom-ids', authenticateToken, (req, res) => {
    const { competence_id, semaine, annee, jour_id } = req.query;
    const site_id = req.query.site_id;
    const userSiteIds = req.user.siteIds;

    if (!userSiteIds.includes(String(site_id))) {
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    const query = `
        SELECT DISTINCT n.nom, n.nom_id
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
            SELECT p.nom_id
            FROM Tplanning p
            JOIN Tplanning_Trepos_Tsite tpt ON p.planning_id = tpt.planning_id
            JOIN Trepos_Tsite trs ON tpt.repos_id = trs.repos_id
            WHERE p.semaine = ? AND p.annee = ? AND p.jour_id = ? AND trs.site_id = ?
        )
        AND n.nom_id NOT IN (
            SELECT v.nom_id
            FROM Tvacances v
            JOIN Tvacances_Tsite vt ON v.vacances_id = vt.vacances_id
            WHERE v.semaine = ? AND v.annee = ? AND vt.site_id = ?
        )
    `;

    connection.query(
        query,
        [
            competence_id, site_id, site_id, site_id,
            semaine, annee, jour_id, site_id,
            semaine, annee, jour_id, site_id,
            semaine, annee, site_id
        ],
        (err, results) => {
            if (err) {
                return res.status(500).send('Erreur lors de la récupération des noms');
            }
            // Ici, on renvoie [{ nom: ..., nom_id: ... }, ...]
            res.json(results);
        }
    );
});

router.get('/available-names', authenticateToken, (req, res) => {
    const { competence_id, site_id, date } = req.query;

    if (!competence_id || !site_id || !date) {
        return res.status(400).send('Les paramètres competence_id, site_id et date sont requis.');
    }

    const query = `
        SELECT DISTINCT n.nom, n.nom_id
        FROM Tcompetence_nom_Tsite cns
        JOIN Tnom n ON cns.nom_id = n.nom_id
        WHERE cns.competence_id = ?
          AND cns.site_id = ?
          AND n.nom_id NOT IN (
              SELECT p.nom_id
              FROM Tplanningv2 p
              WHERE p.date = ? AND p.site_id = ?
          )
    `;

    connection.query(
        query,
        [competence_id, site_id, date, site_id],
        (err, results) => {
            if (err) {
                console.error('Erreur lors de la récupération des noms disponibles :', err.message);
                return res.status(500).send('Erreur lors de la récupération des noms disponibles.');
            }
            res.json(results);
        }
    );
});
router.post('/update-planningv2', authenticateToken, (req, res) => {
    const { date, nom_id, competence_id, horaire_id, site_id } = req.body;

    if (!date || !nom_id || !competence_id || !horaire_id || !site_id) {
        return res.status(400).send('Tous les champs sont requis.');
    }

    const query = `
        INSERT INTO Tplanningv2 (date, nom_id, competence_id, horaire_id, site_id)
        VALUES (?, ?, ?, ?, ?)
    `;

    connection.query(
        query,
        [date, nom_id, competence_id, horaire_id, site_id],
        (err) => {
            if (err) {
                console.error('Erreur lors de la mise à jour de Tplanningv2 :', err.message);
                return res.status(500).send('Erreur lors de la mise à jour de Tplanningv2.');
            }

            res.send('Planning mis à jour avec succès.');
        }
    );
});

router.post('/delete-planningv2', authenticateToken, (req, res) => {
    const { date, nom_id, competence_id, horaire_id, site_id } = req.body;
    const userSiteIds = req.user.siteIds; // Sites autorisés pour l'utilisateur

    // Vérification des paramètres
    if (!date || !nom_id || !competence_id || !horaire_id || !site_id) {
        return res.status(400).send('Tous les champs sont requis.');
    }

    // Vérification de l'accès au site
    if (!userSiteIds.includes(String(site_id))) {
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    const query = `
        DELETE FROM Tplanningv2
        WHERE date = ? AND nom_id = ? AND competence_id = ? AND horaire_id = ? AND site_id = ?
        LIMIT 1
    `;

    connection.query(
        query,
        [date, nom_id, competence_id, horaire_id, site_id],
        (err, result) => {
            if (err) {
                console.error('Erreur lors de la suppression dans Tplanningv2 :', err.message);
                return res.status(500).send('Erreur lors de la suppression dans Tplanningv2.');
            }
            if (result.affectedRows === 0) {
                return res.status(404).send('Aucune entrée trouvée à supprimer.');
            }
            res.send('Suppression réussie.');
        }
    );
});

router.post('/delete-vacancev2', authenticateToken, (req, res) => {
  const { date, nom_id, site_id } = req.body;
  if (!date || !nom_id || !site_id) {
    return res.status(400).send('Paramètres manquants');
  }
  const sql = `DELETE FROM Tvacancesv2 WHERE date = ? AND nom_id = ? AND site_id = ?`;
  connection.query(sql, [date, nom_id, site_id], (err, result) => {
    if (err) {
      console.error('Erreur SQL delete-vacancev2:', err.message);
      return res.status(500).send('Erreur lors de la suppression');
    }
    res.sendStatus(200);
  });
});

router.get('/available-vacance-names', authenticateToken, (req, res) => {
  const { site_id, date } = req.query;
  if (!site_id || !date) {
    return res.status(400).send('Paramètres site_id et date requis.');
  }

  const query = `
    SELECT n.nom, n.nom_id
    FROM Tnom n
    INNER JOIN Tnom_Tsite nts ON n.nom_id = nts.nom_id
    WHERE nts.site_id = ?
      AND n.nom_id NOT IN (
        SELECT v.nom_id
        FROM Tvacancesv2 v
        WHERE v.site_id = ? AND v.date = ?
      )
      AND n.nom_id NOT IN (
        SELECT p.nom_id
        FROM Tplanningv2 p
        WHERE p.site_id = ? AND p.date = ?
      )
    ORDER BY n.nom
  `;

  connection.query(query, [site_id, site_id, date, site_id, date], (err, results) => {
    if (err) {
      console.error('Erreur SQL available-vacance-names:', err.message);
      return res.status(500).send('Erreur lors de la récupération des noms disponibles');
    }
    res.json(results);
  });
});

router.post('/ajouter-vacance', authenticateToken, (req, res) => {
  const { site_id, nom_id, date } = req.body;
  if (!site_id || !nom_id || !date) {
    return res.status(400).send('Paramètres manquants');
  }

  const sql = `
    INSERT INTO Tvacancesv2 (site_id, nom_id, date)
    VALUES (?, ?, ?)
  `;

  connection.query(sql, [site_id, nom_id, date], (err) => {
    if (err) {
      // Gestion du doublon (déjà en vacances ce jour-là)
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).send('Déjà en vacances ce jour-là');
      }
      console.error('Erreur SQL ajouter-vacance:', err.message);
      return res.status(500).send('Erreur lors de l\'ajout');
    }
    res.sendStatus(200);
  });
});


//rotue tolltip vacs
router.get('/available-vacance-names-multi', authenticateToken, (req, res) => {
  const { site_id, start_date, end_date } = req.query;
  if (!site_id || !start_date || !end_date) {
    return res.status(400).send('Paramètres manquants');
  }
  const query = `
    SELECT n.nom, n.nom_id
    FROM Tnom n
    INNER JOIN Tnom_Tsite nts ON n.nom_id = nts.nom_id
    WHERE nts.site_id = ?
      AND n.nom_id NOT IN (
        SELECT v.nom_id
        FROM Tvacancesv2 v
        WHERE v.site_id = ?
          AND v.date BETWEEN ? AND ?
      )
      AND n.nom_id NOT IN (
        SELECT p.nom_id
        FROM Tplanningv2 p
        WHERE p.site_id = ? AND p.date BETWEEN ? AND ?
      )
    ORDER BY n.nom
  `;
  connection.query(query, [site_id, site_id, start_date, end_date, site_id, start_date, end_date], (err, results) => {
    if (err) {
      console.error('Erreur SQL available-vacance-names-multi:', err.message);
      return res.status(500).send('Erreur lors de la récupération des noms disponibles');
    }
    res.json(results);
  });
});

router.post('/ajouter-vacance-multi', authenticateToken, (req, res) => {
  const { site_id, nom_id, dates } = req.body;
  if (!site_id || !nom_id || !dates || !Array.isArray(dates)) {
    return res.status(400).send('Paramètres manquants');
  }
  const values = dates.map(date => [date, nom_id, site_id]);
  const sql = `
    INSERT IGNORE INTO Tvacancesv2 (date, nom_id, site_id)
    VALUES ?
  `;
  connection.query(sql, [values], (err) => {
    if (err) {
      console.error('Erreur SQL ajouter-vacance-multi:', err.message);
      return res.status(500).send('Erreur lors de l\'ajout');
    }
    res.sendStatus(200);
  });
});

module.exports = router;