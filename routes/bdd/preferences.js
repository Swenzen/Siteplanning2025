const express = require('express');
const router = express.Router();
const pool = require('../../db');
const authenticateToken = require('../../middleware/auth');

async function ensureTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS Tpreferenceuser (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      site_id INT NOT NULL,
      planningcompsem TINYINT(1) NOT NULL DEFAULT 0,
      UNIQUE KEY uniq_user_site (user_id, site_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await pool.promise().query(sql);
}

router.get('/user-preferences', authenticateToken, async (req, res) => {
  try {
    await ensureTable();
    const user_id = (req.user && (req.user.userId || req.user.user_id)) || null;
    const site_id = Number(req.query.site_id);
    if (!user_id || !site_id) return res.status(400).json({ error: 'user_id ou site_id manquant' });
    const [rows] = await pool.promise().query('SELECT planningcompsem FROM Tpreferenceuser WHERE user_id=? AND site_id=?', [user_id, site_id]);
    const planningcompsem = rows.length ? Number(rows[0].planningcompsem) : 0;
    res.json({ user_id, site_id, planningcompsem });
  } catch (e) {
    console.error('GET /user-preferences error', e);
    res.status(500).send('Erreur serveur');
  }
});

router.put('/user-preferences', authenticateToken, async (req, res) => {
  try {
    await ensureTable();
    const user_id = (req.user && (req.user.userId || req.user.user_id)) || null;
    const { site_id, planningcompsem } = req.body || {};
    if (!user_id || !site_id || typeof planningcompsem === 'undefined') {
      return res.status(400).json({ error: 'user_id/site_id/planningcompsem manquant' });
    }
    const val = Number(planningcompsem) ? 1 : 0;
    await pool.promise().query(
      'INSERT INTO Tpreferenceuser (user_id, site_id, planningcompsem) VALUES (?,?,?) ON DUPLICATE KEY UPDATE planningcompsem=VALUES(planningcompsem)',
      [user_id, site_id, val]
    );
    res.json({ ok: true, user_id, site_id, planningcompsem: val });
  } catch (e) {
    console.error('PUT /user-preferences error', e);
    res.status(500).send('Erreur serveur');
  }
});

module.exports = router;
