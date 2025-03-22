const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const pool = require('./db');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Logs pour vérifier les variables d'environnement MySQL
console.log('MYSQLHOST:', process.env.MYSQLHOST);
console.log('MYSQLUSER:', process.env.MYSQLUSER);
console.log('MYSQLPASSWORD:', process.env.MYSQLPASSWORD);
console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE);
console.log('MYSQLPORT:', process.env.MYSQLPORT);

// Configuration de la connexion MySQL
const connection = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
});

// Test de la connexion MySQL
connection.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données :', err.message);
    } else {
        console.log('Connecté à la base de données avec succès.');
    }
});

// Middleware pour parser le corps des requêtes
app.use(bodyParser.json());

// Servir les fichiers statiques depuis le dossier "public"
app.use(express.static(path.join(__dirname, 'Public')));

// Importer les routes
const competencesRoutes = require('./routes/bdd/competences');
const nomsRoutes = require('./routes/tableaunom');
const planningssemaineRoutes = require('./routes/planningssemaine');
const tableaucompetencenomRoutes = require('./routes/tableaucompetencenom');
const horairesRoutes = require('./routes/bdd/horaires');
const tableaucompetenceshorairesRoutes = require('./routes/bdd/tableaucompetenceshoraires');
const ordreRoutes = require('./routes/planning/ordre');
const tooltipRoutes = require('./routes/planning/tooltip');
const creationjreposRoutes = require('./routes/bdd/creationjrepos');

// Utiliser les routes
app.use('/api', competencesRoutes);
app.use('/api', nomsRoutes);
app.use('/api', planningssemaineRoutes);
app.use('/api', tableaucompetencenomRoutes);
app.use('/api', horairesRoutes);
app.use('/api', tableaucompetenceshorairesRoutes);
app.use('/api', ordreRoutes);
app.use('/api', tooltipRoutes);
app.use('/api', creationjreposRoutes);



// Route par défaut pour servir "index2.html"
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'index2.html');
    console.log('Chemin du fichier index2.html :', filePath);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Erreur lors de l\'envoi du fichier index2.html :', err.message);
            res.status(404).send('Fichier introuvable');
        }
    });
});

// Route de vérification de santé
app.get('/health', (req, res) => {
    res.send('Application is running');
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insérer l'utilisateur dans la base de données
        const query = 'INSERT INTO Tuser (username, password, email) VALUES (?, ?, ?)';
        pool.query(query, [username, hashedPassword, email], (err, results) => {
            if (err) {
                console.error('Erreur lors de l\'inscription :', err.message);
                return res.status(500).send('Erreur lors de l\'inscription');
            }
            res.status(201).send('Utilisateur inscrit avec succès');
        });
    } catch (err) {
        console.error('Erreur lors du hachage du mot de passe :', err.message);
        res.status(500).send('Erreur interne');
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM Tuser WHERE username = ?';
    pool.query(query, [username], async (err, results) => {
        if (err) {
            console.error('Erreur lors de la connexion :', err.message);
            return res.status(500).send('Erreur lors de la connexion');
        }

        if (results.length === 0) {
            return res.status(401).send('Nom d\'utilisateur ou mot de passe incorrect');
        }

        const user = results[0];

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send('Nom d\'utilisateur ou mot de passe incorrect');
        }

        // Générer un jeton JWT
        const token = jwt.sign({ userId: user.user_id }, 'votre_secret', { expiresIn: '1h' });

        // Renvoyer le jeton et le nom de l'utilisateur
        res.json({ token, username: user.username });
    });
});

// Démarrer le serveur web
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Erreur lors du démarrage du serveur :', err.message);
});