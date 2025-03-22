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
    const { nom, site_id } = req.body; // Récupérer le nom et le site_id depuis le corps de la requête
    const userId = req.user.userId; // Récupérer l'ID de l'utilisateur connecté depuis le middleware

    if (!nom || !site_id) {
        return res.status(400).send('Les champs "nom" et "site_id" sont requis');
    }

    // Vérifier si l'utilisateur a accès au site via Tsite_Tuser
    const checkSiteAccessQuery = `
        SELECT * 
        FROM Tsite_Tuser st
        JOIN Tsite s ON st.site_id = s.site_id
        WHERE st.user_id = ? AND s.site_id = ?
    `;
    connection.query(checkSiteAccessQuery, [userId, site_id], (err, results) => {
        if (err) {
            console.error('Erreur lors de la vérification de l\'accès au site :', err.message);
            return res.status(500).send('Erreur lors de la vérification de l\'accès au site');
        }

        if (results.length === 0) {
            return res.status(403).send('Vous n\'avez pas la permission d\'ajouter un nom à ce site');
        }

        // Ajouter le nom dans la table Tnom et l'associer au site via Tnom_Tsite
        const insertNomQuery = `
            INSERT INTO Tnom (nom) VALUES (?)
        `;
        connection.query(insertNomQuery, [nom], (err, result) => {
            if (err) {
                console.error('Erreur lors de l\'ajout du nom :', err.message);
                return res.status(500).send('Erreur lors de l\'ajout du nom');
            }

            const nomId = result.insertId; // Récupérer l'ID du nom inséré

            // Associer le nom au site dans Tnom_Tsite
            const insertNomSiteQuery = `
                INSERT INTO Tnom_Tsite (nom_id, site_id)
                VALUES (?, ?)
            `;
            connection.query(insertNomSiteQuery, [nomId, site_id], (err, result) => {
                if (err) {
                    console.error('Erreur lors de l\'association du nom au site :', err.message);
                    return res.status(500).send('Erreur lors de l\'association du nom au site');
                }

                res.status(201).send('Nom ajouté et associé au site avec succès');
            });
        });
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
JOIN Tnom_Tsite nts ON t.nom_id = nts.nom_id
JOIN Tsite s ON nts.site_id = s.site_id
JOIN Tsite_Tuser st ON s.site_id = st.site_id
WHERE st.user_id = ?;
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