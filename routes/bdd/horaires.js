const express = require('express');
const router = express.Router();
const connection = require('../../db');
const authenticateToken = require('../../middleware/auth');

// Route pour récupérer les horaires liés à un site (protégée)
router.get('/horaires', authenticateToken, (req, res) => {
    const siteId = req.user.siteIds[0]; // Récupérer le site_id depuis le token

    if (!siteId) {
        return res.status(400).send('Le site_id est introuvable dans le token');
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
    const { horaire_debut, horaire_fin } = req.body;
    const siteId = req.user.siteIds[0]; // Récupérer le site_id depuis le token

    if (!horaire_debut || !horaire_fin || !siteId) {
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

            const linkQuery = `
                INSERT INTO Thoraire_Tsite (horaire_id, site_id)
                VALUES (?, ?)
            `;

            connection.query(linkQuery, [horaireId, siteId], (err) => {
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

// Route pour supprimer un horaire (protégée)
router.post('/delete-horaires', authenticateToken, (req, res) => {
    const { horaire_id } = req.body;
    const siteId = req.user.siteIds[0]; // Récupérer le site_id depuis le token

    if (!horaire_id || !siteId) {
        return res.status(400).send('Les champs "horaire_id" et "site_id" sont requis');
    }

    const deletePlanningQuery = `
        DELETE FROM Tplanning
        WHERE horaire_id = ?
    `;

    connection.query(deletePlanningQuery, [horaire_id], (err) => {
        if (err) {
            console.error('Erreur lors de la suppression des plannings associés :', err.message);
            res.status(500).send('Erreur lors de la suppression des plannings associés');
        } else {
            const deleteHoraireCompetenceQuery = `
                DELETE FROM Thoraire_competence
                WHERE horaire_id = ?
            `;

            connection.query(deleteHoraireCompetenceQuery, [horaire_id], (err) => {
                if (err) {
                    console.error('Erreur lors de la suppression des horaires associés :', err.message);
                    res.status(500).send('Erreur lors de la suppression des horaires associés');
                } else {
                    const deleteHoraireQuery = `
                        DELETE FROM Thoraire
                        WHERE horaire_id = ?
                    `;

                    connection.query(deleteHoraireQuery, [horaire_id], (err) => {
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