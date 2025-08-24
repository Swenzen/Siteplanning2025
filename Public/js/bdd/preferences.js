(function(){
  async function fetchPref() {
    const token = localStorage.getItem('token');
    const site_id = sessionStorage.getItem('selectedSite');
    if (!token || !site_id) return { planningcompsem: 0 };
    const res = await fetch(`/api/user-preferences?site_id=${site_id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return { planningcompsem: 0 };
    return await res.json();
  }
  async function savePref(val) {
    const token = localStorage.getItem('token');
    const site_id = sessionStorage.getItem('selectedSite');
    const body = { site_id: Number(site_id), planningcompsem: val ? 1 : 0 };
    const res = await fetch('/api/user-preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    return res.ok;
  }
  async function refreshUI() {
    const pref = await fetchPref();
    const status = document.getElementById('pref-planningcompsem-status');
    const btn = document.getElementById('toggle-planningcompsem');
    const on = Number(pref.planningcompsem) === 1;
    status.textContent = on ? 'Activé (1)' : 'Désactivé (0)';
    btn.textContent = on ? 'Désactiver' : 'Activer';
    btn.onclick = async () => {
      const ok = await savePref(!on);
      if (ok) refreshUI(); else alert('Erreur enregistrement préférence');
    };
  }
  window.addEventListener('DOMContentLoaded', refreshUI);
})();
