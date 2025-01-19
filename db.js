const mysql = require('mysql2');

// Configuration de la connexion
const connection = mysql.createConnection({
    host: 'localhost',    // Même hôte que dans MySQL Workbench
    user: 'root',         // Même utilisateur
    password: 'Testtest', // Remplacez par le mot de passe que vous utilisez dans Workbench
    database: 'planning2', // Remplacez par le nom de votre base de données
    port: 3306            // Port par défaut
});

// Test de la connexion
connection.connect((err) => {
    if (err) {
        console.error('Erreur de connexion :', err.message);
        return;
    }
    console.log('Connecté à la base de données avec succès. ID de connexion :', connection.threadId);
});

module.exports = connection;