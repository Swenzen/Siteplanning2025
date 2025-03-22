const mysql = require('mysql2');

// Configuration du pool de connexions
const pool = mysql.createPool({
    host: 'localhost',    // Même hôte que dans MySQL Workbench
    user: 'root',         // Même utilisateur
    password: 'Testtest', // Remplacez par le mot de passe que vous utilisez dans Workbench
    database: 'planning2', // Remplacez par le nom de votre base de données
    port: 3306,           // Port par défaut
    waitForConnections: true,
    connectionLimit: 10,  // Nombre maximum de connexions simultanées
    queueLimit: 0         // Pas de limite pour les requêtes en attente
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