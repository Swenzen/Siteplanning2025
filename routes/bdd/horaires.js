const express = require('express');
const router = express.Router();
const connection = require('../../db');
const authenticateToken = require('../../middleware/auth');

// Route pour récupérer les horaires liés à un site (protégée)
router.get('/horaires', authenticateToken, (req, res) => {
    const siteId = req.query.site_id; // Récupérer le site_id depuis la requête
    const userSiteIds = req.user.siteIds; // Récupérer les siteIds autorisés depuis le token

    console.log('Requête reçue pour /horaires :', { siteId, userSiteIds });

    // Vérifier que le site_id est dans la liste des sites autorisés
    if (!userSiteIds.includes(String(siteId))) {
        console.error('Accès refusé : site_id non autorisé');
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site.');
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
            return res.status(500).send('Erreur lors de la récupération des horaires');
        }

        console.log('Horaires récupérés :', results);
        res.json(results);
    });
});

// Route pour ajouter un horaire (protégée)
router.post('/add-horaires', authenticateToken, (req, res) => {
    const { horaire_debut, horaire_fin, site_id } = req.body;
    const userSiteIds = req.user.siteIds; // Récupérer les siteIds autorisés depuis le token

    console.log('Requête reçue pour /add-horaires :', { horaire_debut, horaire_fin, site_id, userSiteIds });

    if (!horaire_debut || !horaire_fin || !site_id) {
        return res.status(400).send('Les champs "horaire_debut", "horaire_fin" et "site_id" sont requis');
    }

    // Vérifier que le site_id est dans la liste des sites autorisés
    if (!userSiteIds.includes(String(site_id))) {
        console.error('Accès refusé : site_id non autorisé');
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site');
    }

    const query = `
        INSERT INTO Thoraire (horaire_debut, horaire_fin)
        VALUES (?, ?)
    `;

    connection.query(query, [horaire_debut, horaire_fin], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout de l\'horaire :', err.message);
            return res.status(500).send('Erreur lors de l\'ajout de l\'horaire');
        }

        const horaireId = result.insertId;

        const linkQuery = `
            INSERT INTO Thoraire_Tsite (horaire_id, site_id)
            VALUES (?, ?)
        `;

        connection.query(linkQuery, [horaireId, site_id], (err) => {
            if (err) {
                console.error('Erreur lors de la liaison horaire-site :', err.message);
                return res.status(500).send('Erreur lors de la liaison horaire-site');
            }

            console.log(`Horaire ajouté avec succès : horaire_id=${horaireId}, site_id=${site_id}`);
            res.send('Horaire ajouté avec succès et lié au site');
        });
    });
});

// Route pour supprimer un horaire (protégée)
router.post('/delete-horaires', authenticateToken, (req, res) => {
    const { horaire_id, site_id } = req.body;
    const userSiteIds = req.user.siteIds; // Récupérer les siteIds autorisés depuis le token

    console.log('Requête reçue pour /delete-horaires :', { horaire_id, site_id, userSiteIds });

    if (!horaire_id || !site_id) {
        return res.status(400).send('Les champs "horaire_id" et "site_id" sont requis');
    }

    // Vérifier que le site_id est dans la liste des sites autorisés
    if (!userSiteIds.includes(String(site_id))) {
        console.error('Accès refusé : site_id non autorisé');
        return res.status(403).send('Accès refusé : Vous n\'avez pas accès à ce site');
    }

    const deletePlanningQuery = `
        DELETE FROM Tplanning
        WHERE horaire_id = ?
    `;

    connection.query(deletePlanningQuery, [horaire_id], (err) => {
        if (err) {
            console.error('Erreur lors de la suppression des plannings associés :', err.message);
            return res.status(500).send('Erreur lors de la suppression des plannings associés');
        }

        const deleteHoraireCompetenceQuery = `
            DELETE FROM Thoraire_competence
            WHERE horaire_id = ?
        `;

        connection.query(deleteHoraireCompetenceQuery, [horaire_id], (err) => {
            if (err) {
                console.error('Erreur lors de la suppression des horaires associés :', err.message);
                return res.status(500).send('Erreur lors de la suppression des horaires associés');
            }

            const deleteHoraireQuery = `
                DELETE FROM Thoraire
                WHERE horaire_id = ?
            `;

            connection.query(deleteHoraireQuery, [horaire_id], (err) => {
                if (err) {
                    console.error('Erreur lors de la suppression de l\'horaire :', err.message);
                    return res.status(500).send('Erreur lors de la suppression de l\'horaire');
                }

                console.log(`Horaire supprimé avec succès : horaire_id=${horaire_id}`);
                res.send('Horaire supprimé avec succès');
            });
        });
    });
});

module.exports = router;