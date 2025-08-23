// Fichier nettoyé et unifié — remplace l'ancien

document.addEventListener('DOMContentLoaded', () => {
  const q = s => document.querySelector(s);
  const qAll = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s || '').replace(/([ #;?%&,.+*~':"!^$[\]()=>|/@])/g,'\\$1');

  // Drag-select overlay for native <select>
  (function initDragSelect(){
    const OPEN_CLASS = 'drag-select-open';
    let current = null; // { select, overlay, list, options, activeIndex }
  let clickStopper = null;

    function buildOverlay(select){
      const wrap = document.createElement('div');
      wrap.className = 'drag-wrap';
      // Insert wrapper around select to anchor the overlay absolutely
      if(!select.parentElement) return null;
      if(!select.parentElement.classList.contains('drag-wrap')){
        select.parentElement.insertBefore(wrap, select);
        wrap.appendChild(select);
      }
      const overlay = document.createElement('div');
      overlay.className = 'drag-select-overlay';
      overlay.setAttribute('role','listbox');
      const list = document.createElement('div');
      list.className = 'drag-select-list';
      // Mirror options
      Array.from(select.options).forEach((opt, idx)=>{
        const div = document.createElement('div');
        div.className = 'drag-option';
        div.textContent = opt.textContent;
        div.setAttribute('role','option');
        if(opt.disabled){ div.classList.add('disabled'); div.setAttribute('aria-disabled','true'); }
        if(opt.selected){ div.setAttribute('aria-selected','true'); }
        div.dataset.index = String(idx);
        list.appendChild(div);
      });
      overlay.appendChild(list);
      wrap.appendChild(overlay);
      return { overlay, list };
    }

  function openOverlay(select){
      closeOverlay();
      const built = buildOverlay(select);
      if(!built) return;
      const { overlay, list } = built;
      // Aligner la largeur de l'overlay sur le select
      try {
        const rectSel = select.getBoundingClientRect();
        overlay.style.width = rectSel.width + 'px';
      } catch {}
  select.classList.add(OPEN_CLASS);
  current = { select, overlay, list, options: Array.from(list.querySelectorAll('.drag-option')), activeIndex: -1 };
      // Positioning is handled via CSS .drag-wrap
      // Activate drag mode
  const onMove = (ev)=>{
        if(!current) return;
        const y = ev.clientY;
        const rect = current.overlay.getBoundingClientRect();
        const relY = y - rect.top;
        let idx = -1; let acc = 0;
        for(let i=0;i<current.options.length;i++){
          const optEl = current.options[i];
          const h = optEl.offsetHeight || 28;
          if(relY >= acc && relY < acc + h){ idx = i; break; }
          acc += h;
        }
        highlightIndex(idx);
      };
  if(current) current.onMove = onMove;
  const onUp = (ev)=>{
        if(!current) { return; }
        // Si relâchement au-dessus d'une option valide, on la choisit
        const x = ev.clientX, y = ev.clientY;
        const el = document.elementFromPoint(x, y);
        const opt = el && el.closest ? el.closest('.drag-option') : null;
        if(opt && !opt.classList.contains('disabled')){
          const idx = Number(opt.dataset.index||-1);
          if(idx>=0) commitSelection(idx);
        }
        closeOverlay();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp, { once:true });
      // Click directly on an option also commits
      overlay.addEventListener('mousedown', (e)=>{
        const opt = e.target.closest('.drag-option');
        if(!opt || opt.classList.contains('disabled')) return;
        const idx = Number(opt.dataset.index||-1);
        if(idx>=0) highlightIndex(idx);
      });
      overlay.addEventListener('click', (e)=>{
        const opt = e.target.closest('.drag-option');
        if(!opt || opt.classList.contains('disabled')) return;
        const idx = Number(opt.dataset.index||-1);
        if(idx>=0){ commitSelection(idx); closeOverlay(); }
      });
      // Scroll wheel support
      current.overlay.addEventListener('wheel', (e)=>{
        e.preventDefault();
        const delta = Math.sign(e.deltaY);
        const next = clamp((current.activeIndex>=0?current.activeIndex:0)+delta, 0, current.options.length-1);
        highlightIndex(next);
      }, { passive:false });
      // Escape to cancel
      document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ closeOverlay(); } }, { once:true });
    }

    function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
    function highlightIndex(idx){
      if(!current) return;
      current.options.forEach((el,i)=>{
        el.classList.toggle('active', i===idx && !el.classList.contains('disabled'));
      });
      current.activeIndex = idx;
      if(idx>=0){
        const el = current.options[idx];
        if(el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
      }
    }
    function commitSelection(idx){
      if(!current) return;
      const optDiv = current.options[idx];
      if(!optDiv || optDiv.classList.contains('disabled')) return;
      const i = Number(optDiv.dataset.index || -1);
      if(i>=0){ current.select.selectedIndex = i; current.select.dispatchEvent(new Event('change', { bubbles:true })); }
    }
    function closeOverlay(){
      if(!current) return;
      current.select.classList.remove(OPEN_CLASS);
      try{ current.overlay.remove(); }catch{}
      try{ if(current.onMove) document.removeEventListener('mousemove', current.onMove); }catch{}
      if(clickStopper){
        try{ document.removeEventListener('click', clickStopper, true); }catch{}
        clickStopper = null;
      }
      current = null;
    }

    function enhance(select){
      if(select.classList.contains('no-drag-select')) return;
      if(select.dataset.dragSelect==='1') return;
      select.dataset.dragSelect = '1';
      let dragging = false;
      let startX = 0, startY = 0;
      let moveHandler = null;
      const threshold = 6; // pixels

    function onMouseMove(ev){
        if(!dragging) return;
        const dx = Math.abs(ev.clientX - startX);
        const dy = Math.abs(ev.clientY - startY);
        if(dx > threshold || dy > threshold){
          dragging = false; // avoid re-entry
          // Supprimer le clic natif imminent qui ouvrirait le menu
      const stopClickOnce = (e)=>{ e.preventDefault(); e.stopImmediatePropagation(); document.removeEventListener('click', stopClickOnce, true); clickStopper = null; };
      clickStopper = stopClickOnce;
      document.addEventListener('click', stopClickOnce, true);
          // Ouvrir l'overlay et retirer l'écoute de mouvement
          openOverlay(select);
          document.removeEventListener('mousemove', moveHandler);
        }
      }

      select.addEventListener('mousedown', (e)=>{
        if(e.button !== 0) return;
        // Mode optionnel: forcer l'overlay dès le clic (style homogène) si classe overlay-click
        if(select.classList.contains('overlay-click')){ e.preventDefault(); openOverlay(select); return; }
        // Sinon, ne pas empêcher le comportement par défaut ici pour garder le menu natif si pas de drag
        dragging = true;
        startX = e.clientX; startY = e.clientY;
        moveHandler = onMouseMove;
        document.addEventListener('mousemove', moveHandler);
        const upOnce = ()=>{
          dragging = false;
          document.removeEventListener('mousemove', moveHandler);
          document.removeEventListener('mouseup', upOnce);
        };
        document.addEventListener('mouseup', upOnce);
      });
      // Laisser le clavier gérer le menu natif (pas d'interception)
    }

    // Enhance current and future selects
    function enhanceAll(root=document){
      root.querySelectorAll('select').forEach(enhance);
    }
    enhanceAll();
    const mo = new MutationObserver((mutList)=>{
      for(const m of mutList){
        m.addedNodes && m.addedNodes.forEach(node=>{
          if(node.nodeType===1){
            if(node.tagName==='SELECT') enhance(node);
            else enhanceAll(node);
          }
        });
      }
    });
    mo.observe(document.body, { childList:true, subtree:true });
    // Close overlay on window blur to avoid sticky state
    window.addEventListener('blur', closeOverlay);
  })();

  // Elements principaux
  const crZone    = q('#cr-zone');
  const btnCopier = q('#btn-copier-cr');
  const btnGen    = null; // retiré
  const copieOkEl = q('#copie-ok');

  // Perfusion (multi-panels) — ces éléments seront résolus par panel via IDs suffixés

  const territoireIsch = q('#territoire-ischemie');
  const territoireNec  = q('#territoire-necrose');
  const countIschEl    = q('#count-isch');
  const countNecEl     = q('#count-nec');

  const typeStress   = q('#type-stress');
  const betabloquant = q('#betabloquant');
  const clinique     = q('#clinique');
  const electrique   = q('#electrique');

  // fmt : on accepte soit un slider soit seulement le champ numérique (on supprime le slider côté HTML)
  const fmt      = q('#fmt') || q('#fmt-input');
  const fmtInput = q('#fmt-input');
  const fmtValue = q('#fmt-value');

  const kineTerr  = q('#kine-territoire');
  const kineType  = q('#kine-type');
  const kineEtend = q('#kine-etendue');
  const kineRev   = q('#kine-reversibilite');
  const kineNorm  = q('#kine-normal');
  const kineGlob  = q('#kine-globale');
  const kineDilat = q('#kine-dilat');

  // si les sliders ont été retirés, on prend en fallback les champs numériques
  const fevgS = null;
  const fevgR = null;
  const vtdS  = q('#vtd-stress') || q('#vtd-stress-input');
  const vtdR  = q('#vtd-rest')  || q('#vtd-rest-input');
  const vtsS  = q('#vts-stress') || q('#vts-stress-input');
  const vtsR  = q('#vts-rest')  || q('#vts-rest-input');

  const flagPerte10 = q('#flag-perte10'), flagPerte10Alt = q('#flag-perte10-2'), flagDilat20 = q('#flag-dilat20'), flagDilat10 = q('#flag-dilat10'), flagVts70 = q('#flag-vts70');

  // Segments
  const SEGMENTS = [
    "apical","antéro-apical","septo-apical","inféro-apical","latéro-apical",
    "inféro-latéral moyen","antéro-latéral moyen","antéro-septal moyen","inféro-septal moyen",
    "inférieur moyen","antérieur moyen","antéro-basal","antéro-septo-basal","inféro-septo-basal",
    "antéro-latéro-basal","inféro-latéro-basal","inféro-basal"
  ];

  // Territoires standard (sans numéros) et options Étendue demandées
  const TERRITOIRES = [
    "Apical","Antéro-apical","Antérieur","Antéro-septal","Antéro-septo-apical",
    "Inférieur","Inféro-septal","Latéral","Inféro-latéral","Septal"
  ];
  const ETENDUES = [
    "De Faible étendue","D'étendue Modérée","Étendue"
  ];
  function populateTerritoires(){
    const selects = Array.from(document.querySelectorAll('select[id*="territoire"]'));
    selects.forEach(sel=>{
      sel.innerHTML = '';
      const opt0 = document.createElement('option'); opt0.value = ''; opt0.textContent = '—'; sel.appendChild(opt0);
      TERRITOIRES.forEach(t=>{ const o = document.createElement('option'); o.value = t; o.textContent = t; sel.appendChild(o); });
    });
  }
  function populateEtendues(){
    const selects = Array.from(document.querySelectorAll('select[id*="etendue"]'));
    selects.forEach(sel=>{
      sel.innerHTML = '';
      const opt0 = document.createElement('option'); opt0.value = ''; opt0.textContent = '—'; sel.appendChild(opt0);
      ETENDUES.forEach(t=>{ const o = document.createElement('option'); o.value = t; o.textContent = t; sel.appendChild(o); });
    });
  }
  populateTerritoires();
  populateEtendues();

  // --- Ajout : peupler le select "profondeur-perfusion" (corrige le menu déroulant qui ne fonctionnait plus) ---
  const PROFONDEURS = [
    "Sous‑endocardique",
    "Transmural",
    "Épicardique"
  ];
  function populateProfondeurs(){
    const selects = Array.from(document.querySelectorAll('select[id*="profondeur"]'));
    selects.forEach(sel=>{
      sel.innerHTML = '';
      const opt0 = document.createElement('option'); opt0.value = ''; opt0.textContent = '—'; sel.appendChild(opt0);
      PROFONDEURS.forEach(p=>{ const o = document.createElement('option'); o.value = p; o.textContent = p; sel.appendChild(o); });
    });
  }
  populateProfondeurs();
  // --- fin ajout ---

  // Etats
  // tri-état pour isch/nec : 0 = none, 1 = partial, 2 = complete (global, conclusions)
  const ischState = new Map(); SEGMENTS.forEach(s => ischState.set(s, 0));
  const necState  = new Map(); SEGMENTS.forEach(s => necState.set(s, 0));
  // Perfusion panels: Map<key, { stress: Map<seg,0|1|2>, rev: Map<seg,0|1|2> }>
  const perfPanels = new Map();

  // utilitaires
  const lc = s => (s||'').toLowerCase();
  const joinFr = arr => arr.length === 0 ? '' : arr.length === 1 ? arr[0] : `${arr.slice(0,-1).join(', ')} et ${arr[arr.length-1]}`;
  const listSegments = arr => arr.map(s => s.replace(/-/g,' '));
  function computeWeighted(map){
    let w = 0; const by = { complete:[], partial:[], none:[] };
    for(const [k,v] of map.entries()){
      if(v === 2){ w += 1; by.complete.push(k); }
      else if(v === 1){ w += 0.5; by.partial.push(k); }
      else by.none.push(k);
    }
    return { weighted: w, byState: by };
  }

  // CSS classes app pour isch/nec
  function applyClassesToPath(mode, segId, state){
    const domId = `${mode}-${segId}`;
    const svgId = mode === 'isch' ? '#svg-ischemie' : '#svg-necrose';
    const p = document.querySelector(`${svgId} #${CSS.escape(domId)}`);
    if(!p) return;
    p.classList.remove(`${mode}-partial`, `${mode}-complete`, `${mode}-none`, 'on');
    if(state === 1){ p.classList.add(`${mode}-partial`, 'on'); }
    else if(state === 2){ p.classList.add(`${mode}-complete`, 'on'); }
    else { p.classList.add(`${mode}-none`); }
  }

  // initial attach pour isch/nec (cycle 0->1->2->0)
  function initAttachCycle(mode, map){
    const svgId = mode === 'isch' ? '#svg-ischemie' : '#svg-necrose';
    const prefix = mode === 'isch' ? 'isch-' : 'nec-';
    const nodes = qAll(`${svgId} [id^="${prefix}"]`);
    nodes.forEach(node => {
      const clone = node.cloneNode(true);
      node.parentNode.replaceChild(clone, node);
      const segId = clone.id.replace(new RegExp('^' + prefix),'');
      const state = map.get(segId) || 0;
      applyClassesToPath(mode, segId, state);
      clone.addEventListener('click', (e) => {
        e.stopPropagation();
        const cur = map.get(segId) || 0;
        const next = (cur + 1) % 3;
        map.set(segId, next);
        applyClassesToPath(mode, segId, next);
        updateBottomCounters();
        updateCounts(); if(typeof genererCR === 'function') genererCR();
      });
    });
  }

  function updateBottomCounters(){
    const iw = computeWeighted(ischState).weighted;
    const nw = computeWeighted(necState).weighted;
    if(countIschEl) countIschEl.textContent = `${iw} / 17`;
    if(countNecEl)  countNecEl.textContent = `${nw} / 17`;
  }

  // Perfusion interactions (multi-panel)
  const REV_CLASSES = ['fill-green','fill-orange','fill-red'];
  const setPerfColor = (path, etat) => {
    path.classList.remove('fill-green','fill-orange','fill-red');
    path.classList.add(etat === 1 ? 'fill-orange' : etat === 2 ? 'fill-red' : 'fill-green');
  };
  const idSuf = (key) => (key === 't1' ? '' : '-' + key);

  function ensurePanelState(key){
    if(!perfPanels.has(key)){
      const stress = new Map(); SEGMENTS.forEach(s => stress.set(s, 0));
      const rev    = new Map(); SEGMENTS.forEach(s => rev.set(s, 0));
      perfPanels.set(key, { stress, rev });
    }
    return perfPanels.get(key);
  }

  function updateReversibiliteAvailabilityFor(key){
    const suf = idSuf(key);
    const st = ensurePanelState(key);
    SEGMENTS.forEach(seg => {
      const p = q(`#svg-reversibilite${suf} #rev-${esc(seg)}${suf}`);
      if(!p) return;
      const active = (st.stress.get(seg) || 0) > 0;
      const cur = st.rev.get(seg) || 0;
      p.classList.remove(...REV_CLASSES, 'fill-gray', 'rev-active','rev-inactive');
      if(active){ p.classList.add(REV_CLASSES[cur], 'rev-active'); }
      else { p.classList.add('fill-gray','rev-inactive'); }
    });
  }

  function initPerfusionPanel(panelEl, key){
    const suf = idSuf(key);
    const st = ensurePanelState(key);
    // ajouter un titre Territoire N au début du panel pour lisibilité
    let title = panelEl.querySelector('.territoire-title');
    if(!title){
      title = document.createElement('div');
      title.className = 'territoire-title';
      const grid = panelEl.querySelector('.bulls-grid');
      if(grid && grid.parentNode){ grid.parentNode.insertBefore(title, grid); }
      else { panelEl.insertBefore(title, panelEl.firstChild); }
    }
    // bouton suppression pour panels > t1
    if(key !== 't1'){
      let actions = panelEl.querySelector('.panel-actions');
      if(!actions){
        actions = document.createElement('div');
        actions.className = 'actions-row panel-actions';
        // insérer sous le bloc des contrôles pour éviter d'impacter les SVG
        const controls = panelEl.querySelector('.bulls-controls.perf-controls');
        if(controls && controls.parentNode){
          // insérer après controls
          if(controls.nextSibling) controls.parentNode.insertBefore(actions, controls.nextSibling);
          else controls.parentNode.appendChild(actions);
        } else {
          panelEl.appendChild(actions);
        }
      }
      // éviter doublon bouton
      let delBtn = actions.querySelector('.btn-del-territoire');
      if(!delBtn){
        delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-copier btn-del-territoire';
        delBtn.textContent = '− Supprimer territoire';
        actions.appendChild(delBtn);
        delBtn.addEventListener('click', (e)=>{
          e.preventDefault();
          // retirer état et DOM
          perfPanels.delete(key);
          const wrap = document.getElementById('perfusion-panels');
          if(panelEl && wrap && wrap.contains(panelEl)) wrap.removeChild(panelEl);
          genererCR();
          relabelTerritoires();
        });
      }
    }
    // écouteurs contrôles de ce panel
    const selIds = [
      `#territoire-perfusion${suf}`,
      `#profondeur-perfusion${suf}`,
      `#etendue-perfusion${suf}`,
      `#artefactuel${suf}`,
      `#normal-par-ailleurs${suf}`
    ];
    selIds.forEach(sel => {
      const el = q(sel);
      if(!el) return;
      ['change','input'].forEach(ev => el.addEventListener(ev, () => genererCR()));
    });
    // init perfusion paths
    SEGMENTS.forEach(seg => {
      const path = q(`#svg-perfusion${suf} #${esc(seg)}${suf}`);
      if(!path) return;
      setPerfColor(path, st.stress.get(seg) || 0);
      const clone = path.cloneNode(true);
      path.parentNode.replaceChild(clone, path);
      clone.addEventListener('click', () => {
        const cur = st.stress.get(seg) || 0;
        const next = (cur + 1) % 3;
        st.stress.set(seg, next);
        setPerfColor(clone, next);
        updateReversibiliteAvailabilityFor(key);
        genererCR();
      });
    });
    // init reversibilite paths
    SEGMENTS.forEach(seg => {
      const p = q(`#svg-reversibilite${suf} #rev-${esc(seg)}${suf}`);
      if(!p) return;
      const clone = p.cloneNode(true);
      p.parentNode.replaceChild(clone, p);
      clone.classList.add('rev-path');
      clone.addEventListener('click', (e) => {
        const active = (st.stress.get(seg) || 0) > 0;
        if(!active) return;
        const cur = st.rev.get(seg) || 0;
        clone.classList.remove(REV_CLASSES[cur]);
        const next = (cur + 1) % 3;
        st.rev.set(seg, next);
        clone.classList.add(REV_CLASSES[next]);
        e.stopPropagation();
        genererCR();
      });
    });
    updateReversibiliteAvailabilityFor(key);
  relabelTerritoires();
  }

  // init isch/nec handlers
  initAttachCycle('isch', ischState);
  initAttachCycle('nec', necState);
  updateBottomCounters();

  // sliders / inputs helpers (conservés)
  function connectSlider(rangeId, inputId, valueId, suffix = "", onChange = ()=>{}){
    const r = q('#' + rangeId); const n = q('#' + inputId); const v = valueId ? q('#' + valueId) : null;
    if(!r || !n) return;
    if(!r.dataset.empty) r.dataset.empty = "1";
    const render = ()=>{ const empty = r.dataset.empty === "1"; if(v) v.textContent = empty ? `—${suffix}` : `${r.value}${suffix}`; n.value = empty ? "" : r.value; };
    const syncR2N = ()=>{ r.dataset.empty = "0"; n.value = r.value; render(); onChange(); };
    const syncN2R = ()=>{ if(n.value === ""){ r.dataset.empty = "1"; render(); onChange(); } else { r.dataset.empty = "0"; r.value = n.value; render(); onChange(); } };
    render();
    r.addEventListener('input', syncR2N);
    n.addEventListener('input', syncN2R);
  }
  if(fmt && fmtInput && fmtValue){
    const updateFmtDisplay = () => {
      const val = Number(fmt.value || 0);
      fmtInput.value = String(val);
      fmtValue.textContent = val > 0 ? `${val}%` : "—%";
    };
    fmt.addEventListener('input', () => { updateFmtDisplay(); genererCR(); });
    fmtInput.addEventListener('input', () => { fmt.value = fmtInput.value; updateFmtDisplay(); genererCR(); });
    updateFmtDisplay();
  }
  connectSlider('vtd-stress','vtd-stress-input','vtd-stress-value',' mL', () => { updateKineFlags(); genererCR(); });
  connectSlider('vtd-rest','vtd-rest-input','vtd-rest-value',' mL', () => { updateKineFlags(); genererCR(); });
  connectSlider('vts-stress','vts-stress-input','vts-stress-value',' mL', () => { updateKineFlags(); genererCR(); });
  connectSlider('vts-rest','vts-rest-input','vts-rest-value',' mL', () => { updateKineFlags(); genererCR(); });

  function num(v){ const n = Number(v); return isFinite(n) ? n : 0; }
  // considère vide si l'élément n'existe pas, si sa valeur est vide ou s'il a le flag data-empty (pour sliders)
  const isEmpty = el => !el || String(el.value || '').trim() === '' || el.dataset.empty === "1";

  function updateKineFlags(){
    if (!flagPerte10 || !flagDilat20 || !flagDilat10 || !flagVts70) return;
    // On calcule la FEVG ONLY à partir des VTD/VTS ; si manquant, on réinitialise les flags
    if (!vtdS || !vtdR || !vtsS || !vtsR || isEmpty(vtdS) || isEmpty(vtdR) || isEmpty(vtsS) || isEmpty(vtsR)) {
      flagPerte10.textContent = "0";
      flagDilat20.textContent = "0";
      flagDilat10.textContent = "0";
      flagVts70.textContent   = "0";
      return;
    }
    const autoFEVGStress = computeFEVGFromInputs(vtdS, vtsS);
    const autoFEVGRest   = computeFEVGFromInputs(vtdR, vtsR);
    if (autoFEVGStress === null || autoFEVGRest === null) {
      flagPerte10.textContent = "0";
      flagDilat20.textContent = "0";
      flagDilat10.textContent = "0";
      flagVts70.textContent   = "0";
      return;
    }
    const dFE  = num(autoFEVGRest) - num(autoFEVGStress);
    const dVTD = num(vtdS.value)  - num(vtdR.value);
    const dVTS = num(vtsS.value)  - num(vtsR.value);
    const vtsStress = num(vtsS.value);

    const perteVal = dFE >= 10 ? "1" : "0";
    flagPerte10.textContent = perteVal;
    if (flagPerte10Alt) flagPerte10Alt.textContent = perteVal;
    flagDilat20.textContent = dVTD >= 20 ? "1" : "0";
    flagDilat10.textContent = dVTS >= 10 ? "1" : "0";
    flagVts70.textContent   = vtsStress > 70 ? "1" : "0";
  }

  ['vtd-stress','vtd-rest','vts-stress','vts-rest','vtd-stress-input','vtd-rest-input','vts-stress-input','vts-rest-input'].forEach(id=>{
    const el = q('#' + id); if(el) el.addEventListener('input', updateFEVGDisplays);
  });

  function computeFEVGFromInputs(vtdEl, vtsEl){
    const vtd = Number(vtdEl?.value); const vts = Number(vtsEl?.value);
    if(!vtd || isNaN(vtd) || isNaN(vts) || vtd <= 0) return null;
    return Math.round(100 * (vtd - vts) / vtd);
  }
  function updateFEVGDisplays(){
    const fevgStressVal = computeFEVGFromInputs(q('#vtd-stress-input') || q('#vtd-stress'), q('#vts-stress-input') || q('#vts-stress'));
    const fevgRestVal = computeFEVGFromInputs(q('#vtd-rest-input') || q('#vtd-rest'), q('#vts-rest-input') || q('#vts-rest'));
    const elS = q('#fevg-stress-auto'); const elR = q('#fevg-rest-auto');
    if(elS) elS.textContent = (fevgStressVal !== null) ? `${fevgStressVal} %` : "";
    if(elR) elR.textContent = (fevgRestVal !== null) ? `${fevgRestVal} %` : "";
    updateKineFlags();
  }
  updateFEVGDisplays();

  // ====== MULTI-TERRITOIRE: clonage CSP-safe du panel perfusion ======
  const perfPanelsWrap = q('#perfusion-panels');
  const addTerrBtn = q('#btn-add-territoire');

  function getNextTerritoireIndex(){
    if(!perfPanelsWrap) return 2;
    const ids = qAll('#perfusion-panels .bulls-container[data-territoire]')
      .map(el => Number((el.getAttribute('data-territoire')||'t1').replace(/^t/,'')))
      .filter(n => !isNaN(n));
    const max = ids.length ? Math.max(...ids) : 1;
    return max + 1;
  }

  function renameIdAndFor(root, suffix){
    // Remplacer tous les id par id+"-"+suffix et mettre à jour les attributs for qui pointent dessus
    const idMap = new Map();
  root.querySelectorAll('[id], svg [id]').forEach(el => {
      const oldId = el.id;
      if(!oldId) return;
      // Éviter de doubler le suffixe si déjà présent
      const newId = oldId.endsWith('-' + suffix) ? oldId : `${oldId}-${suffix}`;
      idMap.set(oldId, newId);
      el.id = newId;
    });
    // for/aria-labelledby/aria-controls xlink:href et href pour svg
    const attrsToFix = ['for','aria-labelledby','aria-controls','xlink:href','href'];
    const all = root.querySelectorAll('*');
    all.forEach(el => {
      attrsToFix.forEach(attr => {
        const v = el.getAttribute(attr);
        if(!v) return;
        // cas URI #id
        if(v.startsWith('#') && idMap.has(v.slice(1))){ el.setAttribute(attr, '#' + idMap.get(v.slice(1))); }
        else if(idMap.has(v)) { el.setAttribute(attr, idMap.get(v)); }
      });
    });
  }

  function createPerfusionPanelClone(){
    const base = q('#perfusion-panel-t1');
    if(!base || !perfPanelsWrap) return null;
    const idx = getNextTerritoireIndex();
    const suffix = 't' + idx;
    const clone = base.cloneNode(true);
    clone.id = `perfusion-panel-${suffix}`;
    clone.setAttribute('data-territoire', suffix);

  // Renommer tous les ids à l'intérieur du clone pour éviter les collisions
    renameIdAndFor(clone, suffix);

    return { node: clone, suffix };
  }

  function populateProfondeursFor(root){
    const selects = Array.from(root.querySelectorAll('select[id*="profondeur"]'));
    selects.forEach(sel=>{
      sel.innerHTML = '';
      const opt0 = document.createElement('option'); opt0.value = ''; opt0.textContent = '—'; sel.appendChild(opt0);
      PROFONDEURS.forEach(p=>{ const o = document.createElement('option'); o.value = p; o.textContent = p; sel.appendChild(o); });
    });
  }

  function insertNewPerfusionPanel(){
    const res = createPerfusionPanelClone();
    if(!res) return;
    const { node } = res;
    // Insérer juste avant la ligne du bouton
    const btnRow = q('.add-territoire-row');
    if(btnRow && btnRow.parentElement === perfPanelsWrap){
      perfPanelsWrap.insertBefore(node, btnRow);
    } else {
      perfPanelsWrap.appendChild(node);
    }
  // Peupler les selects "Profondeur" du nouveau panel
  populateProfondeursFor(node);
  // Initialiser les écouteurs pour ce panel cloné
  initPerfusionPanel(node, node.getAttribute('data-territoire'));
  genererCR();
  }

  if(addTerrBtn){
    addTerrBtn.addEventListener('click', (e)=>{ e.preventDefault(); insertNewPerfusionPanel(); });
  }

  function relabelTerritoires(){
    const panels = collectPerfPanelsInOrder();
    panels.forEach((p, i)=>{
      const title = p.querySelector('.territoire-title');
      if(title) title.textContent = `Territoire ${i+1}`;
    });
  }

  // génération CR (utilise états tri)
  function segPhrase(arr){
    if(!arr || arr.length === 0) return "";
    const names = listSegments(arr);
    if(names.length === 1) return `le segment ${names[0]}`;
    return `les segments ${joinFr(names)}`;
  }

  function updateCounts(){ updateBottomCounters(); } // compat

  function genererCR(){
    // Perfusion summary multi-panels
    let perf = "Tomoscintigraphie de perfusion de stress et de repos:\n";
    const panelKeys = Array.from(perfPanels.keys());
    if(panelKeys.length === 0){
      perf += "- Répartition physiologique du traceur sur l'ensemble des parois du ventricule gauche, sans modification significative entre le stress et le repos.";
    } else {
      panelKeys.forEach((key, idx) => {
        const st = perfPanels.get(key);
        const complete = []; const partial = [];
        for(const seg of SEGMENTS){
          const e = st.stress.get(seg) || 0;
          if(e === 2) complete.push(seg);
          else if(e === 1) partial.push(seg);
        }
        const suf = idSuf(key);
        const territoirePerf = q(`#territoire-perfusion${suf}`);
        const profondeurPerf = q(`#profondeur-perfusion${suf}`);
        const etenduePerf    = q(`#etendue-perfusion${suf}`);
        const artefactuelSel = q(`#artefactuel${suf}`);
        const normalAilleurs = q(`#normal-par-ailleurs${suf}`);

        if(complete.length === 0 && partial.length === 0){
          perf += (idx>0?"\n":"") + "- Répartition physiologique du traceur sur l'ensemble des parois du ventricule gauche, sans modification significative entre le stress et le repos.";
          return;
        }
        const prof = profondeurPerf && profondeurPerf.value ? `${lc(profondeurPerf.value)} ` : "";
        const terr = territoirePerf && territoirePerf.value ? ` du territoire ${lc(territoirePerf.value)}` : "";
        const etnd = etenduePerf && etenduePerf.value ? ` ${lc(etenduePerf.value)}` : "";

        let line = `- Hypofixation ${prof}${terr}${etnd} (segment(s)`;
        if(complete.length) line += " " + joinFr(listSegments(complete));
        if(partial.length) line += ` et dans une moindre mesure ${joinFr(listSegments(partial))}`;
        line += ") au stress,";

        const abnormal = complete.concat(partial);
        if(abnormal.length > 0){
          const revNon = [], revPart = [], revComp = [];
          abnormal.forEach(s => {
            const r = st.rev.get(s) ?? 0;
            if(r === 2) revNon.push(s);
            else if(r === 1) revPart.push(s);
            else revComp.push(s);
          });
          if(revNon.length === abnormal.length) line += " non réversible au repos";
          else if(revComp.length === abnormal.length) line += " de réversibilité complète au repos";
          else {
            const parts = [];
            if(revComp.length) parts.push(`complètement réversible sur ${segPhrase(revComp)}`);
            if(revPart.length) parts.push(`partiellement réversible sur ${segPhrase(revPart)}`);
            if(revNon.length) parts.push(`non réversible sur ${segPhrase(revNon)}`);
            line += " " + parts.join(", ");
          }
        }
        if(artefactuelSel && artefactuelSel.value === "oui") line += ", d'allure artéfactuelle";
        line += ".";
        if(normalAilleurs && normalAilleurs.value === "oui") line += "\n- Par ailleurs, répartition physiologique du traceur sur le reste des parois du ventricule gauche";
        perf += (idx>0?"\n":"") + line;
      });
    }

    // Cinétique et conclusion (conservées, simplifiées)
    let cine = "\n\nTomoscintigraphie synchronisée à l'ECG post-stress et de repos:\n";
    if(!kineType || kineType.value === "") {
      cine += "- Cinétique segmentaire: —.";
    } else if(kineType.value !== "normal"){
      const typeLib = kineType.value === "hypo" ? "Hypokinésie" : "Akinésie";
      const etendRaw = kineEtend && kineEtend.value ? kineEtend.value : "";
      const etendLib = etendRaw ? lc(etendRaw) : "";
      const etendPhrase = etendLib ? (/étendue/i.test(etendRaw) ? " " + etendLib : " d'étendue " + etendLib) : "";
      const terrLib  = kineTerr  && kineTerr.value  ? lc(kineTerr.value)  : "";
      const revLib = (kineRev?.value === "0") ? "non réversible au repos"
                   : (kineRev?.value === "2") ? "complètement réversible au repos"
                   : (kineRev?.value === "1") ? "partiellement  réversible au repos" : "";
      cine += `- ${typeLib}${etendPhrase}${terrLib ? " du territoire " + terrLib : ""} en post-stress${revLib ? ", " + revLib : ""}.`;
      if (kineNorm?.value === "oui") cine += " Absence d'autre anomalie de la cinétique segmentaire.";
    } else cine += "- Pas d'anomalie de la cinétique segmentaire.";
    // si "normal" mais la case "Absence d'autre anomalie" cochée -> ajouter la précision
    if(kineType && kineType.value === "normal" && kineNorm?.value === "oui"){
      cine += " Absence d'autre anomalie de la cinétique segmentaire.";
    }

    if (kineGlob?.value === "oui") cine += " Hypokinésie globale.";
    else if (kineGlob?.value === "non") cine += " Pas d'anomalie de la cinétique globale.";

    if (kineDilat?.value) {
      if (kineDilat.value === "non") cine += "\n- Absence de dilatation ventriculaire gauche";
      else {
        const mapD = { discrete: "discrète", moderee: "modérée", importante: "importante" };
        cine += `\n- Dilatation ventriculaire gauche ${mapD[kineDilat.value] || ""}`;
      }
    }

    // FEVG utilisée pour le CR = uniquement la FEVG calculée à partir des VTD/VTS
    const autoFEVGStress = computeFEVGFromInputs(vtdS, vtsS);
    const autoFEVGRest   = computeFEVGFromInputs(vtdR, vtsR);
    if (autoFEVGStress !== null && autoFEVGRest !== null && !isEmpty(vtdS) && !isEmpty(vtdR) && !isEmpty(vtsS) && !isEmpty(vtsR)) {
      cine += `\n- Fraction d'éjection ventriculaire gauche estimée à ${autoFEVGStress}% en post-stress et ${autoFEVGRest}% au repos. ` +
              `Les VTD et VTS du ventricule gauche sont respectivement estimés à ${vtdS.value}mL et ${vtsS.value}mL en post-stress, ` +
              `et à ${vtdR.value}mL et ${vtsR.value}mL au repos.`;
      const sumFlags = Number(flagPerte10?.textContent || 0) + Number(flagDilat20?.textContent || 0) + Number(flagDilat10?.textContent || 0) + Number(flagVts70?.textContent || 0);
      cine += (sumFlags === 0) ? " Absence de signe de désadaptation ventriculaire gauche de stress." : " Aspect de désadaptation ventriculaire gauche de stress,";
    }

    // isch/nec counts for conclusion — use weighted counts
    const ischW = computeWeighted(ischState).weighted;
    const necW = computeWeighted(necState).weighted;

    // helper: format number FR (comma) with one decimal if needed
    const fmtFr = n => {
      if (n === null || n === undefined) return '';
      if (Number.isInteger(n)) return String(n);
      return n.toFixed(1).replace('.',',');
    };
    // helper: detect if territoire text contains multiple items (',' or ' et ' etc.)
    const isPluralTerr = txt => {
      if(!txt) return false;
      const parts = txt.split(/[,;\/|]| et /i).map(s=>s.trim()).filter(Boolean);
      return parts.length > 1;
    };

    let concl = "\n\nConclusion:\n";
    // type stress / betabloquant / effort handling
    if (typeStress && typeStress.value === "pharmacologique") concl += "Après une épreuve de stress pharmacologique, ";
    else if (typeStress && typeStress.value === "mixte") concl += "Après une épreuve de stress mixte sur bicyclette ergométrique, ";
    else if (typeStress && typeStress.value === "effort") concl += "Après une épreuve d'effort sur bicyclette ergométrique, ";
    else concl += "Après une épreuve, ";

    // FMT handling (inchangé)
    if (typeStress && typeStress.value === "effort") {
      const fmtVal = Number(fmtInput?.value || fmt?.value || 0);
      if (!isNaN(fmtVal) && fmtVal > 0) {
        if (fmtVal < 85) concl += "sous‑maximale non significative ";
        else if (fmtVal < 95) concl += "sous‑maximale significative ";
        else if (fmtVal < 100) concl += "quasi‑maximale ";
        else concl += "maximale ";
      }
    }

    // clinique / electrique
    const parts = [];
    if (clinique && clinique.value) parts.push(`cliniquement ${clinique.value === "positive" ? "positive" : "négative"}`);
    if (electrique && electrique.value) {
      const el = electrique.value === "positive" ? "positive"
                : electrique.value === "ininterpretable" ? "ininterprétable"
                : electrique.value === "douteuse" ? "douteuse" : "négative";
      parts.push(`électriquement ${el}`);
    }
    if(parts.length) concl += parts.join(" et ") + ", ";

    // perfusion conclusion : gestion pluriels et format FR pour les nombres
    concl += "la scintigraphie de perfusion myocardique ";
    if (ischW === 0) {
      concl += "ne met pas en évidence de signes d'ischémie.";
    } else {
      const ischNum = fmtFr(ischW);
      const segWord = (Number(ischW) > 1) ? 'segments' : 'segment';
      concl += `met en évidence une ischémie (${ischNum} ${segWord} sur 17)`;
      if (territoireIsch && territoireIsch.value) {
        const terrWord = isPluralTerr(territoireIsch.value) ? 'territoires' : 'territoire';
        concl += ` localisée sur le ${terrWord} ${territoireIsch.value}`;
      }
      concl += ".";
    }

    // nécrose : même logique (virgule décimale + pluriels)
    if (necW > 0) {
      const necNum = fmtFr(necW);
      const necSegWord = (Number(necW) > 1) ? 'segments' : 'segment';
      concl += `\nAspect de séquelle de nécrose ou d'hibernation (${necNum} ${necSegWord} sur 17)`;
      if (territoireNec && territoireNec.value) {
        const terrWordN = isPluralTerr(territoireNec.value) ? 'territoires' : 'territoire';
        concl += ` du ${terrWordN} ${territoireNec.value}`;
      }
      concl += ".";
    }

    if(crZone) crZone.innerHTML = (perf + "\n" + cine + "\n" + concl).replace(/\n/g, "<br>");
  }

  // copy / gen CR actions
  // Outils pour conversion SVG -> PNG (raster) et copie HTML riche
  function cloneSvgWithInlineStyles(svgEl){
    const clone = svgEl.cloneNode(true);
    // Lier original et clone en parcours parallèle pour récupérer les styles calculés depuis l'original (dans le DOM)
    const origNodes = [svgEl, ...svgEl.querySelectorAll('*')];
    const cloneNodes = [clone, ...clone.querySelectorAll('*')];
    const len = Math.min(origNodes.length, cloneNodes.length);
    for(let i=0;i<len;i++){
      const src = origNodes[i];
      const dst = cloneNodes[i];
      // nettoyer un éventuel style inline
      if(dst.hasAttribute('style')) dst.removeAttribute('style');
      const cs = getComputedStyle(src);
      const map = {
        'fill': 'fill',
        'stroke': 'stroke',
        'stroke-width': 'stroke-width',
        'fill-opacity': 'fill-opacity',
        'opacity': 'opacity',
        'stroke-opacity': 'stroke-opacity'
      };
      for(const prop of Object.keys(map)){
        const val = cs.getPropertyValue(prop);
        if(val && val !== 'initial' && val !== 'auto'){
          // certains navigateurs retournent rgba(0,0,0,0) pour transparent
          if(!(prop==='fill' && /rgba\(0,\s*0,\s*0,\s*0\)/.test(val))){
            dst.setAttribute(map[prop], val.trim());
          }
        }
      }
    }
    // garantir largeur/hauteur à partir du viewBox si absent
    if(!clone.getAttribute('width') || !clone.getAttribute('height')){
      const vb = clone.viewBox && clone.viewBox.baseVal ? clone.viewBox.baseVal : null;
      if(vb){ clone.setAttribute('width', vb.width); clone.setAttribute('height', vb.height); }
    }
    return clone;
  }

  async function svgToPngDataUrl(svgEl){
    if(!svgEl) return null;
    // cloner et intégrer styles inline
    const svgCloned = cloneSvgWithInlineStyles(svgEl);
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgCloned);
    // Utiliser une data URL pour respecter la CSP (img-src 'self' data:)
    const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
    // créer image puis canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const loaded = new Promise((resolve, reject)=>{
      img.onload = ()=> resolve();
      img.onerror = reject;
    });
    img.src = svgDataUrl;
    await loaded;
  const w = img.naturalWidth || svgEl.viewBox?.baseVal?.width || svgEl.clientWidth || 800;
  const h = img.naturalHeight || svgEl.viewBox?.baseVal?.height || svgEl.clientHeight || 450;
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0,0,w,h);
      ctx.drawImage(img, 0, 0, w, h);
      const pngUrl = canvas.toDataURL('image/png');
      return pngUrl;
  }

  function collectPerfPanelsInOrder(){
    const panels = Array.from(document.querySelectorAll('#perfusion-panels .bulls-container[data-territoire]'));
    // trier par index tN croissant selon attribut data-territoire
    return panels.sort((a,b)=>{
      const ai = Number((a.getAttribute('data-territoire')||'t1').replace(/^t/,''))||1;
      const bi = Number((b.getAttribute('data-territoire')||'t1').replace(/^t/,''))||1;
      return ai - bi;
    });
  }

  function legendInlineHtml(type){
    // type: 'perf', 'rev', 'isch', 'nec'
    const box = (color)=>`<span style="display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:middle;background:${color};border:1px solid rgba(0,0,0,0.12);"></span>`;
    if(type==='perf'){
      return `<div style="margin-top:6px;font-size:0.95rem;color:#333;">${box('#27ae60')} Perfusion complète &nbsp; ${box('#f39c12')} Perfusion partielle &nbsp; ${box('#e74c3c')} Absence de perfusion</div>`;
    }
    if(type==='rev'){
      return `<div style="margin-top:6px;font-size:0.95rem;color:#333;">${box('#27ae60')} Complètement réversible &nbsp; ${box('#f39c12')} Partiellement réversible &nbsp; ${box('#e74c3c')} Non réversible</div>`;
    }
    if(type==='isch'){
      return `<div style="margin-top:6px;font-size:0.95rem;color:#333;">${box('#d9d9d9')} Pas d'ischémie &nbsp; ${box('#f39c12')} Ischémie partielle &nbsp; ${box('#e74c3c')} Ischémie complète</div>`;
    }
    if(type==='nec'){
      return `<div style="margin-top:6px;font-size:0.95rem;color:#333;">${box('#d6d8db')} Pas de nécrose &nbsp; ${box('#f39c12')} Nécrose partielle &nbsp; ${box('#e74c3c')} Nécrose complète</div>`;
    }
    return '';
  }

  async function buildExportHtml(){
    const rootStyle = 'font-family:Segoe UI,Arial,sans-serif; color:#222;';
    const sectionStyle = 'margin:10px 0 18px;';
    const h3Style = 'margin:0 0 8px; font-size:1.05rem; color:#183248;';
    // Table 2 colonnes pour compatibilité Word/Email
  const tableStyle = 'width:100%; border-collapse:collapse;';
  const tdStyle = 'width:50%; vertical-align:top; padding:0 6px;';
  // limiter la taille copiée pour éviter « trop gros » (max-width)
  const imgStyle = 'max-width:520px; width:100%; height:auto; border:1px solid #eef3f8; border-radius:6px; background:#fff;';
    // Construire HTML avec CR texte + images des bull-eyes
    const parts = [];
    // Titre global
    parts.push(`<div class="export-root" style="${rootStyle}">`);
    // CR texte
    parts.push(`<div class="export-section" style="${sectionStyle}"><h3 style="${h3Style}">Compte‑rendu</h3>`);
    parts.push(`<div>${(crZone?.innerHTML||'')}</div></div>`);
    // Territoires (chaque panel en ordre) : 2 images côté à côte (perfusion / réversibilité)
    const perfPanelsOrdered = collectPerfPanelsInOrder();
    for(const panel of perfPanelsOrdered){
      const key = panel.getAttribute('data-territoire')||'t1';
      // numéroter selon ordre d'affichage
      const idx = perfPanelsOrdered.indexOf(panel)+1;
      const perfSvg = panel.querySelector(`#svg-perfusion${idSuf(key)}`) || panel.querySelector('#svg-perfusion');
      const revSvg  = panel.querySelector(`#svg-reversibilite${idSuf(key)}`) || panel.querySelector('#svg-reversibilite');
      const perfPng = await svgToPngDataUrl(perfSvg);
      const revPng  = await svgToPngDataUrl(revSvg);
  parts.push(`<div class="export-section" style="${sectionStyle}"><h3 style="${h3Style}">Territoire ${idx}</h3>`);
  parts.push(`<table style="${tableStyle}"><tr>`);
  // Colonne gauche: Perfusion
  parts.push(`<td style="${tdStyle}">`);
  if(perfPng) parts.push(`<img style="${imgStyle}" alt="Perfusion Territoire ${idx}" src="${perfPng}"/>${legendInlineHtml('perf')}`);
  parts.push(`</td>`);
  // Colonne droite: Réversibilité
  parts.push(`<td style="${tdStyle}">`);
  if(revPng) parts.push(`<img style="${imgStyle}" alt="Réversibilité Territoire ${idx}" src="${revPng}"/>${legendInlineHtml('rev')}`);
  parts.push(`</td>`);
  parts.push(`</tr></table></div>`);
    }
    // Ischémie / Nécrose ensuite
    const ischSvg = document.querySelector('#svg-ischemie');
    const necSvg  = document.querySelector('#svg-necrose');
    const ischPng = await svgToPngDataUrl(ischSvg);
    const necPng  = await svgToPngDataUrl(necSvg);
  parts.push(`<div class="export-section" style="${sectionStyle}"><h3 style="${h3Style}">Ischémie et Nécrose</h3>`);
  parts.push(`<table style="${tableStyle}"><tr>`);
  parts.push(`<td style="${tdStyle}">`);
  if(ischPng) parts.push('<img style="'+imgStyle+'" alt="Ischémie" src="' + ischPng + '"/>' + legendInlineHtml('isch'));
  parts.push(`</td>`);
  parts.push(`<td style="${tdStyle}">`);
  if(necPng)  parts.push('<img style="'+imgStyle+'" alt="Nécrose" src="' + necPng + '"/>' + legendInlineHtml('nec'));
  parts.push(`</td>`);
  parts.push(`</tr></table></div>`);
    parts.push('</div>');
    return parts.join('');
  }

  // ====== NOUVEAU: composer une seule image PNG avec toutes les vignettes + légendes ======
  function drawLegend(ctx, x, y, type){
    const items = type==='perf' ? [ ['#27ae60','Perfusion complète'], ['#f39c12','Perfusion partielle'], ['#e74c3c','Absence de perfusion'] ]
                 : type==='rev'  ? [ ['#27ae60','Complètement réversible'], ['#f39c12','Partiellement réversible'], ['#e74c3c','Non réversible'] ]
                 : type==='isch' ? [ ['#d9d9d9','Pas d\'ischémie'], ['#f39c12','Ischémie partielle'], ['#e74c3c','Ischémie complète'] ]
                 : type==='nec'  ? [ ['#d6d8db','Pas de nécrose'], ['#f39c12','Nécrose partielle'], ['#e74c3c','Nécrose complète'] ]
                 : [];
    ctx.font = '14px Segoe UI, Arial';
    ctx.fillStyle = '#333';
    let cx = x, cy = y;
    items.forEach(([color,label],i)=>{
      ctx.fillStyle = color; ctx.fillRect(cx, cy+2, 12, 12);
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.strokeRect(cx, cy+2, 12, 12);
      ctx.fillStyle = '#333'; ctx.fillText(' ' + label, cx + 18, cy + 13);
      cx += ctx.measureText(' ' + label).width + 46; // spacing
    });
  }

  async function buildSingleImageBlob(){
    // Récupérer PNGs pour chaque SVG (per panel: perf & rev), puis isch & nec
    const perfPanelsOrdered = collectPerfPanelsInOrder();
    const tiles = [];
    for(const panel of perfPanelsOrdered){
      const key = panel.getAttribute('data-territoire')||'t1';
      const idx = perfPanelsOrdered.indexOf(panel)+1;
      const perfSvg = panel.querySelector(`#svg-perfusion${idSuf(key)}`) || panel.querySelector('#svg-perfusion');
      const revSvg  = panel.querySelector(`#svg-reversibilite${idSuf(key)}`) || panel.querySelector('#svg-reversibilite');
      const perfPng = await svgToPngDataUrl(perfSvg);
      const revPng  = await svgToPngDataUrl(revSvg);
      tiles.push({ title: `Territoire ${idx}`, left: {img: perfPng, legend: 'perf'}, right: {img: revPng, legend: 'rev'} });
    }
    const ischSvg = document.querySelector('#svg-ischemie');
    const necSvg  = document.querySelector('#svg-necrose');
    const ischPng = await svgToPngDataUrl(ischSvg);
    const necPng  = await svgToPngDataUrl(necSvg);
    tiles.push({ title: 'Ischémie et Nécrose', left: {img: ischPng, legend: 'isch'}, right: {img: necPng, legend: 'nec'} });

    // Mise en page: chaque tuile = 2 colonnes (images) sous un titre; on choisit une largeur cible
    const targetImgW = 600; // largeur max par image
    const padding = 20, gap = 16, titleH = 26, legendH = 22, cellW = targetImgW, rowH = targetImgW * (9/16); // approx ratio
    const cols = 2; // fixe: deux colonnes
    const totalW = padding*2 + cols*cellW + gap;
    // Hauteur totale = somme des sections
    let totalH = padding;
    const tileRects = [];
    tiles.forEach(t => {
      const h = titleH + rowH + legendH + 18; // titre + image + légende + marge
      tileRects.push({ y: totalH, h });
      totalH += h + 8;
    });
    totalH += padding;

    const canvas = document.createElement('canvas');
    canvas.width = totalW; canvas.height = totalH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,totalW,totalH);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';

    // Titre global CR mini (optionnel) : ignoré pour rester sobre

    // Dessiner tuiles
    for(let i=0;i<tiles.length;i++){
      const t = tiles[i];
      const baseY = tileRects[i].y;
      // Titre
      ctx.fillStyle = '#183248';
      ctx.font = 'bold 18px Segoe UI, Arial';
      ctx.fillText(t.title, padding, baseY + 18);
      // Images
      const yImg = baseY + titleH;
      const lx = padding, rx = padding + cellW + gap;
      if(t.left.img){
        const imgL = await loadImage(t.left.img);
        const ratioL = Math.min(1, cellW / imgL.width);
        const hL = Math.round(imgL.height * ratioL);
        ctx.drawImage(imgL, lx, yImg, Math.round(imgL.width*ratioL), hL);
      }
      if(t.right.img){
        const imgR = await loadImage(t.right.img);
        const ratioR = Math.min(1, cellW / imgR.width);
        const hR = Math.round(imgR.height * ratioR);
        ctx.drawImage(imgR, rx, yImg, Math.round(imgR.width*ratioR), hR);
      }
      // Légendes
      const yLegend = yImg + rowH + 4;
      drawLegend(ctx, lx, yLegend, t.left.legend);
      drawLegend(ctx, rx, yLegend, t.right.legend);
    }

    // Retourner un Blob pour éviter fetch(data:...) bloqué par la CSP
    const blob = await new Promise((resolve, reject)=>{
      if (canvas.toBlob) {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
      } else {
        // Fallback très rare: convertir dataURL -> Blob
        try {
          const dataUrl = canvas.toDataURL('image/png');
          const arr = dataUrl.split(',');
          const bstr = atob(arr[1]);
          let n = bstr.length; const u8 = new Uint8Array(n);
          while(n--) u8[n] = bstr.charCodeAt(n);
          resolve(new Blob([u8], { type: 'image/png' }));
        } catch(e){ reject(e); }
      }
    });
    return blob;
  }

  function loadImage(src){
    return new Promise((resolve, reject)=>{
      const img = new Image();
      img.onload = ()=> resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function copyAsSingleImage(){
    const blob = await buildSingleImageBlob();
    if(!blob) return;
    if(window.ClipboardItem){
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
    } else {
      // Fallback: téléchargement du PNG (évite blob:/data: en navigation)
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'scinti.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(()=> URL.revokeObjectURL(url), 1000);
    }
    if(copieOkEl){ copieOkEl.classList.remove('hidden'); setTimeout(()=> copieOkEl.classList.add('hidden'), 1600); }
  }

  // Nouveau: copier le CR avec mise en forme (HTML) + texte brut en fallback
  async function copyCrTextOnly(){
    const text = crZone ? (crZone.textContent || '') : '';
    const html = `<div style="font-family:Segoe UI,Arial,sans-serif;color:#222;">${crZone?.innerHTML||''}</div>`;
    try{
      if(window.ClipboardItem){
        const item = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' })
        });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      if(copieOkEl){ copieOkEl.classList.remove('hidden'); setTimeout(()=> copieOkEl.classList.add('hidden'), 1600); }
    } catch(err){ alert('Impossible de copier'); }
  }

  if(btnCopier){
    btnCopier.addEventListener('click', (e)=>{ e.preventDefault(); copyCrTextOnly(); });
  }

  const btnCopierImage = document.querySelector('#btn-copier-image');
  if(btnCopierImage){
    btnCopierImage.addEventListener('click', async (e)=>{
      e.preventDefault();
      // Génère l'image unique puis copie CR + image comme HTML riche si possible
      try{
        const blob = await buildSingleImageBlob();
        // Convertir en data URL pour intégrer l'image dans le HTML copié
        const dataUrl = await new Promise((resolve, reject)=>{
          const fr = new FileReader();
          fr.onload = ()=> resolve(fr.result);
          fr.onerror = reject;
          fr.readAsDataURL(blob);
        });
        const crHtml = `<div style="font-family:Segoe UI,Arial,sans-serif;color:#222;">${crZone?.innerHTML||''}</div>`;
        const html = `${crHtml}<div style="margin-top:10px;"><img src="${dataUrl}" alt="Scintigraphie" style="max-width:100%;height:auto;border:1px solid #eef3f8;border-radius:6px;background:#fff;"/></div>`;
        if(window.ClipboardItem){
          const item = new ClipboardItem({ 'text/html': new Blob([html], {type:'text/html'}), 'text/plain': new Blob([(crZone?.textContent||'')], {type:'text/plain'}) });
          await navigator.clipboard.write([item]);
        } else {
          // fallback: copie texte seul et déclenche téléchargement PNG
          await navigator.clipboard.writeText(crZone ? (crZone.textContent || '') : '');
          const a = document.createElement('a');
          a.href = String(dataUrl); a.download = 'scinti.png';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
        }
        if(copieOkEl){ copieOkEl.classList.remove('hidden'); setTimeout(()=> copieOkEl.classList.add('hidden'), 1600); }
      } catch(err){
        // en dernier recours, copier texte
        try{ await navigator.clipboard.writeText(crZone ? (crZone.textContent || '') : ''); }catch(e){}
        alert('Copie HTML avec image indisponible');
      }
    });
  }

  // bind change/input to regenerate CR
  [
   territoireIsch, territoireNec,
   typeStress, betabloquant, clinique, electrique,
   fmt, fmtInput,
   kineTerr, kineType, kineEtend, kineRev, kineNorm, kineGlob, kineDilat,
   vtdS, vtdR, vtsS, vtsR
  ].forEach(el => {
    if(!el) return;
    el.addEventListener('change', ()=>{ updateKineFlags(); genererCR(); });
    el.addEventListener('input',  ()=>{ updateKineFlags(); genererCR(); });
  });

  // init
  updateKineFlags();
  updateCounts();
  updateFEVGDisplays();
  // Init perfusion panels (t1 exists by défaut)
  const basePanel = q('#perfusion-panel-t1');
  if(basePanel) initPerfusionPanel(basePanel, 't1');
  genererCR();
});