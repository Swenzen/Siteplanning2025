router.get('/planning-data', authenticateToken, validateSiteAccess, (req, res) => {
    const { semaine, annee, site_id } = req.query;

    const query = `
        SELECT ...
        WHERE site_id = ?
    `;

    connection.query(query, [site_id], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des données du planning :', err.message);
            return res.status(500).send('Erreur lors de la récupération des données du planning');
        }
        res.json(results);
    });
});