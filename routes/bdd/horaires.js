const express = require('express');
const router = express.Router();
const connection = require('../../db'); // Importer la connexion à la base de données
const authenticateToken = require('../../middleware/auth'); // Importer le middleware d'authentification



// Route pour récupérer les horaires liés à un site (protégée)
router.get('/horaires', authenticateToken, (req, res) => {
    const siteId = req.query.site_id;

    if (!siteId) {
        return res.status(400).send('Le champ "site_id" est requis');
    }

    const query = `
        SELECT h.horaire_id, h.horaire_debut, h.horaire_fin
        FROM Thoraire h
        JOIN Thoraire_Tsite ht ON h.horaire_id = ht.horaire_id
        WHERE ht.site_id = ?
    `;

    connection.query(query, [siteId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des horaires :', err.message);
            res.status(500).send('Erreur lors de la récupération des horaires');
        } else {
            res.json(results);
        }
    });
});

// Route pour ajouter un horaire (protégée)
router.post('/add-horaires', authenticateToken, (req, res) => {
    const { horaire_debut, horaire_fin, site_id } = req.body;

    if (!horaire_debut || !horaire_fin || !site_id) {
        return res.status(400).send('Les champs "horaire_debut", "horaire_fin" et "site_id" sont requis');
    }

    const query = `
        INSERT INTO Thoraire (horaire_debut, horaire_fin)
        VALUES (?, ?)
    `;

    connection.query(query, [horaire_debut, horaire_fin], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout de l\'horaire :', err.message);
            res.status(500).send('Erreur lors de l\'ajout de l\'horaire');
        } else {
            const horaireId = result.insertId;

            // Ajouter la liaison dans Thoraire_Tsite
            const linkQuery = `
                INSERT INTO Thoraire_Tsite (horaire_id, site_id)
                VALUES (?, ?)
            `;

            connection.query(linkQuery, [horaireId, site_id], (err) => {
                if (err) {
                    console.error('Erreur lors de la liaison horaire-site :', err.message);
                    res.status(500).send('Erreur lors de la liaison horaire-site');
                } else {
                    res.send('Horaire ajouté avec succès et lié au site');
                }
            });
        }
    });
});






// Route pour supprimer un horaire
router.post('/delete-horaires', (req, res) => {
    const { horaire_id } = req.body;

    // Supprimer les enregistrements associés dans Tplanning
    const deletePlanningQuery = `
        DELETE FROM Tplanning
        WHERE horaire_id = ?
    `;

    connection.query(deletePlanningQuery, [horaire_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression des plannings associés :', err.message);
            res.status(500).send('Erreur lors de la suppression des plannings associés');
        } else {
            console.log(`Plannings associés supprimés pour horaire_id: ${horaire_id}`);

            // Supprimer les enregistrements associés dans Thoraire_competence
            const deleteHoraireCompetenceQuery = `
                DELETE FROM Thoraire_competence
                WHERE horaire_id = ?
            `;

            connection.query(deleteHoraireCompetenceQuery, [horaire_id], (err, result) => {
                if (err) {
                    console.error('Erreur lors de la suppression des horaires associés :', err.message);
                    res.status(500).send('Erreur lors de la suppression des horaires associés');
                } else {
                    console.log(`Horaires associés supprimés pour horaire_id: ${horaire_id}`);

                    // Supprimer l'horaire dans Thoraire
                    const deleteHoraireQuery = `
                        DELETE FROM Thoraire
                        WHERE horaire_id = ?
                    `;

                    connection.query(deleteHoraireQuery, [horaire_id], (err, result) => {
                        if (err) {
                            console.error('Erreur lors de la suppression de l\'horaire :', err.message);
                            res.status(500).send('Erreur lors de la suppression de l\'horaire');
                        } else {
                            res.send('Horaire supprimé avec succès');
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;