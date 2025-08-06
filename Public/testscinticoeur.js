// Paramètres du formulaire
const typeStress = document.getElementById('type-stress');
const betabloquant = document.getElementById('betabloquant');
const clinique = document.getElementById('clinique');
const electrique = document.getElementById('electrique');
const fevg = document.getElementById('fevg');
const fevgValue = document.getElementById('fevg-value');
const vtd = document.getElementById('vtd');
const vtdValue = document.getElementById('vtd-value');
const vts = document.getElementById('vts');
const vtsValue = document.getElementById('vts-value');
const crZone = document.getElementById('cr-zone');
const fevgInput = document.getElementById('fevg-input');
const vtdInput = document.getElementById('vtd-input');
const vtsInput = document.getElementById('vts-input');

// Territoires du SVG
const ids = [
  "apical", "antéro-apical", "septo-apical", "inféro-apical", "latéro-apical",
  "inféro-latéral moyen", "antéro-latéral moyen", "antéro-septal moyen", "inféro-septal moyen",
  "inférieur moyen", "antérieur moyen", "antéro-basal", "antéro-septo-basal",
  "inféro-septo-basal", "antéro-latéro-basal", "inféro-latéro-basal", "inféro-basal"
];
const couleurs = ["#51cf66", "#fd7e14", "#fa5252"]; // Vert, Orange, Rouge
let etats = Array(ids.length).fill(0);

// Affichage dynamique des sliders
fevg.addEventListener('input', () => fevgValue.textContent = fevg.value + "%");
vtd.addEventListener('input', () => vtdValue.textContent = vtd.value + " mL");
vts.addEventListener('input', () => vtsValue.textContent = vts.value + " mL");

// Synchronisation sliders <-> input
fevg.addEventListener('input', () => {
  fevgValue.textContent = fevg.value + "%";
  fevgInput.value = fevg.value;
  genererCR();
});
fevgInput.addEventListener('input', () => {
  fevg.value = fevgInput.value;
  fevgValue.textContent = fevgInput.value + "%";
  genererCR();
});

vtd.addEventListener('input', () => {
  vtdValue.textContent = vtd.value + " mL";
  vtdInput.value = vtd.value;
  genererCR();
});
vtdInput.addEventListener('input', () => {
  vtd.value = vtdInput.value;
  vtdValue.textContent = vtdInput.value + " mL";
  genererCR();
});

vts.addEventListener('input', () => {
  vtsValue.textContent = vts.value + " mL";
  vtsInput.value = vts.value;
  genererCR();
});
vtsInput.addEventListener('input', () => {
  vts.value = vtsInput.value;
  vtsValue.textContent = vtsInput.value + " mL";
  genererCR();
});

// Interactivité SVG
ids.forEach((id, idx) => {
  const zone = document.getElementById(id);
  if (zone) {
    zone.classList.add("zone-svg");
    zone.setAttribute("fill", couleurs[0]);
    zone.addEventListener("mouseenter", () => {
      zone.style.filter = "brightness(1.3) drop-shadow(0 0 6px #ff0a)";
      zone.setAttribute("stroke-width", "3");
    });
    zone.addEventListener("mouseleave", () => {
      zone.style.filter = "";
      zone.setAttribute("stroke-width", "2");
    });
    zone.addEventListener("click", () => {
      etats[idx] = (etats[idx] + 1) % couleurs.length;
      zone.setAttribute("fill", couleurs[etats[idx]]);
      genererCR();
    });
    zone.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      etats[idx] = (etats[idx] - 1 + couleurs.length) % couleurs.length;
      zone.setAttribute("fill", couleurs[etats[idx]]);
      genererCR();
    });
  }
});

