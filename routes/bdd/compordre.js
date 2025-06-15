const express = require('express');
const router = express.Router();
const connection = require('../../db');
const authenticateToken = require('../../middleware/auth');

// GET /api/ordrecompetences?site_id=1
router.get('/ordrecompetences', authenticateToken, (req, res) => {
    const { site_id } = req.query;
    if (!site_id) {
        return res.status(400).json({ error: 'site_id requis' });
    }

    const sql = `
        SELECT c.competence_id, c.competence, co.display_order
        FROM Tcompetence c
        JOIN Tcompetence_order co ON c.competence_id = co.competence_id
        JOIN Tcompetence_Tsite cts ON c.competence_id = cts.competence_id
        WHERE cts.site_id = ?
        ORDER BY co.display_order ASC
    `;
    connection.query(sql, [site_id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erreur serveur' });
        }
        res.json(results);
    });
});

// POST /api/swap-ordrecompetence
router.post('/swap-ordrecompetence', authenticateToken, (req, res) => {
    const { id1, id2 } = req.body;
    if (!id1 || !id2) {
        return res.status(400).json({ error: 'id1 et id2 requis' });
    }
    // On échange les display_order des deux compétences
    const getOrders = `
        SELECT competence_id, display_order FROM Tcompetence_order WHERE competence_id IN (?, ?)
    `;
    connection.query(getOrders, [id1, id2], (err, rows) => {
        if (err || rows.length !== 2) {
            return res.status(500).json({ error: 'Erreur lors de la récupération des ordres.' });
        }
        const [row1, row2] = rows[0].competence_id == id1 ? [rows[0], rows[1]] : [rows[1], rows[0]];
        const update1 = `UPDATE Tcompetence_order SET display_order = ? WHERE competence_id = ?`;
        const update2 = `UPDATE Tcompetence_order SET display_order = ? WHERE competence_id = ?`;
        connection.query(update1, [row2.display_order, row1.competence_id], (err1) => {
            if (err1) return res.status(500).json({ error: 'Erreur update 1' });
            connection.query(update2, [row1.display_order, row2.competence_id], (err2) => {
                if (err2) return res.status(500).json({ error: 'Erreur update 2' });
                res.json({ success: true });
            });
        });
    });
});


module.exports = router;