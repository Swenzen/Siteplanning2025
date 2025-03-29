const express = require('express');
const router = express.Router();
const connection = require('../../db'); // Assurez-vous que le chemin est correct
const authenticateToken = require('../../middleware/auth'); // Middleware d'authentification

// Route pour récupérer les noms disponibles pour une compétence donnée
router.get('/nom-ids', authenticateToken, (req, res) => {
    const { competence_id, semaine, annee, jour_id } = req.query;
    const siteId = req.user?.site_id;

    if (!siteId) {
        console.error('Erreur : site_id manquant.');
        return res.status(400).send('Erreur : site_id est requis.');
    }

    console.log('Utilisateur authentifié :', req.user);
    console.log('Site ID utilisé :', siteId);

    // Récupérer les noms des tables Tjrepos_
    const getTablesQuery = `
        SELECT TABLE_NAME
        FROM information_schema.tables
        WHERE table_schema = DATABASE() AND TABLE_NAME LIKE 'Tjrepos_%'
    `;

    connection.query(getTablesQuery, (err, tables) => {
        if (err) {
            console.error('Erreur lors de la récupération des tables de repos :', err.message);
            return res.status(500).send('Erreur lors de la récupération des tables de repos');
        }

        const tableNames = tables.map(row => row.TABLE_NAME);
        const reposQueries = tableNames.map(tableName => `
            SELECT nom_id
            FROM ${tableName}
            WHERE semaine = ${connection.escape(semaine)} AND annee = ${connection.escape(annee)} AND jour_id = ${connection.escape(jour_id)}
        `).join(' UNION ');

        const query = `
            SELECT DISTINCT n.nom
            FROM Tcompetence_nom cn
            JOIN Tnom n ON cn.nom_id = n.nom_id
            JOIN Tnom_Tsite nts ON n.nom_id = nts.nom_id
            JOIN Tcompetence_Tsite cts ON cn.competence_id = cts.competence_id
            WHERE cn.competence_id = ?
            AND nts.site_id = ?
            AND cts.site_id = ?
            AND n.nom_id NOT IN (
                SELECT p.nom_id
                FROM Tplanning p
                JOIN Tplanning_Tsite pts ON p.planning_id = pts.planning_id
                WHERE p.semaine = ? AND p.annee = ? AND p.jour_id = ? AND pts.site_id = ?
            )
            AND n.nom_id NOT IN (
                SELECT v.nom_id
                FROM Tvacances v
                WHERE v.semaine = ? AND v.annee = ?
            )
            ${reposQueries ? `AND n.nom_id NOT IN (${reposQueries})` : ''}
        `;

        console.log('Requête SQL exécutée :', query);
        console.log('Paramètres SQL :', [competence_id, siteId, siteId, semaine, annee, jour_id, siteId, semaine, annee]);

        connection.query(
            query,
            [competence_id, siteId, siteId, semaine, annee, jour_id, siteId, semaine, annee],
            (err, results) => {
                if (err) {
                    console.error('Erreur lors de la récupération des noms :', err.message);
                    return res.status(500).send('Erreur lors de la récupération des noms');
                }

                res.json(results.map(row => row.nom));
            }
        );
    });
});

module.exports = router;