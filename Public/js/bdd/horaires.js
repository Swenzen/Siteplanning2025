document.addEventListener('DOMContentLoaded', () => {
  /* Utils */
  const qs  = (s,r=document)=>r.querySelector(s);
  const qsa = (s,r=document)=>[...r.querySelectorAll(s)];
  const token  = () => localStorage.getItem('token');
  const siteId = () => sessionStorage.getItem('selectedSite');

  const horaireModal         = qs('#horaireModal');
  const btnAddHoraire        = qs('#addHoraireButton');
  const btnCloseHoraire      = qs('#closeHoraireModal');
  const btnConfirmAddHoraire = qs('#confirmAddHoraire');

  let lastFocusedBeforeModal = null;
  let modalOpen = false;

  function needAuth() {
    if (!token() || !siteId()) {
      console.warn('[horaires] token ou site_id manquant');
      return true;
    }
    return false;
  }

  function showModal(el) {
    if (!el || modalOpen) return;
    modalOpen = true;
    lastFocusedBeforeModal = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    el.classList.remove('hidden');
    el.style.display = 'flex';
    // Pas d'aria-hidden sur la modale (c’est un dialog)
    const first = qs('#horaireDebutInput', el);
    if (first) setTimeout(()=>first.focus(), 10);
    console.log('[horaires] Modal ouvert');
  }

  function hideModal(el) {
    if (!el || !modalOpen) return;
    // Retirer le focus interne avant aria-hidden ou masquage
    if (el.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    el.classList.add('hidden');
    el.style.display = 'none';
    modalOpen = false;
    const d = qs('#horaireDebutInput', el);
    const f = qs('#horaireFinInput', el);
    if (d) d.value = '';
    if (f) f.value = '';
    if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
      lastFocusedBeforeModal.focus();
    }
  }

  function openHoraireModal(e) {
    if (e) e.preventDefault();
    showModal(horaireModal);
  }
  function closeHoraireModal(e) {
    if (e) e.preventDefault();
    hideModal(horaireModal);
  }

  /* Ouverture unique */
  if (btnAddHoraire) {
    btnAddHoraire.addEventListener('click', openHoraireModal);
  } else {
    console.warn('[horaires] #addHoraireButton absent au DOM');
  }

  /* Fermeture via croix */
  if (btnCloseHoraire) btnCloseHoraire.addEventListener('click', closeHoraireModal);

  /* Fermeture clic fond */
  document.addEventListener('mousedown', e => {
    if (horaireModal && modalOpen && e.target === horaireModal) {
      closeHoraireModal(e);
    }
  });

  /* Boutons génériques data-close-modal */
  qsa('[data-close-modal]').forEach(x=>{
    x.addEventListener('click', () => {
      const id = x.getAttribute('data-close-modal');
      const el = qs('#'+id);
      hideModal(el);
    });
  });

  /* Echappe pour fermer */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalOpen) {
      closeHoraireModal(e);
    }
  });

  /* Ajout horaire */
  if (btnConfirmAddHoraire) {
    btnConfirmAddHoraire.addEventListener('click', async () => {
      const debut = qs('#horaireDebutInput')?.value || '';
      const fin   = qs('#horaireFinInput')?.value || '';
      if (!debut || !fin) { alert('Renseigner début et fin'); return; }
      if (fin <= debut) { alert('Fin doit être > début'); return; }
      if (needAuth()) { alert('Authentification manquante'); return; }

      try {
        const res = await fetch('/api/add-horaires', {
          method:'POST',
          headers:{
            'Authorization':`Bearer ${token()}`,
            'Content-Type':'application/json'
          },
          body: JSON.stringify({
            horaire_debut: debut,
            horaire_fin: fin,
            site_id: siteId()
          })
        });
        if (!res.ok) {
            console.error('[horaires] statut ajout', res.status);
            alert('Erreur ajout');
            return;
        }
        await fetchHoraires();
        if (typeof fetchHorairesCompetences === 'function') fetchHorairesCompetences();
        closeHoraireModal();
      } catch(err) {
        console.error('[horaires] exception ajout', err);
        alert('Erreur réseau');
      }
    });
  }

  /* Fetch / affichage */
  async function fetchHoraires() {
    if (needAuth()) return;
    try {
      const r = await fetch(`/api/horaires?site_id=${encodeURIComponent(siteId())}`, {
        headers:{
          'Authorization':`Bearer ${token()}`,
          'Content-Type':'application/json'
        }
      });
      if (!r.ok) { console.error('[horaires] fetchHoraires statut', r.status); return; }
      const data = await r.json();
      const tbody = qs('#horairesTable tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      data.forEach(h=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${h.horaire_debut}</td>
          <td>${h.horaire_fin}</td>
          <td><button class="btn-delete-horaire" data-id="${h.horaire_id}">Supprimer</button></td>`;
        tbody.appendChild(tr);
      });
      console.log('[horaires] horaires affichés', data.length);
    } catch(err){
      console.error('[horaires] fetchHoraires exception', err);
    }
  }

  async function deleteHoraire(id) {
    if (!id) return;
    if (!confirm('Supprimer cet horaire ?')) return;
    if (needAuth()) return;
    try {
      const r = await fetch('/api/delete-horaires', {
        method:'POST',
        headers:{
          'Authorization':`Bearer ${token()}`,
            'Content-Type':'application/json'
        },
        body: JSON.stringify({ horaire_id:id, site_id: siteId() })
      });
      if (!r.ok) { console.error('[horaires] delete statut', r.status); alert('Erreur suppression'); return; }
      await fetchHoraires();
      if (typeof fetchHorairesCompetences === 'function') fetchHorairesCompetences();
    } catch(err){
      console.error('[horaires] delete exception', err);
      alert('Erreur réseau suppression');
    }
  }

  const horairesTbody = qs('#horairesTable tbody');
  if (horairesTbody) {
    horairesTbody.addEventListener('click', e => {
      const b = e.target.closest('.btn-delete-horaire');
      if (b) deleteHoraire(b.dataset.id);
    });
  }

  fetchHoraires();
});