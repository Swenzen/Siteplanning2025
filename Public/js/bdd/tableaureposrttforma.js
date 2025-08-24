async function fetchCompetencesRepos() {
    const token = localStorage.getItem('token');
    const siteId = sessionStorage.getItem('selectedSite');
    if (!token || !siteId) return [];

    const res = await fetch(`/api/competences-repos?site_id=${siteId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json();
}

async function updateReposCompetence(competence_id, repos) {
    const token = localStorage.getItem('token');
    const site_id = sessionStorage.getItem('selectedSite');
    if (!token) { alert('Non connecté'); return false; }
    if (!site_id) { alert('Sélectionnez un site'); return false; }

    try {
        const res = await fetch('/api/update-repos', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ competence_id, repos, site_id })
        });
        if (!res.ok) {
            const text = await res.text();
            alert(`Échec mise à jour (${res.status}) : ${text || 'Erreur'}`);
            return false;
        }
        return true;
    } catch (e) {
        console.error('Erreur réseau update-repos', e);
        alert('Erreur réseau lors de la mise à jour');
        return false;
    }
}

async function displayReposTable() {
    const table = document.getElementById('joursrepos');
    const tbody = table.querySelector('tbody');
    const thead = table.querySelector('thead');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // En-tête
    const headerRow = document.createElement('tr');
    const thCompetence = document.createElement('th');
    thCompetence.textContent = 'Compétence';
    headerRow.appendChild(thCompetence);

    const thRepos = document.createElement('th');
    thRepos.textContent = 'Repos';
    headerRow.appendChild(thRepos);

    thead.appendChild(headerRow);

    // Données
    const competences = await fetchCompetencesRepos();
    competences.forEach(comp => {
        const row = document.createElement('tr');
        const tdCompetence = document.createElement('td');
        tdCompetence.textContent = comp.competence;
        row.appendChild(tdCompetence);

        const tdRepos = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !!comp.repos;
        checkbox.addEventListener('change', async function() {
            const success = await updateReposCompetence(comp.competence_id, this.checked);
            if (!success) {
                alert('Erreur lors de la mise à jour');
                this.checked = !this.checked; // revert
            }
        });
        tdRepos.appendChild(checkbox);
        row.appendChild(tdRepos);

        tbody.appendChild(row);
    });
}

// Afficher le tableau au chargement de la page
document.addEventListener('DOMContentLoaded', displayReposTable);