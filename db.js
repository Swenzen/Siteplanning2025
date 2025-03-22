const mysql = require('mysql2');

// Configuration du pool de connexions
const pool = mysql.createPool({
    host: process.env.MYSQLHOST || 'mysql.railway.internal', // Hôte correct
    user: process.env.MYSQLUSER || 'root',                  // Utilisateur
    password: process.env.MYSQLPASSWORD || 'MenOioKySFCFTvpXIOvZqghlQttdjsbf', // Mot de passe
    database: process.env.MYSQLDATABASE || 'railway',       // Nom de la base de données
    port: process.env.MYSQLPORT || 3306,                   // Port
    waitForConnections: true,
    connectionLimit: 10,                                   // Nombre maximum de connexions simultanées
    queueLimit: 0                                          // Pas de limite pour les requêtes en attente
});

// Test de la connexion
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Erreur lors de la connexion au pool :', err.message);
        return;
    }
    console.log('Connexion au pool réussie. ID de connexion :', connection.threadId);
    connection.release(); // Libérer la connexion après le test
});


module.exports = pool;