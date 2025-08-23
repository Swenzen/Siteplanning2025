// Charger les options du menu déroulant
        document.addEventListener('DOMContentLoaded', loadSiteOptions);

        // Fonction pour charger les sites depuis l'API
        async function loadSiteOptions() {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Token manquant. Veuillez vous reconnecter.');
                return;
            }

            try {
                const response = await fetch('/api/site', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Erreur lors de la récupération des sites : ${response.status}`);
                }

                const data = await response.json();
                

                const siteSelector = document.getElementById('siteSelectorparametrage');
                siteSelector.innerHTML = ''; // Vider les options existantes

                // Ajouter une option par défaut
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Choisissez un site';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                siteSelector.appendChild(defaultOption);

                // Vérifier si la clé 'site' existe et contient des données
                if (data.site && Array.isArray(data.site) && data.site.length > 0) {
                    // Ajouter les sites récupérés
                    data.site.forEach(site => {
                        const optionParametrageSite = document.createElement('option');
                        optionParametrageSite.value = site.site_id;
                        optionParametrageSite.textContent = site.site_name;
                        siteSelector.appendChild(optionParametrageSite);
                    });
                } else {
                    console.warn('Aucun site disponible ou réponse inattendue.');
                    const noSiteOption = document.createElement('option');
                    noSiteOption.value = '';
                    noSiteOption.textContent = 'Aucun site disponible';
                    noSiteOption.disabled = true;
                    siteSelector.appendChild(noSiteOption);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des sites :', error);
            }
        }

        // Fonction pour créer un nouveau site
        function createSite() {
            const siteName = document.getElementById('siteName').value;

            if (!siteName) {
                alert('Veuillez entrer un nom pour le site.');
                return;
            }

            fetch('/api/create-site', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ siteName })
            })
                .then(response => {
                    if (response.ok) {
                        alert('Site créé avec succès.');
                        loadSiteOptions(); // Recharger les sites après création
                    } else {
                        alert('Erreur lors de la création du site.');
                    }
                })
                .catch(err => console.error('Erreur lors de la création du site :', err));
        }

        // Fonction pour définir un code personnalisé
        function setCustomCode() {
            const customCode = document.getElementById('customCode').value;
            const siteSelector = document.getElementById('siteSelectorparametrage');
            const siteId = siteSelector.options[siteSelector.selectedIndex].value; // Récupérer la valeur sélectionnée

            if (!siteId) {
                alert('Veuillez sélectionner un site.');
                return;
            }

            if (!customCode) {
                alert('Veuillez entrer un code personnalisé.');
                return;
            }

            // Vérification avant l'envoi
            console.log(`Envoi du code personnalisé "${customCode}" pour le site ID ${siteId}`);

            // Envoyer uniquement le site sélectionné avec le code
            fetch('/api/set-custom-code', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ customCode, siteId }) // Inclure le siteId sélectionné
            })
                .then(response => {
                    if (response.ok) {
                        alert(`Code personnalisé défini avec succès pour le site ID ${siteId}.`);
                    } else {
                        return response.json().then(err => {
                            console.error('Erreur de l\'API :', err);
                            alert('Erreur lors de la définition du code.');
                        });
                    }
                })
                .catch(err => console.error('Erreur lors de la définition du code personnalisé :', err));
        }

        // Fonction pour rejoindre un site
        function joinSite() {
            const joinCode = document.getElementById('joinCode').value;

            if (!joinCode) {
                alert('Veuillez entrer un code d\'accès.');
                return;
            }

            fetch('/api/join-site', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ accessCode: joinCode })
            })
                .then(response => {
                    if (response.ok) {
                        alert('Vous avez rejoint le site avec succès.');
                    } else {
                        alert('Code d\'accès invalide ou erreur.');
                    }
                })
                .catch(err => console.error('Erreur lors de la tentative de rejoindre un site :', err));
        }

        // Charger les options pour le menu déroulant de suppression
        async function loadDeleteSiteOptions() {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Token manquant. Veuillez vous reconnecter.');
                return;
            }

            try {
                const response = await fetch('/api/site', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Erreur lors de la récupération des sites : ${response.status}`);
                }

                const data = await response.json();
                

                const siteSelectorDelete = document.getElementById('siteSelectorDelete');
                siteSelectorDelete.innerHTML = ''; // Vider les options existantes

                // Ajouter une option par défaut
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Choisissez un site';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                siteSelectorDelete.appendChild(defaultOption);

                // Ajouter les sites récupérés
                if (data.site && Array.isArray(data.site) && data.site.length > 0) {
                    data.site.forEach(site => {
                        const option = document.createElement('option');
                        option.value = site.site_id;
                        option.textContent = site.site_name;
                        siteSelectorDelete.appendChild(option);
                    });
                } else {
                    console.warn('Aucun site disponible ou réponse inattendue.');
                }
            } catch (error) {
                console.error('Erreur lors du chargement des sites pour suppression :', error);
            }
        }

        // Fonction pour supprimer la liaison avec un site
        function deleteSiteLink() {
            const siteSelectorDelete = document.getElementById('siteSelectorDelete');
            const siteId = siteSelectorDelete.options[siteSelectorDelete.selectedIndex].value;

            if (!siteId) {
                alert('Veuillez sélectionner un site.');
                return;
            }

            fetch('/api/delete-site-link', {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ siteId })
            })
                .then(response => {
                    if (response.ok) {
                        alert(`Liaison avec le site ID ${siteId} supprimée avec succès.`);
                        loadDeleteSiteOptionsok(); // Recharger les options après suppression
                    } else {
                        alert('Erreur lors de la suppression de la liaison.');
                    }
                })
                .catch(err => console.error('Erreur lors de la suppression de la liaison :', err));
        }

        // Charger les options au chargement de la page
        document.addEventListener('DOMContentLoaded', () => {
          document.getElementById('createSiteBtn').addEventListener('click', createSite);
          document.getElementById('setCustomCodeBtn').addEventListener('click', setCustomCode);
          document.getElementById('joinSiteBtn').addEventListener('click', joinSite);
          document.getElementById('deleteSiteLinkBtn').addEventListener('click', deleteSiteLink);

          loadSiteOptions();
          loadDeleteSiteOptions();
        });