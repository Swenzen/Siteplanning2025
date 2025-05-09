const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth'); // Middleware pour vérifier le JWT
const connection = require('../db'); // Connexion à la base de données

// Route pour récupérer les informations du site associé à l'utilisateur
router.get('/site', authenticateToken, (req, res) => {
    console.log('Requête reçue pour /api/site');
    const siteIds = req.user.siteIds;
    console.log('SiteIds extraits du token :', req.user.siteIds);

    if (!siteIds || siteIds.length === 0) {
        console.error('Aucun site associé à cet utilisateur');
        return res.status(403).send('Aucun site associé à cet utilisateur');
    }

    const query = `
        SELECT site_id, site_name
        FROM Tsite
        WHERE site_id IN (?)
    `;

    console.log('Requête SQL exécutée :', query);
    console.log('Paramètres SQL :', [siteIds]);

    connection.query(query, [siteIds], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des sites :', err.message);
            return res.status(500).send('Erreur lors de la récupération des sites');
        }

        console.log('Sites récupérés :', results);
        res.json({ site: results });
    });
});

module.exports = router;