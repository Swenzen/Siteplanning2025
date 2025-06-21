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












// En dessous = groupe pour stats

router.get('/all-competences', authenticateToken, (req, res) => {
    const site_id = req.query.site_id; // <-- récupère dans la query, comme planning-stats !
    if (!site_id) return res.status(400).json({ error: "site_id manquant" });

    const query = `
        SELECT c.competence_id, c.competence
        FROM Tcompetence c
        JOIN Tcompetence_Tsite ct ON c.competence_id = ct.competence_id
        WHERE ct.site_id = ?
        ORDER BY c.competence
    `;
    connection.query(query, [site_id], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des compétences :', err.message);
            return res.status(500).json({ error: "Erreur lors de la récupération des compétences" });
        }
        res.json(results);
    });
});

router.post('/competence-groupe', authenticateToken, (req, res) => {
    const { nom_groupe, competences, site_id } = req.body;
    if (!nom_groupe || !Array.isArray(competences) || !site_id) {
        return res.status(400).json({ error: "Paramètres manquants" });
    }
    connection.query(
        "INSERT INTO Tcompetence_groupe (nom_groupe, site_id) VALUES (?, ?)",
        [nom_groupe, site_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: "Erreur serveur", details: err.message });
            const groupe_id = result.insertId;
            if (!competences.length) return res.json({ groupe_id });
            const values = competences.map(cid => [cid, groupe_id]);
            connection.query(
                "INSERT INTO Tcompetence_groupe_liaison (competence_id, groupe_id) VALUES ?",
                [values],
                (err2) => {
                    if (err2) return res.status(500).json({ error: "Erreur serveur", details: err2.message });
                    res.json({ groupe_id });
                }
            );
        }
    );
});

router.get('/competence-groupes', authenticateToken, (req, res) => {
    const site_id = req.query.site_id;
    if (!site_id) return res.status(400).json({ error: "site_id manquant" });

    const sql = `
        SELECT g.groupe_id, g.nom_groupe, l.competence_id, c.competence
        FROM Tcompetence_groupe g
        LEFT JOIN Tcompetence_groupe_liaison l ON g.groupe_id = l.groupe_id
        LEFT JOIN Tcompetence c ON l.competence_id = c.competence_id
        WHERE g.site_id = ?
        ORDER BY g.nom_groupe, c.competence
    `;
    connection.query(sql, [site_id], (err, rows) => {
        if (err) return res.status(500).json({ error: "Erreur serveur", details: err.message });
        // Regroupe par groupe
        const groupes = {};
        rows.forEach(row => {
            if (!groupes[row.groupe_id]) {
                groupes[row.groupe_id] = { groupe_id: row.groupe_id, nom_groupe: row.nom_groupe, competences: [] };
            }
            if (row.competence_id && row.competence) {
                groupes[row.groupe_id].competences.push({
                    competence_id: row.competence_id,
                    competence: row.competence
                });
            }
        });
        res.json(Object.values(groupes));
    });
});

// Lier une compétence à un groupe
router.post('/competence-groupe/liaison', authenticateToken, (req, res) => {
    const { groupe_id, competence_id } = req.body;
    if (!groupe_id || !competence_id) return res.status(400).json({ error: "Paramètres manquants" });
    connection.query(
        "INSERT IGNORE INTO Tcompetence_groupe_liaison (competence_id, groupe_id) VALUES (?, ?)",
        [competence_id, groupe_id],
        (err) => {
            if (err) return res.status(500).json({ error: "Erreur serveur", details: err.message });
            res.json({ success: true });
        }
    );
});

// Délier une compétence d'un groupe
router.delete('/competence-groupe/liaison', authenticateToken, (req, res) => {
    const { groupe_id, competence_id } = req.body;
    if (!groupe_id || !competence_id) return res.status(400).json({ error: "Paramètres manquants" });
    connection.query(
        "DELETE FROM Tcompetence_groupe_liaison WHERE competence_id = ? AND groupe_id = ?",
        [competence_id, groupe_id],
        (err) => {
            if (err) return res.status(500).json({ error: "Erreur serveur", details: err.message });
            res.json({ success: true });
        }
    );
});

router.delete('/competence-groupe/:groupe_id', authenticateToken, (req, res) => {
    const groupe_id = req.params.groupe_id;
    if (!groupe_id) return res.status(400).json({ error: "groupe_id manquant" });
    // Supprime d'abord les liaisons, puis le groupe
    connection.query(
        "DELETE FROM Tcompetence_groupe_liaison WHERE groupe_id = ?",
        [groupe_id],
        (err) => {
            if (err) return res.status(500).json({ error: "Erreur serveur", details: err.message });
            connection.query(
                "DELETE FROM Tcompetence_groupe WHERE groupe_id = ?",
                [groupe_id],
                (err2) => {
                    if (err2) return res.status(500).json({ error: "Erreur serveur", details: err2.message });
                    res.json({ success: true });
                }
            );
        }
    );
});

module.exports = router;