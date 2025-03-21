const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de la connexion
console.log('MYSQLHOST:', process.env.MYSQLHOST);
console.log('MYSQLUSER:', process.env.MYSQLUSER);
console.log('MYSQLPASSWORD:', process.env.MYSQLPASSWORD);
console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE);
console.log('MYSQLPORT:', process.env.MYSQLPORT);



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const connection = mysql.createConnection({
    host: process.env.MYSQLHOST, // Hôte fourni par Railway
    user: process.env.MYSQLUSER, // Utilisateur fourni par Railway
    password: process.env.MYSQLPASSWORD, // Mot de passe fourni par Railway
    database: process.env.MYSQLDATABASE, // Nom de la base de données fourni par Railway
    port: process.env.MYSQLPORT // Port fourni par Railway
});

// Test de la connexion
connection.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données :', err.message);
        process.exit(1); // Arrête l'application si la connexion échoue
    } else {
        console.log('Connecté à la base de données avec succès.');
    }
});

// Middleware pour parser le corps des requêtes
app.use(bodyParser.json());

// Importer les routes
const competencesRoutes = require('./routes/competences');
const nomsRoutes = require('./routes/tableaunom');
const planningssemaineRoutes = require('./routes/planningssemaine');
const tableaucompetencenomRoutes = require('./routes/tableaucompetencenom');
const horairesRoutes = require('./routes/horaires');
const tableaucompetenceshorairesRoutes = require('./routes/tableaucompetenceshoraires');
const ordreRoutes = require('./routes/planning/ordre');
const tooltipRoutes = require('./routes/planning/tooltip');
const creationjreposRoutes = require('./routes/bdd/creationjrepos'); // Assurez-vous que cette ligne est présente

// Utiliser les routes
app.use('/api', competencesRoutes);
app.use('/api', nomsRoutes);
app.use('/api', planningssemaineRoutes);
app.use('/api', tableaucompetencenomRoutes);
app.use('/api', horairesRoutes);
app.use('/api', tableaucompetenceshorairesRoutes);
app.use('/api', ordreRoutes); // Assurez-vous que cette ligne est présente
app.use('/api', tooltipRoutes); // Assurez-vous que cette ligne est présente
app.use('/api', creationjreposRoutes); // Assurez-vous que cette ligne est présente


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

// Servir les fichiers statiques depuis le dossier "public"
app.use(express.static(path.join(__dirname, 'public')));

// Route par défaut pour servir "index2.html"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index2.html'));
});

app.get('/health', (req, res) => {
    res.send('Application is running');
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});