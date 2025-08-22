// Fichier JS mis à jour — remplace intégralement le précédent
document.addEventListener('DOMContentLoaded', () => {
  function bindBottomSvgs(){
    // helper pour remplacer un node par son clone (supprime anciens listeners)
    const replaceWithClone = (el) => { if(!el || !el.parentNode) return; el.parentNode.replaceChild(el.cloneNode(true), el); };

    // ISCHEMIE
    const ischSel = '#svg-ischemie [id^="isch-"]';
    [...document.querySelectorAll(ischSel)].forEach(replaceWithClone);
    const ischPaths = [...document.querySelectorAll(ischSel)];
    const totalIsch = ischPaths.length;
    ischPaths.forEach(p => {
      p.classList.remove('on');
      p.style.cursor = ''; // évite inline si tu veux, CSS gère déjà le cursor
      p.addEventListener('click', () => {
        p.classList.toggle('on');
        const count = document.querySelectorAll('#svg-ischemie .on').length;
        const el = document.getElementById('count-isch');
        if(el) el.textContent = `${count} / ${totalIsch}`;
        // si ischState existe, mettre à jour (clé = id sans préfixe)
        if(typeof ischState === 'object' && typeof ischState.set === 'function'){
          const key = p.id.replace(/^isch-/, '');
          ischState.set(key, p.classList.contains('on'));
        }
        if(typeof updateCounts === 'function') updateCounts();
        if(typeof genererCR === 'function') genererCR();
      });
    });

    // NECROSE
    const necSel = '#svg-necrose [id^="nec-"]';
    [...document.querySelectorAll(necSel)].forEach(replaceWithClone);
    const necPaths = [...document.querySelectorAll(necSel)];
    const totalNec = necPaths.length;
    necPaths.forEach(p => {
      p.classList.remove('on');
      p.style.cursor = '';
      p.addEventListener('click', () => {
        p.classList.toggle('on');
        const count = document.querySelectorAll('#svg-necrose .on').length;
        const el = document.getElementById('count-nec');
        if(el) el.textContent = `${count} / ${totalNec}`;
        if(typeof necState === 'object' && typeof necState.set === 'function'){
          const key = p.id.replace(/^nec-/, '');
          necState.set(key, p.classList.contains('on'));
        }
        if(typeof updateCounts === 'function') updateCounts();
        if(typeof genererCR === 'function') genererCR();
      });
    });
  }

  try{ bindBottomSvgs(); }catch(e){ console.error('bindBottomSvgs error', e); }

  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...(root.querySelectorAll(sel) || [])];
  const esc = s => s.replace(/([ #;?%&,.+*~\':"!^$[\]()=>|/@])/g,'\\$1');

  const typeStress   = qs('#type-stress');
  const betabloquant = qs('#betabloquant');
  const clinique     = qs('#clinique');
  const electrique   = qs('#electrique');

  const fmt      = qs('#fmt');
  const fmtInput = qs('#fmt-input');
  const fmtValue = qs('#fmt-value');

  const territoirePerf   = qs('#territoire-perfusion');
  const profondeurPerf   = qs('#profondeur-perfusion');
  const etenduePerf      = qs('#etendue-perfusion');
  const artefactuelSelect = qs('#artefactuel');
  const normalParAilleurs = qs('#normal-par-ailleurs');

  const territoireIsch = qs('#territoire-ischemie');
  const territoireNec  = qs('#territoire-necrose');
  const countIschEl    = qs('#count-isch');
  const countNecEl     = qs('#count-nec');

  const crZone    = qs('#cr-zone');
  const btnCopier = qs('#btn-copier-cr');
  const copieOkEl = qs('#copie-ok');

  /* Cinétique */
  const kineTerr   = qs('#kine-territoire');
  const kineType   = qs('#kine-type');
  const kineEtend  = qs('#kine-etendue');
  const kineRev    = qs('#kine-reversibilite');
  const kineNorm   = qs('#kine-normal');
  const kineGlob   = qs('#kine-globale');
  const kineDilat  = qs('#kine-dilat');

  const fevgS = qs('#fevg-stress');
  const fevgR = qs('#fevg-rest');
  const vtdS  = qs('#vtd-stress');
  const vtdR  = qs('#vtd-rest');
  const vtsS  = qs('#vts-stress');
  const vtsR  = qs('#vts-rest');

  const flagPerte10  = qs('#flag-perte10');
  const flagDilat20  = qs('#flag-dilat20');
  const flagDilat10  = qs('#flag-dilat10');
  const flagVts70    = qs('#flag-vts70');

  const SEGMENTS = [
    "apical","antéro-apical","septo-apical","inféro-apical","latéro-apical",
    "inféro-latéral moyen","antéro-latéral moyen","antéro-septal moyen","inféro-septal moyen",
    "inférieur moyen","antérieur moyen","antéro-basal","antéro-septo-basal","inféro-septo-basal",
    "antéro-latéro-basal","inféro-latéro-basal","inféro-basal"
  ];

  const TERRITOIRES = ["", "Apical","Antéro-apical","Antérieur","Antéro-septal","Antéro-septo-apical","Inférieur","Inféro-septal","Latéral","Inféro-latéral","Septal"];
  const PROFONDEURS = ["", "Lacunaire", "Profonde", "Modérée", "Discrète"];
  const ETENDUES    = ["", "De Faible étendue", "D'étendue Modérée", "Étendue"];

  const ETATS = [
    { v: 0, label: "Non",     cls: "fill-green"  },
    { v: 1, label: "Partiel", cls: "fill-orange" },
    { v: 2, label: "Complet", cls: "fill-red"    },
  ];

  const stressState = new Map(); SEGMENTS.forEach(id => stressState.set(id, { etat: 0, profondeur: "", etendue: "" }));
  const ischState = new Map(); SEGMENTS.forEach(id => ischState.set(id, false));
  const necState  = new Map(); SEGMENTS.forEach(id => necState.set(id, false));

  function fillSelect(sel, items){
    if(!sel) return;
    sel.innerHTML = items.map(v => `<option value="${v}">${v || "—"}</option>`).join("");
  }
  function num(v){ const n = Number(v); return isFinite(n) ? n : 0; }
  const isEmpty = el => !el || el.dataset.empty === "1";
  function lc(s){ return (s||"").toLowerCase(); }
  function joinFr(arr){ if(arr.length===0) return ""; if(arr.length===1) return arr[0]; return `${arr.slice(0,-1).join(", ")} et ${arr[arr.length-1]}`; }
  function listSegments(arr){ return arr.map(s => s.replace(/-/g,' ')); }

  fillSelect(territoireIsch, TERRITOIRES);
  fillSelect(territoireNec, TERRITOIRES);
  if(territoirePerf) fillSelect(territoirePerf, TERRITOIRES);
  fillSelect(profondeurPerf, PROFONDEURS);
  fillSelect(etenduePerf, ETENDUES);
  if(kineTerr) fillSelect(kineTerr, TERRITOIRES);
  if(kineEtend) fillSelect(kineEtend, ETENDUES);

  function connectSlider(rangeId, inputId, valueId, suffix = "", onChange = ()=>{}){
    const r = qs('#' + rangeId); const n = qs('#' + inputId); const v = valueId ? qs('#' + valueId) : null;
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

  connectSlider('fevg-stress','fevg-stress-input','fevg-stress-value','%', () => { updateKineFlags(); genererCR(); });
  connectSlider('fevg-rest','fevg-rest-input','fevg-rest-value','%', () => { updateKineFlags(); genererCR(); });
  connectSlider('vtd-stress','vtd-stress-input','vtd-stress-value',' mL', () => { updateKineFlags(); genererCR(); });
  connectSlider('vtd-rest','vtd-rest-input','vtd-rest-value',' mL', () => { updateKineFlags(); genererCR(); });
  connectSlider('vts-stress','vts-stress-input','vts-stress-value',' mL', () => { updateKineFlags(); genererCR(); });
  connectSlider('vts-rest','vts-rest-input','vts-rest-value',' mL', () => { updateKineFlags(); genererCR(); });

  function updateKineFlags(){
    if(!flagPerte10 || !flagDilat20 || !flagDilat10 || !flagVts70) return;
    if (!fevgS || !fevgR || !vtdS || !vtdR || !vtsS || !vtsR ||
        isEmpty(fevgS) || isEmpty(fevgR) || isEmpty(vtdS) || isEmpty(vtdR) || isEmpty(vtsS) || isEmpty(vtsR)) {
      flagPerte10.textContent = "0";
      flagDilat20.textContent = "0";
      flagDilat10.textContent = "0";
      flagVts70.textContent   = "0";
      return;
    }
    const dFE  = num(fevgR.value) - num(fevgS.value);
    const dVTD = num(vtdS.value)  - num(vtdR.value);
    const dVTS = num(vtsS.value)  - num(vtsR.value);
    const vtsStress = num(vtsS.value);

    flagPerte10.textContent = dFE >= 10 ? "1" : "0";
    flagDilat20.textContent = dVTD >= 20 ? "1" : "0";
    flagDilat10.textContent = dVTS >= 10 ? "1" : "0";
    flagVts70.textContent   = vtsStress > 70 ? "1" : "0";
  }

  // --- PERFUSION SVG interactions (plus de table) ---
  SEGMENTS.forEach(id => {
    const path = qs(`#svg-perfusion #${esc(id)}`);
    if(!path) return;
    // initial couleur verte (non anormal)
    setPerfColor(path, 0);
    path.addEventListener('click', () => {
      const s = stressState.get(id);
      s.etat = (s.etat + 1) % 3;
      setPerfColor(path, s.etat);
      // mise à jour availability du bull's-right et génération CR
      onPerfusionChangeForSegment(id);
    });
  });

  function setPerfColor(path, etat){
    path.classList.remove('fill-green','fill-orange','fill-red');
    path.classList.add(etat === 1 ? 'fill-orange' : etat === 2 ? 'fill-red' : 'fill-green');
  }
  function colorizePerf(segId, etat){
    const path = qs(`#svg-perfusion #${esc(segId)}`);
    if(!path) return;
    setPerfColor(path, etat);
  }

  /* ischémie / nécrose interactions (inchangées) */
  SEGMENTS.forEach(id => {
    const pathIsch = qs(`#svg-ischemie #isch-${esc(id)}`);
    if(pathIsch){
      pathIsch.addEventListener('click', () => {
        const cur = ischState.get(id);
        ischState.set(id, !cur);
        pathIsch.classList.toggle('on', !cur);
        updateCounts();
        genererCR();
      });
    }
    const pathNec = qs(`#svg-necrose #nec-${esc(id)}`);
    if(pathNec){
      pathNec.addEventListener('click', () => {
        const cur = necState.get(id);
        necState.set(id, !cur);
        pathNec.classList.toggle('on', !cur);
        updateCounts();
        genererCR();
      });
    }
  });

  function updateCounts(){
    if(countIschEl) countIschEl.textContent = `${countTrue(ischState)} / 17`;
    if(countNecEl)  countNecEl.textContent  = `${countTrue(necState)} / 17`;
  }
  function countTrue(map){ let n=0; map.forEach(v=>{ if(v) n++; }); return n; }

  /* Contrôles généraux -> CR */
  [
   territoirePerf, profondeurPerf, etenduePerf,
   artefactuelSelect, normalParAilleurs,
   territoireIsch, territoireNec,
   typeStress, betabloquant, clinique, electrique,
   fmt, fmtInput,
   kineTerr, kineType, kineEtend, kineRev, kineNorm, kineGlob, kineDilat,
   fevgS, fevgR, vtdS, vtdR, vtsS, vtsR
  ].forEach(el => {
    if(!el) return;
    el.addEventListener('change', ()=>{ updateKineFlags(); genererCR(); });
    el.addEventListener('input',  ()=>{ updateKineFlags(); genererCR(); });
  });

  /* Génération CR: utilise segPhrase pour singulariser/pluraliser */
  function segPhrase(arr){
    if(!arr || arr.length === 0) return "";
    const names = listSegments(arr);
    if(names.length === 1) return `le segment ${names[0]}`;
    return `les segments ${joinFr(names)}`;
  }

  // Réversibilité: mapping des états et disponibilité conditionnée par perfusion
  const REV_SEGMENTS = SEGMENTS.slice();
  // ordre des classes : 0 = complètement réversible (vert), 1 = partiel (orange), 2 = non réversible (red)
  const REV_CLASSES = ['fill-green','fill-orange','fill-red'];
  const revState = new Map(); REV_SEGMENTS.forEach(s=>revState.set(s,0));

  function setupReversibiliteSvg(){
    REV_SEGMENTS.forEach(seg=>{
      const path = document.querySelector(`#svg-reversibilite [id="rev-${seg}"]`);
      if(!path) return;
      path.classList.add('rev-path');
      path.addEventListener('click', (e)=>{
        const sperf = stressState.get(seg);
        if(!sperf || sperf.etat === 0) return; // inactif -> ignore
        const cur = revState.get(seg) || 0;
        path.classList.remove(REV_CLASSES[cur]);
        const next = (cur + 1) % 3;
        revState.set(seg, next);
        path.classList.add(REV_CLASSES[next]);
        e.stopPropagation();
        genererCR();
      });
    });
  }

  function updateReversibiliteAvailability(){
    REV_SEGMENTS.forEach(seg=>{
      const path = document.querySelector(`#svg-reversibilite [id="rev-${seg}"]`);
      if(!path) return;
      const sperf = stressState.get(seg);
      const active = !!(sperf && sperf.etat > 0);
      path.classList.remove(...REV_CLASSES, 'fill-gray', 'rev-active', 'rev-inactive');
      if(active){
        const state = revState.get(seg) ?? 0;
        path.classList.add(REV_CLASSES[state], 'rev-active');
      } else {
        path.classList.add('fill-gray', 'rev-inactive');
      }
    });
  }

  setupReversibiliteSvg();
  updateReversibiliteAvailability();

  function onPerfusionChangeForSegment(segId){
    updateReversibiliteAvailability();
    genererCR();
  }

  // Calcul automatique FEVG
  function computeFEVGFromInputs(vtdEl, vtsEl){
    const vtd = Number(vtdEl?.value); const vts = Number(vtsEl?.value);
    if(!vtd || isNaN(vtd) || isNaN(vts) || vtd <= 0) return null;
    return Math.round(100 * (vtd - vts) / vtd);
  }
  function updateFEVGDisplays(){
    const fevgStressVal = computeFEVGFromInputs(qs('#vtd-stress-input') || qs('#vtd-stress'), qs('#vts-stress-input') || qs('#vts-stress'));
    const fevgRestVal = computeFEVGFromInputs(qs('#vtd-rest-input') || qs('#vtd-rest'), qs('#vts-rest-input') || qs('#vts-rest'));
    const elS = qs('#fevg-stress-auto'); const elR = qs('#fevg-rest-auto');
    if(elS) elS.textContent = (fevgStressVal !== null) ? `${fevgStressVal} %` : "";
    if(elR) elR.textContent = (fevgRestVal !== null) ? `${fevgRestVal} %` : "";
    updateKineFlags();
  }
  ['vtd-stress','vtd-rest','vts-stress','vts-rest','vtd-stress-input','vtd-rest-input','vts-stress-input','vts-rest-input'].forEach(id=>{
    const el = qs('#' + id); if(el) el.addEventListener('input', updateFEVGDisplays);
  });
  updateFEVGDisplays();

  // GenererCR (mis à jour pour utiliser revState et segPhrase)
  function genererCR(){
    const segComplet = []; const segPartiel = []; let nbAnormaux = 0;
    stressState.forEach((s,id)=>{ if(s.etat===2){ segComplet.push(id); nbAnormaux++; } if(s.etat===1){ segPartiel.push(id); nbAnormaux++; } });

    let perf = "Tomoscintigraphie de perfusion de stress et de repos:\n";
    if(nbAnormaux === 0){
      perf += "- Répartition physiologique du traceur sur l'ensemble des parois du ventricule gauche, sans modification significative entre le stress et le repos.";
    } else {
      const prof = profondeurPerf && profondeurPerf.value ? `${lc(profondeurPerf.value)} ` : "";
      const terr = territoirePerf && territoirePerf.value ? ` du territoire ${lc(territoirePerf.value)}` : "";
      const etnd = etenduePerf && etenduePerf.value ? ` ${lc(etenduePerf.value)}` : "";
      perf += `- Hypofixation ${prof}${terr}${etnd} (segment(s)`;
      if(segComplet.length) perf += " " + joinFr(listSegments(segComplet));
      if(segPartiel.length) perf += ` et dans une moindre mesure ${joinFr(listSegments(segPartiel))}`;
      perf += `) au stress,`;

      const abnormal = segComplet.concat(segPartiel);
      if(abnormal.length > 0){
        const revNon = [], revPart = [], revComp = [];
        abnormal.forEach(s => {
          const r = revState.get(s) ?? 0;
          if(r === 2) revNon.push(s);       // 2 = non réversible (rouge)
          else if(r === 1) revPart.push(s);
          else revComp.push(s);            // 0 = complètement réversible (vert)
        });

        if(revNon.length === abnormal.length){
          perf += " non réversible au repos";
        } else if(revComp.length === abnormal.length){
          perf += " de réversibilité complète au repos";
        } else {
          const parts = [];
          if(revComp.length) parts.push(`complètement réversible sur ${segPhrase(revComp)}`);
          if(revPart.length) parts.push(`partiellement réversible sur ${segPhrase(revPart)}`);
          if(revNon.length)  parts.push(`non réversible sur ${segPhrase(revNon)}`);
          perf += " " + parts.join(", ");
        }
      }

      if(artefactuelSelect && artefactuelSelect.value === "oui") perf += ", d'allure artéfactuelle";
      perf += ".";
      if(normalParAilleurs && normalParAilleurs.value === "oui") perf += "\n- Par ailleurs, répartition physiologique du traceur sur le reste des parois du ventricule gauche";
    }

    // --- Cinétique & conclusion (conservées) ---
    let cine = "\n\nTomoscintigraphie synchronisée à l'ECG post-stress et de repos:\n";
    if(!kineType || kineType.value === ""){
      cine += "- Cinétique segmentaire: —.";
    } else if (kineType.value !== "normal"){
      const typeLib = kineType.value === "hypo" ? "Hypokinésie" : "Akinésie";
      const etendLib = kineEtend && kineEtend.value ? lc(kineEtend.value) : "";
      const terrLib  = kineTerr  && kineTerr.value  ? lc(kineTerr.value)  : "";
      const revLib = (kineRev?.value === "0") ? "non réversible au repos"
                   : (kineRev?.value === "2") ? "complètement réversible au repos"
                   : (kineRev?.value === "1") ? "partiellement  réversible au repos" : "";
      cine += `- ${typeLib}${etendLib ? " d'étendue " + etendLib : ""}${terrLib ? " du territoire " + terrLib : ""} en post-stress${revLib ? ", " + revLib : ""}.`;
      if (kineNorm?.value === "oui") cine += " Absence d'autre anomalie de la cinétique segmentaire.";
    } else {
      cine += "- Pas d'anomalie de la cinétique segmentaire.";
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

    const allKineNums = !isEmpty(fevgS) && !isEmpty(fevgR) && !isEmpty(vtdS) && !isEmpty(vtdR) && !isEmpty(vtsS) && !isEmpty(vtsR);
    if(allKineNums){
      cine += `\n- Fraction d'éjection ventriculaire gauche estimée à ${fevgS.value}% en post-stress et ${fevgR.value}% au repos. ` +
              `Les VTD et VTS du ventricule gauche sont respectivement estimés à ${vtdS.value}mL et ${vtsS.value}mL en post-stress, ` +
              `et à ${vtdR.value}mL et ${vtsR.value}mL au repos.`;

      const sumFlags = Number(flagPerte10?.textContent || 0) + Number(flagDilat20?.textContent || 0) + Number(flagDilat10?.textContent || 0) + Number(flagVts70?.textContent || 0);
      cine += (sumFlags === 0) ? " Absence de signe de désadaptation ventriculaire gauche de stress." : " Aspect de désadaptation ventriculaire gauche de stress,";
    }

    const nIsch = countTrue(ischState);
    const nNec  = countTrue(necState);

    let concl = "\n\nConclusion:\n";
    concl += "Après une épreuve ";
    if (typeStress && typeStress.value === "pharmacologique") concl += "de stress pharmacologique ";
    else if (typeStress && typeStress.value === "mixte")       concl += "de stress mixte sur bicyclette ergométrique ";
    else if (typeStress && typeStress.value === "effort")      concl += "d'effort sur bicyclette ergométrique ";
    else concl += "de stress ";

    if (typeStress && typeStress.value === "effort" && betabloquant && betabloquant.value) {
      if (betabloquant.value === "jamais")            concl += "non maquillée ";
      else if (betabloquant.value === "non-arretes")  concl += "maquillée ";
      else if (betabloquant.value === "arrete")       concl += "démaquillée ";
    }

    const fmtVal = Number(fmt?.value || 0);
    if (typeStress && typeStress.value === "effort" && fmtVal > 0) {
      if (fmtVal < 85)      concl += "sous-maximale non significative ";
      else if (fmtVal < 95) concl += "sous-maximale significative ";
      else if (fmtVal < 100)concl += "quasi-maximale ";
      else                  concl += "maximale ";
    }

    const parts = [];
    if (clinique && clinique.value) parts.push(`cliniquement ${clinique.value === "positive" ? "positive" : "négative"}`);
    if (electrique && electrique.value) {
      const el = electrique.value === "positive" ? "positive"
                : electrique.value === "ininterpretable" ? "ininterprétable"
                : electrique.value === "douteuse" ? "douteuse" : "négative";
      parts.push(`électriquement ${el}`);
    }
    if(parts.length) concl += parts.join(" et ");

    concl += ", la scintigraphie de perfusion myocardique ";
    if(nIsch === 0) concl += "ne met pas en évidence de signes d'ischémie.";
    else concl += `met en évidence une ischémie du territoire ${lc(territoireIsch?.value || '')} (${nIsch} segments sur 17).`;
    if(nNec > 0) concl += `\nAspect de séquelle de nécrose ou d'hibernation du territoire ${lc(territoireNec?.value || '')} (${nNec} segments sur 17).`;

    if(crZone) crZone.innerHTML = (perf + "\n" + cine + "\n" + concl).replace(/\n/g, "<br>");
  }

  // copy / gen CR buttons
  if(btnCopier){
    btnCopier.addEventListener('click', async ()=>{
      try{
        await navigator.clipboard.writeText(crZone ? (crZone.textContent || "") : "");
        if(copieOkEl){ copieOkEl.classList.remove('hidden'); setTimeout(()=> copieOkEl.classList.add('hidden'), 1400); }
      }catch(e){ alert('Impossible de copier'); }
    });
  }
  const btnGen = qs('#btn-gen-cr');
  if(btnGen) btnGen.addEventListener('click', ()=> genererCR());

  /* Ré-attacher écouteurs pour ischémie / nécrose et s'assurer que la classe 'on' est utilisée */
  function attachIschNecListeners(){
    SEGMENTS.forEach(id => {
      // ischémie
      const pathIsch = qs(`#svg-ischemie #isch-${esc(id)}`);
      if(pathIsch){
        pathIsch.style.cursor = 'pointer';
        // remove previous to avoid doublons
        pathIsch.replaceWith(pathIsch.cloneNode(true));
      }
      // nécrose
      const pathNec = qs(`#svg-necrose #nec-${esc(id)}`);
      if(pathNec){
        pathNec.style.cursor = 'pointer';
        pathNec.replaceWith(pathNec.cloneNode(true));
      }
    });

    // maintenant ré-query et bind proprement
    SEGMENTS.forEach(id => {
      const pIsch = qs(`#svg-ischemie #isch-${esc(id)}`);
      if(pIsch){
        pIsch.addEventListener('click', () => {
          const cur = ischState.get(id);
          ischState.set(id, !cur);
          pIsch.classList.toggle('on', !cur);
          updateCounts();
          genererCR();
        });
      }
      const pNec = qs(`#svg-necrose #nec-${esc(id)}`);
      if(pNec){
        pNec.addEventListener('click', () => {
          const cur = necState.get(id);
          necState.set(id, !cur);
          pNec.classList.toggle('on', !cur);
          updateCounts();
          genererCR();
        });
      }
    });
  }

  // appeler après DOM ready / initialisation
  attachIschNecListeners();

  // init
  updateKineFlags();
  updateCounts();
  updateFEVGDisplays();
  genererCR();
  updateReversibiliteAvailability();
});