// Génération du texte CR automatique
function genererCR() {
  // Territoires selon couleur
  const territoiresVert = [];
  const territoiresOrange = [];
  const territoiresRouge = [];
  ids.forEach((id, idx) => {
    if (etats[idx] === 0) territoiresVert.push(id.replace(/-/g, ' '));
    if (etats[idx] === 1) territoiresOrange.push(id.replace(/-/g, ' '));
    if (etats[idx] === 2) territoiresRouge.push(id.replace(/-/g, ' '));
  });

  // Section Perfusion
  let perfusionTxt = "Tomoscintigraphie de perfusion de stress et de repos :\n";
  if (territoiresOrange.length === 0 && territoiresRouge.length === 0) {
    perfusionTxt += "- Répartition physiologique du traceur sur l'ensemble des parois du ventricule gauche, sans modification significative entre le stress et le repos.\n";
  } else {
    if (territoiresOrange.length > 0) {
      perfusionTxt += "- Hypoperfusion du territoire " + territoiresOrange.join(", ") + ".\n";
    }
    if (territoiresRouge.length > 0) {
      perfusionTxt += "- Ischémie/nécrose du territoire " + territoiresRouge.join(", ") + ".\n";
    }
  }

  // Section Cinétique
  let cinetiqueTxt = "\nTomoscintigraphie synchronisée à l'ECG post-stress et de repos :\n";
  cinetiqueTxt += "- Fraction d'éjection ventriculaire gauche estimée à " + fevg.value + "% en post-stress.\n";
  cinetiqueTxt += "- Les VTD et VTS du ventricule gauche sont respectivement estimés à " + vtd.value + " mL et " + vts.value + " mL en post-stress.\n";
  cinetiqueTxt += "- Pas d'anomalie de la cinétique segmentaire. Pas d'anomalie de la cinétique globale.\n";
  cinetiqueTxt += "- Absence de dilatation ventriculaire gauche.\n";
  cinetiqueTxt += "\n"; // Séparation "par ailleurs"

  // Section Conclusion
  let conclusionTxt = "\n\nConclusion :\n";
  conclusionTxt += "Après une épreuve ";
  if (typeStress.value === "effort") conclusionTxt += "d'effort sur bicyclette ergométrique ";
  if (typeStress.value === "pharmacologique") conclusionTxt += "de stress pharmacologique ";
  if (typeStress.value === "mixte") conclusionTxt += "de stress mixte sur bicyclette ergométrique ";
  if (betabloquant.value === "jamais") conclusionTxt += "non maquillée ";
  if (betabloquant.value === "non-arretes") conclusionTxt += "maquillée ";
  if (betabloquant.value === "arrete") conclusionTxt += "démaquillée ";
  conclusionTxt += "cliniquement " + (clinique.value === "positive" ? "positive " : "négative ");
  conclusionTxt += "et électriquement ";
  if (electrique.value === "positive") conclusionTxt += "positive";
  else if (electrique.value === "ininterpretable") conclusionTxt += "ininterprétable";
  else if (electrique.value === "douteuse") conclusionTxt += "douteuse";
  else conclusionTxt += "négative";
  conclusionTxt += ", la scintigraphie de perfusion myocardique ";
  if (territoiresRouge.length === 0 && territoiresOrange.length === 0) {
    conclusionTxt += "ne met pas en évidence de signes d'ischémie.";
  } else {
    conclusionTxt += "met en évidence ";
    if (territoiresRouge.length > 0) conclusionTxt += "une ischémie/nécrose du territoire " + territoiresRouge.join(", ") + ". ";
    if (territoiresOrange.length > 0) conclusionTxt += "une hypoperfusion du territoire " + territoiresOrange.join(", ") + ".";
  }

  // Remplace les \n par <br> pour l'affichage HTML
  crZone.innerHTML = (perfusionTxt + cinetiqueTxt + conclusionTxt).replace(/\n/g, "<br>");
}

// Mise à jour dynamique
[typeStress, betabloquant, clinique, electrique, fevg, vtd, vts].forEach(el => {
  el.addEventListener('change', genererCR);
  el.addEventListener('input', genererCR);
});
genererCR();

// Bouton copier le CR
const btnCopier = document.getElementById('btn-copier-cr');
const copieOk = document.getElementById('copie-ok');
if (copieOk) copieOk.classList.remove("visible");
btnCopier.addEventListener('click', () => {
  navigator.clipboard.writeText(crZone.textContent)
    .then(() => {
      copieOk.classList.add("visible");
      setTimeout(() => copieOk.classList.remove("visible"), 1200);
    });
});