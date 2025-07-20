document.addEventListener("DOMContentLoaded", () => {
    const header = document.createElement("header");
    header.id = "main-header";

    header.innerHTML = `
        <div id="header-container">
            <nav id="menu">
                <ul>
                    <li><a href="index.html" class="${window.location.pathname.includes('index.html') ? 'active' : ''}">Index</a></li>
                    <li class="has-dropdown">
                        <a href="base-de-donnee.html">Base de donnée</a>
                        <ul class="dropdown-menu">
                            <li><a href="base-de-donnee.html#noms">Noms</a></li>
                            <li><a href="base-de-donnee.html#compétences">Compétences</a></li>
                            <li><a href="base-de-donnee.html#horaires">Horaires</a></li>
                            <li><a href="base-de-donnee.html#horaires par compétence">Horaires par compétence</a></li>
                            <li><a href="base-de-donnee.html#horaires par compétence et jours">Horaires par compétence et jours</a></li>
                            <li><a href="base-de-donnee.html#horaires par compétence avec dates">Horaires par compétence avec dates</a></li>
                            <li><a href="base-de-donnee.html#compétences par nom">Compétences par nom</a></li>
                            <li><a href="base-de-donnee.html#ordre compétences par nom">Ordre compétences par nom</a></li>
                            <li><a href="base-de-donnee.html#jours repos">Jours repos</a></li>
                            <li><a href="base-de-donnee.html#gérer les indisponibilités par compétence">Gérer les indisponibilités par compétence</a></li>
                        </ul>
                    </li>
                    <li class="has-dropdown">
                        <a href="planning.html" class="${window.location.pathname.includes('planning.html') ? 'active' : ''}">Planning</a>
                        <ul class="dropdown-menu">
                            <li><a href="planning-planning automatique.html">Planning automatique</a></li>
                            <li><a href="planning-roulement.html">Planning roulement</a></li>
                        </ul>
                    </li>
                    <li><a href="parametrage.html" class="${window.location.pathname.includes('parametrage.html') ? 'active' : ''}">Paramétrage</a></li>
                    <li><a href="stats.html" class="${window.location.pathname.includes('stats.html') ? 'active' : ''}">Stats</a></li>
                </ul>
            </nav>
            <div id="user-section">
                <span id="user-info"></span>
                <select id="siteSelector" style="display: none;"></select>
                <button id="logoutButton" style="display: none;">Se déconnecter</button>
            </div>
        </div>
    `;

    document.body.insertBefore(header, document.body.firstChild);

    // Gestion utilisateur
    const username = localStorage.getItem("username");
    const userInfo = document.getElementById("user-info");
    const logoutButton = document.getElementById("logoutButton");
    const siteSelector = document.getElementById("siteSelector");

    if (username) {
        userInfo.textContent = `${username}`;
        logoutButton.style.display = "inline-block";
        siteSelector.style.display = "inline-block";
        loadSiteOptions();
    } else if (window.location.pathname.includes("index.html")) {
        userInfo.innerHTML = `<a href="#login">Connexion</a> | <a href="#register">Inscription</a>`;
    } else {
        userInfo.textContent = "Non connecté";
    }

    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("site_id");
        window.location.href = "index.html";
    });

    // Forcer le rechargement à chaque clic sur le menu BDD
    document.querySelectorAll('nav#menu .dropdown-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            // Si le lien pointe vers la même page (juste le hash), on reload
            const currentPage = window.location.pathname.split('/').pop();
            const targetPage = this.href.split('/').pop().split('#')[0];
            if (currentPage === targetPage) {
                e.preventDefault();
                window.location.assign(this.href.split('#')[0] + '#' + decodeURIComponent(this.href.split('#')[1] || ''));
                window.location.reload();
            }
            // Sinon, navigation normale (ne bloque pas le clic)
            // Pas de e.preventDefault()
        });
    });
});

async function loadSiteOptions() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const response = await fetch('/api/site', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error(`Erreur lors de la récupération des sites : ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data.site)) throw new Error('La réponse de /api/site ne contient pas un tableau de sites.');
        const siteSelector = document.getElementById('siteSelector');
        siteSelector.innerHTML = '';
        data.site.forEach(site => {
            const option = document.createElement('option');
            option.value = site.site_id;
            option.textContent = site.site_name;
            siteSelector.appendChild(option);
        });
        const savedSite = sessionStorage.getItem("selectedSite");
        if (savedSite) {
            siteSelector.value = savedSite;
        } else if (data.site.length > 0) {
            siteSelector.value = data.site[0].site_id;
            sessionStorage.setItem("selectedSite", data.site[0].site_id);
        }
        siteSelector.addEventListener('change', (event) => {
            sessionStorage.setItem("selectedSite", event.target.value);
            window.location.reload();
        });
    } catch (error) {
        console.error('Erreur lors du chargement des sites :', error);
    }
}