require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const pool = require('./db');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Détecter l'environnement
const environment = process.env.NODE_ENV || 'local';
console.log(`Environnement détecté : ${environment}`);

// Configuration de la connexion MySQL en fonction de l'environnement
const dbConfig = environment === 'production' ? {
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
} : {
    host: 'localhost',
    user: 'root',
    password: 'Testtest',
    database: 'date',
    port: 3306
};



// Configuration de la connexion MySQL
const connection = mysql.createConnection(dbConfig);

// Test de la connexion MySQL
connection.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données :');
    } else {
        console.log('Connecté à la base de données avec succès.');
    }
});

// Middleware pour parser le corps des requêtes
app.use(bodyParser.json());

// Place les middlewares de sécurité AVANT express.static
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
    styleSrc: ["'self'", "https://cdn.jsdelivr.net"],
    objectSrc: ["'none'"]
  }
}));
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.crossOriginResourcePolicy({ policy: 'same-origin' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Servir les fichiers statiques 
app.use(express.static(path.join(__dirname, 'Public')));

// Importer les routes
const competencesRoutes = require('./routes/bdd/competences');
const nomsRoutes = require('./routes/bdd/tableaunom');
const planningssemaineRoutes = require('./routes/planningssemaine');
const tableaucompetencenomRoutes = require('./routes/bdd/tableaucompetencenom');
const horairesRoutes = require('./routes/bdd/horaires');
const tableaucompetenceshorairesRoutes = require('./routes/bdd/tableaucompetenceshoraires');
const ordreRoutes = require('./routes/planning/ordre');
const tooltipRoutes = require('./routes/planning/tooltip');
const creationjreposRoutes = require('./routes/bdd/creationjrepos');
const retoursiteRoutes = require('./routes/retoursite');
const planningsRoutes = require('./routes/bdd/plannings');
const parametrageRoutes = require('./routes/parametrage/liaisonsite');
const planningRoutes = require('./routes/planning/planning');
const compordreRoutes = require('./routes/bdd/compordre');
const commentaireRoutes = require('./routes/planning/commentaire');
const statsRoutes = require('./routes/stats/stats');

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
app.use('/api', retoursiteRoutes);
app.use('/api', planningsRoutes);
app.use('/api', parametrageRoutes);
app.use('/api', tooltipRoutes);
app.use('/api', planningRoutes);
app.use('/api', compordreRoutes);
app.use('/api', commentaireRoutes);
app.use('/api', statsRoutes);





// Route de vérification de santé
app.get('/health', (req, res) => {
    res.send('Application is running');
});

app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Créer le site (nom = email ou "Site de {email}")
        const siteName = `Site de ${email}`;
        pool.query('INSERT INTO Tsite (site_name) VALUES (?)', [siteName], (err, siteResult) => {
            if (err) {
                console.error('Erreur lors de la création du site :', err.message);
                return res.status(500).send('Erreur lors de la création du site');
            }
            const siteId = siteResult.insertId;

            // 2. Créer l'utilisateur
            pool.query('INSERT INTO Tuser (username, password, email) VALUES (?, ?, ?)', [email, hashedPassword, email], (err, userResult) => {
                if (err) {
                    console.error('Erreur lors de l\'inscription :', err.message);
                    return res.status(500).send('Erreur lors de l\'inscription');
                }
                const userId = userResult.insertId;

                // 3. Lier l'utilisateur au site
                pool.query('INSERT INTO Tuser_Tsite (user_id, site_id) VALUES (?, ?)', [userId, siteId], (err, linkResult) => {
                    if (err) {
                        console.error('Erreur lors de la liaison user-site :', err.message);
                        return res.status(500).send('Erreur lors de la liaison user-site');
                    }
                    res.status(201).send('Utilisateur et site créés avec succès');
                });
            });
        });
    } catch (err) {
        console.error('Erreur lors du hachage du mot de passe :', err.message);
        res.status(500).send('Erreur interne');
    }
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (process.env.NODE_ENV !== 'production') {
      console.log('Tentative de connexion avec email:', email);
    }

    const query = `
        SELECT u.user_id, u.username, u.password, GROUP_CONCAT(st.site_id) AS site_ids
        FROM Tuser u
        JOIN Tuser_Tsite st ON u.user_id = st.user_id
        WHERE u.username = ?
        GROUP BY u.user_id
    `;

    pool.query(query, [email], async (err, results) => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('Résultat SQL:', results);
        }
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

        // Générer un jeton JWT avec les site_ids
        const token = jwt.sign({ userId: user.user_id, siteIds: user.site_ids.split(',') }, process.env.JWT_SECRET, { expiresIn: '1h' });

                
        res.json({ token, username: user.username });
    });
});

// Démarrer le serveur web
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Erreur lors du démarrage du serveur :', err.message);
});