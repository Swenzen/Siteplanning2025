const express = require('express');
const router = express.Router();
const connection = require('../db'); // Importer la connexion à la base de données
const authenticateToken = require('../middleware/auth'); // Importer le middleware d'authentification

// Route pour mettre à jour le nom (protégée)
router.post('/update-name', authenticateToken, (req, res) => {
    const { nom_id, nom } = req.body;
    const query = 'UPDATE Tnom SET nom = ? WHERE nom_id = ?';

    connection.query(query, [nom, nom_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la mise à jour du nom :', err.message);
            res.status(500).send('Erreur lors de la mise à jour');
            return;
        }
        res.send('Nom mis à jour avec succès');
    });
});

// Route pour ajouter un nom (protégée)
router.post('/add-nom', authenticateToken, (req, res) => {
    const { nom } = req.body;

    if (!nom) {
        return res.status(400).send('Le champ "nom" est requis');
    }

    const query = 'INSERT INTO Tnom (nom) VALUES (?)';
    connection.query(query, [nom], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout du nom :', err.message);
            res.status(500).send('Erreur lors de l\'ajout du nom');
        } else {
            res.status(201).send('Nom ajouté avec succès');
        }
    });
});

// Route pour supprimer un nom (protégée)
router.post('/delete-nom', authenticateToken, (req, res) => {
    const { nom_id } = req.body;

    // Supprimer les enregistrements associés dans Tcompetence_nom
    const deleteCompetenceNomQuery = `
        DELETE FROM Tcompetence_nom
        WHERE nom_id = ?
    `;

    connection.query(deleteCompetenceNomQuery, [nom_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression des compétences associées :', err.message);
            res.status(500).send('Erreur lors de la suppression des compétences associées');
        } else {
            console.log(`Compétences associées supprimées pour nom_id: ${nom_id}`);
            // Mettre à jour les enregistrements associés dans Tplanning
            const updatePlanningQuery = `
                UPDATE Tplanning
                SET nom_id = NULL
                WHERE nom_id = ?
            `;

            connection.query(updatePlanningQuery, [nom_id], (err, result) => {
                if (err) {
                    console.error('Erreur lors de la mise à jour des plannings associés :', err.message);
                    res.status(500).send('Erreur lors de la mise à jour des plannings associés');
                } else {
                    console.log(`Plannings associés mis à jour pour nom_id: ${nom_id}`);
                    // Supprimer le nom dans Tnom
                    const deleteNomQuery = `
                        DELETE FROM Tnom
                        WHERE nom_id = ?
                    `;

                    connection.query(deleteNomQuery, [nom_id], (err, result) => {
                        if (err) {
                            console.error('Erreur lors de la suppression du nom :', err.message);
                            res.status(500).send('Erreur lors de la suppression du nom');
                        } else {
                            console.log(`Nom supprimé avec succès pour nom_id: ${nom_id}`);
                            res.send('Nom supprimé avec succès');
                        }
                    });
                }
            });
        }
    });
});

async function fetchNoms() {
    const token = localStorage.getItem('token'); // Récupérer le jeton depuis le localStorage

    const response = await fetch('/api/noms', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`, // Ajouter le jeton dans l'en-tête
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        const noms = await response.json();
        console.log('Noms récupérés :', noms);
        // Afficher les noms dans le tableau
    } else {
        console.error('Erreur lors de la récupération des noms');
    }
}

router.get('/data', authenticateToken, (req, res) => {
    const userId = req.user.userId; // Récupérer l'ID de l'utilisateur depuis le middleware

    const query = `
        SELECT t.nom_id, t.nom, s.site_name
        FROM Tnom t
        JOIN Tsite s ON t.site_id = s.site_id
        JOIN Tsite_Tuser st ON s.site_id = st.site_id
        WHERE st.user_id = ?
    `;
    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des noms :', err.message);
            res.status(500).send('Erreur lors de la récupération des noms');
        } else {
            res.json(results); // Renvoie les noms et les sites associés à l'utilisateur
        }
    });
});

router.get('/api/data', authenticateToken, (req, res) => {
    const query = 'SELECT nom_id, nom FROM Tnom';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des noms :', err.message);
            res.status(500).send('Erreur lors de la récupération des noms');
        } else {
            res.json(results); // Renvoie les données au client
        }
    });
});

module.exports = router;