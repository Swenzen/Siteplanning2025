const express = require('express');
const router = express.Router();
const connection = require('../db'); // Importer la connexion à la base de données
const authenticateToken = require('../middleware/auth'); // Importer le middleware d'authentification

// Route pour mettre à jour le nom (protégée)
router.post('/update-name', authenticateToken, (req, res) => {
    console.log('Requête reçue :', req.body);
    const { nom_id, nom } = req.body;
    const query = 'UPDATE Tnom SET nom = ? WHERE nom_id = ?';

    connection.query(query, [nom, nom_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la mise à jour du nom :', err.message);
            res.status(500).send('Erreur lors de la mise à jour');
            return;
        }
        res.send('Nom mis à jour avec succès');
    });
});




router.post('/add-nom', authenticateToken, (req, res) => {
    const { nom, site_id } = req.body;

    if (!req.user.siteIds.includes(String(site_id))) {
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site');
    }

    const insertNomQuery = 'INSERT INTO Tnom (nom) VALUES (?)';
    connection.query(insertNomQuery, [nom], (err, nomResult) => {
        if (err) {
            return res.status(500).send('Erreur lors de l\'ajout du nom');
        }

        const nomId = nomResult.insertId;

        const insertNomSiteQuery = 'INSERT INTO Tnom_Tsite (nom_id, site_id) VALUES (?, ?)';
        connection.query(insertNomSiteQuery, [nomId, site_id], (err) => {
            if (err) {
                return res.status(500).send('Erreur lors de l\'association du nom au site');
            }

            res.status(201).send('Nom ajouté avec succès');
        });
    });
});

// Route pour supprimer un nom (protégée)

router.post('/delete-nom', authenticateToken, (req, res) => {
    console.log('Requête reçue :', req.body);
    const { nom_id } = req.body;

    if (!nom_id) {
        return res.status(400).send('Le champ "nom_id" est requis');
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

        console.log(`Nom supprimé avec succès pour nom_id: ${nom_id}`);
        res.send('Nom supprimé avec succès');
    });
});


router.get('/data', authenticateToken, (req, res) => {
    const siteIds = req.user.siteIds;

    const query = `
        SELECT t.nom, s.site_name
        FROM Tnom t
        JOIN Tnom_Tsite nts ON t.nom_id = nts.nom_id
        JOIN Tsite s ON nts.site_id = s.site_id
        WHERE nts.site_id IN (?)
    `;

    connection.query(query, [siteIds], (err, results) => {
        if (err) {
            return res.status(500).send('Erreur lors de la récupération des données');
        }

        res.json(results);
    });
});


module.exports = router;