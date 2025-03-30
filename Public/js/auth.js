async function login(username, password) {
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Token JWT :', result.token);

            // Stocker le token et le nom de l'utilisateur dans le localStorage
            localStorage.setItem('token', result.token);
            localStorage.setItem('username', result.username);

            alert('Connexion réussie !');
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

document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault(); // Empêche le rechargement par défaut du formulaire

    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    try {
        // Simuler une requête d'authentification (remplace par ton API réelle)
        const response = await fakeLogin(username, password);

        if (response.success) {
            // Stocker les informations de l'utilisateur dans le localStorage
            localStorage.setItem("username", username);
            localStorage.setItem("token", response.token);

            // Rafraîchir la page après connexion réussie
            window.location.reload();
        } else {
            alert("Nom d'utilisateur ou mot de passe incorrect.");
        }
    } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        alert("Une erreur est survenue. Veuillez réessayer.");
    }
});

