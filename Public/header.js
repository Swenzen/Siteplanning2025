document.addEventListener("DOMContentLoaded", () => {
    const header = document.createElement("header");
    header.id = "main-header";

    header.innerHTML = `
        <div id="header-container">
    <nav id="menu">
      <ul>
                <li><a href="/index.html" class="">Index</a></li>
                <li class="has-dropdown">
                    <a href="/bdd/noms.html">Base de donnée</a>
                    <ul class="dropdown-menu">
                        <li><a href="/bdd/noms.html">Noms</a></li>
                        <li><a href="/bdd/competences.html">Compétences</a></li>
                        <li><a href="/bdd/horaires.html">Horaires</a></li>
                        <li><a href="/bdd/horaires-par-competence.html">Horaires par compétence</a></li>
                        <li><a href="/bdd/horaires-par-competence-jours.html">Horaires par compétence et jours</a></li>
                        <li><a href="/bdd/horaires-par-competence-dates.html">Horaires par compétence avec dates</a></li>
                        <li><a href="/bdd/competences-par-nom.html">Compétences par nom</a></li>
                        <li><a href="/bdd/ordre-competences-par-nom.html">Ordre compétences par nom</a></li>
                        <li><a href="/bdd/jours-repos.html">Jours repos</a></li>
                        <li><a href="/bdd/indisponibilites-par-competence.html">Gérer les indisponibilités par compétence</a></li>
                        <li><a href="/bdd/exclusion-competence.html">Exclusion compétence</a></li>
                    </ul>
                </li>
                <li class="has-dropdown">
                                        <a href="/planning/planning.html">Planning</a>
                      <ul class="dropdown-menu">
                                    <li><a href="/planning/planning-desideratas.html">Planning desideratas</a></li>
                                                <li><a href="/planning/planning-automatique.html">Planning automatique</a></li>
                                                <li><a href="/planning/planning-roulement.html">Planning roulement</a></li>
                                                <li><a href="/planning/planning-automatique-clone.html">Planning automatique (clone)</a></li>
                    </ul>
                </li>
                <li><a href="/parametrage.html">Paramétrage</a></li>
                <li><a href="/stats.html">Stats</a></li>
                <li class="has-dropdown">
                    <a href="/confidentialite.html">Infos légales</a>
                    <ul class="dropdown-menu">
                        <li><a href="/confidentialite.html">Politique de confidentialité</a></li>
                        <li><a href="/rgpd.html">RGPD</a></li>
                        <li><a href="/cgu.html">CGU</a></li>
                    </ul>
                </li>
      </ul>
    </nav>
        <div id="user-section">
      <span class="user-avatar">P</span>
      <div class="user-info-block">
                <span class="user-mail">Non connecté</span>
        <select id="siteSelector">
          <option value="1">Amiens</option>
          <option value="4">StVictor</option>
          <option value="5">test</option>
          <option value="6">Médecine nucléaire</option>
        </select>
      </div>
            <button id="headerLogoutButton">Se déconnecter</button>
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

        // Cas BDD: si on est sur une page dans /bdd/, n'activer que le lien racine du menu BDD (pas les autres menus comme Planning)
        if (window.location.pathname.includes('/bdd/')) {
            const liHasDropdown = link.closest('.has-dropdown');
            const isDropdownRoot = liHasDropdown && liHasDropdown.querySelector(':scope > a') === link;
            if (isDropdownRoot) {
                const hrefLower = (link.getAttribute('href') || '').toLowerCase();
                if (hrefLower.startsWith('/bdd/')) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            }
        }
    });

    // Gestion utilisateur (basée uniquement sur le token)
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const isLogged = !!token;
    const userInfo = document.getElementById('user-info'); // facultatif selon pages
    const logoutButton = document.getElementById('headerLogoutButton');
    const siteSelector = document.getElementById('siteSelector');
    const userMail = document.querySelector('#main-header .user-mail');

    if (isLogged) {
        if (userMail) userMail.textContent = username || 'Connecté';
        if (userInfo) userInfo.textContent = username || '';
        if (logoutButton) {
            logoutButton.classList.remove('hidden');
            logoutButton.style.display = 'inline-block';
        }
        if (siteSelector) {
            siteSelector.classList.remove('hidden');
            siteSelector.style.display = 'inline-block';
        }
        loadSiteOptions().catch(() => {});
    } else {
        // Non connecté
        if (userMail) userMail.textContent = 'Non connecté';
        if (userInfo && window.location.pathname.includes('index.html')) {
            // Sur index, laisser la page gérer ses formulaires (#auth-section)
        } else if (userInfo) {
            userInfo.textContent = 'Non connecté';
        }
        if (logoutButton) { logoutButton.classList.add('hidden'); logoutButton.style.display = 'none'; }
        if (siteSelector) { siteSelector.classList.add('hidden'); siteSelector.style.display = 'none'; }
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Nettoyage session
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('site_id');
            sessionStorage.removeItem('selectedSite');
            window.location.href = '/index.html';
        });
    }

    // Navigation BDD: laisser le hash changer sans recharger la page (géré en CSS :target)

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
    if (!token) return; // Pas connecté: ne rien faire
    try {
        const response = await fetch('/api/site', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) return; // API indisponible ou non autorisée
        const data = await response.json();
        if (!data || !Array.isArray(data.site)) return;
        const siteSelector = document.getElementById('siteSelector');
        if (!siteSelector) return; // Pas de sélecteur sur cette page
        siteSelector.innerHTML = '';
        data.site.forEach(site => {
            const option = document.createElement('option');
            option.value = String(site.site_id ?? site.id ?? '');
            option.textContent = site.site_name ?? site.name ?? 'Site';
            siteSelector.appendChild(option);
        });
        const savedSite = sessionStorage.getItem('selectedSite');
        if (savedSite) {
            siteSelector.value = savedSite;
        } else if (data.site.length > 0) {
            const def = String(data.site[0].site_id ?? data.site[0].id ?? '');
            siteSelector.value = def;
            sessionStorage.setItem('selectedSite', def);
        }
        siteSelector.addEventListener('change', (event) => {
            sessionStorage.setItem('selectedSite', event.target.value);
            window.location.reload();
        });
    } catch (error) {
        console.error('Erreur lors du chargement des sites :', error);
    }
}