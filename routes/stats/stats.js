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
    const { nom_groupe, competences } = req.body;
    if (!nom_groupe || !Array.isArray(competences)) {
        return res.status(400).json({ error: "Paramètres manquants" });
    }
    // 1. Créer le groupe
    connection.query(
        "INSERT INTO Tcompetence_groupe (nom_groupe) VALUES (?)",
        [nom_groupe],
        (err, result) => {
            if (err) return res.status(500).json({ error: "Erreur serveur", details: err.message });
            const groupe_id = result.insertId;
            // 2. Ajouter les liaisons si besoin
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

module.exports = router;