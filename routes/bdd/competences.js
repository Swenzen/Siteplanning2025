const express = require('express');
const router = express.Router();
const connection = require('../../db'); // Assurez-vous que le chemin est correct
const authenticateToken = require('../../middleware/auth'); // Importer le middleware d'authentification


router.get('/competences', authenticateToken, (req, res) => {
    const siteId = req.query.site_id; // Récupérer le site_id depuis la requête
    const userSiteIds = req.user.siteIds; // Récupérer les siteIds autorisés depuis le token

    if (!userSiteIds.includes(String(siteId))) {
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    const query = `
        SELECT c.competence_id, c.competence, c.date_debut, c.date_fin, cd.date_debut AS indisponibilite_debut, cd.date_fin AS indisponibilite_fin
        FROM Tcompetence c
        JOIN Tcompetence_Tsite ct ON c.competence_id = ct.competence_id
        LEFT JOIN Tcompetence_disponibilite cd ON c.competence_id = cd.competence_id
        WHERE ct.site_id = ?
        ORDER BY c.competence_id, cd.date_debut
    `;

    connection.query(query, [siteId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des compétences :', err.message);
            return res.status(500).send('Erreur lors de la récupération des compétences');
        }

        res.json(results);
    });
});


router.post('/update-competence-dates', authenticateToken, (req, res) => {
    const { competence_id, date_debut, date_fin, indisponibilites, site_id } = req.body;
    const userSiteIds = req.user.siteIds;

    if (!userSiteIds.includes(String(site_id))) {
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    // Mettre à jour les dates de début et de fin de la compétence
    const updateCompetenceQuery = `
        UPDATE Tcompetence
        SET date_debut = ?, date_fin = ?
        WHERE competence_id = ?
    `;

    connection.query(updateCompetenceQuery, [date_debut, date_fin, competence_id], (err) => {
        if (err) {
            console.error('Erreur lors de la mise à jour des dates de la compétence :', err.message);
            return res.status(500).send('Erreur lors de la mise à jour des dates de la compétence.');
        }

        // Supprimer les indisponibilités existantes pour cette compétence
        const deleteIndisponibilitesQuery = `
            DELETE FROM Tcompetence_disponibilite
            WHERE competence_id = ?
        `;

        connection.query(deleteIndisponibilitesQuery, [competence_id], (err) => {
            if (err) {
                console.error('Erreur lors de la suppression des indisponibilités :', err.message);
                return res.status(500).send('Erreur lors de la suppression des indisponibilités.');
            }

            // Insérer les nouvelles indisponibilités
            if (indisponibilites && indisponibilites.length > 0) {
                const insertIndisponibilitesQuery = `
                    INSERT INTO Tcompetence_disponibilite (competence_id, date_debut, date_fin)
                    VALUES ?
                `;

                const values = indisponibilites.map(ind => [competence_id, ind.date_debut, ind.date_fin]);

                connection.query(insertIndisponibilitesQuery, [values], (err) => {
                    if (err) {
                        console.error('Erreur lors de l\'insertion des indisponibilités :', err.message);
                        return res.status(500).send('Erreur lors de l\'insertion des indisponibilités.');
                    }

                    res.send('Dates et indisponibilités mises à jour avec succès.');
                });
            } else {
                res.send('Dates mises à jour avec succès (aucune indisponibilité ajoutée).');
            }
        });
    });
});



router.post('/add-competence2', authenticateToken, (req, res) => {
    const { competence, displayOrder } = req.body;
    const siteId = req.body.site_id; // Récupérer le site_id depuis la requête
    const userSiteIds = req.user.siteIds; // Récupérer les siteIds autorisés depuis le token

    console.log('Données utilisateur (req.user) :', req.user);

    if (!competence || !siteId) {
        return res.status(400).send('Les champs "competence" et "site_id" sont requis');
    }

    // Vérifier que le site_id est dans la liste des sites autorisés
    if (!userSiteIds.includes(String(siteId))) {
        console.error('Accès refusé : L\'utilisateur n\'a pas accès à ce site');
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site');
    }

    // Étape 1 : Ajouter la compétence dans Tcompetence
    const query = 'INSERT INTO Tcompetence (competence) VALUES (?)';
    connection.query(query, [competence], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout de la compétence :', err.message);
            return res.status(500).send('Erreur lors de l\'ajout de la compétence');
        }

        const competenceId = result.insertId;

        // Étape 2 : Ajouter l'ordre d'affichage dans Tcompetence_order
        const orderQuery = 'INSERT INTO Tcompetence_order (competence_id, display_order) VALUES (?, ?)';
        connection.query(orderQuery, [competenceId, displayOrder], (err) => {
            if (err) {
                console.error('Erreur lors de l\'ajout de l\'ordre de la compétence :', err.message);
                return res.status(500).send('Erreur lors de l\'ajout de l\'ordre de la compétence');
            }

            // Étape 3 : Créer la liaison dans Tcompetence_Tsite
            const linkQuery = 'INSERT INTO Tcompetence_Tsite (competence_id, site_id) VALUES (?, ?)';
            connection.query(linkQuery, [competenceId, siteId], (err) => {
                if (err) {
                    console.error('Erreur lors de la création de la liaison compétence-site :', err.message);
                    return res.status(500).send('Erreur lors de la création de la liaison compétence-site');
                }

                console.log(`Liaison créée : competence_id=${competenceId}, site_id=${siteId}`);
                res.send('Compétence ajoutée avec succès et liée au site');
            });
        });
    });
});

