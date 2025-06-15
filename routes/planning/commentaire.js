const express = require('express');
const router = express.Router();
const connection = require('../../db'); // Assurez-vous que le chemin est correct
const authenticateToken = require('../../middleware/auth'); // Middleware d'authentification

// POST /api/delete-commentairev2
router.post('/delete-commentairev2', authenticateToken, (req, res) => {
    const { site_id, competence_id, horaire_id, date, nom_id } = req.body;
    if (!site_id || !competence_id || !horaire_id || !date) {
        return res.status(400).json({ error: 'Paramètres manquants' });
    }
    const sql = `
        DELETE FROM Tcommentairev2
        WHERE site_id = ? AND competence_id = ? AND horaire_id = ? AND date = ? AND
        ${nom_id ? 'nom_id = ?' : 'nom_id IS NULL'}
    `;
    const params = nom_id
        ? [site_id, competence_id, horaire_id, date, nom_id]
        : [site_id, competence_id, horaire_id, date];
    connection.query(sql, params, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur lors de la suppression' });
        }
        res.json({ success: true });
    });
});

module.exports = router;