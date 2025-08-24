// Définit le contexte de page pour marquer les insertions comme planning_auto et ajouter une classe body
try {
	window.PLANNING_CONTEXT = 'automatique';
	if (document && document.addEventListener) {
		document.addEventListener('DOMContentLoaded', function(){
			try { document.body.classList.add('page-automatique'); } catch(e) {}
		});
	}
} catch(e) {}
