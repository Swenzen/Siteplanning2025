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

// Route pour supprimer une compétence d'une personne
router.post('/delete-competence2', (req, res) => {
    const { nom_id, competence_id } = req.body;
    const query = `
        DELETE FROM Tcompetence_nom
        WHERE nom_id = ? AND competence_id = ?
    `;

    connection.query(query, [nom_id, competence_id], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression de la compétence :', err.message);
            res.status(500).send('Erreur lors de la suppression de la compétence');
        } else {
            res.send('Compétence supprimée avec succès');
        }
    });
});


module.exports = router;