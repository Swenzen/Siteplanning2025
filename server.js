const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Configuration de la connexion
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Testtest',
    database: 'planning2',
    port: 3306
});

// Test de la connexion
connection.connect((err) => {
    if (err) {
        console.error('Erreur de connexion :', err.message);
        return;
    }
    console.log('Connecté à la base de données avec succès. ID de connexion :', connection.threadId);
});

// Middleware pour parser le corps des requêtes
app.use(bodyParser.json());

// Importer les routes
const competencesRoutes = require('./routes/competences');
const nomsRoutes = require('./routes/tableaunom');
const planningssemaineRoutes = require('./routes/planningssemaine');
const tableaucompetencenomRoutes = require('./routes/tableaucompetencenom');
const horairesRoutes = require('./routes/horaires');
// Utiliser les routes
app.use('/api', competencesRoutes);
app.use('/api', nomsRoutes);
app.use('/api', planningssemaineRoutes);
app.use('/api', tableaucompetencenomRoutes);
app.use('/api', horairesRoutes);

// Route pour récupérer les données
app.get('/api/data', (req, res) => {
    connection.query('SELECT nom_id, nom FROM Tnom', (err, results) => {
        if (err) {
            console.error('Erreur lors de la requête :', err.message);
            res.status(500).send('Erreur lors de la requête');
        } else {
            res.json(results);
        }
    });
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});