const jwt = require('jsonwebtoken');

// Middleware pour vérifier le JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Récupérer le token après "Bearer"

    if (!token) {
        return res.status(401).send('Accès refusé : Aucun token fourni');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).send('Token invalide');
        }

        req.user = user; // Inclut userId et siteIds
        next();
    });
}

module.exports = authenticateToken;