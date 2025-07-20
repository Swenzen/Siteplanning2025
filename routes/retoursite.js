const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth'); // Middleware pour vérifier le JWT
const connection = require('../db'); // Connexion à la base de données

// Route pour récupérer les informations du site associé à l'utilisateur
router.get('/site', authenticateToken, (req, res) => {
    const siteIds = req.user.siteIds;
    

    if (!siteIds || siteIds.length === 0) {
        console.error('Aucun site associé à cet utilisateur');
        return res.status(403).send('Aucun site associé à cet utilisateur');
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

        
        res.json({ site: results });
    });
});

module.exports = router;