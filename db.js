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

    // Exemple de requête
    connection.query('SELECT 1 + 1 AS solution', (err, results) => {
        if (err) {
            console.error('Erreur lors de la requête :', err.message);
        } else {
            console.log('Résultat de la requête :', results[0].solution);
        }

        // Fermer la connexion
        connection.end((err) => {
            if (err) {
                console.error('Erreur lors de la fermeture de la connexion :', err.message);
            } else {
                console.log('Connexion fermée proprement.');
            }
        });
    });
});
