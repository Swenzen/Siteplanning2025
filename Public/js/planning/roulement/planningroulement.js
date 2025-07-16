async function fetchRoulementNoms() {
    const token = localStorage.getItem('token');
    const siteId = sessionStorage.getItem('selectedSite');
    if (!token || !siteId) return;

    try {
        const response = await fetch(`/api/noms?site_id=${siteId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) return;

        const data = await response.json();
        const tbody = document.querySelector("#roulementNomTable tbody");
        tbody.innerHTML = '';
        data.forEach(({ nom }) => {
            const tr = document.createElement('tr');
            const tdNom = document.createElement('td');
            tdNom.textContent = nom;
            const tdVide = document.createElement('td');
            tr.appendChild(tdNom);
            tr.appendChild(tdVide);
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error('Erreur lors du chargement des noms:', e);
    }
}

document.addEventListener('DOMContentLoaded', fetchRoulementNoms);