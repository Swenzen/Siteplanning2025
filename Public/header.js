document.addEventListener("DOMContentLoaded", () => {
    const header = document.createElement("header");
    header.id = "main-header";

    // Contenu du bandeau
    header.innerHTML = `
        <div id="header-container">
            <nav id="menu">
                <ul>
                    <li><a href="index.html" class="${window.location.pathname.includes('index.html') ? 'active' : ''}">Index</a></li>
                    <li><a href="base-de-donnee.html" class="${window.location.pathname.includes('base-de-donnee.html') ? 'active' : ''}">Base de donnée</a></li>
                    <li><a href="planning.html" class="${window.location.pathname.includes('planning.html') ? 'active' : ''}">Planning</a></li>
                </ul>
            </nav>
            <div id="user-section">
                <div id="user-info-container">
                    <span id="user-info"></span>
                    <select id="siteSelector" style="display: none;"></select> <!-- Menu déroulant pour les sites -->
                </div>
                <button id="logoutButton" style="display: none;">Se déconnecter</button>
            </div>
        </div>
    `;

    // Ajouter le bandeau au début du body
    document.body.insertBefore(header, document.body.firstChild);

    // Gestion de l'utilisateur connecté
    const username = localStorage.getItem("username");
    const userInfo = document.getElementById("user-info");
    const logoutButton = document.getElementById("logoutButton");
    const siteSelector = document.getElementById("siteSelector");

    if (username) {
        // Si l'utilisateur est connecté
        userInfo.textContent = `${username}`;
        logoutButton.style.display = "inline-block";
        siteSelector.style.display = "inline-block"; // Afficher le menu déroulant
        loadSiteOptions(); // Charger les options du menu déroulant
    } else if (window.location.pathname.includes("index.html")) {
        // Si l'utilisateur est sur la page d'index (afficher inscription/connexion)
        userInfo.innerHTML = `
            <a href="#login">Connexion</a> | <a href="#register">Inscription</a>
        `;
    } else {
        // Si l'utilisateur n'est pas connecté et pas sur index.html
        userInfo.textContent = "Non connecté";
    }

    // Gestion de la déconnexion
    logoutButton.addEventListener("click", () => {
        // Supprimer toutes les données sensibles du localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("site_id");

        // Rediriger vers la page d'accueil ou de connexion
        window.location.href = "index.html";
    });

    const token = localStorage.getItem("token");

    // Si aucun token n'est présent, nettoyer les autres données
    if (!token) {
        localStorage.removeItem("username");
        localStorage.removeItem("site_id");
    }
});

async function loadSiteOptions() {
    const token = localStorage.getItem('token');
    console.log('Token récupéré :', token);
    if (!token) {
        console.error('Erreur : aucun token trouvé.');
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
        console.log('Sites récupérés :', data);

        // Vérifiez si `data.site` est un tableau
        if (!Array.isArray(data.site)) {
            throw new Error('La réponse de /api/site ne contient pas un tableau de sites.');
        }

        const siteSelector = document.getElementById('siteSelector');
        siteSelector.innerHTML = ''; // Vider les options existantes

        data.site.forEach(site => {
            const option = document.createElement('option');
            option.value = site.site_id;
            option.textContent = site.site_name;
            siteSelector.appendChild(option);
        });

        // Mettre à jour le site_id dans le localStorage lorsque l'utilisateur change de site
        siteSelector.addEventListener('change', (event) => {
            localStorage.setItem('site_id', event.target.value);
            console.log('Site sélectionné :', event.target.value);
            // Recharger les données du planning ou d'autres éléments liés au site
            if (typeof fetchPlanningData === 'function') {
                fetchPlanningData();
            }
        });

        // Sélectionner le premier site par défaut
        if (data.site.length > 0) {
            siteSelector.value = data.site[0].site_id;
            localStorage.setItem('site_id', data.site[0].site_id);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des sites :', error);
    }
}

// Appeler la fonction au chargement de la page
document.addEventListener('DOMContentLoaded', loadSiteOptions);