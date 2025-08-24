const express = require('express');
const router = express.Router();
const connection = require('../../db');
const authenticateToken = require('../../middleware/auth');
const validateSiteAccess = require('../../middleware/validateSiteAccess');

// Ajouter une mission
router.post('/add-mission', authenticateToken, validateSiteAccess(), (req, res) => {
    const { site_id, competence_id, horaire_id, date, nom_id, texte } = req.body;
    if (!site_id || !competence_id || !horaire_id || !date || !texte) {
        return res.status(400).json({ error: 'Champs manquants' });
    }
    connection.query(
        'INSERT INTO Tmission (site_id, competence_id, horaire_id, date, nom_id, texte) VALUES (?, ?, ?, ?, ?, ?)',
        [site_id, competence_id, horaire_id, date, nom_id || null, texte],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: result.insertId });
        }
    );
});

// Modifier une mission
router.put('/edit-mission/:id', authenticateToken, (req, res) => {
    const { texte } = req.body;
    const { id } = req.params;
    if (!texte) return res.status(400).json({ error: 'Texte manquant' });
    // Vérifie l'accès site via lookup
    connection.query('SELECT site_id FROM Tmission WHERE id = ?', [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows || rows.length === 0) return res.status(404).json({ error: 'Introuvable' });
        const site_id = String(rows[0].site_id);
        const userSiteIds = (req.user && req.user.siteIds) ? req.user.siteIds.map(String) : [];
        if (!userSiteIds.includes(site_id)) return res.status(403).json({ error: 'Accès refusé' });
        connection.query('UPDATE Tmission SET texte = ? WHERE id = ?', [texte, id], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ success: true });
        });
    });
});

// Supprimer une mission
router.delete('/delete-mission/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    connection.query('SELECT site_id FROM Tmission WHERE id = ?', [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows || rows.length === 0) return res.status(404).json({ error: 'Introuvable' });
        const site_id = String(rows[0].site_id);
        const userSiteIds = (req.user && req.user.siteIds) ? req.user.siteIds.map(String) : [];
        if (!userSiteIds.includes(site_id)) return res.status(403).json({ error: 'Accès refusé' });
        connection.query('DELETE FROM Tmission WHERE id = ?', [id], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ success: true });
        });
    });
});



// Récupérer les missions pour un planning (plage ou date unique)
router.get('/missions', authenticateToken, validateSiteAccess(), (req, res) => {
    const { site_id, start_date, end_date, date } = req.query;
    if (!site_id) return res.status(400).json({ error: 'site_id manquant' });

    // Si start_date et end_date sont fournis, on récupère la plage
    if (start_date && end_date) {
        connection.query(
            'SELECT * FROM Tmission WHERE site_id = ? AND date BETWEEN ? AND ?',
            [site_id, start_date, end_date],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows);
            }
        );
    }
    // Sinon, on récupère pour une seule date (compatibilité)
    else if (date) {
        connection.query(
            'SELECT * FROM Tmission WHERE site_id = ? AND date = ?',
            [site_id, date],
            (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json(rows);
            }
        );
    } else {
        res.status(400).json({ error: 'start_date/end_date ou date manquant' });
    }
});


module.exports = router;