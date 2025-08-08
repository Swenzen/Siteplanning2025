document.addEventListener('DOMContentLoaded', () => {
  const toggleTableBtn = document.getElementById('toggle-table-perfusion');
  const tablePerf = document.getElementById('table-perfusion');

  if (toggleTableBtn && tablePerf) {
    // cachée par défaut
    tablePerf.classList.add('hidden');
    toggleTableBtn.setAttribute('aria-expanded', 'false');
    toggleTableBtn.textContent = 'Afficher la table des segments';

    toggleTableBtn.addEventListener('click', () => {
      const isHidden = tablePerf.classList.toggle('hidden');
      toggleTableBtn.setAttribute('aria-expanded', String(!isHidden));
      toggleTableBtn.textContent = isHidden ? 'Afficher la table des segments' : 'Masquer la table des segments';
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Champs formulaire
  const typeStress   = document.getElementById('type-stress');
  const betabloquant = document.getElementById('betabloquant');
  const clinique     = document.getElementById('clinique');
  const electrique   = document.getElementById('electrique');

  // % FMT
  const fmt      = document.getElementById('fmt');
  const fmtInput = document.getElementById('fmt-input');
  const fmtValue = document.getElementById('fmt-value');

  // Perfusion (filtres)
  const territoirePerf   = document.getElementById('territoire-perfusion');
  const profondeurPerf   = document.getElementById('profondeur-perfusion');
  const etenduePerf      = document.getElementById('etendue-perfusion');
  const artefactuelSelect = document.getElementById('artefactuel');
  const reversibilite     = document.getElementById('reversibilite');
  const normalParAilleurs = document.getElementById('normal-par-ailleurs');

  // Conclusion: ischémie / nécrose
  const territoireIsch = document.getElementById('territoire-ischemie');
  const territoireNec  = document.getElementById('territoire-necrose');
  const countIschEl    = document.getElementById('count-isch');
  const countNecEl     = document.getElementById('count-nec');

  const crZone    = document.getElementById('cr-zone');
  const btnCopier = document.getElementById('btn-copier-cr');
  const copieOk   = document.getElementById('copie-ok');

  // bouton repli/affichage table Perfusion
  const toggleTableBtn = document.getElementById('toggle-table-perfusion');
  const tablePerfEl    = document.getElementById('table-perfusion');

  /* ==== CINETIQUE: éléments ==== */
  const kineTerr   = document.getElementById('kine-territoire');
  const kineType   = document.getElementById('kine-type');          // normal | hypo | akine
  const kineEtend  = document.getElementById('kine-etendue');
  const kineRev    = document.getElementById('kine-reversibilite'); // 0|1|2
  const kineNorm   = document.getElementById('kine-normal');        // oui|non
  const kineGlob   = document.getElementById('kine-globale');       // oui|non
  const kineDilat  = document.getElementById('kine-dilat');         // non|discrete|moderee|importante

  // Sliders Cinétique
  const fevgS = document.getElementById('fevg-stress');
  const fevgR = document.getElementById('fevg-rest');
  const vtdS  = document.getElementById('vtd-stress');
  const vtdR  = document.getElementById('vtd-rest');
  const vtsS  = document.getElementById('vts-stress');
  const vtsR  = document.getElementById('vts-rest');

  const flagPerte10  = document.getElementById('flag-perte10');
  const flagDilat20  = document.getElementById('flag-dilat20');
  const flagDilat10  = document.getElementById('flag-dilat10');
  const flagVts70    = document.getElementById('flag-vts70');

  // Segments (17)
  const SEGMENTS = [
    "apical","antéro-apical","septo-apical","inféro-apical","latéro-apical",
    "inféro-latéral moyen","antéro-latéral moyen","antéro-septal moyen","inféro-septal moyen",
    "inférieur moyen","antérieur moyen","antéro-basal","antéro-septo-basal","inféro-septo-basal",
    "antéro-latéro-basal","inféro-latéro-basal","inféro-basal"
  ];

  // Listes déroulantes (conformes)
  const TERRITOIRES = [
    "", // option vide "—"
    "Apical","Antéro-apical","Antérieur","Antéro-septal","Antéro-septo-apical",
    "Inférieur","Inféro-septal","Latéral","Inféro-latéral","Septal"
  ];
  const PROFONDEURS = ["", "Lacunaire", "Profonde", "Modérée", "Discrète"];
  const ETENDUES    = ["", "De Faible étendue", "D'étendue Modérée", "Étendue"];

  // États Perfusion (stress)
  const ETATS = [
    { v: 0, label: "Non",     cls: "fill-green"  },
    { v: 1, label: "Partiel", cls: "fill-orange" },
    { v: 2, label: "Complet", cls: "fill-red"    },
  ];

  // Etat interne
  const stressState = new Map(); // segId -> { etat, profondeur, etendue }
  SEGMENTS.forEach(id => stressState.set(id, { etat: 0, profondeur: "", etendue: "" }));

  // Ischémie/Nécrose: binaire (true = sélectionné)
  const ischState = new Map();
  const necState  = new Map();
  SEGMENTS.forEach(id => { ischState.set(id, false); necState.set(id, false); });

  // Helpers
  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = s => s.replace(/([ #;?%&,.+*~\':"!^$[\]()=>|/@])/g,'\\$1');

  // Init des listes déroulantes
  fillSelect(territoirePerf, TERRITOIRES);
  fillSelect(territoireIsch, TERRITOIRES);
  fillSelect(territoireNec,  TERRITOIRES);
  fillSelect(profondeurPerf, PROFONDEURS);
  fillSelect(etenduePerf,    ETENDUES);

  /* Cinétique: remplir les sélecteurs */
  if (kineTerr) fillSelect(kineTerr, TERRITOIRES);
  if (kineEtend) fillSelect(kineEtend, ETENDUES);

  function fillSelect(sel, items) {
    sel.innerHTML = items.map(v => `<option value="${v}">${v || "—"}</option>`).join("");
  }

  // Connecter sliders avec état "vide" (—)
  function connectSlider(rangeId, inputId, valueId, suffix = "", onChange = () => {}) {
    const r = document.getElementById(rangeId);
    const n = document.getElementById(inputId);
    const v = valueId ? document.getElementById(valueId) : null;
    if (!r || !n) return;

    const render = () => {
      const empty = r.dataset.empty === "1";
      if (v) v.textContent = empty ? `—${suffix}` : `${r.value}${suffix}`;
      if (empty) n.value = ""; else n.value = r.value;
    };

    const syncR2N = () => {
      r.dataset.empty = "0";
      n.value = r.value;
      render(); onChange();
    };

    const syncN2R = () => {
      if (n.value === "") {
        r.dataset.empty = "1";
        render(); onChange();
      } else {
        r.dataset.empty = "0";
        r.value = n.value;
        render(); onChange();
      }
    };

    // init affichage
    if (!r.dataset.empty) r.dataset.empty = "1";
    render();

    r.addEventListener('input', syncR2N);
    n.addEventListener('input', syncN2R);
  }

  // FMT affichage — si 0
  const updateFmtDisplay = () => {
    const val = Number(fmt.value || 0);
    fmtInput.value = String(val);
    fmtValue.textContent = val > 0 ? `${val}%` : "—%";
  };
  if (fmt && fmtInput && fmtValue) {
    fmt.addEventListener('input', () => { updateFmtDisplay(); genererCR(); });
    fmtInput.addEventListener('input', () => { fmt.value = fmtInput.value; updateFmtDisplay(); genererCR(); });
    updateFmtDisplay();
  }

  // Sliders Cinétique
  connectSlider('fevg-stress','fevg-stress-input','fevg-stress-value','%', () => { updateKineFlags(); genererCR(); });
  connectSlider('fevg-rest','fevg-rest-input','fevg-rest-value','%', () => { updateKineFlags(); genererCR(); });
  connectSlider('vtd-stress','vtd-stress-input','vtd-stress-value',' mL', () => { updateKineFlags(); genererCR(); });
  connectSlider('vtd-rest','vtd-rest-input','vtd-rest-value',' mL', () => { updateKineFlags(); genererCR(); });
  connectSlider('vts-stress','vts-stress-input','vts-stress-value',' mL', () => { updateKineFlags(); genererCR(); });
  connectSlider('vts-rest','vts-rest-input','vts-rest-value',' mL', () => { updateKineFlags(); genererCR(); });

  function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }
  const isEmpty = el => !el || el.dataset.empty === "1";

  function updateKineFlags() {
    if (!fevgS) return;
    if (isEmpty(fevgS) || isEmpty(fevgR) || isEmpty(vtdS) || isEmpty(vtdR) || isEmpty(vtsS) || isEmpty(vtsR)) {
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

  // Construire le tableau Perfusion
  const tbody = qs('#table-perfusion tbody');
  tbody.innerHTML = SEGMENTS.map(id => `
    <tr data-seg="${id}">
      <td>${id}</td>
      <td>
        <select class="sel-etat">
          ${ETATS.map(e => `<option value="${e.v}">${e.label}</option>`).join('')}
        </select>
      </td>
      <td>
        <select class="sel-profondeur">
          ${PROFONDEURS.map(p => `<option value="${p}">${p || "—"}</option>`).join('')}
        </select>
      </td>
      <td>
        <select class="sel-etendue">
          ${ETENDUES.map(e => `<option value="${e}">${e || "—"}</option>`).join('')}
        </select>
      </td>
    </tr>
  `).join('');

  // Events sur le tableau
  qsa('#table-perfusion tbody tr').forEach(tr => {
    const segId = tr.getAttribute('data-seg');
    const selEtat = qs('.sel-etat', tr);
    const selProf = qs('.sel-profondeur', tr);
    const selEtendue = qs('.sel-etendue', tr);

    const update = () => {
      const s = stressState.get(segId);
      s.etat       = Number(selEtat.value);
      s.profondeur = selProf.value;
      s.etendue    = selEtendue.value;
      colorizePerf(segId, s.etat);
      setRowColor(tr, s.etat);
      genererCR();
    };

    selEtat.addEventListener('change', update);
    selProf.addEventListener('change', update);
    selEtendue.addEventListener('change', update);

    tr.addEventListener('mouseenter', () => {
      const path = qs(`#svg-perfusion #${esc(segId)}`);
      if (path) path.classList.add('active');
    });
    tr.addEventListener('mouseleave', () => {
      const path = qs(`#svg-perfusion #${esc(segId)}`);
      if (path) path.classList.remove('active');
    });

    setRowColor(tr, stressState.get(segId).etat);
  });

  function setRowColor(tr, etat) {
    tr.classList.remove('row-orange', 'row-red');
    if (etat === 1) tr.classList.add('row-orange');
    if (etat === 2) tr.classList.add('row-red');
  }

  // Préparer SVG Perfusion
  SEGMENTS.forEach(id => {
    const path = qs(`#svg-perfusion #${esc(id)}`);
    if (!path) return;
    setPerfColor(path, 0);
    path.addEventListener('click', () => {
      const s = stressState.get(id);
      s.etat = (s.etat + 1) % 3; // 0->1->2->0
      setPerfColor(path, s.etat);
      const tr = qs(`#table-perfusion tbody tr[data-seg="${esc(id)}"]`);
      if (tr) qs('.sel-etat', tr).value = String(s.etat);
      setRowColor(tr, s.etat);
      genererCR();
    });
  });

  function setPerfColor(path, etat) {
    path.classList.remove('fill-green', 'fill-orange', 'fill-red');
    path.classList.add(etat === 1 ? 'fill-orange' : etat === 2 ? 'fill-red' : 'fill-green');
  }
  function colorizePerf(segId, etat) {
    const path = qs(`#svg-perfusion #${esc(segId)}`);
    if (!path) return;
    setPerfColor(path, etat);
  }

  // Préparer SVG Ischémie
  SEGMENTS.forEach(id => {
    const path = qs(`#svg-ischemie #isch-${esc(id)}`);
    if (!path) return;
    path.addEventListener('click', () => {
      const cur = ischState.get(id);
      ischState.set(id, !cur);
      path.classList.toggle('on', !cur);
      updateCounts();
      genererCR();
    });
  });

  // Préparer SVG Nécrose
  SEGMENTS.forEach(id => {
    const path = qs(`#svg-necrose #nec-${esc(id)}`);
    if (!path) return;
    path.addEventListener('click', () => {
      const cur = necState.get(id);
      necState.set(id, !cur);
      path.classList.toggle('on', !cur);
      updateCounts();
      genererCR();
    });
  });

  function updateCounts() {
    countIschEl.textContent = `${countTrue(ischState)} / 17`;
    countNecEl.textContent  = `${countTrue(necState)} / 17`;
  }
  function countTrue(map) {
    let n = 0; map.forEach(v => { if (v) n++; }); return n;
  }

  // Autres contrôles -> CR
  [territoirePerf, profondeurPerf, etenduePerf,
   artefactuelSelect, reversibilite, normalParAilleurs,
   territoireIsch, territoireNec,
   typeStress, betabloquant, clinique, electrique,
   fmt, fmtInput,
   /* cinétique */
   kineTerr, kineType, kineEtend, kineRev, kineNorm, kineGlob, kineDilat,
   fevgS, fevgR, vtdS, vtdR, vtsS, vtsR
  ].forEach(el => {
    if (!el) return;
    el.addEventListener('change', () => { updateKineFlags(); genererCR(); });
    el.addEventListener('input',  () => { updateKineFlags(); genererCR(); });
  });

  // Helpers texte
  function lc(s) { return (s || "").toLowerCase(); }
  function joinFr(arr) {
    if (arr.length === 0) return "";
    if (arr.length === 1) return arr[0];
    return `${arr.slice(0, -1).join(", ")} et ${arr[arr.length - 1]}`;
  }
  function listSegments(arr) { return arr.map(s => s.replace(/-/g, ' ')); }

  // Génération du CR
  function genererCR() {
    // Perfusion: segments complets vs partiels
    const segComplet = [];
    const segPartiel = [];
    let nbAnormaux = 0;
    stressState.forEach((s, id) => {
      if (s.etat === 2) { segComplet.push(id); nbAnormaux++; }
      if (s.etat === 1) { segPartiel.push(id); nbAnormaux++; }
    });

    let perf = "Tomoscintigraphie de perfusion de stress et de repos:\n";
    if (nbAnormaux === 0) {
      perf += "- Répartition physiologique du traceur sur l'ensemble des parois du ventricule gauche, sans modification significative entre le stress et le repos.";
    } else {
      const prof = profondeurPerf.value ? `${lc(profondeurPerf.value)} ` : "";
      const terr = territoirePerf.value ? ` du territoire ${lc(territoirePerf.value)}` : "";
      const etnd = etenduePerf.value ? ` ${lc(etenduePerf.value)}` : "";
      perf += `- Hypofixation ${prof}${terr}${etnd} (segment(s)`;
      if (segComplet.length) perf += " " + joinFr(listSegments(segComplet));
      if (segPartiel.length) perf += ` et dans une moindre mesure ${joinFr(listSegments(segPartiel))}`;
      perf += `) au stress,`;

      if (reversibilite.value === "0") perf += " non réversible au repos";
      if (reversibilite.value === "2") perf += " de réversibilité complète au repos";
      if (reversibilite.value === "1") perf += " partiellement réversible au repos";

      if (artefactuelSelect.value === "oui") perf += ", d'allure artéfactuelle";
      perf += ".";
      if (normalParAilleurs.value === "oui") {
        perf += "\n- Par ailleurs, répartition physiologique du traceur sur le reste des parois du ventricule gauche";
      }
    }

    // Cinétique segmentaire
    let cine = "\n\nTomoscintigraphie synchronisée à l'ECG post-stress et de repos:\n";
    if (!kineType || kineType.value === "") {
      cine += "- Cinétique segmentaire: —.";
    } else if (kineType.value !== "normal") {
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

    // Dilatation
    if (kineDilat?.value) {
      if (kineDilat.value === "non") cine += "\n- Absence de dilatation ventriculaire gauche";
      else {
        const mapD = { discrete: "discrète", moderee: "modérée", importante: "importante" };
        cine += `\n- Dilatation ventriculaire gauche ${mapD[kineDilat.value] || ""}`;
      }
    }

    // FEVG/VTD/VTS: inclure seulement si les 6 valeurs sont renseignées
    const allKineNums = !isEmpty(fevgS) && !isEmpty(fevgR) && !isEmpty(vtdS) && !isEmpty(vtdR) && !isEmpty(vtsS) && !isEmpty(vtsR);
    if (allKineNums) {
      cine += `\n- Fraction d'éjection ventriculaire gauche estimée à ${fevgS.value}% en post-stress et ${fevgR.value}% au repos. ` +
              `Les VTD et VTS du ventricule gauche sont respectivement estimés à ${vtdS.value}mL et ${vtsS.value}mL en post-stress, ` +
              `et à ${vtdR.value}mL et ${vtsR.value}mL au repos.`;

      const sumFlags =
        Number(flagPerte10.textContent) +
        Number(flagDilat20.textContent) +
        Number(flagDilat10.textContent) +
        Number(flagVts70.textContent);

      cine += (sumFlags === 0)
        ? " Absence de signe de désadaptation ventriculaire gauche de stress."
        : " Aspect de désadaptation ventriculaire gauche de stress,";
    }

    // Conclusion (Ischémie + Nécrose + %FMT)
    const nIsch = countTrue(ischState);
    const nNec  = countTrue(necState);

    let concl = "\n\nConclusion:\n";
    concl += "Après une épreuve ";
    if (typeStress.value === "pharmacologique") concl += "de stress pharmacologique ";
    else if (typeStress.value === "mixte")       concl += "de stress mixte sur bicyclette ergométrique ";
    else if (typeStress.value === "effort")      concl += "d'effort sur bicyclette ergométrique ";
    else                                         concl += "de stress ";

    if (typeStress.value === "effort" && betabloquant.value) {
      if (betabloquant.value === "jamais")            concl += "non maquillée ";
      else if (betabloquant.value === "non-arretes")  concl += "maquillée ";
      else if (betabloquant.value === "arrete")       concl += "démaquillée ";
    }

    // % FMT -> qualificatif
    const fmtVal = Number(fmt?.value || 0);
    if (typeStress.value === "effort" && fmtVal > 0) {
      if (fmtVal < 85)      concl += "sous-maximale non significative ";
      else if (fmtVal < 95) concl += "sous-maximale significative ";
      else if (fmtVal < 100)concl += "quasi-maximale ";
      else                  concl += "maximale ";
    }

    // Ajout "cliniquement/électriquement" si renseigné
    const parts = [];
    if (clinique.value)   parts.push(`cliniquement ${clinique.value === "positive" ? "positive" : "négative"}`);
    if (electrique.value) {
      const el = electrique.value === "positive" ? "positive"
                : electrique.value === "ininterpretable" ? "ininterprétable"
                : electrique.value === "douteuse" ? "douteuse" : "négative";
      parts.push(`électriquement ${el}`);
    }
    if (parts.length) concl += parts.join(" et ");

    concl += ", la scintigraphie de perfusion myocardique ";
    if (nIsch === 0) {
      concl += "ne met pas en évidence de signes d'ischémie.";
    } else {
      concl += `met en évidence une ischémie du territoire ${lc(territoireIsch.value)} (${nIsch} segments sur 17).`;
    }
    if (nNec > 0) {
      concl += `\nAspect de séquelle de nécrose ou d'hibernation du territoire ${lc(territoireNec.value)} (${nNec} segments sur 17).`;
    }

    crZone.innerHTML = (perf + "\n" + cine + "\n" + concl).replace(/\n/g, "<br>");
  }

  // Copier CR
  if (copieOk) copieOk.classList.remove("visible");
  btnCopier.addEventListener('click', () => {
    navigator.clipboard.writeText(crZone.textContent || "")
      .then(() => {
        copieOk.classList.add("visible");
        setTimeout(() => copieOk.classList.remove("visible"), 1200);
      });
  });

  // Init
  updateCounts();
  updateKineFlags();
  genererCR();
});