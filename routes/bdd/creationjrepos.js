const express = require('express');
const router = express.Router();
const connection = require('../../db'); // Assurez-vous que le chemin est correct
const authenticateToken = require('../../middleware/auth'); // Importer le middleware d'authentification

//table ok ajout

router.post('/create-repos-table', authenticateToken, async (req, res) => {
    const { nomRepos } = req.body;
    const siteId = req.body.site_id; // Récupérer le site_id depuis le corps de la requête
    const userSiteIds = req.user.siteIds; // Récupérer les siteIds autorisés depuis le token

    console.log('Données reçues pour /create-repos-table :', { nomRepos, siteId, userSiteIds });

    if (!nomRepos || !siteId) {
        return res.status(400).send('Nom du repos ou site_id manquant.');
    }

    // Vérifier que le site_id est dans la liste des sites autorisés
    if (!userSiteIds.includes(String(siteId))) {
        console.error('Accès refusé : site_id non autorisé');
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    try {
        // Vérifier si le repos existe déjà
        const checkReposQuery = `SELECT repos_id FROM Trepos WHERE repos = ?`;
        const [reposResult] = await connection.promise().query(checkReposQuery, [nomRepos]);

        let reposId;
        if (reposResult.length === 0) {
            // Ajouter le repos
            const insertReposQuery = `INSERT INTO Trepos (repos) VALUES (?)`;
            const [insertResult] = await connection.promise().query(insertReposQuery, [nomRepos]);
            reposId = insertResult.insertId;
        } else {
            reposId = reposResult[0].repos_id;
        }

        // Lier le repos au site
        const linkReposQuery = `INSERT IGNORE INTO Trepos_Tsite (repos_id, site_id) VALUES (?, ?)`;
        await connection.promise().query(linkReposQuery, [reposId, siteId]);

        res.send('Repos créé et lié au site avec succès.');
    } catch (error) {
        console.error('Erreur lors de la création du repos :', error.message);
        res.status(500).send('Erreur lors de la création du repos.');
    }
});

// Route pour récupérer les repos liés à un site
router.get('/get-repos', authenticateToken, async (req, res) => {
    const siteId = req.query.site_id; // Récupérer le site_id depuis la requête
    const userSiteIds = req.user.siteIds; // Récupérer les siteIds autorisés depuis le token

    console.log('Requête reçue pour /get-repos :', { siteId, userSiteIds });

    // Vérifier que le site_id est dans la liste des sites autorisés
    if (!siteId || !userSiteIds.includes(String(siteId))) {
        console.error('Accès refusé : site_id non autorisé ou manquant');
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    try {
        const query = `
            SELECT r.repos_id, r.repos
            FROM Trepos r
            JOIN Trepos_Tsite ts ON r.repos_id = ts.repos_id
            WHERE ts.site_id = ?
        `;
        const [results] = await connection.promise().query(query, [siteId]);

        console.log('Repos récupérés :', results);
        res.json(results);
    } catch (error) {
        console.error('Erreur lors de la récupération des repos :', error.message);
        res.status(500).send('Erreur lors de la récupération des repos.');
    }
});

router.post('/delete-repos-table', authenticateToken, async (req, res) => {
    const { repos_id, site_id } = req.body; // Récupérer les données nécessaires
    const userSiteIds = req.user.siteIds; // Récupérer les siteIds autorisés depuis le token

    console.log('Données reçues pour /delete-repos-table :', { repos_id, site_id, userSiteIds });

    if (!repos_id || !site_id) {
        return res.status(400).send('Repos_id ou site_id manquant.');
    }

    // Vérifier que le site_id est dans la liste des sites autorisés
    if (!userSiteIds.includes(String(site_id))) {
        console.error('Accès refusé : site_id non autorisé');
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    try {
        // Supprimer la liaison entre le repos et le site
        const deleteLinkQuery = `DELETE FROM Trepos_Tsite WHERE repos_id = ? AND site_id = ?`;
        await connection.promise().query(deleteLinkQuery, [repos_id, site_id]);

        res.send('Repos supprimé avec succès.');
    } catch (error) {
        console.error('Erreur lors de la suppression du repos :', error.message);
        res.status(500).send('Erreur lors de la suppression du repos.');
    }
});

// Route pour ajouter des données dans Tplanning_Trepos_Tsite
router.post('/add-repos-data', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Récupérer le token
    const { planningId, reposId, siteId } = req.body;

    if (!planningId || !reposId || !siteId) {
        return res.status(400).send('Données manquantes (planningId, reposId ou siteId).');
    }

    try {
        const query = `INSERT INTO Tplanning_Trepos_Tsite (planning_id, repos_id, site_id) VALUES (?, ?, ?)`;
        await connection.promise().query(query, [planningId, reposId, siteId]);
        res.send('Données ajoutées avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'ajout des données :', error.message);
        res.status(500).send('Erreur lors de l\'ajout des données.');
    }
});

// Route pour récupérer les nom_id disponibles pour les repos
router.get('/nom-ids-repos', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Récupérer le token
    const siteId = req.headers['site-id']; // Récupérer le site_id depuis les en-têtes
    const { jourId } = req.query;

    console.log('Requête reçue :', { token, siteId, jourId });

    if (!siteId || !jourId) {
        console.error('Données manquantes :', { siteId, jourId });
        return res.status(400).send('Données manquantes (site_id ou jourId).');
    }

    try {
        const query = `
            SELECT tn.nom_id, tn.nom
            FROM Tnom tn
            WHERE tn.nom_id NOT IN (
                SELECT tpt.planning_id
                FROM Tplanning_Trepos_Tsite tpt
                WHERE tpt.site_id = ? AND tpt.jour_id = ?
            )
        `;
        const [results] = await connection.promise().query(query, [siteId, jourId]);
        console.log('Résultats récupérés :', results);
        res.json(results);
    } catch (error) {
        console.error('Erreur lors de la récupération des nom_id :', error.message);
        res.status(500).send('Erreur lors de la récupération des nom_id.');
    }
});

// Route pour récupérer les données des repos pour un site spécifique
router.get('/repos-data', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Récupérer le token
    const siteId = req.headers['site-id']; // Récupérer le site_id depuis les en-têtes
    const { semaine, annee } = req.query;

    if (!siteId || !semaine || !annee) {
        return res.status(400).send('Données manquantes (site_id, semaine ou annee).');
    }

    try {
        const query = `
            SELECT tpt.repos_id, tpt.site_id, tpt.planning_id, tn.nom, tpt.jour_id
            FROM Tplanning_Trepos_Tsite tpt
            JOIN Tnom tn ON tpt.planning_id = tn.nom_id
            WHERE tpt.site_id = ? AND tpt.semaine = ? AND tpt.annee = ?
        `;
        const [results] = await connection.promise().query(query, [siteId, semaine, annee]);
        res.json(results);
    } catch (error) {
        console.error('Erreur lors de la récupération des données des repos :', error.message);
        res.status(500).send('Erreur lors de la récupération des données des repos.');
    }
});

// Route pour supprimer une valeur dans Tplanning_Trepos_Tsite
router.post('/remove-repos-data', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Récupérer le token
    const { reposId, siteId } = req.body; // Récupérer les données nécessaires

    if (!reposId || !siteId) {
        return res.status(400).send('Données manquantes (reposId ou siteId).');
    }

    try {
        const query = `DELETE FROM Trepos_Tsite WHERE repos_id = ? AND site_id = ?`;
        await connection.promise().query(query, [reposId, siteId]);
        res.send('Repos supprimé avec succès.');
    } catch (error) {
        console.error('Erreur lors de la suppression du repos :', error.message);
        res.status(500).send('Erreur lors de la suppression du repos.');
    }
});

// Route pour récupérer le nom_id à partir du nom
router.get('/get-nom-id', (req, res) => {
    const { nom } = req.query;

    const query = `
        SELECT nom_id
        FROM Tnom
        WHERE nom = ?
    `;

    connection.query(query, [nom], (err, results) => {
        if (err) {
            // console.error('Erreur lors de la récupération du nom_id :', err.message);
            res.status(500).send(`Erreur lors de la récupération du nom_id : ${err.message}`);
        } else if (results.length === 0) {
            res.status(404).send('Nom non trouvé');
        } else {
            res.json(results[0]);
        }
    });
});


module.exports = router;