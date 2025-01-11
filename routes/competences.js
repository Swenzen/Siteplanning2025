const express = require('express');
const router = express.Router();
const connection = require('../db'); // Importer la connexion à la base de données

// Route pour ajouter un nom
router.post('/add-nom', (req, res) => {
    const { nom } = req.body;
    const query = `
        INSERT INTO Tnom (nom)
        VALUES (?)
    `;

    connection.query(query, [nom], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout du nom :', err.message);
            res.status(500).send('Erreur lors de l\'ajout du nom');
        } else {
            res.send('Nom ajouté avec succès');
        }
    });
});

module.exports = router;