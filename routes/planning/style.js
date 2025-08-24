const express = require('express');
const router = express.Router();
const connection = require('../../db');
const authenticateToken = require('../../middleware/auth');
const validateSiteAccess = require('../../middleware/validateSiteAccess');

// GET toutes les couleurs pour un site
router.get('/styleload', authenticateToken, validateSiteAccess(), (req, res) => {
    const { site_id } = req.query;
    if (!site_id) return res.status(400).send('site_id requis');
    connection.query(
        `SELECT competence_id, horaire_id, color FROM Tcompetence_horaire_color WHERE site_id = ?`,
        [site_id],
        (err, results) => {
            if (err) return res.status(500).send('Erreur SQL');
            // Format: { "competenceId-horaireId": "#xxxxxx", ... }
            const obj = {};
            results.forEach(row => {
                obj[`${row.competence_id}-${row.horaire_id}`] = row.color;
            });
            res.json(obj);
        }
    );
});

// POST/PUT une couleur pour une ligne
router.post('/styleupdate', authenticateToken, validateSiteAccess(), (req, res) => {
    const { site_id, competence_id, horaire_id, color } = req.body;
    if (!site_id || !competence_id || !horaire_id || !color) {
        return res.status(400).send('Paramètres manquants');
    }
    connection.query(
        `INSERT INTO Tcompetence_horaire_color (site_id, competence_id, horaire_id, color)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE color = VALUES(color)`,
        [site_id, competence_id, horaire_id, color],
        (err) => {
            if (err) return res.status(500).send('Erreur SQL');
            res.json({ success: true });
        }
    );
});

module.exports = router;