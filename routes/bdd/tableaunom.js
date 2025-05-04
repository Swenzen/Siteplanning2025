const express = require('express');
const router = express.Router();
const connection = require('../../db');
const authenticateToken = require('../../middleware/auth');


router.post('/update-nom-dates', authenticateToken, (req, res) => {
    const { nom_id, date_debut, date_fin, site_id } = req.body;
    const userSiteIds = req.user.siteIds;

    if (!userSiteIds.includes(String(site_id))) {
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    const query = `
        UPDATE Tnom
        SET date_debut = ?, date_fin = ?
        WHERE nom_id = ? AND EXISTS (
            SELECT 1 FROM Tnom_Tsite WHERE nom_id = ? AND site_id = ?
        )
    `;

    connection.query(query, [date_debut, date_fin, nom_id, nom_id, site_id], (err) => {
        if (err) {
            console.error('Erreur lors de la mise à jour des dates du nom :', err.message);
            return res.status(500).send('Erreur lors de la mise à jour des dates du nom.');
        }

        res.send('Dates mises à jour avec succès.');
    });
});


router.post('/add-nom', authenticateToken, (req, res) => {
    const { nom, date_debut, date_fin, site_id } = req.body;
    const userSiteIds = req.user.siteIds;

    if (!userSiteIds.includes(String(site_id))) {
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    const insertNomQuery = `
        INSERT INTO Tnom (nom, date_debut, date_fin)
        VALUES (?, ?, ?)
    `;

    connection.query(insertNomQuery, [nom, date_debut, date_fin], (err, nomResult) => {
        if (err) {
            console.error('Erreur lors de l\'ajout du nom :', err.message);
            return res.status(500).send('Erreur lors de l\'ajout du nom.');
        }

        const nomId = nomResult.insertId;

        const insertNomSiteQuery = `
            INSERT INTO Tnom_Tsite (nom_id, site_id)
            VALUES (?, ?)
        `;
        connection.query(insertNomSiteQuery, [nomId, site_id], (err) => {
            if (err) {
                console.error('Erreur lors de l\'association du nom au site :', err.message);
                return res.status(500).send('Erreur lors de l\'association du nom au site.');
            }

            res.status(201).send('Nom ajouté avec succès.');
        });
    });
});
router.post('/delete-nom', authenticateToken, (req, res) => {
    const { nom_id, site_id } = req.body;
    const userSiteIds = req.user.siteIds;

    if (!userSiteIds.includes(String(site_id))) {
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    const deleteNomQuery = `
        DELETE FROM Tnom
        WHERE nom_id = ? AND EXISTS (
            SELECT 1 FROM Tnom_Tsite WHERE nom_id = ? AND site_id = ?
        )
    `;

    connection.query(deleteNomQuery, [nom_id, nom_id, site_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression du nom :', err.message);
            return res.status(500).send('Erreur lors de la suppression du nom.');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Aucun nom trouvé pour ce site.');
        }

        res.send('Nom supprimé avec succès.');
    });
});


router.get('/data', authenticateToken, (req, res) => {
    const siteId = req.query.site_id; // Récupérer le site_id depuis la requête
    const userSiteIds = req.user.siteIds; // Récupérer les siteIds autorisés depuis le token

    console.log('SiteId reçu :', siteId);
    console.log('SiteIds autorisés :', userSiteIds);

    // Vérifier que le site_id est dans la liste des sites autorisés
    if (!userSiteIds.includes(siteId)) {
        console.error('Accès refusé : site_id non autorisé');
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    const query = `
        SELECT t.nom_id, t.nom, s.site_name
        FROM Tnom t
        JOIN Tnom_Tsite nts ON t.nom_id = nts.nom_id
        JOIN Tsite s ON nts.site_id = s.site_id
        WHERE nts.site_id = ?
    `;

    console.log('Requête SQL exécutée :', query);
    console.log('Paramètres SQL :', [siteId]);

    connection.query(query, [siteId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des données :', err.message);
            return res.status(500).send('Erreur lors de la récupération des données');
        }

        console.log('Données récupérées :', results);
        res.json(results);
    });
});

router.get('/noms', authenticateToken, (req, res) => {
    const siteId = req.query.site_id;

    if (!siteId) {
        console.error('Erreur : Le paramètre site_id est manquant.');
        return res.status(400).send('Le paramètre site_id est requis.');
    }

    console.log('Requête reçue pour /noms avec site_id :', siteId);

    const query = `
        SELECT 
            t.nom_id, 
            t.nom, 
            DATE_FORMAT(t.date_debut, '%Y-%m-%d') AS date_debut, -- Renvoyer uniquement la date
            DATE_FORMAT(t.date_fin, '%Y-%m-%d') AS date_fin     -- Renvoyer uniquement la date
        FROM Tnom t
        JOIN Tnom_Tsite nts ON t.nom_id = nts.nom_id
        WHERE nts.site_id = ?
    `;

    connection.query(query, [siteId], (err, results) => {
        if (err) {
            console.error('Erreur lors de l\'exécution de la requête SQL :', err.message);
            return res.status(500).send('Erreur interne du serveur.');
        }

        console.log('Résultats de la requête :', results);
        res.json(results);
    });
});

module.exports = router;