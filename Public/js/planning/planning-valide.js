// Contexte pour la page planning validé: n'afficher que les noms validés (planning_valide=1)
(function(){
  try { window.PLANNING_CONTEXT = 'valide'; } catch(e) {}
  try {
    document.addEventListener('DOMContentLoaded', function(){
      try { document.body.classList.add('page-valide'); } catch(e) {}
    });
  } catch(e) {}
  // Shims pour fonctions optionnelles utilisées par planningauto.js
  if (!('renderPlanningRemplissageTable' in window)) {
    window.renderPlanningRemplissageTable = function(){};
  }
  if (!('startSwitchEvolution' in window)) {
    window.startSwitchEvolution = function(){};
  }
})();
