window.addEventListener('DOMContentLoaded', function() {
  // Applique les couleurs dynamiques
  document.querySelectorAll('td[data-bgcolor]').forEach(td => {
    const color = td.getAttribute('data-bgcolor');
    if (color) td.style.backgroundColor = color;
  });

  // Si tu veux un bouton "Imprimer" dans la popup :
  const btn = document.getElementById('btnPrintNow');
  if (btn) {
    btn.onclick = function() {
      window.print();
    };
  } else {
    // Sinon, impression automatique
    window.print();
  }
});
