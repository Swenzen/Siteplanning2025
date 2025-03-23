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