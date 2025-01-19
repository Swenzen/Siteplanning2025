const express = require('express');
const router = express.Router();
const connection = require('../db'); // Importer la connexion à la base de données




// Route pour récupérer les horaires
router.get('/horaires', (req, res) => {
    const query = 'SELECT horaire_id, horaire_debut, horaire_fin FROM Thoraire'; // Requête SQL correcte

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des horaires :', err.message);
            res.status(500).send('Erreur lors de la récupération des horaires');
        } else {
            res.json(results);
        }
    });
});

// Route pour ajouter un horaire
router.post('/add-horaires', (req, res) => {
    const { horaire_debut, horaire_fin } = req.body;
    const query = `
        INSERT INTO Thoraire (horaire_debut, horaire_fin)
        VALUES (?, ?)
    `;

    connection.query(query, [horaire_debut, horaire_fin], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout de l\'horaire :', err.message);
            res.status(500).send('Erreur lors de l\'ajout de l\'horaire');
        } else {
            res.send('Horaire ajouté avec succès');
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