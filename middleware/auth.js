const jwt = require('jsonwebtoken');

// Middleware pour vérifier le JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Récupérer le token après "Bearer"

    if (!token) {
        return res.status(401).send('Accès refusé : aucun token fourni');
    }

    jwt.verify(token, 'votre_secret', (err, user) => {
        if (err) {
            return res.status(403).send('Token invalide');
        }
        req.user = user; // Ajouter les informations de l'utilisateur au `req`
        next(); // Passer à la route suivante
    });
}

module.exports = authenticateToken;