window.addEventListener('DOMContentLoaded', function() {
  // Respect CSP: ne pas appliquer de styles inline ici.
  // Les couleurs dynamiques (data-bgcolor) sont ignorées en impression.

  const btn = document.getElementById('btnPrintNow');
  if (btn) {
    btn.addEventListener('click', () => window.print());
  } else {
    window.print();
  }
});
