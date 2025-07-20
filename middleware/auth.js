const jwt = require('jsonwebtoken');

// Middleware pour vérifier le JWT
module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Récupérer le token après "Bearer"

    if (!token) {
        console.error('Aucun token fourni');
        return res.status(401).send('Accès refusé');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Token invalide :', err.message);
            return res.status(403).send('Token invalide');
        }

                req.user = user; // Inclut userId et siteIds
        next();
    });
};