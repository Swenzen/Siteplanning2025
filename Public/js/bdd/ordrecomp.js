document.addEventListener('DOMContentLoaded', async () => {
    const tableau = document.getElementById('ordrecomptableau').querySelector('tbody');
    let competences = [];

    function getSiteId() {
        return sessionStorage.getItem('selectedSite');
    }
    function getToken() {
        return localStorage.getItem('token');
    }

    async function fetchOrdreCompetences() {
        const siteId = getSiteId();
        const token = getToken();
        if (!siteId || !token) {
            console.error('Erreur : siteId ou token manquant');
            return [];
        }
        try {
            const response = await fetch(`/api/ordrecompetences?site_id=${siteId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Erreur serveur');
            return await response.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    async function swapOrdreCompetence(id1, id2) {
        const token = getToken();
        if (!token) {
            console.error('Erreur : token manquant');
            return { error: true };
        }
        try {
            const response = await fetch('/api/swap-ordrecompetence', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id1, id2 })
            });
            return await response.json();
        } catch (e) {
            console.error(e);
            return { error: true };
        }
    }

    function renderOrdreCompetences(competences) {
        tableau.innerHTML = '';
        competences.forEach((comp, idx) => {
            const tr = document.createElement('tr');
            tr.setAttribute('draggable', 'true');
            tr.dataset.id = comp.competence_id;
            tr.dataset.index = idx;

            const tdNom = document.createElement('td');
            tdNom.textContent = comp.competence;
            tr.appendChild(tdNom);

            // Drag events
            tr.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', idx);
                tr.classList.add('dragging');
            });
            tr.addEventListener('dragend', () => {
                tr.classList.remove('dragging');
            });
            tr.addEventListener('dragover', (e) => {
                e.preventDefault();
                tr.classList.add('drag-over');
            });
            tr.addEventListener('dragleave', () => {
                tr.classList.remove('drag-over');
            });
            tr.addEventListener('drop', async (e) => {
                e.preventDefault();
                tr.classList.remove('drag-over');
                const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                const toIdx = idx;
                if (fromIdx === toIdx) return;
                const id1 = competences[fromIdx].competence_id;
                const id2 = competences[toIdx].competence_id;
                await swapOrdreCompetence(id1, id2);
                await reload();
            });

            tableau.appendChild(tr);
        });
    }

    async function reload() {
        competences = await fetchOrdreCompetences();
        renderOrdreCompetences(competences);
    }

    await reload();
});