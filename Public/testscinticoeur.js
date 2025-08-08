document.addEventListener('DOMContentLoaded', () => {
  // Champs formulaire
  const typeStress   = document.getElementById('type-stress');
  const betabloquant = document.getElementById('betabloquant');
  const clinique     = document.getElementById('clinique');
  const electrique   = document.getElementById('electrique');

  const fevg       = document.getElementById('fevg');
  const fevgInput  = document.getElementById('fevg-input');
  const fevgValue  = document.getElementById('fevg-value');
  const vtd        = document.getElementById('vtd');
  const vtdInput   = document.getElementById('vtd-input');
  const vtdValue   = document.getElementById('vtd-value');
  const vts        = document.getElementById('vts');
  const vtsInput   = document.getElementById('vts-input');
  const vtsValue   = document.getElementById('vts-value');

  const artefactuelSelect = document.getElementById('artefactuel');
  const reversibilite     = document.getElementById('reversibilite');
  const normalParAilleurs = document.getElementById('normal-par-ailleurs');

  const crZone    = document.getElementById('cr-zone');
  const btnCopier = document.getElementById('btn-copier-cr');
  const copieOk   = document.getElementById('copie-ok');

  // Segments (17) = ids du SVG
  const segments = [
    "apical",
    "antéro-apical",
    "septo-apical",
    "inféro-apical",
    "latéro-apical",
    "inféro-latéral moyen",
    "antéro-latéral moyen",
    "antéro-septal moyen",
    "inféro-septal moyen",
    "inférieur moyen",
    "antérieur moyen",
    "antéro-basal",
    "antéro-septo-basal",
    "inféro-septo-basal",
    "antéro-latéro-basal",
    "inféro-latéro-basal",
    "inféro-basal"
  ];

  // Libellés
  const PROFONDEURS = ["", "Lacunaire", "Profonde", "Modérée", "Discrète"];
  const ETENDUES    = ["", "Faible", "Modérée", "Étendue"];
  const ETATS       = [
    { v: 0, label: "Non",     cls: "fill-green"  },
    { v: 1, label: "Partiel", cls: "fill-orange" },
    { v: 2, label: "Complet", cls: "fill-red"    },
  ];
  const COLORS_BY_V = { 0: "fill-green", 1: "fill-orange", 2: "fill-red" };

  // Etat interne par segment
  const state = new Map(); // segmentId -> { etat, profondeur, etendue }
  segments.forEach(id => state.set(id, { etat: 0, profondeur: "", etendue: "" }));

  // Helpers
  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  // Construire le tableau Perfusion
  const tbody = qs('#table-perfusion tbody');
  tbody.innerHTML = segments.map(id => {
    const segLabel = id;
    return `
      <tr data-seg="${id}">
        <td>${segLabel}</td>
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
    `;
  }).join('');

  // Attacher events sur les selects de la table
  qsa('#table-perfusion tbody tr').forEach(tr => {
    const segId = tr.getAttribute('data-seg');
    const selEtat = qs('.sel-etat', tr);
    const selProf = qs('.sel-profondeur', tr);
    const selEtendue = qs('.sel-etendue', tr);

    // Mise à jour état + SVG + couleur de ligne
    const update = () => {
      const s = state.get(segId);
      s.etat       = Number(selEtat.value);
      s.profondeur = selProf.value;
      s.etendue    = selEtendue.value;
      colorizeSegment(segId, s.etat);
      setRowColor(tr, s.etat);
      genererCR();
    };

    selEtat.addEventListener('change', update);
    selProf.addEventListener('change', update);
    selEtendue.addEventListener('change', update);

    // Hover: survol ligne -> surbrillance SVG
    tr.addEventListener('mouseenter', () => {
      const path = document.getElementById(segId);
      if (path) path.classList.add('active');
    });
    tr.addEventListener('mouseleave', () => {
      const path = document.getElementById(segId);
      if (path) path.classList.remove('active');
    });

    // init couleur de ligne
    setRowColor(tr, state.get(segId).etat);
  });

  // Préparer le SVG: couleurs init et interactions
  const defaultFill = 0; // "Non"
  segments.forEach(id => {
    const path = document.getElementById(id);
    if (!path) return;
    // couleur par défaut
    path.classList.remove('fill-green', 'fill-orange', 'fill-red');
    path.classList.add(COLORS_BY_V[defaultFill]);
    // clic sur SVG -> cycle des états et synchro table + ligne
    path.addEventListener('click', () => {
      const segState = state.get(id);
      segState.etat = (segState.etat + 1) % ETATS.length;
      colorizeSegment(id, segState.etat);
      // Synchroniser le select et la couleur de la ligne
      const tr = qs(`#table-perfusion tbody tr[data-seg="${cssEscape(id)}"]`);
      if (tr) {
        const sel = qs('.sel-etat', tr);
        if (sel) sel.value = String(segState.etat);
        setRowColor(tr, segState.etat);
      }
      genererCR();
    });
  });

  function colorizeSegment(segId, etatVal) {
    const path = document.getElementById(segId);
    if (!path) return;
    path.classList.remove('fill-green', 'fill-orange', 'fill-red');
    path.classList.add(COLORS_BY_V[etatVal] || 'fill-green');
  }

  // Coloration des lignes (0 = neutre)
  function setRowColor(tr, etat) {
    tr.classList.remove('row-orange', 'row-red');
    if (etat === 1) tr.classList.add('row-orange');
    if (etat === 2) tr.classList.add('row-red');
  }

  // Synchronisation sliders <-> inputs
  fevg.addEventListener('input', () => { fevgInput.value = fevg.value; fevgValue.textContent = fevg.value + "%"; genererCR(); });
  fevgInput.addEventListener('input', () => { fevg.value = fevgInput.value; fevgValue.textContent = fevgInput.value + "%"; genererCR(); });

  vtd.addEventListener('input', () => { vtdInput.value = vtd.value; vtdValue.textContent = vtd.value + " mL"; genererCR(); });
  vtdInput.addEventListener('input', () => { vtd.value = vtdInput.value; vtdValue.textContent = vtdInput.value + " mL"; genererCR(); });

  vts.addEventListener('input', () => { vtsInput.value = vts.value; vtsValue.textContent = vts.value + " mL"; genererCR(); });
  vtsInput.addEventListener('input', () => { vts.value = vtsInput.value; vtsValue.textContent = vtsInput.value + " mL"; genererCR(); });

  // Autres contrôles
  artefactuelSelect.addEventListener('change', genererCR);
  reversibilite.addEventListener('change', genererCR);
  normalParAilleurs.addEventListener('change', genererCR);
  [typeStress, betabloquant, clinique, electrique].forEach(el => {
    el.addEventListener('change', genererCR);
    el.addEventListener('input', genererCR);
  });

  // Helpers texte
  function etenduePhrase(v) {
    if (!v) return "";
    const l = v.toLowerCase();
    if (l === "faible")   return " de faible étendue";
    if (l === "modérée")  return " d'étendue modérée";
    if (l === "étendue")  return " étendue";
    return ` ${l}`;
  }
  function describeDetail(s, segId) {
    const prof = s.profondeur ? s.profondeur.toLowerCase() + " " : "";
    const territ = segId.toLowerCase();
    const etnd = etenduePhrase(s.etendue);
    // ex: "profonde du territoire antéro-septal moyen d'étendue modérée"
    return `${prof}du territoire ${territ}${etnd}`.trim();
  }
  function joinFr(arr) {
    if (arr.length === 0) return "";
    if (arr.length === 1) return arr[0];
    return `${arr.slice(0, -1).join(", ")} et ${arr[arr.length - 1]}`;
  }
  function cssEscape(ident) {
    return ident.replace(/([ #;?%&,.+*~\':"!^$[\]()=>|/@])/g,'\\$1');
  }

  // Génération du texte CR (intègre profondeur, étendue, artefactuel)
  function genererCR() {
    const detailsPartiel = [];
    const detailsComplet = [];
    let nbSegmentsAnormaux = 0;

    state.forEach((s, segId) => {
      if (s.etat === 0) return;
      nbSegmentsAnormaux++;
      const d = describeDetail(s, segId);
      if (s.etat === 2) detailsComplet.push(d);
      if (s.etat === 1) detailsPartiel.push(d);
    });

    // Section Perfusion
    let perfusionTxt = "Tomoscintigraphie de perfusion de stress et de repos:\n";
    if (nbSegmentsAnormaux === 0) {
      perfusionTxt += "- Répartition physiologique du traceur sur l'ensemble des parois du ventricule gauche, sans modification significative entre le stress et le repos.";
    } else {
      if (detailsComplet.length > 0) {
        perfusionTxt += `- Ischémie ${joinFr(detailsComplet)}`;
        if (detailsPartiel.length > 0) {
          perfusionTxt += ` et dans une moindre mesure ${joinFr(detailsPartiel)}`;
        }
      } else {
        perfusionTxt += `- Hypofixation ${joinFr(detailsPartiel)}`;
      }
      perfusionTxt += ` (segment(s) ${nbSegmentsAnormaux} sur 17) au stress`;

      // Réversibilité globale
      const rev = reversibilite.value;
      if (rev === "0") perfusionTxt += ", non réversible au repos";
      if (rev === "2") perfusionTxt += ", de réversibilité complète au repos";
      if (rev === "1") perfusionTxt += ", partiellement réversible au repos";

      // Artefactuel global
      if (artefactuelSelect.value === "oui") perfusionTxt += ", d'allure artéfactuelle";
      perfusionTxt += ".";
      if (normalParAilleurs.value === "oui") {
        perfusionTxt += "\n- Par ailleurs, répartition physiologique du traceur sur le reste des parois du ventricule gauche.";
      }
    }

    // Section Cinétique (simplifiée)
    let cinetiqueTxt = "\n\nTomoscintigraphie synchronisée à l'ECG post-stress et de repos:\n";
    cinetiqueTxt += "- Pas d'anomalie de la cinétique segmentaire. Pas d'anomalie de la cinétique globale.\n";
    cinetiqueTxt += "- Absence de dilatation ventriculaire gauche.\n";
    cinetiqueTxt += `- Fraction d'éjection ventriculaire gauche estimée à ${fevg.value}% en post-stress.\n`;
    cinetiqueTxt += `- Les VTD et VTS du ventricule gauche sont respectivement estimés à ${vtd.value} mL et ${vts.value} mL en post-stress.`;

    // Conclusion (résumé)
    let conclusionTxt = "\n\nConclusion:\n";
    conclusionTxt += "Après une épreuve ";
    if (typeStress.value === "pharmacologique") conclusionTxt += "de stress pharmacologique ";
    else if (typeStress.value === "mixte")       conclusionTxt += "de stress mixte sur bicyclette ergométrique ";
    else                                         conclusionTxt += "d'effort sur bicyclette ergométrique ";

    if (typeStress.value === "effort") {
      if (betabloquant.value === "jamais")            conclusionTxt += "non maquillée ";
      else if (betabloquant.value === "non-arretes")  conclusionTxt += "maquillée ";
      else                                            conclusionTxt += "démaquillée ";
    }

    conclusionTxt += `cliniquement ${clinique.value === "positive" ? "positive " : "négative "}`;
    conclusionTxt += "et électriquement ";
    if (electrique.value === "positive") conclusionTxt += "positive";
    else if (electrique.value === "ininterpretable") conclusionTxt += "ininterprétable";
    else if (electrique.value === "douteuse") conclusionTxt += "douteuse";
    else conclusionTxt += "négative";

    conclusionTxt += ", la scintigraphie de perfusion myocardique ";
    if (nbSegmentsAnormaux === 0) {
      conclusionTxt += "ne met pas en évidence de signes d'ischémie.";
    } else {
      const hasComplet = detailsComplet.length > 0;
      conclusionTxt += hasComplet
        ? `met en évidence une ischémie (${nbSegmentsAnormaux} segments sur 17).`
        : `met en évidence une hypoperfusion (${nbSegmentsAnormaux} segments sur 17).`;
    }

    // Rendu
    crZone.innerHTML = (perfusionTxt + "\n" + cinetiqueTxt + "\n" + conclusionTxt).replace(/\n/g, "<br>");
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

  // Génération initiale
  genererCR();
});