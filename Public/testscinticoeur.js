// Fichier nettoyé et unifié — remplace l'ancien

document.addEventListener('DOMContentLoaded', () => {
  const q = s => document.querySelector(s);
  const qAll = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s || '').replace(/([ #;?%&,.+*~':"!^$[\]()=>|/@])/g,'\\$1');

  // Elements principaux
  const crZone    = q('#cr-zone');
  const btnCopier = q('#btn-copier-cr');
  const btnGen    = q('#btn-gen-cr');
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
  if(btnCopier){
    btnCopier.addEventListener('click', async ()=> {
      try {
        await navigator.clipboard.writeText(crZone ? (crZone.textContent || "") : "");
        if(copieOkEl){ copieOkEl.classList.remove('hidden'); setTimeout(()=> copieOkEl.classList.add('hidden'), 1400); }
      } catch(e){ alert('Impossible de copier'); }
    });
  }
  if(btnGen) btnGen.addEventListener('click', ()=> genererCR());

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