const express = require('express');
const router = express.Router();
const connection = require('../../db'); // Assurez-vous que le chemin est correct

// Route pour récupérer les noms disponibles pour une compétence donnée
router.get('/nom-ids', (req, res) => {
    const { competence_id, semaine, annee, jour_id } = req.query;

    // Récupérer les noms des tables Tjrepos_
    const getTablesQuery = `
        SELECT TABLE_NAME
        FROM information_schema.tables
        WHERE table_schema = DATABASE() AND TABLE_NAME LIKE 'Tjrepos_%'
    `;

    connection.query(getTablesQuery, (err, tables) => {
        if (err) {
            console.error('Erreur lors de la récupération des tables de repos :', err.message);
            res.status(500).send('Erreur lors de la récupération des tables de repos');
        } else {
            const tableNames = tables.map(row => row.TABLE_NAME);
            const reposQueries = tableNames.map(tableName => `
                SELECT nom_id
                FROM ${tableName}
                WHERE semaine = ${connection.escape(semaine)} AND annee = ${connection.escape(annee)} AND jour_id = ${connection.escape(jour_id)}
            `).join(' UNION ');

            const query = `
                SELECT n.nom
                FROM Tcompetence_nom cn
                JOIN Tnom n ON cn.nom_id = n.nom_id
                WHERE cn.competence_id = ?
                AND n.nom_id NOT IN (
                    SELECT p.nom_id
                    FROM Tplanning p
                    WHERE p.semaine = ? AND p.annee = ? AND p.jour_id = ?
                )
                AND n.nom_id NOT IN (
                    SELECT v.nom_id
                    FROM Tvacances v
                    WHERE v.semaine = ? AND v.annee = ?
                )
                ${reposQueries ? `AND n.nom_id NOT IN (${reposQueries})` : ''}
            `;

            connection.query(query, [competence_id, semaine, annee, jour_id, semaine, annee], (err, results) => {
                if (err) {
                    console.error('Erreur lors de la récupération des noms :', err.message);
                    res.status(500).send('Erreur lors de la récupération des noms');
                } else {
                    res.json(results.map(row => row.nom));
                }
            });
        }
    });
});


module.exports = router;