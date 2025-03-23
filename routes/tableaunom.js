const express = require('express');
const router = express.Router();
const connection = require('../db'); // Importer la connexion à la base de données
const authenticateToken = require('../middleware/auth'); // Importer le middleware d'authentification

// Route pour mettre à jour le nom (protégée)
router.post('/update-name', authenticateToken, (req, res) => {
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

    // Vérifier si l'utilisateur a accès au site_id
    if (!req.user.siteIds.includes(String(site_id))) {
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site');
    }

    // Logique pour ajouter un nom
    const insertNomQuery = 'INSERT INTO Tnom (nom) VALUES (?)';
    connection.query(insertNomQuery, [nom], (err, nomResult) => {
        if (err) {
            console.error('Erreur lors de l\'ajout du nom :', err.message);
            return res.status(500).send('Erreur lors de l\'ajout du nom');
        }

        const nomId = nomResult.insertId;

        const insertNomSiteQuery = 'INSERT INTO Tnom_Tsite (nom_id, site_id) VALUES (?, ?)';
        connection.query(insertNomSiteQuery, [nomId, site_id], (err) => {
            if (err) {
                console.error('Erreur lors de l\'association du nom au site :', err.message);
                return res.status(500).send('Erreur lors de l\'association du nom au site');
            }

            res.status(201).send('Nom ajouté et associé au site avec succès');
        });
    });
});

// Route pour supprimer un nom (protégée)

router.post('/delete-nom', authenticateToken, (req, res) => {
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
    const userId = req.user.userId; // Récupérer l'ID de l'utilisateur depuis le middleware

    const query = `
SELECT t.nom_id, t.nom, s.site_name
FROM Tnom t
JOIN Tnom_Tsite nts ON t.nom_id = nts.nom_id
JOIN Tsite s ON nts.site_id = s.site_id
JOIN Tsite_Tuser st ON s.site_id = st.site_id
WHERE st.user_id = ?;
    `;
    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des noms :', err.message);
            res.status(500).send('Erreur lors de la récupération des noms');
        } else {
            res.json(results); // Renvoie les noms et les sites associés à l'utilisateur
        }
    });
});

router.get('/api/data', authenticateToken, (req, res) => {
    const query = 'SELECT nom_id, nom FROM Tnom';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des noms :', err.message);
            res.status(500).send('Erreur lors de la récupération des noms');
        } else {
            res.json(results); // Renvoie les données au client
        }
    });
});

// Route pour récupérer les informations des sites associés à l'utilisateur
router.get('/site', authenticateToken, (req, res) => {
    const siteIds = req.user.siteIds; // Récupérer les siteIds depuis le token JWT

    if (!siteIds || siteIds.length === 0) {
        return res.status(400).send('Aucun site associé à cet utilisateur');
    }

    const query = `
        SELECT site_id, site_name
        FROM Tsite
        WHERE site_id IN (?)
    `;

    connection.query(query, [siteIds], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des sites :', err.message);
            return res.status(500).send('Erreur lors de la récupération des sites');
        }

        res.json({ sites: results });
    });
});

module.exports = router;