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

  async function fetchExclusions() {
    const siteId = sessionStorage.getItem('selectedSite');
    try {
      const data = await apiGet(`/api/exclusions-competence-nom?site_id=${siteId}`);
      // Build Set key: `${nom_id}|${competence_id}|${horaire_id}` where excluded=1
      const set = new Set();
      for (const row of data || []) {
        if (row.excluded) set.add(`${row.nom_id}|${row.competence_id}|${row.horaire_id}`);
      }
      return set;
    } catch (e) {
      console.error('Exclusion compétence: échec fetch exclusions', e);
      return new Set();
    }
  }

  function renderTable(noms, compMap, compByPerson, horairesByComp, excludedSet) {
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
      const tdActions = document.createElement('td');
      const compIds = compByPerson.get(item.nom_id) || [];
      if (compIds.length === 0) {
        tdComp.textContent = '—';
        tdActions.textContent = '';
      } else {
        // Liste des compétences, et à droite la grille des checkboxes horaires
        const compList = document.createElement('div');
        compList.style.display = 'flex';
        compList.style.gap = '12px';
        compList.style.flexWrap = 'wrap';

        for (const cid of compIds) {
          const bloc = document.createElement('div');
          bloc.style.border = '1px solid #ddd';
          bloc.style.borderRadius = '6px';
          bloc.style.padding = '6px 8px';
          bloc.style.minWidth = '240px';

          const title = document.createElement('div');
          title.style.fontWeight = '600';
          title.textContent = compMap.get(cid) || `Compétence ${cid}`;
          bloc.appendChild(title);

          const horaires = horairesByComp.get(cid) || [];
          if (horaires.length === 0) {
            const none = document.createElement('div');
            none.textContent = 'Aucun horaire lié';
            none.style.opacity = '0.7';
            bloc.appendChild(none);
          } else {
            const grid = document.createElement('div');
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = 'auto auto';
            grid.style.gap = '6px 10px';
            for (const h of horaires) {
              const label = document.createElement('label');
              label.style.display = 'contents';
              const cb = document.createElement('input');
              cb.type = 'checkbox';
              const key = `${item.nom_id}|${cid}|${h.id}`;
              cb.checked = excludedSet.has(key);
              cb.addEventListener('change', async (ev) => {
                const token = localStorage.getItem('token');
                const siteId = sessionStorage.getItem('selectedSite');
                try {
                  const res = await fetch('/api/toggle-exclusion-competence-nom', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nom_id: item.nom_id, competence_id: cid, horaire_id: h.id, site_id: siteId, excluded: cb.checked })
                  });
                  if (!res.ok) throw new Error(await res.text());
                  if (cb.checked) excludedSet.add(key); else excludedSet.delete(key);
                } catch (e) {
                  console.error('Échec mise à jour exclusion:', e);
                  cb.checked = !cb.checked; // revert UI
                  alert('Erreur lors de la mise à jour.');
                }
              });
              const span = document.createElement('span');
              span.textContent = `${h.debut}–${h.fin}`;
              label.appendChild(cb);
              label.appendChild(span);
              grid.appendChild(label);
            }
            bloc.appendChild(grid);
          }
          compList.appendChild(bloc);
        }
        tdComp.appendChild(compList);
      }
      tr.appendChild(tdComp);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    }
  }

  async function initExclusionSection() {
    // Fonctionne si la table de la page dédiée est présente
    const table = document.querySelector('#exclusionCompetenceTable tbody');
    if (!table) return;
    const [noms, comps, compByPerson, horairesByComp, excludedSet] = await Promise.all([
      fetchNoms(),
      fetchCompetences(),
      fetchCompetencesPersonnes(),
      fetchHorairesCompetences(),
      fetchExclusions()
    ]);
    renderTable(noms, comps.map, compByPerson, horairesByComp, excludedSet);
  }

  // Charger quand la section devient la cible (:target) ou au chargement si déjà ciblée
  document.addEventListener('DOMContentLoaded', () => {
    let retryCount = 0;
    const maxRetries = 10;
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    // 1) Page dédiée /bdd/exclusion-competence.html : init direct si la table est là
    const loadOnPageIfReady = async () => {
      if (!document.querySelector('#exclusionCompetenceTable')) return; // pas sur cette page
      const token = localStorage.getItem('token');
      const siteId = sessionStorage.getItem('selectedSite');
      if (!token || !siteId) {
        if (retryCount < maxRetries) {
          retryCount++;
          await delay(400);
          return loadOnPageIfReady();
        }
      }
      initExclusionSection();
    };
    loadOnPageIfReady();

    // 2) Compatibilité ancienne page: charger quand la section devient :target
    const maybeLoadOldPage = async () => {
      const oldSection = document.getElementById('exclusion compétence');
      if (!oldSection || !oldSection.matches(':target')) return;
      const token = localStorage.getItem('token');
      const siteId = sessionStorage.getItem('selectedSite');
      if (!token || !siteId) {
        if (retryCount < maxRetries) {
          retryCount++;
          await delay(400);
          return maybeLoadOldPage();
        }
      }
      initExclusionSection();
    };
    maybeLoadOldPage();
    window.addEventListener('hashchange', maybeLoadOldPage);

    // Recharger quand le site change (page dédiée ou ancienne section active)
    const selector = document.getElementById('siteSelector');
    if (selector) {
      selector.addEventListener('change', () => {
        if (document.querySelector('#exclusionCompetenceTable')) {
          initExclusionSection();
          return;
        }
        const oldSection = document.getElementById('exclusion compétence');
        if (oldSection && oldSection.matches(':target')) initExclusionSection();
      });
    }
  });
})();
