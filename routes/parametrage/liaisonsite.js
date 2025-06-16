const express = require('express');
const router = express.Router();
const connection = require('../../db'); // Assurez-vous que le chemin est correct
const authenticateToken = require('../../middleware/auth'); // Middleware pour vérifier le JWT

// Route pour définir un code personnalisé
router.post('/set-custom-code', authenticateToken, (req, res) => {
    const { customCode, siteId } = req.body; // Récupérer siteId depuis le corps de la requête
    const userId = req.user.userId;

    if (!customCode) {
        return res.status(400).send('Code personnalisé manquant');
    }

    if (!siteId) {
        return res.status(400).send('Site ID manquant');
    }

    // Vérifier si l'utilisateur a accès au site
    const query = `
        SELECT site_id FROM Tuser_Tsite WHERE user_id = ? AND site_id = ? LIMIT 1
    `;

    connection.query(query, [userId, siteId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la vérification du site :', err.message);
            return res.status(500).send('Erreur interne');
        }

        if (results.length === 0) {
            return res.status(403).send('Accès non autorisé au site spécifié');
        }

        // Insérer ou mettre à jour le code personnalisé pour le site
        const insertQuery = `
            INSERT INTO Tsite_access (site_id, access_code)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE access_code = VALUES(access_code)
        `;

        connection.query(insertQuery, [siteId, customCode], (err) => {
            if (err) {
                console.error('Erreur lors de la définition du code personnalisé :', err.message);
                return res.status(500).send('Erreur interne');
            }

            res.status(200).send('Code personnalisé défini avec succès');
        });
    });
});

// Route pour rejoindre un site avec un code d'accès
router.post('/join-site', authenticateToken, (req, res) => {
    const { accessCode } = req.body;
    const userId = req.user.userId; // Récupérer l'ID de l'utilisateur depuis le token

    if (!accessCode) {
        return res.status(400).send('Code d\'accès manquant');
    }

    console.log('Requête pour rejoindre un site :', { userId, accessCode });

    const query = `
        SELECT site_id FROM Tsite_access WHERE access_code = ?
    `;

    connection.query(query, [accessCode], (err, results) => {
        if (err) {
            console.error('Erreur SQL lors de la recherche du code d\'accès :', err.message);
            return res.status(500).send('Erreur interne');
        }

        if (results.length === 0) {
            console.log('Code d\'accès invalide :', accessCode);
            return res.status(404).send('Code d\'accès invalide');
        }

        const siteId = results[0].site_id;
        console.log('Site trouvé :', siteId);

        const insertQuery = `
            INSERT INTO Tuser_Tsite (user_id, site_id) VALUES (?, ?)
        `;

        connection.query(insertQuery, [userId, siteId], (err) => {
            if (err) {
                console.error('Erreur SQL lors de l\'ajout de l\'utilisateur au site :', err.message);
                return res.status(500).send('Erreur interne');
            }

            console.log('Utilisateur ajouté au site avec succès :', { userId, siteId });

            // Supprimer le code d'accès après utilisation
            const deleteQuery = `
                DELETE FROM Tsite_access WHERE access_code = ?
            `;

            connection.query(deleteQuery, [accessCode], (err) => {
                if (err) {
                    console.error('Erreur lors de la suppression du code d\'accès :', err.message);
                    return res.status(500).send('Erreur interne');
                }

                res.status(200).send('Accès au site accordé avec succès et code supprimé');
            });
        });
    });
});

// Route pour récupérer le code d'accès du site
router.get('/get-access-code', authenticateToken, (req, res) => {
    const userId = req.user.userId; // Récupérer l'ID de l'utilisateur depuis le token

    const query = `
        SELECT sa.access_code
        FROM Tsite_access sa
        JOIN Tuser_Tsite uts ON sa.site_id = uts.site_id
        WHERE uts.user_id = ?
        LIMIT 1
    `;

    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération du code d\'accès :', err.message);
            return res.status(500).send('Erreur interne');
        }

        if (results.length === 0) {
            return res.status(404).send('Aucun code d\'accès trouvé pour cet utilisateur');
        }

        res.json({ accessCode: results[0].access_code });
    });
});

// Route pour créer un nouveau site
router.post('/create-site', authenticateToken, (req, res) => {
    const { siteName } = req.body;
    const userId = req.user.userId;

    if (!siteName) {
        return res.status(400).send('Nom du site manquant');
    }

    const insertQuery = `
        INSERT INTO Tsite (site_name) VALUES (?)
    `;

    connection.query(insertQuery, [siteName], (err, results) => {
        if (err) {
            console.error('Erreur lors de la création du site :', err.message);
            return res.status(500).send('Erreur interne');
        }

        const siteId = results.insertId;

        const linkQuery = `
            INSERT INTO Tuser_Tsite (user_id, site_id) VALUES (?, ?)
        `;

        connection.query(linkQuery, [userId, siteId], (err) => {
            if (err) {
                console.error('Erreur lors de l\'association de l\'utilisateur au site :', err.message);
                return res.status(500).send('Erreur interne');
            }

            res.status(200).send('Site créé et associé à l\'utilisateur avec succès');
        });
    });
});

// Route pour supprimer la liaison entre un utilisateur et un site
router.delete('/delete-site-link', authenticateToken, (req, res) => {
    const { siteId } = req.body; // Récupérer le siteId depuis le corps de la requête
    const userId = req.user.userId; // Récupérer l'ID de l'utilisateur depuis le token

    if (!siteId) {
        return res.status(400).send('Site ID manquant');
    }

    const deleteQuery = `
        DELETE FROM Tuser_Tsite WHERE user_id = ? AND site_id = ?
    `;

    connection.query(deleteQuery, [userId, siteId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la suppression de la liaison :', err.message);
            return res.status(500).send('Erreur interne');
        }

        if (results.affectedRows === 0) {
            return res.status(404).send('Aucune liaison trouvée pour cet utilisateur et ce site');
        }

        res.status(200).send('Liaison supprimée avec succès');
    });
});


// Ajoute cette route dans liaisonsite.js
router.get('/site', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    const query = `
        SELECT s.site_id, s.site_name
        FROM Tsite s
        JOIN Tuser_Tsite uts ON s.site_id = uts.site_id
        WHERE uts.user_id = ?
        ORDER BY s.site_name
    `;
    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des sites :', err.message);
            return res.status(500).send('Erreur interne');
        }
        res.json({ site: results });
    });
});

module.exports = router;