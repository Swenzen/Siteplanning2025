document.addEventListener('DOMContentLoaded', () => {
  // Valeurs par défaut (peuvent être remplacées via localStorage rgpd.meta)
  const DEFAULT_META = {
    ctlrName: 'Magnier Pierre',
    ctlrAddr: 'À compléter',
    ctlrEmail: 'magniepi@gmail.com',
    hostingRegion: 'Europe (Railway)',
    dbRegion: 'Europe',
    retentionPlanning: '20 ans',
    retentionUsers: '24 mois',
    retentionLogs: '6 mois',
    analyticsEnabled: false,
    performanceEnabled: false
  };
  const meta = Object.assign({}, DEFAULT_META, JSON.parse(localStorage.getItem('rgpd.meta') || '{}'));

  document.getElementById('ctlr-name').textContent = meta.ctlrName;
  document.getElementById('ctlr-address').textContent = meta.ctlrAddr;
  const el = document.getElementById('ctlr-email');
  el.textContent = meta.ctlrEmail; el.href = `mailto:${meta.ctlrEmail}`;
  const re = document.getElementById('rights-email');
  if (re) { re.textContent = meta.ctlrEmail; re.href = `mailto:${meta.ctlrEmail}`; }
  document.getElementById('hosting-region').textContent = meta.hostingRegion;
  document.getElementById('db-region').textContent = meta.dbRegion;
  document.getElementById('retention-planning').textContent = meta.retentionPlanning;
  document.getElementById('retention-users').textContent = meta.retentionUsers;
  document.getElementById('retention-logs').textContent = meta.retentionLogs;

  // Pas de cookies/analytics : aucun autre script requis ici.
});
