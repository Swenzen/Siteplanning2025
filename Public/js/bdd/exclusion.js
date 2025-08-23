// Affiche le tableau "Exclusion compétence" en listant les noms depuis l'API
(function () {
  async function fetchNoms() {
    const token = localStorage.getItem('token');
    const siteId = sessionStorage.getItem('selectedSite');
    if (!token || !siteId) {
      console.warn('Exclusion compétence: token ou site non défini.');
      return [];
    }
    try {
      const res = await fetch(`/api/noms?site_id=${siteId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Erreur API noms');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('Exclusion compétence: échec fetch noms', e);
      return [];
    }
  }

  function renderTable(noms) {
    const tbody = document.querySelector('#exclusionCompetenceTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Tri alphabétique français A→Z
    const sorted = [...noms].sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' }));

    for (const item of sorted) {
      const tr = document.createElement('tr');

      const tdNom = document.createElement('td');
      tdNom.textContent = item.nom || '';
      tr.appendChild(tdNom);

      const tdActions = document.createElement('td');
      // Intentionnellement vide pour l'instant
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    }
  }

  async function initExclusionSection() {
  const section = document.getElementById('exclusion compétence');
    if (!section) return;
    const noms = await fetchNoms();
    renderTable(noms);
  }

  // Charger quand la section devient la cible (:target) ou au chargement si déjà ciblée
  document.addEventListener('DOMContentLoaded', () => {
    let retryCount = 0;
    const maxRetries = 10;
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    const maybeLoad = async () => {
  const section = document.getElementById('exclusion compétence');
      if (section && section.matches(':target')) {
        const token = localStorage.getItem('token');
        const siteId = sessionStorage.getItem('selectedSite');
        if (!token || !siteId) {
          if (retryCount < maxRetries) {
            retryCount++;
            await delay(400);
            return maybeLoad();
          }
        }
        initExclusionSection();
      }
    };
    maybeLoad();
    window.addEventListener('hashchange', maybeLoad);

    // Recharger quand le site change si la section est active
  const selector = document.getElementById('siteSelector');
    if (selector) {
      selector.addEventListener('change', () => {
    const section = document.getElementById('exclusion compétence');
        if (section && section.matches(':target')) {
          initExclusionSection();
        }
      });
    }
  });
})();
