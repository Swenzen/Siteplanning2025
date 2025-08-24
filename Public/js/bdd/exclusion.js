// Affiche le tableau "Exclusion compétence" en listant les noms depuis l'API
(function () {
  // Helpers d’API
  async function apiGet(url) {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Token manquant');
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error(await res.text() || 'Erreur API');
    return res.json();
  }

  async function fetchNoms() {
    const token = localStorage.getItem('token');
    const siteId = sessionStorage.getItem('selectedSite');
    if (!token || !siteId) {
      console.warn('Exclusion compétence: token ou site non défini.');
      return [];
    }
    try {
      const data = await apiGet(`/api/noms?site_id=${siteId}`);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('Exclusion compétence: échec fetch noms', e);
      return [];
    }
  }

  async function fetchCompetences() {
    const siteId = sessionStorage.getItem('selectedSite');
    try {
      const data = await apiGet(`/api/competences?site_id=${siteId}`);
      // Map id -> libellé
      const map = new Map(data.map(c => [c.competence_id, c.competence]));
      return { list: data, map };
    } catch (e) {
      console.error('Exclusion compétence: échec fetch competences', e);
      return { list: [], map: new Map() };
    }
  }

  async function fetchCompetencesPersonnes() {
    const siteId = sessionStorage.getItem('selectedSite');
    try {
      const data = await apiGet(`/api/competences-personnes?site_id=${siteId}`);
      // data: [{ nom_id, competences: [competence_id, ...] }, ...]
      const byNom = new Map();
      for (const p of data) byNom.set(p.nom_id, p.competences || []);
      return byNom;
    } catch (e) {
      console.error('Exclusion compétence: échec fetch competences-personnes', e);
      return new Map();
    }
  }

  async function fetchHorairesCompetences() {
    const siteId = sessionStorage.getItem('selectedSite');
    try {
      const data = await apiGet(`/api/horaires-competences?site_id=${siteId}`);
      // Retour attendu: [{ horaire_id, horaire_debut, horaire_fin, competences: [competence_id] }, ...]
      const byCompetence = new Map();
      for (const h of data) {
        const compIds = h.competences || [];
        for (const cid of compIds) {
          if (!byCompetence.has(cid)) byCompetence.set(cid, []);
          byCompetence.get(cid).push({ id: h.horaire_id, debut: h.horaire_debut, fin: h.horaire_fin });
        }
      }
      // Tri des horaires par heure début
      for (const [, arr] of byCompetence) {
        arr.sort((a, b) => (a.debut || '').localeCompare(b.debut || ''));
      }
      return byCompetence;
    } catch (e) {
      console.error('Exclusion compétence: échec fetch horaires-competences', e);
      return new Map();
    }
  }

  function renderTable(noms, compMap, compByPerson, horairesByComp) {
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

      // Colonne compétences et horaires
      const tdComp = document.createElement('td');
      const compIds = compByPerson.get(item.nom_id) || [];
      if (compIds.length === 0) {
        tdComp.textContent = '—';
      } else {
        const list = document.createElement('ul');
        list.style.margin = '0';
        list.style.paddingLeft = '16px';
        for (const cid of compIds) {
          const li = document.createElement('li');
          const label = compMap.get(cid) || `Compétence ${cid}`;
          const horaires = horairesByComp.get(cid) || [];
          const horairesTxt = horaires.length
            ? `: ${horaires.map(h => `${h.debut}–${h.fin}`).join(', ')}`
            : '';
          li.textContent = `${label}${horairesTxt}`;
          list.appendChild(li);
        }
        tdComp.appendChild(list);
      }
      tr.appendChild(tdComp);

      const tdActions = document.createElement('td');
      // Intentionnellement vide pour l'instant
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    }
  }

  async function initExclusionSection() {
  const section = document.getElementById('exclusion compétence');
    if (!section) return;
    const [noms, comps, compByPerson, horairesByComp] = await Promise.all([
      fetchNoms(),
      fetchCompetences(),
      fetchCompetencesPersonnes(),
      fetchHorairesCompetences()
    ]);
    renderTable(noms, comps.map, compByPerson, horairesByComp);
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