router.post('/delete-competence', authenticateToken, (req, res) => {
    const { competence_id, site_id } = req.body;

    console.log('Requête reçue pour /delete-competence :', req.body);

    const userSiteIds = req.user.siteIds;

    if (!competence_id || !site_id) {
        return res.status(400).send('Les champs "competence_id" et "site_id" sont requis');
    }

    if (!userSiteIds.includes(String(site_id))) {
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site');
    }

    const deleteQuery = `
        DELETE c
        FROM Tcompetence c
        JOIN Tcompetence_Tsite ct ON c.competence_id = ct.competence_id
        WHERE c.competence_id = ? AND ct.site_id = ?
    `;

    connection.query(deleteQuery, [competence_id, site_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression de la compétence :', err.message);
            return res.status(500).send('Erreur lors de la suppression de la compétence');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Aucune compétence trouvée pour ce site');
        }

        res.send('Compétence supprimée avec succès');
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

router.get('/competence-days', authenticateToken, (req, res) => {
    const siteId = req.query.site_id;

    if (!siteId) {
        return res.status(400).send('Le site_id est requis.');
    }

    const query = `
        SELECT c.competence_id, c.competence, GROUP_CONCAT(cj.jour_id) AS jours
        FROM Tcompetence c
        JOIN Tcompetence_Tsite ct ON c.competence_id = ct.competence_id
        LEFT JOIN Tcompetence_jour cj ON c.competence_id = cj.competence_id
        WHERE ct.site_id = ?
        GROUP BY c.competence_id, c.competence
    `;

    connection.query(query, [siteId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des jours par compétence :', err.message);
            return res.status(500).send('Erreur lors de la récupération des jours par compétence.');
        }

        const formattedResults = results.map(row => ({
            competence_id: row.competence_id,
            competence: row.competence,
            jours: row.jours ? row.jours.split(',').map(Number) : []
        }));

        res.json(formattedResults);
    });
});


router.post('/toggle-competence-day', authenticateToken, (req, res) => {
    const { competence_id, jour_id, is_checked, site_id } = req.body;

    if (!competence_id || !jour_id || site_id === undefined) {
        return res.status(400).send('Les champs competence_id, jour_id et site_id sont requis.');
    }

    const query = is_checked
        ? `INSERT INTO Tcompetence_jour (competence_id, jour_id) VALUES (?, ?)`
        : `DELETE FROM Tcompetence_jour WHERE competence_id = ? AND jour_id = ?`;

    connection.query(query, [competence_id, jour_id], (err) => {
        if (err) {
            console.error('Erreur lors de la mise à jour des jours par compétence :', err.message);
            return res.status(500).send('Erreur lors de la mise à jour des jours par compétence.');
        }

        res.send('Jour mis à jour avec succès.');
    });
});


router.get('/competence-disponibilites', authenticateToken, (req, res) => {
    const { competence_id, site_id } = req.query;

    const query = `
        SELECT date_debut, date_fin
        FROM Tcompetence_disponibilite
        WHERE competence_id = ? AND EXISTS (
            SELECT 1 FROM Tcompetence_Tsite WHERE competence_id = ? AND site_id = ?
        )
    `;

    connection.query(query, [competence_id, competence_id, site_id], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des indisponibilités :', err.message);
            return res.status(500).send('Erreur lors de la récupération des indisponibilités.');
        }

        res.json(results);
    });
});

router.post('/add-indisponibilite', authenticateToken, (req, res) => {
    const { competence_id, date_debut, date_fin, site_id } = req.body;

    const query = `
        INSERT INTO Tcompetence_disponibilite (competence_id, date_debut, date_fin)
        SELECT ?, ?, ?
        WHERE EXISTS (
            SELECT 1 FROM Tcompetence_Tsite WHERE competence_id = ? AND site_id = ?
        )
    `;

    connection.query(query, [competence_id, date_debut, date_fin, competence_id, site_id], (err) => {
        if (err) {
            console.error('Erreur lors de l\'ajout de l\'indisponibilité :', err.message);
            return res.status(500).send('Erreur lors de l\'ajout de l\'indisponibilité.');
        }

        res.send('Indisponibilité ajoutée avec succès.');
    });
});

router.post('/remove-indisponibilite', authenticateToken, (req, res) => {
    const { competence_id, date_debut, date_fin, site_id } = req.body;

    console.log("Requête reçue pour /remove-indisponibilite :", {
        competence_id,
        date_debut,
        date_fin,
        site_id,
    });

    // Vérifier si tous les paramètres nécessaires sont présents
    if (!competence_id || !date_debut || !date_fin || !site_id) {
        console.error("Paramètres manquants :", { competence_id, date_debut, date_fin, site_id });
        return res.status(400).send("Les champs competence_id, date_debut, date_fin et site_id sont requis.");
    }

    const query = `
        DELETE FROM Tcompetence_disponibilite
        WHERE competence_id = ? AND date_debut = ? AND date_fin = ? AND EXISTS (
            SELECT 1 
            FROM Tcompetence_Tsite 
            WHERE competence_id = ? AND site_id = ?
        )
    `;

    connection.query(query, [competence_id, date_debut, date_fin, competence_id, site_id], (err, results) => {
        if (err) {
            console.error("Erreur lors de la suppression de l'indisponibilité :", err.message);
            return res.status(500).send("Erreur lors de la suppression de l'indisponibilité.");
        }

        console.log("Résultats de la requête DELETE :", results);

        if (results.affectedRows === 0) {
            console.warn("Aucune ligne supprimée. Vérifiez les paramètres :", {
                competence_id,
                date_debut,
                date_fin,
                site_id,
            });
            return res.status(404).send("Aucune indisponibilité trouvée pour ces paramètres.");
        }

        res.send("Indisponibilité supprimée avec succès.");
    });
});

module.exports = router;