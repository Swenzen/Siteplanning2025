const examen = document.getElementById('examen');
const perfusion = document.getElementById('perfusion');
const conclusion = document.getElementById('conclusion');
const crZone = document.getElementById('cr-zone');

// Génération du texte CR automatique
function genererCR() {
  let texte = "Scintigraphie myocardique réalisée en mode " + examen.options[examen.selectedIndex].text.toLowerCase() + ".\n";
  texte += "Perfusion : " + perfusion.options[perfusion.selectedIndex].text + ".\n";
  texte += "Conclusion : " + conclusion.options[conclusion.selectedIndex].text + ".";
  crZone.textContent = texte;
}
examen.addEventListener('change', genererCR);
perfusion.addEventListener('change', genererCR);
conclusion.addEventListener('change', genererCR);
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

// Interactivité SVG médical
const couleurs = ["#fa5252", "#fd7e14", "#ffe066", "#51cf66"];
const ids = [
  "apical", "antéro-apical", "septo-apical", "inféro-apical", "latéro-apical",
  "inféro-latéral moyen", "antéro-latéral moyen", "antéro-septal moyen", "inféro-septal moyen",
  "inférieur moyen", "antérieur moyen", "antéro-basal", "antéro-septo-basal",
  "inféro-septo-basal", "antéro-latéro-basal", "inféro-latéro-basal", "inféro-basal"
];
let etats = Array(ids.length).fill(0);

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
    });
    zone.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      etats[idx] = (etats[idx] - 1 + couleurs.length) % couleurs.length;
      zone.setAttribute("fill", couleurs[etats[idx]]);
    });
  }
});