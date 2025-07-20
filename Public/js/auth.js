async function login(email, password) {
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Token JWT :', result.token);

            // Stocker le token et le nom de l'utilisateur dans le localStorage
            localStorage.setItem('token', result.token);
            localStorage.setItem('username', result.email); // Stocke l'email comme identifiant

            return true;
        } else {
            const error = await response.text();
            alert(error);
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de la connexion :', error);
        alert('Erreur lors de la connexion');
        return false;
    }
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const loginButton = e.target.querySelector("button[type='submit']");
    loginButton.disabled = true; // Désactive le bouton pour éviter les clics multiples

    try {
        const success = await login(email, password); // Appelle la fonction login
        if (success) {
            alert("Connexion réussie !");
            window.location.reload(); // Rafraîchit la page après connexion
        }
    } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        alert("Une erreur est survenue, veuillez réessayer.");
    } finally {
        loginButton.disabled = false; // Réactive le bouton après la requête
    }
});

// Masquer la section auth si connecté
function hideAuthSectionIfConnected() {
    const token = localStorage.getItem('token');
    if (token) {
        const authSection = document.getElementById('auth-section');
        if (authSection) authSection.style.display = 'none';
        // Ici tu peux aussi afficher le contenu réservé aux utilisateurs connectés
    }
}

// Appelle la fonction au chargement de la page
window.addEventListener('DOMContentLoaded', hideAuthSectionIfConnected);

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const result = await response.text();
    alert(result);
});