module.exports = function validateSiteAccess() {
  return (req, res, next) => {
    try {
      const userSiteIds = (req.user && req.user.siteIds) ? req.user.siteIds.map(String) : [];
      const siteId = (req.query && (req.query.site_id || req.query.siteId))
        || (req.body && (req.body.site_id || req.body.siteId))
        || (req.params && (req.params.site_id || req.params.siteId));

      if (!siteId) {
        return res.status(400).send('site_id manquant');
      }
      if (!userSiteIds.includes(String(siteId))) {
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
      }
      next();
    } catch (e) {
      return res.status(500).send('Erreur de validation d\'accès au site');
    }
  };
};
