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

router.post('/add-repos-data', authenticateToken, async (req, res) => {
    const { tableName, semaine, annee, jourId, nomId, site_id } = req.body;
    const userSiteIds = req.user.siteIds;

    console.log('Requête reçue pour /add-repos-data :', { tableName, semaine, annee, jourId, nomId, site_id, userSiteIds });

    // Vérifier que le site_id est autorisé
    if (!site_id || !userSiteIds.includes(String(site_id))) {
        console.error('Accès refusé : site_id non autorisé.');
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    // Validation stricte pour tableName
    if (!tableName || isNaN(tableName)) {
        console.error('Erreur : tableName est invalide.', tableName);
        return res.status(400).send('Nom de table invalide.');
    }

    try {
        // Étape 1 : Insérer ou récupérer le planning_id dans Tplanning
        const planningQuery = `
            INSERT INTO Tplanning (semaine, annee, jour_id, nom_id)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE planning_id = LAST_INSERT_ID(planning_id)
        `;
        const [planningResult] = await connection.promise().query(planningQuery, [semaine, annee, jourId, nomId]);
        const planningId = planningResult.insertId;

        console.log('Planning ID récupéré ou inséré :', planningId);

        // Étape 2 : Insérer la liaison dans Tplanning_TRepos_Tsite
        const linkQuery = `
            INSERT INTO Tplanning_Trepos_Tsite (planning_id, repos_id, site_id)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE planning_id = VALUES(planning_id)
        `;
        await connection.promise().query(linkQuery, [planningId, tableName, site_id]);

        console.log('Liaison ajoutée avec succès dans Tplanning_Trepos_Tsite.');
        res.send('Repos ajouté au planning avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'ajout au planning :', error.message);
        res.status(500).send('Erreur lors de l\'ajout au planning.');
    }
});

// Route pour récupérer les nom_id disponibles pour les repos
router.get('/nom-ids-repos', authenticateToken, (req, res) => {
    const { semaine, annee, jourId, site_id } = req.query;
    const userSiteIds = req.user.siteIds; // Récupérer les siteIds autorisés depuis le token

    console.log('Requête reçue pour /nom-ids-repos :', { semaine, annee, jourId, site_id, userSiteIds });

    // Vérifier que le site_id est fourni et que l'utilisateur y a accès
    if (!site_id || !userSiteIds.includes(String(site_id))) {
        console.error('Accès refusé : site_id non autorisé ou manquant.');
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    const query = `
        SELECT n.nom_id, n.nom
        FROM Tnom n
        JOIN Tnom_Tsite nts ON n.nom_id = nts.nom_id
        WHERE nts.site_id = ?
        AND n.nom_id NOT IN (
            SELECT p.nom_id
            FROM Tplanning p
            JOIN Tplanning_Tsite pts ON p.planning_id = pts.planning_id
            WHERE p.semaine = ? AND p.annee = ? AND p.jour_id = ? AND pts.site_id = ?
        )
        AND n.nom_id NOT IN (
            SELECT v.nom_id
            FROM Tvacances v
            JOIN Tvacances_Tsite vt ON v.vacances_id = vt.vacances_id
            WHERE v.semaine = ? AND v.annee = ? AND vt.site_id = ?
        )
    `;

    connection.query(query, [site_id, semaine, annee, jourId, site_id, semaine, annee, site_id], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des nom_id :', err.message);
            return res.status(500).send('Erreur lors de la récupération des nom_id.');
        }

        console.log('Nom_id récupérés :', results);
        res.json(results);
    });
});


router.get('/repos-data', authenticateToken, async (req, res) => {
    const { semaine, annee, site_id } = req.query;
    const userSiteIds = req.user.siteIds;

    console.log('Requête reçue pour /repos-data :', { semaine, annee, site_id, userSiteIds });

    // Vérifier que le site_id est autorisé
    if (!site_id || !userSiteIds.includes(String(site_id))) {
        console.error('Accès refusé : site_id non autorisé.');
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    try {
        const query = `
            SELECT 
                tpt.repos_id, 
                tpt.site_id, 
                tpt.planning_id, 
                tn.nom, 
                tn.nom_id, 
                tp.jour_id, -- Correction ici
                tr.repos
            FROM Tplanning_Trepos_Tsite tpt
            LEFT JOIN Tplanning tp ON tpt.planning_id = tp.planning_id
            LEFT JOIN Tnom tn ON tp.nom_id = tn.nom_id
            LEFT JOIN Trepos tr ON tpt.repos_id = tr.repos_id
            WHERE tpt.site_id = ? AND tp.semaine = ? AND tp.annee = ?
        `;
        const [results] = await connection.promise().query(query, [site_id, semaine, annee]);

        if (results.length === 0) {
            console.warn('Aucune donnée trouvée pour /repos-data.');
            return res.status(404).send('Aucune donnée trouvée.');
        }

        console.log('Données récupérées pour /repos-data :', results);
        res.json(results);
    } catch (error) {
        console.error('Erreur lors de la récupération des données des repos :', error.message);
        res.status(500).send('Erreur lors de la récupération des données des repos.');
    }
});

router.post('/remove-repos-data', authenticateToken, async (req, res) => {
    const { tableName, semaine, annee, jourId, nomId, site_id } = req.body;
    const userSiteIds = req.user.siteIds;

    console.log('Requête reçue pour /remove-repos-data :', { tableName, semaine, annee, jourId, nomId, site_id, userSiteIds });

    // Vérifier que le site_id est autorisé
    if (!site_id || !userSiteIds.includes(String(site_id))) {
        console.error('Accès refusé : site_id non autorisé.');
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
    }

    try {
        const query = `
            DELETE FROM Tplanning_Trepos_Tsite
            WHERE planning_id = (
                SELECT planning_id
                FROM Tplanning
                WHERE semaine = ? AND annee = ? AND jour_id = ? AND nom_id = ?
            )
            AND site_id = ?
            AND repos_id = ?
        `;
        const [result] = await connection.promise().query(query, [semaine, annee, jourId, nomId, site_id, tableName]);

        if (result.affectedRows === 0) {
            console.warn('Aucune donnée supprimée pour /remove-repos-data.');
            return res.status(404).send('Aucune donnée supprimée.');
        }

        console.log('Données supprimées avec succès pour /remove-repos-data.');
        res.send('Données supprimées avec succès.');
    } catch (error) {
        console.error('Erreur lors de la suppression des données :', error.message);
        res.status(500).send('Erreur lors de la suppression des données.');
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