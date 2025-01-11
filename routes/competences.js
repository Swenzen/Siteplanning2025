const express = require('express');
const router = express.Router();
const connection = require('../db'); // Importer la connexion à la base de données

// Route pour ajouter une compétence
router.post('/add-competence2', (req, res) => {
    const { competence } = req.body;
    const query = `
        INSERT INTO Tcompetence (competence)
        VALUES (?)
    `;

    connection.query(query, [competence], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout de la compétence :', err.message);
            res.status(500).send('Erreur lors de l\'ajout de la compétence');
        } else {
            res.send('Compétence ajoutée avec succès');
        }
    });
});

// Route pour récupérer les compétences
router.get('/competences', (req, res) => {
    const query = 'SELECT competence_id, competence FROM Tcompetence';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des compétences :', err.message);
            res.status(500).send('Erreur lors de la récupération des compétences');
        } else {
            res.json(results);
        }
    });
});



// Route pour supprimer une compétence
router.post('/delete-competence', (req, res) => {
    const { competence_id } = req.body;

    // Supprimer les enregistrements associés dans tplanning
    const deletePlanningQuery = `
        DELETE FROM Tplanning
        WHERE competence_id = ?
    `;

    connection.query(deletePlanningQuery, [competence_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression des plannings associés :', err.message);
            res.status(500).send('Erreur lors de la suppression des plannings associés');
        } else {
            console.log(`Plannings associés supprimés pour competence_id: ${competence_id}`);

            // Supprimer les enregistrements associés dans thoraire_competence
            const deleteHoraireCompetenceQuery = `
                DELETE FROM Thoraire_competence
                WHERE competence_id = ?
            `;

            connection.query(deleteHoraireCompetenceQuery, [competence_id], (err, result) => {
                if (err) {
                    console.error('Erreur lors de la suppression des horaires associés :', err.message);
                    res.status(500).send('Erreur lors de la suppression des horaires associés');
                } else {
                    console.log(`Horaires associés supprimés pour competence_id: ${competence_id}`);

                    // Supprimer les enregistrements associés dans Tcompetence_nom
                    const deleteCompetenceNomQuery = `
                        DELETE FROM Tcompetence_nom
                        WHERE competence_id = ?
                    `;

                    connection.query(deleteCompetenceNomQuery, [competence_id], (err, result) => {
                        if (err) {
                            console.error('Erreur lors de la suppression des compétences associées :', err.message);
                            res.status(500).send('Erreur lors de la suppression des compétences associées');
                        } else {
                            console.log(`Compétences associées supprimées pour competence_id: ${competence_id}`);

                            // Supprimer la compétence dans Tcompetence
                            const deleteCompetenceQuery = `
                                DELETE FROM Tcompetence
                                WHERE competence_id = ?
                            `;

                            connection.query(deleteCompetenceQuery, [competence_id], (err, result) => {
                                if (err) {
                                    console.error('Erreur lors de la suppression de la compétence :', err.message);
                                    res.status(500).send('Erreur lors de la suppression de la compétence');
                                } else {
                                    res.send('Compétence supprimée avec succès');
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;