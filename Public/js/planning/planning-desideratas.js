// Shims pour éviter les dépendances à iaselective.js sur cette page
(function(){
  if (!('renderPlanningRemplissageTable' in window)) {
    window.renderPlanningRemplissageTable = function(){};
  }
  if (!('startSwitchEvolution' in window)) {
    window.startSwitchEvolution = function(){};
  }
})();
