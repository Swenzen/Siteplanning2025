// Shims pour éviter les dépendances à iaselective.js sur cette page
(function(){
  // Définir le contexte de page pour le tooltip (CSP-safe)
  try { window.PLANNING_CONTEXT = 'desideratas'; } catch(e) {}
  // Marquer le body pour des styles spécifiques à la page desideratas
  try {
    if (document && document.body) {
      document.addEventListener('DOMContentLoaded', function(){
        document.body.classList.add('page-desideratas');
      });
    }
  } catch(e) {}
  if (!('renderPlanningRemplissageTable' in window)) {
    window.renderPlanningRemplissageTable = function(){};
  }
  if (!('startSwitchEvolution' in window)) {
    window.startSwitchEvolution = function(){};
  }
})();
