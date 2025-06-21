const express = require('express');
const router = express.Router();
const connection = require('../../db');
const authenticateToken = require('../../middleware/auth');

// Stats planning
router.get('/planning-stats', authenticateToken, (req, res) => {
    const { site_id, start, end } = req.query;
    if (!site_id || !start || !end) {
        return res.status(400).json({ error: "Paramètres manquants" });
    }
    connection.query(`
        SELECT 
            n.nom AS nom,
            c.competence AS competence,
            h.horaire_id AS horaire_id
        FROM Tplanningv2 p
        JOIN Tnom n ON p.nom_id = n.nom_id
        JOIN Tcompetence c ON p.competence_id = c.competence_id
        JOIN Thoraire h ON p.horaire_id = h.horaire_id
        WHERE p.site_id = ?
          AND p.date >= ?
          AND p.date <= ?
    `, [site_id, start, end], (err, rows) => {
        if (err) {
            console.error("Erreur SQL planning-stats :", err);
            return res.status(500).json({ error: "Erreur serveur", details: err.message });
        }
        res.json(rows);
    });
});


module.exports = router;