const express = require('express');
const router = express.Router();
const connection = require('../../db');
const authenticateToken = require('../../middleware/auth');

// Récupérer les exclusions pour un site
router.get('/exclusions-competence-nom', authenticateToken, (req, res) => {
  const siteId = req.query.site_id;
  const userSiteIds = req.user.siteIds || [];

  if (!siteId) return res.status(400).send('Le site_id est requis.');
  if (!userSiteIds.includes(String(siteId))) {
    return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
  }

  const q = `
    SELECT nom_id, competence_id, horaire_id, excluded
    FROM Texclusioncompetencenom_Tsite
    WHERE site_id = ?
  `;
  connection.query(q, [siteId], (err, rows) => {
    if (err) {
      console.error('Erreur SQL exclusions-competence-nom:', err.message);
      return res.status(500).send('Erreur lors de la récupération des exclusions');
    }
    res.json(rows || []);
  });
});

// Ajouter / mettre à jour une exclusion (checkbox)
router.post('/toggle-exclusion-competence-nom', authenticateToken, (req, res) => {
  const { nom_id, competence_id, horaire_id, site_id, excluded } = req.body || {};
  const userSiteIds = req.user.siteIds || [];

  if (!nom_id || !competence_id || !horaire_id || !site_id || typeof excluded === 'undefined') {
    return res.status(400).send('Champs requis: nom_id, competence_id, horaire_id, site_id, excluded');
  }
  if (!userSiteIds.includes(String(site_id))) {
    return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
  }

  const q = `
    INSERT INTO Texclusioncompetencenom_Tsite (nom_id, competence_id, horaire_id, site_id, excluded)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE excluded = VALUES(excluded)
  `;
  connection.query(q, [nom_id, competence_id, horaire_id, site_id, excluded ? 1 : 0], (err) => {
    if (err) {
      console.error('Erreur SQL toggle-exclusion-competence-nom:', err.message);
      return res.status(500).send('Erreur lors de la mise à jour de l\'exclusion');
    }
    res.send('Exclusion mise à jour');
  });
});

module.exports = router;
