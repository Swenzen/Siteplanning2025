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

// Route pour ajouter un nom (protégée) *
router.post('/add-nom', authenticateToken, (req, res) => {
    console.log('Requête reçue :', req.body); // Log pour vérifier les données reçues

    const { nom, site_id } = req.body;

    if (!nom || !site_id) {
        return res.status(400).send('Les champs "nom" et "site_id" sont requis');
    }

    // Étape 1 : Ajouter le nom dans la table Tnom
    const insertNomQuery = 'INSERT INTO Tnom (nom) VALUES (?)';
    connection.query(insertNomQuery, [nom], (err, nomResult) => {
        if (err) {
            console.error('Erreur lors de l\'ajout du nom :', err.message);
            return res.status(500).send('Erreur lors de l\'ajout du nom');
        }

        const nomId = nomResult.insertId; // Récupérer l'ID du nom inséré

        // Étape 2 : Associer le nom au site dans Tnom_Tsite
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

router.get('/site', authenticateToken, (req, res) => {
    const userId = req.user.userId; // Récupérer l'ID de l'utilisateur depuis le middleware

    const query = `
        SELECT s.site_id, s.site_name
        FROM Tsite s
        JOIN Tsite_Tuser st ON s.site_id = st.site_id
        WHERE st.user_id = ?
    `;

    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération du site :', err.message);
            res.status(500).send('Erreur lors de la récupération du site');
        } else {
            if (results.length > 0) {
                const site = results[0]; // Récupérer le premier site associé à l'utilisateur
                res.json({ site }); // Envoyer les informations du site au client
            } else {
                res.status(404).send('Aucun site associé à cet utilisateur');
            }
        }
    });
});

module.exports = router;