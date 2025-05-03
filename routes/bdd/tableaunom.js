const express = require('express');
const router = express.Router();
const connection = require('../../db');
const authenticateToken = require('../../middleware/auth');

router.post('/update-name', authenticateToken, (req, res) => {
    const { nom_id, nom, date_debut, date_fin } = req.body;

    if (!nom_id || !nom || !date_debut || !date_fin) {
        return res.status(400).send('Les champs nom_id, nom, date_debut et date_fin sont requis.');
    }

    const query = `
        UPDATE Tnom
        SET nom = ?, date_debut = ?, date_fin = ?
        WHERE nom_id = ?
    `;

    connection.query(query, [nom, date_debut, date_fin, nom_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la mise à jour du nom :', err.message);
            return res.status(500).send('Erreur lors de la mise à jour du nom.');
        }

        res.send('Nom mis à jour avec succès.');
    });
});



router.post('/add-nom', authenticateToken, (req, res) => {
    const { nom, date_debut, date_fin, site_id } = req.body; // Inclure les dates et le site_id
    const userSiteIds = req.user.siteIds; // Récupérer les sites autorisés depuis le token

    console.log('Requête reçue :', { nom, date_debut, date_fin, site_id, userSiteIds });

    if (!nom || !date_debut || !date_fin || !site_id) {
        return res.status(400).send('Données manquantes (nom, date_debut, date_fin ou site_id)');
    }

    // Vérifier que le site_id est dans la liste des sites autorisés
    if (!userSiteIds.includes(String(site_id))) {
        console.error('Accès refusé : L\'utilisateur n\'a pas accès à ce site');
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site');
    }

    const insertNomQuery = `
        INSERT INTO Tnom (nom, date_debut, date_fin)
        VALUES (?, ?, ?)
    `;

    connection.query(insertNomQuery, [nom, date_debut, date_fin], (err, nomResult) => {
        if (err) {
            console.error('Erreur lors de l\'ajout du nom :', err.message);
            return res.status(500).send('Erreur lors de l\'ajout du nom');
        }

        const nomId = nomResult.insertId;

        const insertNomSiteQuery = `
            INSERT INTO Tnom_Tsite (nom_id, site_id)
            VALUES (?, ?)
        `;
        connection.query(insertNomSiteQuery, [nomId, site_id], (err) => {
            if (err) {
                console.error('Erreur lors de l\'association du nom au site :', err.message);
                return res.status(500).send('Erreur lors de l\'association du nom au site');
            }

            console.log('Nom ajouté avec succès :', { nomId, site_id });
            res.status(201).send('Nom ajouté avec succès');
        });
    });
});

router.post('/delete-nom', authenticateToken, (req, res) => {
    const { nom_id, site_id } = req.body; // Récupérer le site_id depuis la requête
    const userSiteIds = req.user.siteIds; // Récupérer les siteIds autorisés depuis le token

    console.log('Requête reçue pour /delete-nom :', { nom_id, site_id, userSiteIds });

    if (!nom_id || !site_id) {
        console.error('Erreur : Les champs "nom_id" et "site_id" sont requis');
        return res.status(400).send('Les champs "nom_id" et "site_id" sont requis');
    }

    // Vérifier que le site_id est dans la liste des sites autorisés
    if (!userSiteIds.includes(String(site_id))) {
        console.error('Accès refusé : site_id non autorisé');
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site');
    }

    const deleteNomQuery = `
        DELETE FROM Tnom
        WHERE nom_id = ?
    `;

    connection.query(deleteNomQuery, [nom_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression du nom :', err.message);
            return res.status(500).send('Erreur lors de la suppression du nom');
        }

        if (result.affectedRows === 0) {
            console.error('Aucun nom trouvé pour nom_id :', nom_id);
            return res.status(404).send('Aucun nom trouvé pour ce nom_id');
        }

        console.log(`Nom supprimé avec succès pour nom_id: ${nom_id}`);
        res.send('Nom supprimé avec succès');
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
        SELECT t.nom_id, t.nom, t.date_debut, t.date_fin
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