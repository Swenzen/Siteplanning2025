document.addEventListener("DOMContentLoaded", () => {
    const header = document.createElement("header");
    header.id = "main-header";

    header.innerHTML = `
        <div id="header-container">
    <nav id="menu">
      <ul>
        <li><a href="index.html" class="">Index</a></li>
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
          <a href="planning.html">Planning</a>
          <ul class="dropdown-menu">
            <li><a href="planning-planning automatique.html">Planning automatique</a></li>
            <li><a href="planning-roulement.html">Planning roulement</a></li>
          </ul>
        </li>
        <li><a href="parametrage.html">Paramétrage</a></li>
        <li><a href="stats.html">Stats</a></li>
      </ul>
    </nav>
    <div id="user-section">
      <span class="user-avatar">P</span>
      <div class="user-info-block">
        <span class="user-mail">p@gmail.com</span>
        <select id="siteSelector">
          <option value="1">Amiens</option>
          <option value="4">StVictor</option>
          <option value="5">test</option>
          <option value="6">Médecine nucléaire</option>
        </select>
      </div>
      <button id="logoutButton">Se déconnecter</button>
    </div>
  </div>
    `;

    document.body.insertBefore(header, document.body.firstChild);

    const currentPage = window.location.pathname.split('/').pop();

    // 1. Mettre à jour les liens principaux et sous-menus
    document.querySelectorAll('#menu a').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;

        // On enlève .html pour comparer plus souplement
        const hrefPage = href.split('/').pop().replace('.html', '');
        const currentPageBase = currentPage.replace('.html', '');

        // Active sur lien principal si page principale OU une de ses sous-pages
        if (
            (hrefPage === currentPageBase) ||
            // Cas Planning: active si sous-page planning
            (hrefPage === 'planning' && (currentPageBase.startsWith('planning-')))
        ) {
            link.classList.add('active');
        }

        // Active sur sous-menu si page exacte
        if (hrefPage === currentPageBase) {
            link.classList.add('active');
            // Active aussi le parent (ex: "Planning")
            const parentLi = link.closest('.has-dropdown');
            if (parentLi) {
                const parentLink = parentLi.querySelector('a[href]');
                if (parentLink) parentLink.classList.add('active');
            }
        }
    });

    // Gestion utilisateur
    const username = localStorage.getItem("username");
    const userInfo = document.getElementById("user-info");
    const logoutButton = document.getElementById("logoutButton");
    const siteSelector = document.getElementById("siteSelector");

    if (username) {
        userInfo.textContent = `${username}`;
        logoutButton.style.display = "inline-block";
        siteSelector.style.display = "inline-block";
        logoutButton.classList.remove("hidden");
        siteSelector.classList.remove("hidden");
        loadSiteOptions();
    } else if (window.location.pathname.includes("index.html")) {
        userInfo.innerHTML = `
    <button class="user-btn" id="loginBtn">Connexion</button>
    <button class="user-btn" id="registerBtn">Inscription</button>
`;
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

    // Pour afficher une section
    // document.getElementById('section-noms').classList.remove('hidden');

    // Fermer le dropdown au clic sur un lien du menu
    document.querySelectorAll('.dropdown-menu a').forEach(link => {
        link.addEventListener('click', function() {
            // On masque tous les dropdowns
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.style.opacity = 0;
                menu.style.visibility = 'hidden';
                menu.style.pointerEvents = 'none';
            });
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