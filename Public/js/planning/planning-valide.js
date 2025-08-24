// Contexte pour la page planning validé: n'afficher que les noms validés (planning_valide=1)
(function(){
  try { window.PLANNING_CONTEXT = 'valide'; } catch(e) {}
  try {
    document.addEventListener('DOMContentLoaded', function(){
      try { document.body.classList.add('page-valide'); } catch(e) {}
      // Met à jour la période dans le bandeau si dates présentes
      try {
        const s = document.getElementById('startDate')?.value;
        const e = document.getElementById('endDate')?.value;
        if (s && e) {
          const span = document.getElementById('valide-periode');
          if (span) span.textContent = ` Période: ${new Date(s).toLocaleDateString('fr-FR')} → ${new Date(e).toLocaleDateString('fr-FR')}`;
        }
      } catch {}
    });
  } catch(e) {}
  // Shims pour fonctions optionnelles utilisées par planningauto.js
  if (!('renderPlanningRemplissageTable' in window)) {
    window.renderPlanningRemplissageTable = function(){};
  }
  if (!('startSwitchEvolution' in window)) {
    window.startSwitchEvolution = function(){};
  }

  // Intercepter l’affichage pour montrer le bandeau si au moins une affectation est validée
  const _display = window.displayPlanningWithNames;
  if (typeof _display === 'function') {
    window.displayPlanningWithNames = async function(data, startDate, endDate, vacancesData, missions) {
      const result = await _display.apply(this, arguments);
      try {
        const hasValidated = Array.isArray(data) && data.some(r => Number(r.planning_valide || 0) === 1);
        const banner = document.getElementById('valide-banner');
        const span = document.getElementById('valide-periode');
        if (startDate && endDate && span) span.textContent = ` Période: ${new Date(startDate).toLocaleDateString('fr-FR')} → ${new Date(endDate).toLocaleDateString('fr-FR')}`;
        if (banner) banner.classList.toggle('hidden', !hasValidated);
      } catch {}
      return result;
    }
  }
})();
