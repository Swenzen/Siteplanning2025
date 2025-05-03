const express = require('express');
const router = express.Router();
const connection = require('../../db'); // Assurez-vous que le chemin est correct
const authenticateToken = require('../../middleware/auth'); // Importer le middleware d'authentification


router.get('/competences', authenticateToken, (req, res) => {
    const siteId = req.query.site_id; // Récupérer le site_id depuis la requête
    const userSiteIds = req.user.siteIds; // Récupérer les siteIds autorisés depuis le token

    console.log('Requête reçue pour /competences :', { siteId, userSiteIds });

    // Vérifier que le site_id est dans la liste des sites autorisés
    if (!userSiteIds.includes(String(siteId))) {
        console.error('Accès refusé : site_id non autorisé');
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    const query = `
        SELECT c.competence_id, c.competence, cd.date_debut, cd.date_fin
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

        console.log('Compétences récupérées :', results);
        res.json(results);
    });
});


router.post('/update-competence-dates', authenticateToken, (req, res) => {
    const { competence_id, date_debut, date_fin, site_id } = req.body;
    const userSiteIds = req.user.siteIds;

    if (!userSiteIds.includes(String(site_id))) {
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    const query = `
        INSERT INTO Tcompetence_disponibilite (competence_id, date_debut, date_fin)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE date_debut = VALUES(date_debut), date_fin = VALUES(date_fin)
    `;

    connection.query(query, [competence_id, date_debut, date_fin], (err, results) => {
        if (err) {
            console.error('Erreur lors de la mise à jour des périodes :', err.message);
            return res.status(500).send('Erreur lors de la mise à jour des périodes.');
        }

        res.send('Périodes mises à jour avec succès.');
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
    const { competence_id, site_id } = req.body; // Récupérer le site_id depuis la requête
    const userSiteIds = req.user.siteIds; // Récupérer les siteIds autorisés depuis le token

    console.log('Données utilisateur (req.user) :', req.user);

    if (!competence_id || !site_id) {
        return res.status(400).send('Les champs "competence_id" et "site_id" sont requis');
    }

    // Vérifier que le site_id est dans la liste des sites autorisés
    if (!userSiteIds.includes(String(site_id))) {
        console.error('Accès refusé : site_id non autorisé');
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site');
    }

    const deleteQuery = `
        DELETE c
        FROM Tcompetence c
        JOIN Tcompetence_Tsite ct ON c.competence_id = ct.competence_id
        WHERE c.competence_id = ? AND ct.site_id = ?
    `;

    console.log('Requête SQL exécutée :', deleteQuery);
    console.log('Paramètres SQL :', [competence_id, site_id]);

    connection.query(deleteQuery, [competence_id, site_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression de la compétence :', err.message);
            return res.status(500).send('Erreur lors de la suppression de la compétence');
        }

        console.log('Résultat de la suppression :', result);

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



module.exports = router;