document.addEventListener("DOMContentLoaded", () => {
    const header = document.createElement("header");
    header.id = "main-header";

    // Contenu du bandeau
    header.innerHTML = `
        <div id="header-container">
            <nav id="menu">
                <ul>
                    <li><a href="index.html">Index</a></li>
                    <li><a href="base-de-donnee.html">Base de donnée</a></li>
                    <li><a href="planning.html">Planning</a></li>
                </ul>
            </nav>
            <div id="user-section">
                <span id="user-info"></span>
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

    if (username) {
        // Si l'utilisateur est connecté
        userInfo.textContent = `Connecté en tant que : ${username}`;
        logoutButton.style.display = "inline-block";
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
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        window.location.href = "index.html"; // Rediriger vers la page d'accueil
    });
});