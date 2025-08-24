const express = require('express');
const router = express.Router();
const connection = require('../../db');
const authenticateToken = require('../../middleware/auth');
const validateSiteAccess = require('../../middleware/validateSiteAccess');

// Récupérer toutes les compétences du site avec leur statut repos
router.get('/competences-repos', authenticateToken, validateSiteAccess(), (req, res) => {
    const { site_id } = req.query;
    if (!site_id) return res.status(400).send('site_id manquant');
    const query = `
        SELECT c.competence_id, c.competence, c.repos
        FROM Tcompetence c
        JOIN Tcompetence_Tsite ct ON c.competence_id = ct.competence_id
        WHERE ct.site_id = ?
        ORDER BY c.competence
    `;
    connection.query(query, [site_id], (err, results) => {
        if (err) {
            console.error('Erreur SQL competences-repos:', err.message);
            return res.status(500).send('Erreur lors de la récupération des compétences');
        }
        res.json(results);
    });
});

// Mettre à jour le statut repos d'une compétence
router.post('/update-repos', authenticateToken, validateSiteAccess(), (req, res) => {
    const { competence_id, repos } = req.body;
    if (typeof competence_id === 'undefined' || typeof repos === 'undefined') {
        return res.status(400).send('Paramètres manquants');
    }
    const query = `UPDATE Tcompetence SET repos = ? WHERE competence_id = ?`;
    connection.query(query, [repos ? 1 : 0, competence_id], (err, result) => {
        if (err) {
            console.error('Erreur SQL update-repos:', err.message);
            return res.status(500).send('Erreur lors de la mise à jour');
        }
        res.json({ success: true });
    });
});

module.exports = router;